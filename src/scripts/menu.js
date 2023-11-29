window.toggleMenu = function() {
  const navLinks = document.getElementById('nav-links');
  const hamburger = document.querySelector('.hamburger');

  if (navLinks.classList.contains('open')) {
    navLinks.classList.remove('open');
    navLinks.classList.add('collapsed');
  } else {
    navLinks.classList.remove('collapsed');
    navLinks.classList.add('open');
  }

  hamburger.classList.toggle('open');
}