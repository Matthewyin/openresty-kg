export const fixtures = {
  events: { input: 'events { multi_accept on; worker_connections 1024; }', mode: 'main' },
  stream: { input: 'stream { server { listen 9000; resolver 192.0.2.53; proxy_connect_timeout 5s; proxy_timeout 10s; set $target example.invalid:443; proxy_pass $target; } }', mode: 'main' },
  vts: { input: 'http { vhost_traffic_status_zone; server { listen 8080; location /status { vhost_traffic_status_display; vhost_traffic_status_display_format html; } } }', mode: 'main' },
  fragment: { input: 'server { listen 9000; proxy_pass example.invalid:443; }', mode: 'fragment' },
  map: { input: 'http { map $host $backend { default example.invalid; include conf.d/*.conf; } }', mode: 'main' },
  invalid: { input: 'events { worker_connections 1024;', mode: 'main' },
};
