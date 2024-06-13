# Stage 2: Setup Caddy server
FROM caddy:2.8.0
COPY ./dist /usr/share/caddy
COPY Caddyfile /etc/caddy/Caddyfile
