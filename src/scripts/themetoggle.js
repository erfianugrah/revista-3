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