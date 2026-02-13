# Docker Implementation

### Detailed Docker configuration for the Revista project

---

## Overview

The Docker implementation for this project provides a production-ready container using Caddy as the web server. The container is designed for security, performance, and ease of deployment across various environments.

## Multi-Stage Build Process

The Dockerfile uses a single-stage build to create an optimized image:

```dockerfile
# Using the lightweight Alpine variant of Caddy for better performance
FROM caddy:2.8.4-alpine

# Set the working directory for the site files
WORKDIR /usr/share/caddy

# Copy the Astro-built static files (from the 'dist' directory after 'bun run build')
COPY ./dist .

# Copy our custom Caddy configuration
COPY Caddyfile /etc/caddy/Caddyfile

# Set proper ownership and permissions for security
RUN chown -R root:root /usr/share/caddy && \
    chmod -R 755 /usr/share/caddy && \
    # Create Caddy-specific directories with proper permissions
    mkdir -p /data/caddy /config/caddy && \
    chmod 700 /data/caddy /config/caddy

# Expose the HTTP port (HTTPS is handled by Cloudflare in production)
EXPOSE 80

# Run Caddy with our custom config
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
```

### Key Features

1. **Base Image**: Uses the Alpine variant of Caddy for a minimal footprint (~40MB)
2. **Security**: Sets proper file permissions for web content
3. **Configuration**: Uses a custom Caddyfile for optimized serving
4. **Simplicity**: Assumes the static files are pre-built before Docker build

## Potential Multi-Stage Build Improvement

A more comprehensive multi-stage build could include the build process itself:

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install Bun for faster builds
RUN npm install -g bun

# Copy package files and install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source files and build
COPY . .
RUN bun run build

# Production stage
FROM caddy:2.8.4-alpine
WORKDIR /usr/share/caddy

# Copy built files from builder stage
COPY --from=builder /app/dist .
COPY Caddyfile /etc/caddy/Caddyfile

# Set permissions and create directories
RUN chown -R root:root /usr/share/caddy && \
    chmod -R 755 /usr/share/caddy && \
    mkdir -p /data/caddy /config/caddy && \
    chmod 700 /data/caddy /config/caddy

EXPOSE 80
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
```

This improved approach would:

1. Build the site inside the container
2. Ensure build environment consistency
3. Reduce the final image size by excluding build tools
4. Simplify the CI/CD process

## Multi-Architecture Support

The project includes multi-architecture builds for maximum compatibility:

```bash
docker buildx build \
  --platform linux/arm64,linux/amd64,linux/arm/v6,linux/arm/v7 \
  -t [repo]/[image-name]:[tag] . \
  --push
```

This enables deployment on:

- Standard x86_64 servers (linux/amd64)
- ARM-based servers (linux/arm64)
- Raspberry Pi and similar devices (linux/arm/v6, linux/arm/v7)

## Caddyfile Configuration

```
# Basic Caddyfile for the Revista site
:80 {
    # Enable gzip compression
    encode gzip

    # Set cache control headers for better performance
    header /* {
        # Cache static assets for 1 week
        Cache-Control "public, max-age=604800, must-revalidate"
        # Security headers
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
    }

    # Special cache settings for images
    header /assets/* {
        Cache-Control "public, max-age=2592000, must-revalidate"
    }

    # Serve the static site from the container's working directory
    root * /usr/share/caddy
    file_server
}
```

This configuration provides:

1. **Compression**: Enables gzip compression for faster delivery
2. **Cache Control**: Sets appropriate cache times for different asset types
3. **Security Headers**: Adds security headers for enhanced protection
4. **Static Serving**: Configures the file server for optimal performance

## Docker Compose Configuration

The project includes a `compose.yaml` file for easy deployment:

```yaml
version: "3"
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

Key aspects:

1. **Port Mapping**: Maps container port 80 to host port 8080
2. **Restart Policy**: Ensures the container restarts automatically
3. **Persistent Volumes**: Creates volumes for Caddy data and configuration

## Security Considerations

The Docker setup includes several security enhancements:

1. **Read-Only Content**: Web content is not modified at runtime
2. **Minimal Permissions**: Content files are owned by root but readable by the Caddy process
3. **Security Headers**: The Caddyfile adds protective HTTP headers
4. **No Unnecessary Services**: The container runs only Caddy

## Image Size Optimization

The final image size is optimized at approximately 40MB by:

1. Using Alpine Linux as the base OS
2. Including only the built static files
3. Not installing additional packages

This small footprint provides:

- Faster container startup
- Reduced storage requirements
- Smaller attack surface
- Faster deployment and downloads
