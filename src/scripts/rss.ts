/**
 * Show the RSS link icon and set its href when the current page
 * is a collection index that has an RSS feed endpoint.
 */
function handlePageLoad(): void {
  const collections = [
    "short_form",
    "long_form",
    "muses",
    "zeitweilig",
    "authors",
  ];
  // Normalize path by stripping leading/trailing slashes
  const currentPath = window.location.pathname.replace(/^\/|\/$/g, "");

  if (collections.includes(currentPath)) {
    const rssLink = document.getElementById(
      "rss-link",
    ) as HTMLAnchorElement | null;
    if (!rssLink) return;
    rssLink.href = `/${currentPath}/rss.xml`;
    rssLink.style.visibility = "visible";
    rssLink.style.width = "auto";
    rssLink.style.height = "auto";
  }
}

document.addEventListener("astro:page-load", handlePageLoad);
