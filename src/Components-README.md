# Astro Components

### Refer to [Astro docs on Components](https://docs.astro.build/en/basics/astro-components/)
---
For pages such as [short form](https://www.erfianugrah.com/short_form/), [long form](https://www.erfianugrah.com/long_form/), any [tag](https://www.erfianugrah.com/long_form/tags/gleichgesinnte/) pages the file that's being used to structure the layout is [BlogPost.astro](layouts/BlogPost.astro)

The [Footer.astro](components/Footer.astro) will reference [astro-icon](../package.json) for the social media icons

[getRandomImage.astro](components/getRandomImage.astro) is used in [TagLayout.astro](layouts/TagLayout.astro) to randommise the images chosen from the [Content Collections](content/)

[Pagefind.astro](components/Pagefind.astro) is used in [Navigation.astro](components/Navigation.astro) and is using the [Pagefind](https://pagefind.app/) integration

[ThemeIcon.astro](components/ThemeIcon.astro) is referencing [themetoggle.js](scripts/themetoggle.js) for light/dark mode switch.

[Hamburger.astro](components/Hamburger.astro), [ThemeIcon.astro](components/ThemeIcon.astro), [Navigation.astro](components/Navigation.astro) and  [Pagefind.astro](components/Pagefind.astro) are used in [Header.astro](components/Header.astro)

[Masonry.astro](components/Masonry.astro) is used in [MarkdownPostLayout.astro](layouts/MarkdownPostLayout.astro) for the rendering of the images that's referenced in the [Content Collections](content/) for specific posts. [Masonry.astro](components/Masonry.astro) is referencing [masonry.css](styles/MasonryLayout.css) and [glightbox.js](scripts/lightbox.js)

[sortbydate.jsx](components/sortbydate.jsx) is used in [Pages](pages/) to order the posts that are being rendered by [BlogPost.astro](layouts/BlogPost.astro).

[Homepage.astro](components/Homepage.astro) is used in [index.astro](pages/index.astro) and is referencing [homepage.js](scripts/homePage.js), this functions the same as [getRandomImage.astro](components/getRandomImage.astro) to randomise the pictures shown, but structures are different in terms of the props being passed

[Prose.astro](components/Prose.astro) is a TailwindCSS layout and is being used throughout the site for formmatting. [Prose_cv.astro](components/Prose_cv.astro) is only for the [cv](content/cv) collection. [Prose_headings.astro](components/Prose_headings.astro) as the name mentions, formats headings.

The other files are remnants during the development process and can be ignored.