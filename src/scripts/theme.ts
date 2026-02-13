export type Theme = "light" | "dark";

export function getThemePreference(): Theme {
  return (
    (localStorage.getItem("theme") as Theme) ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light")
  );
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem("theme", theme);
}

export function toggleTheme(): void {
  const currentTheme: Theme = document.documentElement.classList.contains(
    "dark",
  )
    ? "dark"
    : "light";
  const newTheme: Theme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(newTheme);
}

/**
 * Initialize theme handling: apply stored preference, listen for
 * toggle events from the React ThemeToggle component, and re-apply
 * on Astro client-side navigations.
 */
export function initTheme(): void {
  applyTheme(getThemePreference());

  window.addEventListener("theme-toggle", toggleTheme);

  document.addEventListener("astro:after-swap", () => {
    applyTheme(getThemePreference());
  });
}
