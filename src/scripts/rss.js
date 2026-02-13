function handlePageLoad() {
  const collections = [
    "/short_form/",
    "/long_form/",
    "/muses/",
    "/zeitweilig/",
  ];
  const currentPath = window.location.pathname;
  if (collections.includes(currentPath)) {
    const rssLink = document.getElementById("rss-link");
    rssLink.href = currentPath + "rss.xml";
    rssLink.style.visibility = "visible";
    rssLink.style.width = "auto";
    rssLink.style.height = "auto";
  }
}

document.addEventListener("astro:page-load", handlePageLoad);
// document.addEventListener('astro:after-swap', handlePageLoad);
