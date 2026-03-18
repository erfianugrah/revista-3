FROM --platform=$BUILDPLATFORM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM busybox:1.37
COPY --from=build /app/dist /var/www
CMD ["httpd", "-f", "-p", "80", "-h", "/var/www"]
EXPOSE 80
