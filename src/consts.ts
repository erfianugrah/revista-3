/** Site-wide constants — single source of truth for values used across components. */

export const SITE_TITLE = "stoicopa";
export const SITE_DESCRIPTION = "My personal hamster wheel.";
export const SITE_AUTHOR = "Erfi Anugrah";

/** CDN base URLs for remote images. */
export const CDN_FAVICON_URL = "https://res.cloudinary.com/dvwl2ci5j/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_red,b_rgb:262c35/v1777951052/isang-bagsak-bw-v2_ryrsrc.png";
export const CDN_COVER_IMAGE_URL = "https://res.cloudinary.com/dvwl2ci5j/image/upload/v1777950985/DSC08327_ktm6kk.jpg";

/** Social media links. */
export const SOCIAL_LINKS = {
  mastodon: "https://mastodon.social/@stoicopa",
  github: "https://github.com/erfianugrah",
  linkedin: "https://www.linkedin.com/in/erfianugrah/",
  instagram: "https://www.instagram.com/stoicopa/",
} as const;
