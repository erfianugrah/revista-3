# Astro Layouts

### Refer to [Astro docs on Layouts ](https://docs.astro.build/en/basics/layouts/)
---

There are technically also components but they are re-usable, and you can see it in other components or even other layouts. Case in point [BaseLayout.astro](layouts/BaseLayout.astro) is used in the other layouts, and other layouts might be using components to render particular UI elements, so nothing is being re-rendered over again. 

You'll see `<slot />` a lot and this is how the content is injected from content collections.