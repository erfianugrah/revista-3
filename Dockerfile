# Stage 1: Build the Astro project
FROM node:lts AS builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# Stage 2: Setup Caddy server
FROM erfianugrah/caddy-cfdns:v1.3.4-2.7.6-arm64
COPY --from=builder /app/dist /usr/share/caddy
COPY Caddyfile /etc/caddy/Caddyfile
