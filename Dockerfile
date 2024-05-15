FROM caddy:2.8-alpine
COPY ./dist /usr/share/caddy
COPY Caddyfile /etc/caddy/Caddyfile
