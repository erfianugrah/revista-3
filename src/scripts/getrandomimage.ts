import { initRandomImages } from "./randomImage.ts";

function handlePageLoad(): void {
  initRandomImages(".randomimage");
}

document.addEventListener("astro:page-load", handlePageLoad);
