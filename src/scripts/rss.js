document.addEventListener('astro:page-load', function() {
  console.log('Script is running');
  window.addEventListener('DOMContentLoaded', (event) => {
    const collections = ["/short_form", "/long_form", "/muses", "/zeitweillig"];
    const currentPath = window.location.pathname;
    console.log('Current path:', currentPath);
    console.log('Is current path in collections?', collections.includes(currentPath));
    if (collections.includes(currentPath)) {
      const rssLink = document.getElementById('rss-link');
      rssLink.href = currentPath + "/rss.xml";
      rssLink.style.visibility = "visible";
      rssLink.style.width = "auto";
      rssLink.style.height = "auto";
      console.log('RSS link element:', rssLink);
      console.log('RSS link href:', rssLink.href);
    }
  });
});