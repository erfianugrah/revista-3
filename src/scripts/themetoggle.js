// Check if the theme is stored in localStorage
let theme = localStorage.getItem("theme");

// If not, check the user's system preference
if (!theme) {
  theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Set the theme in localStorage
localStorage.setItem("theme", theme);

// Add the theme as a class on the html element
document.documentElement.classList.add(theme);

document.getElementById("themeToggle").addEventListener("click", () => {
  // Toggle the .dark class
  document.documentElement.classList.toggle("dark");

  // Check if the .dark class is present
  const isDark = document.documentElement.classList.contains("dark");

  // Set the theme based on whether the .dark class is present
  theme = isDark ? "dark" : "light";

  // Update the theme in localStorage
  localStorage.setItem("theme", theme);
});

document.addEventListener('astro:after-swap', () => {
  // Get the theme from localStorage
  theme = localStorage.getItem("theme");

  // Add the theme as a class on the html element
  document.documentElement.classList.add(theme);
});