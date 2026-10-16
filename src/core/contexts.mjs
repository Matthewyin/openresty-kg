export const CONTEXTS = Object.freeze([
  'main', 'events', 'http', 'http.server', 'http.location', 'http.upstream',
  'http.if.server', 'http.if.location', 'http.limit_except',
  'stream', 'stream.server', 'stream.upstream', 'mail', 'mail.server',
]);

// 对照 Nginx 1.27.1 各块回调中的 cmd_type；未知块不能继承父槽位。
const transitions = {
  http: { server: 'http.server', upstream: 'http.upstream' },
  'http.server': { location: 'http.location', if: 'http.if.server' },
  'http.location': {
    location: 'http.location', if: 'http.if.location', limit_except: 'http.limit_except',
  },
  stream: { server: 'stream.server', upstream: 'stream.upstream' },
  mail: { server: 'mail.server' },
};

export function childContext(name, parent, isRoot) {
  if (isRoot && ['http', 'stream', 'mail', 'events'].includes(name)) return name;
  const transition = Object.hasOwn(transitions, parent) ? transitions[parent] : null;
  return transition && Object.hasOwn(transition, name) ? transition[name] : null;
}

// 锁定 Nginx e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928 的注册槽位与 handler 分支。
const mapHandler = { include: true, controls: { hostnames: 0, volatile: 0, default: 1 } };
const geoHandler = { include: true, controls: { ranges: 0, default: 1, delete: 1 } };
const httpGeoHandler = { include: true, controls: { ...geoHandler.controls, proxy: 1, proxy_recursive: 0 } };
const typesHandler = { include: true, controls: {} };
const splitHandler = { include: false, controls: {} };
const charsetHandler = { include: false, controls: {} };
const handlers = {
  http: { map: mapHandler, geo: httpGeoHandler, types: typesHandler, split_clients: splitHandler, charset_map: charsetHandler },
  stream: { map: mapHandler, geo: geoHandler, split_clients: splitHandler },
  'http.server': { types: typesHandler },
  'http.location': { types: typesHandler },
};

export function blockHandler(name, parent) {
  const allowed = Object.hasOwn(handlers, parent) ? handlers[parent] : null;
  return allowed && Object.hasOwn(allowed, name) ? allowed[name] : null;
}
