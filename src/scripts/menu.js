document.addEventListener('astro:page-load', () => {
  window.toggleMenu = function () {
    const navLinks = document.getElementById('nav-links');
    const hamburger = document.querySelector('.hamburger');

    const isNavOpen = navLinks.classList.contains('open');
    navLinks.classList.remove('open', 'collapsed');

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        navLinks.classList.add(isNavOpen ? 'collapsed' : 'open');
      });
    });

    hamburger.classList.toggle('open');
  }
});