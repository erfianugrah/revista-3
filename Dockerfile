FROM caddy:2.8.4-alpine
COPY ./dist /usr/share/caddy
COPY Caddyfile /etc/caddy/Caddyfile
