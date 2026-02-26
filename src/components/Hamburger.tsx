"use client";

import { useState, useEffect, useCallback } from "react";

export default function Hamburger() {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    const navLinks = document.getElementById("nav-links");
    if (navLinks) {
      navLinks.classList.remove("open");
      navLinks.classList.add("collapsed");
    }
  }, []);

  const openMenu = useCallback(() => {
    setIsOpen(true);
    const navLinks = document.getElementById("nav-links");
    if (navLinks) {
      navLinks.classList.remove("collapsed");
      navLinks.classList.add("open");
    }
  }, []);

  const toggleMenu = useCallback(() => {
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }, [isOpen, closeMenu, openMenu]);

  useEffect(() => {
    const handlePageLoad = () => {
      closeMenu();
    };

    document.addEventListener("astro:page-load", handlePageLoad);
    return () => {
      document.removeEventListener("astro:page-load", handlePageLoad);
    };
  }, [closeMenu]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeMenu();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeMenu]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const navLinks = document.getElementById("nav-links");
      const target = e.target as Node;
      if (
        navLinks &&
        !navLinks.contains(target) &&
        !(e.target as Element).closest(".hamburger")
      ) {
        closeMenu();
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isOpen, closeMenu]);

  return (
    <button
      onClick={toggleMenu}
      className="w-[30px] h-[30px] bg-transparent border-0 p-0 cursor-pointer relative hamburger flex items-center justify-center"
      aria-label={isOpen ? "Close menu" : "Open menu"}
      aria-expanded={isOpen}
      aria-controls="nav-links"
    >
      <div className="relative w-[24px] h-[18px]">
        <span
          className="absolute h-[2px] w-full bg-current left-0 transition-transform duration-300"
          style={{
            top: "0px",
            transform: isOpen
              ? "translateY(8px) rotate(45deg)"
              : "translateY(0) rotate(0)",
          }}
        />
        <span
          className="absolute h-[2px] w-full bg-current left-0 top-[8px] transition-opacity duration-300"
          style={{ opacity: isOpen ? 0 : 1 }}
        />
        <span
          className="absolute h-[2px] w-full bg-current left-0 transition-transform duration-300"
          style={{
            top: "16px",
            transform: isOpen
              ? "translateY(-8px) rotate(-45deg)"
              : "translateY(0) rotate(0)",
          }}
        />
      </div>
    </button>
  );
}
