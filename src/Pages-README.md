# Astro Pages

### Refer to [Astro docs on Pages](https://docs.astro.build/en/basics/astro-pages/)
---

These pages are what you'll see rendered/appended to the paths of the site, it's part of how Astro does its routing, and in this particular case we're doing static site rendering rather than server/hybrid.

Each page here references [components](components/) and [layouts](layouts/) talked about in other readmes in those sections.

The dynamic page routes (such as blog posts) are generated from content collections defined in [content.config.ts](/src/content.config.ts) using Astro's glob loader pattern. These collections use a consistent schema that enables type-safe access to content throughout the codebase.

[404.astro](pages/404.astro) is referencing [burgundy.js](scripts/burgundy.js)