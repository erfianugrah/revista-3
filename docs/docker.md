# Docker Implementation

### Container configuration for the Revista project

---

## Overview

The Docker setup provides a production-ready container using Caddy as the web server. I keep it simple - Caddy serves the pre-built static files, and Cloudflare handles HTTPS and edge caching in production.

## Dockerfile

```dockerfile
FROM caddy:2.9.1-alpine

WORKDIR /usr/share/caddy

COPY ./dist .
COPY Caddyfile /etc/caddy/Caddyfile

RUN chown -R root:root /usr/share/caddy && \
    chmod -R 755 /usr/share/caddy

EXPOSE 80

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
```

Key points:

1. **Base Image**: Alpine variant of Caddy 2.9.1 for a minimal footprint
2. **Security**: Proper file ownership and permissions for web content
3. **Simplicity**: Assumes static files are pre-built before `docker build`

## Multi-Architecture Support

The CI/CD pipeline builds for multiple architectures:

```bash
docker buildx build \
  --platform linux/arm64,linux/amd64,linux/arm/v6,linux/arm/v7 \
  -t [repo]/[image-name]:[tag] . \
  --push
```

This covers standard x86_64 servers, ARM-based servers, and Raspberry Pi devices.

## Caddyfile Configuration

```
{
    servers {
        metrics
    }

    grace_period 5s
    log {
        level info
        output file /var/log/access.log {
            roll_size 1gb
            roll_keep 5
            roll_keep_for 168h
        }
        format json {
            time_format wall
        }
    }
}

:2019 {
    metrics
}

:80 {
    encode zstd gzip
    root * /usr/share/caddy
    try_files {path} {path}/ /404.html
    encode zstd gzip
    file_server {
        precompressed zstd br gzip
    }
    handle_errors {
        rewrite * /404.html
        file_server
    }
    log {
        level info
        output file /var/log/revista-access.log {
            roll_size 1gb
            roll_keep 5
            roll_keep_for 168h
        }
        format json {
            time_format wall
        }
    }
}
```

This provides:

1. **Compression**: zstd and gzip with precompressed asset support (brotli too)
2. **Metrics**: Prometheus-compatible metrics endpoint on `:2019`
3. **Error Handling**: 404 fallback via `try_files` and `handle_errors`
4. **Structured Logging**: JSON-formatted access logs with rotation (1GB per file, 5 files, 7 day retention)
5. **Static Serving**: `file_server` with precompressed asset delivery - if a `.zst`, `.br`, or `.gz` version of a file exists, Caddy serves that instead

No explicit cache or security headers in the Caddyfile - Cloudflare handles all of that at the edge.

## Docker Compose

The `compose.yaml` is configured for running behind a reverse proxy:

```yaml
version: "3.9"

services:
  revista:
    image: erfianugrah/revista-4:1.27.6
    hostname: revista
    container_name: revista
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: "1"
          memory: 128M
    volumes:
      - /mnt/user/data/revista/log:/var/log
    environment:
      - TZ=Asia/Singapore
    expose:
      - 80
    networks:
      revista:
        ipv4_address: 172.19.23.2

networks:
  revista:
    driver: bridge
    ipam:
      config:
        - subnet: 172.19.23.0/24
          gateway: 172.19.23.1
```

Key aspects:

1. **Resource Limits**: Capped at 1 CPU and 128MB RAM - more than enough for a static site
2. **Log Volume**: Caddy's JSON access logs are persisted to the host for analysis
3. **Network Isolation**: Custom bridge network with a static IP for reverse proxy routing
4. **No Direct Port Exposure**: Uses `expose` instead of `ports` - the reverse proxy handles external traffic

## Security Considerations

1. **Read-Only Content**: Web content is not modified at runtime
2. **Minimal Permissions**: Content files are owned by root, readable by the Caddy process
3. **No Unnecessary Services**: The container runs only Caddy
4. **Image Signing**: The CI/CD pipeline signs images with Cosign for supply chain security
