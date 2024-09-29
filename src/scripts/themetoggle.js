// Check if the theme is stored in localStorage
let theme = localStorage.getItem("theme");

// If not, check the user's system preference
if (!theme) {
  theme = window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

// Set the theme in localStorage
localStorage.setItem("theme", theme);

// Function to apply the current theme
function applyTheme(isInitial = false) {
  const root = document.documentElement;
  if (!isInitial) {
    root.classList.add("theme-transition");
  }
  root.classList.toggle("dark", theme === "dark");
  window.setTimeout(() => {
    root.classList.remove("theme-transition");
  }, 300);
}

// Function to toggle the theme
function toggleTheme() {
  theme = theme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", theme);
  applyTheme();
}

// Apply theme on initial page load
applyTheme(true);

// Event listeners
document.addEventListener("astro:page-load", () => {
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }
});

document.addEventListener("astro:after-swap", () => applyTheme(true));

