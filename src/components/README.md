# Astro Components

### Refer to [Astro docs on Components](https://docs.astro.build/en/basics/astro-components/)
---
For pages such as [short form](https://www.erfianugrah.com/short_form/), [long form](https://www.erfianugrah.com/long_form/), any [tag](https://www.erfianugrah.com/long_form/tags/gleichgesinnte/) pages the file that's being used to structure the layout is [BlogPost.astro](./BlogPost.astro)

The [Footer.astro](./Footer.astro) will reference [astro-icon](../../package.json) for the social media icons

[getRandomImage.astro](./getRandomImage.astro) is used in [TagLayout.astro](../layouts/TagLayout.astro) to randommise the images chosen from the [Content Collections](../content/)

[Pagefind.astro](./Pagefind.astro) is used in [Navigation.astro](./Navigation.astro) and is using the [Pagefind](https://pagefind.app/) integration

[ThemeIcon.astro](./ThemeIcon.astro) is referencing [themetoggle.js](../scripts/themetoggle.js) for light/dark mode switch.

[Hamburger.astro](./Hamburger.astro), [ThemeIcon.astro](./ThemeIcon.astro), [Navigation.astro](./Navigation.astro) and  [Pagefind.astro](./Pagefind.astro) are used in [Header.astro](./Header.astro)

[Masonry.astro](./Masonry.astro) is used in [MarkdownPostLayout.astro](../layouts/MarkdownPostLayout.astro) for the rendering of the images that's referenced in the [Content Collections](../content/) for specific posts. [Masonry.astro](./Masonry.astro) is referencing [masonry.css](../styles/MasonryLayout.css) and [glightbox.js](../scripts/lightbox.js)

[sortbydate.jsx](./sortbydate.jsx) is used in [Pages](../pages/) to order the posts that are being rendered by [BlogPost.astro](./BlogPost.astro).

[Homepage.astro](./Homepage.astro) is used in [index.astro](../pages/index.astro) and is referencing [homepage.js](../scripts/homePage.js), this functions the same as [getRandomImage.astro](./getRandomImage.astro) to randomise the pictures shown, but structures are different in terms of the props being passed

[Prose.astro](./Prose.astro) is a TailwindCSS layout and is being used throughout the site for formmatting. [Prose_cv.astro](./Prose_cv.astro) is only for the [cv](../content/cv) collection. [Prose_headings.astro](./Prose_headings.astro) as the name mentions, formats headings.

The other files are remnants during the development process and can be ignored.