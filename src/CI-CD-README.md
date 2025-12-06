# CI/CD Implementation

### Continuous Integration/Deployment for the Revista project
---

## Overview

This project uses GitHub Actions for its CI/CD pipeline, automating builds, testing, and deployments to multiple targets including Cloudflare, Deno Deploy, GitHub Pages, and Docker Hub.

## Workflow Architecture

The CI/CD pipeline consists of the following stages:

```mermaid
graph TD
    A["Check & Setup"] --> B["Build"] 
    B --> C["Test"]
    C --> D["Deploy"]
    D --> E1["Cloudflare Pages"]  
    D --> E2["Deno Deploy"]
    D --> E3["GitHub Pages"]
    D --> E4["Docker Hub"]
    
    classDef setup fill:#f5d6c3,stroke:#333,stroke-width:1px
    classDef build fill:#c3e8f5,stroke:#333,stroke-width:1px
    classDef test fill:#d6f5c3,stroke:#333,stroke-width:1px
    classDef deploy fill:#f5c3e8,stroke:#333,stroke-width:1px
    classDef target fill:#f5f5c3,stroke:#333,stroke-width:1px
    
    class A setup
    class B build
    class C test
    class D deploy
    class E1,E2,E3,E4 target
```

## Workflow File Structure

The primary workflow file is `.github/workflows/deploy.yml`, which orchestrates the entire process.

## Build Process

The build process supports multiple deployment targets with different configurations:

### Standard Build (Shared by Cloudflare, Deno, Docker)

```yaml
jobs:
  build-revista:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
      
      - name: Cache dependencies
        uses: actions/cache@v4
        with:
          path: |
            ~/.bun/install/cache
            node_modules
            .astro
            dist
          key: ${{ runner.os }}-bun-${{ hashFiles('**/bun.lockb') }}-${{ hashFiles('**/package.json') }}-${{ hashFiles('src/**') }}
      
      - name: Install dependencies
        run: bun install
      
      - name: Build site
        run: bun run build
        
      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
```

### GitHub Pages Build (Independent)

GitHub Pages uses its own build process to accommodate the different base path requirement:

```bash
# Environment variable sets GitHub Pages configuration
GITHUB_PAGES=true astro build && pagefind --site dist
```

This approach ensures:
- **Standard deployments** use `site: "https://www.erfianugrah.com"` with no base path
- **GitHub Pages** uses `site: "https://erfianugrah.github.io"` with `base: "/revista-3"`
- **Complete isolation** between deployment configurations

Key optimizations:

1. **Bun Instead of Node**: Uses Bun for significantly faster installations and builds
2. **Dependency Caching**: Caches Bun's dependency cache to speed up subsequent builds
3. **Frozen Lockfile**: Ensures consistent dependencies across builds
4. **Artifact Generation**: Uploads the build output for use in subsequent jobs

## Testing

The testing phase ensures the build meets quality standards:

```yaml
test:
  needs: build
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    
    - name: Download build
      uses: actions/download-artifact@v3
      with:
        name: build-output
        path: dist
    
    - name: Validate HTML
      run: npx html-validate dist/**/*.html
    
    - name: Check for broken links
      run: npx hyperlink dist/index.html --skip-external
```

Tests include:
1. HTML validation for standards compliance
2. Internal link checking to prevent broken navigation

You can replicate the same checks locally with `bun run lint:site` (builds the site, then runs the HTML validator and hyperlink checker).

## Deployment Targets

### Cloudflare Pages

```yaml
deploy-cloudflare:
  needs: test
  runs-on: ubuntu-latest
  steps:
    - name: Download build
      uses: actions/download-artifact@v3
      with:
        name: build-output
        path: dist
    
    - name: Publish to Cloudflare Pages
      uses: cloudflare/wrangler-action@2.0.0
      with:
        apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        command: pages publish dist --project-name=revista

    - name: Purge Cloudflare cache
      run: |
        curl -X POST "https://api.cloudflare.com/client/v4/zones/${{ secrets.CLOUDFLARE_ZONE_ID }}/purge_cache" \
        -H "Authorization: Bearer ${{ secrets.CLOUDFLARE_API_TOKEN }}" \
        -H "Content-Type: application/json" \
        --data '{"purge_everything":true}'
```

Key points:
1. Uses Cloudflare's Wrangler tool to upload the built site
2. Purges the CDN cache to ensure visitors see the latest content

### Deno Deploy

```yaml
deploy-deno:
  needs: test
  runs-on: ubuntu-latest
  steps:
    - name: Download build
      uses: actions/download-artifact@v3
      with:
        name: build-output
        path: dist
    
    - name: Deploy to Deno Deploy
      uses: denoland/deployctl@v1
      with:
        project: revista
        entrypoint: https://deno.land/std/http/file_server.ts
        root: dist
        token: ${{ secrets.DENO_DEPLOY_TOKEN }}
```

This provides a secondary deployment target using Deno's edge platform.

### GitHub Pages

```yaml
deploy-to-github-pages:
  runs-on: ubuntu-latest
  permissions:
    contents: read
    pages: write
    id-token: write
  concurrency:
    group: "pages"
    cancel-in-progress: false
  environment:
    name: github-pages
    url: ${{ steps.deployment.outputs.page_url }}
  steps:
    - name: Checkout repository
      uses: actions/checkout@v4

    - name: Setup Bun environment
      uses: oven-sh/setup-bun@v1

    - name: Cache dependencies
      uses: actions/cache@v4
      with:
        path: |
          ~/.bun/install/cache
          node_modules
        key: ${{ runner.os }}-bun-${{ hashFiles('**/bun.lockb') }}-${{ hashFiles('**/package.json') }}
        restore-keys: |
          ${{ runner.os }}-bun-${{ hashFiles('**/bun.lockb') }}-
          ${{ runner.os }}-bun-

    - name: Install project dependencies
      run: bun install

    - name: Build for GitHub Pages
      run: bun run build:github-pages

    - name: Setup Pages
      uses: actions/configure-pages@v5

    - name: Upload to GitHub Pages
      uses: actions/upload-pages-artifact@v3
      with:
        path: dist

    - name: Deploy to GitHub Pages
      id: deployment
      uses: actions/deploy-pages@v4
```

Key features:
1. **Independent Build Process**: Unlike other deployments, GitHub Pages builds from source with its own environment
2. **Environment-Specific Configuration**: Uses `GITHUB_PAGES=true` environment variable to set correct `site` and `base` paths
3. **Dedicated Build Command**: Uses `build:github-pages` npm script for proper base path configuration
4. **Proper Permissions**: Configures Pages write access and OIDC token authentication
5. **Concurrency Control**: Prevents conflicting deployments with proper job isolation
6. **Latest GitHub Actions**: Uses official Pages Actions (configure-pages@v5, upload-pages-artifact@v3, deploy-pages@v4)

### Docker Deployment

```yaml
deploy-docker:
  needs: test
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    
    - name: Download build
      uses: actions/download-artifact@v3
      with:
        name: build-output
        path: dist
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Login to Docker Hub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKERHUB_USERNAME }}
        password: ${{ secrets.DOCKERHUB_TOKEN }}
    
    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        platforms: linux/amd64,linux/arm64
        tags: erfianugrah/revista:latest
        cache-from: type=gha
        cache-to: type=gha,mode=max
```

Key aspects:
1. Multi-architecture build for broad compatibility
2. Build caching to speed up subsequent builds
3. Automatic tagging and pushing to Docker Hub

## Secret Management

The workflow uses GitHub Secrets for sensitive information:

- `CLOUDFLARE_API_TOKEN` - Authentication for Cloudflare API
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account identifier
- `CLOUDFLARE_ZONE_ID` - Cloudflare zone for cache purging
- `DENO_DEPLOY_TOKEN` - Authentication for Deno Deploy
- `DOCKERHUB_USERNAME` - Docker Hub account
- `DOCKERHUB_TOKEN` - Authentication for Docker Hub

**GitHub Pages Specific:**
- No additional secrets required (uses built-in OIDC with `id-token: write`)
- Environment variable `GITHUB_PAGES=true` automatically set during GitHub Pages build

## Workflow Triggers

The workflow runs automatically on:

```yaml
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 0 * * 0' # Weekly builds for freshness
```

This ensures:
1. Automatic deployment when code is merged to main
2. Preview builds for pull requests
3. Regular rebuilds to keep dependencies current

## Retry Logic and Error Handling

The workflow includes retry logic for transient errors:

```yaml
- name: Install dependencies
  uses: nick-fields/retry@v2
  with:
    timeout_minutes: 10
    max_attempts: 3
    command: bun install --frozen-lockfile
```

This improves reliability by automatically retrying operations that might fail due to temporary issues.

## Performance Considerations

The CI/CD pipeline is optimized for speed:

1. Parallel deployments to multiple targets (Cloudflare, Deno, GitHub Pages, Docker)
2. Artifact sharing between jobs to avoid rebuilding
3. Caching of dependencies and Docker layers
4. Use of Bun instead of npm for faster installation and building
5. Concurrent deployment jobs that run simultaneously for faster overall pipeline execution

Typical build and deploy times:
- Full pipeline execution: ~4-6 minutes
- Standard build job: ~1-2 minutes (shared by Cloudflare, Deno, Docker)
- GitHub Pages independent build: ~2-3 minutes (includes full build + image processing)
- Each deployment job: ~1-2 minutes
- Overall efficiency gained through parallel execution
