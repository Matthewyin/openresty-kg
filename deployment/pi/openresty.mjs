import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function renderLocations({ basePath, staticRoot, upstream, resolver = '127.0.0.11', proxyTimeoutSeconds = 190, bodyLimit = '64k', publicPort }) {
  if (!/^\/(?:[A-Za-z0-9_-]+\/)+$/.test(basePath)) throw new Error('入口需要非根目录基础路径');
  if (!/^\/[A-Za-z0-9_./-]+$/.test(staticRoot) || staticRoot.includes('..')) throw new Error('静态目录必须是明确的绝对路径');
  if (!/^[a-zA-Z0-9][a-zA-Z0-9.-]*:[0-9]{1,5}$/.test(upstream)) throw new Error('需要内部服务名和端口');
  if (!/^[0-9.]+$/.test(resolver) || !Number.isInteger(proxyTimeoutSeconds) || proxyTimeoutSeconds < 1 || !/^[1-9][0-9]*[km]?$/.test(bodyLimit)) throw new Error('代理参数不合法');
  const prefix = basePath.slice(0, -1);
  if (publicPort !== undefined && (!Number.isInteger(publicPort) || publicPort < 1 || publicPort > 65535)) throw new Error('外部端口不合法');
  const dynamic = publicPort !== undefined;
  const addressCheck = dynamic ? `
    local function reject_origin()
      ngx.header["Cache-Control"] = "no-store"
      ngx.status = 403
      ngx.header.content_type = "application/json; charset=utf-8"
      ngx.say('{"error":"拒绝非同源请求","code":"origin_rejected"}')
      return ngx.exit(403)
    end
    local authority = ngx.var.http_host or ""
    local hostname, port = authority:match("^([^:]+):(%d+)$")
    local valid = hostname == "localhost"
    if hostname and not valid then
      local a,b,c,d = hostname:match("^(%d+)%.(%d+)%.(%d+)%.(%d+)$")
      if a then
        valid = true
        for _,octet in ipairs({a,b,c,d}) do
          if tonumber(octet) > 255 or tostring(tonumber(octet)) ~= octet then valid = false end
        end
      end
    end
    if not valid or port ~= "${publicPort}" then return reject_origin() end
    local expected = ngx.var.scheme .. "://" .. authority
    local origin = ngx.var.http_origin
    local fetch_site = ngx.var.http_sec_fetch_site
    if (origin and origin ~= expected) or (fetch_site and fetch_site ~= "same-origin" and fetch_site ~= "none") then return reject_origin() end
  ` : '';
  const auth = api => `access_by_lua_block {
    ${addressCheck}
    local token = ngx.var.cookie_rag_auth_token
    if token and ngx.shared.auth_sessions:get(token) then
      ${dynamic && api ? `if not origin then
        local referer = ngx.var.http_referer or ""
        if referer:sub(1, #expected + 1) ~= expected .. "/" then return reject_origin() end
      end` : ''}
      return
    end
    ngx.header["Cache-Control"] = "no-store"
    ${api ? '' : `if ngx.var.uri == "${basePath}" or ngx.var.uri == "${basePath}index.html" then return ngx.redirect("/login") end`}
    ngx.status = 401
    ngx.header.content_type = "application/json; charset=utf-8"
    ngx.say('{"error":"请先登录原网站","code":"authentication_required"}')
    return ngx.exit(401)
  }`;
  return `# 仅新增本应用路由，不改变原站登录或业务 location。
location = ${prefix} { return 302 ${basePath}$is_args$args; }
location ^~ ${basePath}api/ {
  ${auth(true)}
  resolver ${resolver} valid=5s ipv6=off;
  resolver_timeout 3s;
  set $pi_backend http://${upstream};
  rewrite ^${prefix}(/api/.*)$ $1 break;
  proxy_pass $pi_backend;
  proxy_http_version 1.1;
  proxy_set_header Host ${dynamic ? upstream : '$http_host'};
  proxy_set_header Origin ${dynamic ? `http://${upstream}` : '$http_origin'};
  proxy_set_header Forwarded "";
  proxy_set_header X-Forwarded-Host "";
  proxy_set_header X-Forwarded-Proto "";
  proxy_set_header Cookie "";
  proxy_set_header Connection "";
  proxy_connect_timeout 3s;
  proxy_read_timeout ${proxyTimeoutSeconds}s;
  proxy_send_timeout ${proxyTimeoutSeconds}s;
  client_max_body_size ${bodyLimit};
  proxy_cache off;
  proxy_intercept_errors off;
  add_header Cache-Control "no-store" always;
  error_page 502 503 504 = @pi_unavailable;
  error_page 404 = @pi_not_found;
  error_page 413 = @pi_too_large;
}
location ^~ ${basePath} {
  ${auth(false)}
  alias ${staticRoot.replace(/\/$/, '')}/;
  index index.html;
  autoindex off;
  disable_symlinks on;
  if ($uri ~ "(^|/)\\.") { return 404; }
  if ($uri ~ "\\\\\\\\") { return 404; }
  if ($uri !~ "(?:\\.(?:html|js|mjs|css|json|svg|png|ico|mp4)$|/$)") { return 404; }
  types { text/html html; text/javascript js mjs; text/css css; application/json json; image/svg+xml svg; image/png png; image/x-icon ico; video/mp4 mp4; }
  default_type application/octet-stream;
  add_header Cache-Control "no-store" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'" always;
  error_page 404 = @pi_not_found;
  error_page 403 = @pi_not_found;
}
location @pi_not_found {
  default_type application/json;
  add_header Cache-Control "no-store" always;
  return 404 '{"error":"文件或接口不存在","code":"not_found"}';
}
location @pi_unavailable {
  default_type application/json;
  add_header Cache-Control "no-store" always;
  return 503 '{"error":"Agent 暂不可用，基础查询仍可使用","code":"unavailable"}';
}
location @pi_too_large {
  default_type application/json;
  add_header Cache-Control "no-store" always;
  return 413 '{"error":"提交内容超过入口限制","code":"input_too_large"}';
}
`;
}

export function candidate(original, locations) {
  const anchor = '        server_name localhost;';
  if (original.split(anchor).length !== 2 || /location\s+(?:[=^~]+\s+)?\/pi(?:[\s/{]|$)/.test(original)) throw new Error('原配置结构变化，必须重新审查，不能自动套用');
  return original.replace(anchor, `${anchor}\n\n${locations}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [configFile, destination, originalFile] = process.argv.slice(2);
  if (!configFile || !destination) throw new Error('需要参数 JSON 和新输出文件路径，可选原配置只读路径');
  const locations = renderLocations(JSON.parse(await readFile(configFile, 'utf8')));
  await writeFile(destination, originalFile ? candidate(await readFile(originalFile, 'utf8'), locations) : locations, { flag: 'wx' });
}
