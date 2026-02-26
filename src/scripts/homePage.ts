import { initRandomImages } from "./randomImage.ts";

function handlePageLoad(): void {
  initRandomImages("#homepage", { updateAnchor: true });
}

document.addEventListener("astro:page-load", handlePageLoad);
