"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronUp } from "lucide-react";
import { Button } from "../components/ui/button.tsx";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const rafId = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (!ticking.current) {
        ticking.current = true;
        rafId.current = requestAnimationFrame(() => {
          setIsVisible(window.scrollY > 300);
          ticking.current = false;
        });
      }
    };

    window.addEventListener("scroll", toggleVisibility, { passive: true });

    return () => {
      window.removeEventListener("scroll", toggleVisibility);
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      {isVisible && (
        <Button
          className="fixed bottom-4 right-4 p-2 rounded-full bg-primary text-primary-foreground shadow-lg transition-opacity hover:opacity-80 focus:outline-hidden focus:ring-2 focus:ring-primary focus:ring-opacity-50"
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          <ChevronUp className="h-6 w-6" />
        </Button>
      )}
    </>
  );
}
