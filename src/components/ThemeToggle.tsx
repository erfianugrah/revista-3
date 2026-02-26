import { useState, useEffect } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial theme state from DOM
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    checkTheme();

    // Listen for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    // Dispatch custom event for Astro script to handle
    window.dispatchEvent(new Event("theme-toggle"));
  };

  return (
    <button
      onClick={toggleTheme}
      className="w-[30px] h-[30px] bg-transparent border-0 p-0 cursor-pointer relative flex items-center justify-center"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-[24px] h-[24px] transition-transform duration-300"
      >
        <circle
          cx="12"
          cy="12"
          r={isDark ? 5 : 9}
          fill="currentColor"
          className="transition-all duration-300"
        />
        <g
          stroke="currentColor"
          className="transition-all duration-300"
          style={{
            opacity: isDark ? 1 : 0,
            transform: isDark ? "scale(1)" : "scale(0.3)",
            transformOrigin: "center",
          }}
        >
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </g>
      </svg>
    </button>
  );
}
