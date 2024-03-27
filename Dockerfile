# Stage 1: Build the Astro project
FROM node:lts AS builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# Stage 2: Setup Caddy server
FROM caddy:2-alpine
COPY --from=builder /app/dist /usr/share/caddy
COPY Caddyfile /etc/caddy/Caddyfile
