# Docker Setup for Revista

## Overview

This project provides a containerized deployment option using Docker with Caddy as the web server. The container runs a custom Astro v5.5.6 + Tailwind CSS v4 build optimized for performance and security.

## Key Components

- **Base Image**: Alpine-based Caddy (v2.8.4)
- **Content**: Pre-built static files from Astro
- **Configuration**: Custom Caddyfile for optimal performance
- **Security**: Proper file permissions and security headers

## Quick Start

```bash
# Build the container
docker build -t revista:latest .

# Run the container
docker run -p 8080:80 revista:latest

# Or use docker-compose
docker-compose up -d
```

## Port Configuration

The container exposes port 80 by default. For different setups:

- **Standard usage**: Map to any port on your host (e.g., `-p 8080:80`)
- **Behind reverse proxy**: Can map to port 4321 or any other port
- **Direct exposure**: Caddy handles serving the static content

## Docker Compose

The project includes a `compose.yaml` file for easy deployment:

```yaml
version: '3'
services:
  revista:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped
    volumes:
      - caddy_data:/data
      - caddy_config:/config

volumes:
  caddy_data:
  caddy_config:
```

## Multi-Architecture Support

The project supports multiple CPU architectures. If you encounter issues with multi-platform builds, use these commands:

```bash
# Create a builder instance
docker buildx create --name mybuilder --use --driver docker-container

# Check the builder's status
docker buildx inspect --bootstrap
docker buildx ls

# Build and push for multiple platforms
docker buildx build \
  --platform linux/arm64,linux/amd64,linux/arm/v6,linux/arm/v7 \
  -t [repo]/[image-name]:[tag] . \
  --push
```

## Performance Optimizations

The Docker setup includes several performance optimizations:

1. **Alpine-based image** for minimal size (~40MB)
2. **Gzip compression** enabled in Caddyfile
3. **Cache control headers** for optimal browser caching
4. **Security headers** for enhanced protection

## Customization

To customize the Docker setup:

1. **Modify the Caddyfile** for different server configurations
2. **Edit environment variables** in compose.yaml for different settings
3. **Add volumes** in compose.yaml for persistent storage needs

## Troubleshooting

Common issues and solutions:

- **Permission errors**: Container runs as a non-root user; ensure proper file permissions
- **Port conflicts**: Change the host port mapping if 8080 is already in use
- **Build failures**: Ensure Docker buildx is properly set up for multi-architecture builds

For more detailed information on Docker deployment, refer to the main [README.md](README.md#docker-setup) file.
