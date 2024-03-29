# Stage 1: Build the Astro project
FROM node:lts-alpine AS builder
WORKDIR /app

# Disable Astro telemetry
ENV ASTRO_TELEMETRY_DISABLED=1

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build


# Stage 2: Setup Caddy server
FROM caddy:2.7.6-alpine
COPY --from=builder /app/dist /usr/share/caddy
COPY Caddyfile /etc/caddy/Caddyfile
