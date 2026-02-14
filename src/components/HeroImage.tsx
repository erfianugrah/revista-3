/**
 * Parallax hero image for content pages.
 *
 * Uses IntersectionObserver to enable/disable the scroll listener so
 * the parallax transform only runs while the hero is in the viewport.
 * The inner div is oversized (-20%/120%) to give headroom for the
 * parallax offset without exposing gaps. A hidden accessible <img>
 * at the bottom provides alt text for screen readers.
 *
 * Hydrated with client:load since it needs to be visible immediately.
 */
"use client";
import { useEffect, useRef } from "react";

interface HeroImageProps {
  title: string;
  tags: string[];
  backgroundImage: string;
  mobileBackgroundImage: string;
  positionX?: string;
  positionY?: string;
  alt: string;
}

export default function HeroImage({
  title,
  tags,
  backgroundImage,
  mobileBackgroundImage,
  positionX = "30%",
  positionY = "50%",
  alt,
}: HeroImageProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const heroElement = heroRef.current;
    const parallaxElement = parallaxRef.current;
    if (!heroElement || !parallaxElement) return;

    // Bind to a const so closures can see the narrowed non-null type
    const pEl = parallaxElement;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            pEl.style.willChange = "transform";
            window.addEventListener("scroll", updateParallax);
          } else {
            pEl.style.willChange = "auto";
            window.removeEventListener("scroll", updateParallax);
          }
        });
      },
      { threshold: 0 },
    );

    observer.observe(heroElement);

    function updateParallax() {
      const scrollPosition = window.scrollY;
      const parallaxFactor = 0.3;
      pEl.style.transform = `translate3d(0, ${scrollPosition * parallaxFactor}px, 0)`;
    }

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateParallax);
    };
  }, []);

  return (
    <div
      ref={heroRef}
      className="relative flex flex-col justify-center items-center text-center h-screen mb-8 md:-mx-16 -mx-8 overflow-hidden"
      data-pagefind-body
    >
      <div
        ref={parallaxRef}
        className="absolute inset-0"
        style={{
          willChange: "transform",
        }}
      >
        <div
          className="absolute inset-0 bg-cover bg-no-repeat md:hidden"
          style={{
            backgroundImage: `url(${mobileBackgroundImage})`,
            backgroundPosition: `${positionX} ${positionY}`,
            top: "-20%",
            height: "120%",
          }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-cover bg-no-repeat hidden md:block"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundPosition: `${positionX} ${positionY}`,
            top: "-20%",
            height: "120%",
          }}
          aria-hidden="true"
        />
      </div>
      <div className="relative">
        <h1 className="prose prose-slate uppercase font-overpass-mono text-[rgb(245,245,245)] text-4xl fade-in-up delay-150">
          {title}
        </h1>
        <div className="flex gap-2 mt-2 fade-in-up delay-300 justify-center">
          {tags.map((tag) => (
            <p key={tag} className="font-overpass-mono text-xl">
              <a
                className="bg-slate-600 text-[rgb(245,245,245)] bg-opacity-50 px-2 py-1 rounded-sm no-underline"
                href={`../tags/${tag}`}
              >
                {tag}
              </a>
            </p>
          ))}
        </div>
      </div>
      <img src={backgroundImage} alt={alt} className="sr-only" />
    </div>
  );
}
