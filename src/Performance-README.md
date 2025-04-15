# Performance Optimization

### Performance strategy for the Revista project
---

## Overview

The performance strategy for this site addresses multiple aspects of web performance:

1. **Network optimization**: Reducing file sizes and request counts
2. **Rendering optimization**: Ensuring fast page rendering and minimal layout shifts
3. **Resource prioritization**: Loading critical resources first
4. **Caching strategy**: Effective use of browser and CDN caching

## Optimization Techniques

### Astro's Islands Architecture

The project leverages Astro's islands architecture to minimize JavaScript:

- Static HTML rendering for most content
- Selective hydration only where needed (with `client:load`, `client:visible` directives)
- Example: The ThemeToggle component only hydrates itself, not the entire page

```astro
<!-- Only this component gets JavaScript -->  
<ThemeToggle client:load />  
  
<!-- These remain static HTML -->  
<Navigation />  
<SiteTitle />  
```

### Image Optimization

#### Size and Format Optimization

Images are processed through Astro's built-in image optimization:

```javascript
// Masonry.astro
const imageAssets = await Promise.all(
  images.map(async (image) => {
    if (image) {
      return await getImage({
        src: image.src,
        width: 3840,  // Maximum quality size
        height: 2160, // Maintains aspect ratio
        format: "avif", // Optimal compression format
        loading: "lazy", // Defer loading of off-screen images
        decoding: "async", // Allow browser to decode image asynchronously
      });
    }
    return null;
  }),
);
```

Benefits:
- AVIF format reduces file size by ~50% compared to JPEG
- Proper width/height attributes prevent Cumulative Layout Shift (CLS)
- Lazy loading defers off-screen image loading

### Code Optimization

#### Bundle Size Reduction

Tailwind's JIT compiler generates only the CSS actually used on the page:

```javascript
// tailwind.config.mjs
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  // Configuration ensures only used styles are included
}
```

#### Resource Hints

Astro's prefetch directive optimizes navigation:

```javascript
// astro.config.mjs
prefetch: {
  prefetchAll: true,
  defaultStrategy: "viewport",
},
```

This configuration:
- Prefetches pages when links enter the viewport
- Speeds up perceived navigation time
- Prioritizes likely navigation targets

## CDN Integration

The site is deployed to Cloudflare for edge caching:

### Cache Control Headers

Custom headers are defined in the Caddyfile:

```
# Basic Caddyfile for the Revista site
:80 {
    # Set cache control headers for better performance
    header /* {
        # Cache static assets for 1 week
        Cache-Control "public, max-age=604800, must-revalidate"
    }

    # Special cache settings for images
    header /assets/* {
        Cache-Control "public, max-age=2592000, must-revalidate"
    }
}
```

Benefits:
- Different cache policies for different asset types
- Longer cache for images (30 days)
- Shorter cache for HTML/CSS/JS (1 week)

### Edge Deployment

The project deploys to multiple edge platforms:

1. **Cloudflare Pages**: Main deployment with global edge distribution
2. **Deno Deploy**: Secondary deployment for additional edge presence

## Mobile Optimization

### Responsive Grid Adjustments

The Masonry layout adapts for mobile with optimized configurations:

```css
@media (max-width: 768px) {
  .masonry {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  /* Reset spanning on smaller screens for simpler layout */
  .image-container:nth-child(3n),
  .image-container:nth-child(4n) {
    grid-row: auto;
    grid-column: auto;
  }
}

@media (max-width: 480px) {
  .masonry {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
}
```

This creates:
- Smaller grid cells on mobile to fit more content
- Simplified layout patterns to avoid complex reflows
- Better touch-friendly spacing

## Build Process Optimization

The project uses Bun for faster builds:

```json
"scripts": {
  "build": "astro build",
  "postbuild": "pagefind --site dist"
},
```

Build optimizations in `astro.config.mjs`:

```javascript
build: {
  concurrency: 4, // Parallelized build process
  measuring: {
    entryBuilding: true,
    pageGeneration: true,
    bundling: true,
    rendering: true,
    assetProcessing: true,
  },
},
```

These settings provide:
- Parallelized build processes
- Performance metrics for build optimization
- Efficient asset processing

## Monitoring and Metrics

The project is regularly tested for performance using:

- Lighthouse scores for overall performance
- Web Vitals metrics (LCP, FID, CLS)
- Network waterfall analysis

Key metrics targeted:
- **LCP (Largest Contentful Paint)**: Under 2.5s
- **FID (First Input Delay)**: Under 100ms
- **CLS (Cumulative Layout Shift)**: Under 0.1