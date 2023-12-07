document.addEventListener('astro:page-load', function() {
  const collections = ["/short_form", "/long_form", "/muses", "/zeitweillig"];
  const currentPath = window.location.pathname;
  if (collections.includes(currentPath)) {
    const rssLink = document.getElementById('rss-link');
    rssLink.href = currentPath + "/rss.xml";
    rssLink.style.visibility = "visible";
    rssLink.style.width = "auto";
    rssLink.style.height = "auto";
  }
});