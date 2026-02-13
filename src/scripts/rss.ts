function handlePageLoad(): void {
  const collections = [
    "/short_form/",
    "/long_form/",
    "/muses/",
    "/zeitweilig/",
  ];
  const currentPath = window.location.pathname;

  if (collections.includes(currentPath)) {
    const rssLink = document.getElementById(
      "rss-link",
    ) as HTMLAnchorElement | null;
    if (!rssLink) return;
    rssLink.href = currentPath + "rss.xml";
    rssLink.style.visibility = "visible";
    rssLink.style.width = "auto";
    rssLink.style.height = "auto";
  }
}

document.addEventListener("astro:page-load", handlePageLoad);
