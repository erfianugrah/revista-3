# Stage 2: Setup Caddy server
FROM caddy:2.8-alpine
COPY ./dist /usr/share/caddy
COPY Caddyfile /etc/caddy/Caddyfile
