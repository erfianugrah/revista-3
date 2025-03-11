# Astro Layouts

### Refer to [Astro docs on Layouts](https://docs.astro.build/en/basics/layouts/)
---

This project uses Astro v5.4.3's enhanced layout capabilities with Tailwind CSS v4 for styling.

Layouts are reusable UI structures that can contain components or other layouts. For example, [BaseLayout.astro](layouts/BaseLayout.astro) is used as the foundation for other layouts, and these layouts may incorporate components to render specific UI elements, creating a modular architecture that prevents redundant rendering.

You'll see `<slot />` frequently throughout these files - this is Astro's mechanism for content injection, allowing content from [content collections](/src/content.config.ts) to be inserted into the layout.

The content collections are defined using Astro's new glob loader pattern which provides enhanced type safety and explicit file selection.