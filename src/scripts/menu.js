document.addEventListener("astro:page-load", () => {
window.toggleMenu = function() {
  const navLinks = document.getElementById('nav-links');
  const hamburger = document.querySelector('.hamburger');
  navLinks.classList.toggle('open');
  hamburger.classList.toggle('open');
}
});