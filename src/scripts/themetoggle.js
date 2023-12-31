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

document.addEventListener('astro:page-load', () => {
    // Remove all theme classes
    document.documentElement.classList.remove("light", "dark");

    // Add the current theme class
    document.documentElement.classList.add(theme);

    document.getElementById("themeToggle").addEventListener("click", () => {
        // Toggle the theme
        theme = document.documentElement.classList.toggle("dark") ? "dark" : "light";

        // Update the theme in localStorage
        localStorage.setItem("theme", theme);
    });
});