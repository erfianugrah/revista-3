# Docker Implementation

### Container configuration for the Revista project

---

## Overview

The Docker setup provides a minimal production-ready container using BusyBox httpd as the web server. The container serves pre-built static files - Cloudflare handles HTTPS and edge caching in production.

## Dockerfile

```dockerfile
FROM busybox:1.37
COPY dist /var/www
CMD ["httpd", "-f", "-p", "80", "-h", "/var/www"]
EXPOSE 80
```

Key points:

1. **Base Image**: BusyBox 1.37 for a minimal footprint (~2.5 MB)
2. **Simplicity**: Single-stage build - copies pre-built `dist/` and runs BusyBox httpd
3. **No Runtime Dependencies**: Static files are pre-built before `docker build`; no config files or additional services needed

## Multi-Architecture Support

The CI/CD pipeline builds for multiple architectures:

```bash
docker buildx build \
  --platform linux/arm64,linux/amd64,linux/arm/v6,linux/arm/v7 \
  -t [repo]/[image-name]:[tag] . \
  --push
```

This covers standard x86_64 servers, ARM-based servers, and Raspberry Pi devices.

## Docker Compose

Two compose files, one per deployment target:

- **`compose.router.yaml`** - LIVE since 2026-08-23. Runs on the MS-01
  NixOS router (composer-managed, host=local) while servarr is rebuilt.
  Single pinned-bridge network:

```yaml
networks:
  revista:
    driver: bridge
    driver_opts:
      com.docker.network.bridge.name: revista0
    ipam:
      config:
        - subnet: 172.20.5.0/24
          gateway: 172.20.5.1
```

The bridge name (`revista0`) must appear in `dockerBridges` in
`~/infra/router/configuration.nix` (the router's nftables forward chain
is policy-drop). The edge Caddy runs on the same host
(`network_mode: host`), so no macvlan is needed - it proxies
`revista.erfi.io` and `erfianugrah.com` straight to `172.20.5.2:80`.

- **`compose.yaml`** - the servarr deployment (rollback path). Dual
  network: custom bridge for reverse proxy routing plus a shared macvlan
  (`servarr_lan`) for a first-class LAN IP reachable by the edge Caddy
  on MS-01:

```yaml
services:
  revista:
    image: erfianugrah/revista-4:latest
    hostname: revista
    container_name: revista
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: "1"
          memory: 64M
    environment:
      - TZ=Asia/Singapore
    expose:
      - 80
    networks:
      revista:
        ipv4_address: 172.19.23.2
      lan:
        ipv4_address: 10.0.71.58
        mac_address: "02:42:0a:00:47:3a"
        gw_priority: 100

networks:
  revista:
    driver: bridge
    ipam:
      config:
        - subnet: 172.19.23.0/24
          gateway: 172.19.23.1
  lan:
    external: true
    name: servarr_lan
```

Key aspects:

1. **Resource Limits**: Capped at 1 CPU and 64MB RAM - more than enough for a static site served by BusyBox httpd
2. **Router deployment**: pinned bridge `revista0` / 172.20.5.0/24; the edge Caddy is on the same host, so a bridge IP suffices
3. **Servarr deployment (rollback)**: custom bridge network (`revista`) plus a shared macvlan (`servarr_lan`) for a first-class LAN IP reachable by the edge Caddy on MS-01
4. **No Direct Port Exposure**: Uses `expose` instead of `ports` - the reverse proxy handles external traffic

## Security Considerations

1. **Read-Only Content**: Web content is not modified at runtime
2. **Minimal Attack Surface**: The container runs only BusyBox httpd - no scripting, no modules, no runtime config
3. **No Unnecessary Services**: Single static binary, single process
4. **Image Signing**: The CI/CD pipeline signs images with Cosign for supply chain security
