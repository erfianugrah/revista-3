/** Site-wide constants — single source of truth for values used across components. */

export const SITE_TITLE = "stoicopa";
export const SITE_DESCRIPTION = "My personal hamster wheel.";
export const SITE_AUTHOR = "Erfi Anugrah";

/** CDN base URLs for remote images. */
export const CDN_FAVICON_URL = "https://image.erfi.io/ea_favicon.png";
export const CDN_COVER_IMAGE_URL = "https://image.erfi.io/tenhult_3.jpg";

/** Social media links. */
export const SOCIAL_LINKS = {
  mastodon: "https://mastodon.social/@stoicopa",
  github: "https://github.com/erfianugrah",
  linkedin: "https://www.linkedin.com/in/erfianugrah/",
  instagram: "https://www.instagram.com/stoicopa/",
} as const;
