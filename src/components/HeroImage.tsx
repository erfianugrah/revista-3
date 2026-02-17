/**
 * Parallax hero image for content pages.
 *
 * Improvements over the original:
 *  - Scroll handler batched via rAF (no layout thrashing)
 *  - Smooth lerp easing on scroll parallax
 *  - rAF loop idles when not scrolling to save CPU
 *  - Fade-in on image load (no white flash)
 *  - Text shadow for legibility on bright images
 *  - Respects prefers-reduced-motion
 *  - Uses <img> elements instead of CSS background-image for
 *    better browser loading hints (fetchpriority, decoding)
 *  - willChange only set while hero is in viewport
 *
 * Hydrated with client:load since it needs to be visible immediately.
 */
"use client";
import { useEffect, useRef, useState } from "react";

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
  const desktopImgRef = useRef<HTMLImageElement>(null);
  const mobileImgRef = useRef<HTMLImageElement>(null);
  const [desktopLoaded, setDesktopLoaded] = useState(false);
  const [mobileLoaded, setMobileLoaded] = useState(false);

  // Handle images that loaded before React hydration (cached / SSR)
  useEffect(() => {
    if (desktopImgRef.current?.complete) setDesktopLoaded(true);
    if (mobileImgRef.current?.complete) setMobileLoaded(true);
  }, []);

  useEffect(() => {
    const heroElement = heroRef.current;
    const parallaxElement = parallaxRef.current;
    if (!heroElement || !parallaxElement) return;

    const pEl = parallaxElement;

    // Respect reduced-motion preference
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) return;

    let rafId = 0;
    let isRunning = false;
    let currentY = window.scrollY * 0.3; // initialise to current position
    const parallaxFactor = 0.3;
    const lerpSpeed = 0.1;

    function tick() {
      const targetY = window.scrollY * parallaxFactor;

      // Lerp toward target for smooth easing
      currentY += (targetY - currentY) * lerpSpeed;

      // Snap when close enough — then stop the loop to save CPU
      if (Math.abs(targetY - currentY) < 0.5) {
        currentY = targetY;
        pEl.style.transform = `translate3d(0, ${currentY}px, 0)`;
        isRunning = false;
        return;
      }

      pEl.style.transform = `translate3d(0, ${currentY}px, 0)`;
      rafId = requestAnimationFrame(tick);
    }

    function startLoop() {
      if (!isRunning) {
        isRunning = true;
        rafId = requestAnimationFrame(tick);
      }
    }

    let isInView = false;

    function handleScroll() {
      if (isInView) startLoop();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isInView = entry.isIntersecting;
          if (isInView) {
            pEl.style.willChange = "transform";
            startLoop();
          } else {
            pEl.style.willChange = "auto";
            cancelAnimationFrame(rafId);
            isRunning = false;
          }
        });
      },
      { threshold: 0 },
    );

    observer.observe(heroElement);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const objectPosition = `${positionX} ${positionY}`;

  return (
    <div
      ref={heroRef}
      className="relative flex flex-col justify-center items-center text-center h-screen mb-8 md:-mx-16 -mx-8 overflow-hidden"
      data-pagefind-body
    >
      <div ref={parallaxRef} className="absolute inset-0">
        {/* Mobile image */}
        <img
          ref={mobileImgRef}
          src={mobileBackgroundImage}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          decoding="sync"
          onLoad={() => setMobileLoaded(true)}
          className={`absolute left-0 right-0 w-full object-cover md:hidden transition-opacity duration-700 ${
            mobileLoaded ? "opacity-100" : "opacity-0"
          }`}
          style={{
            objectPosition,
            top: "-20%",
            height: "120%",
          }}
        />
        {/* Desktop image */}
        <img
          ref={desktopImgRef}
          src={backgroundImage}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          decoding="sync"
          onLoad={() => setDesktopLoaded(true)}
          className={`absolute left-0 right-0 w-full object-cover hidden md:block transition-opacity duration-700 ${
            desktopLoaded ? "opacity-100" : "opacity-0"
          }`}
          style={{
            objectPosition,
            top: "-20%",
            height: "120%",
          }}
        />
      </div>
      {/* Subtle gradient overlay for text legibility */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.2) 100%)",
        }}
        aria-hidden="true"
      />
      <div className="relative">
        <h1
          className="prose prose-slate uppercase font-overpass-mono text-[rgb(245,245,245)] text-4xl fade-in-up delay-150"
          style={{
            textShadow: "0 2px 12px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3)",
          }}
        >
          {title}
        </h1>
        <div className="flex gap-2 mt-2 fade-in-up delay-300 justify-center">
          {tags.map((tag) => (
            <p key={tag} className="font-overpass-mono text-xl">
              <a
                className="bg-slate-600 text-[rgb(245,245,245)] bg-opacity-50 px-2 py-1 rounded-sm no-underline"
                href={`../tags/${tag}`}
                style={{
                  textShadow: "0 1px 4px rgba(0,0,0,0.4)",
                }}
              >
                {tag}
              </a>
            </p>
          ))}
        </div>
      </div>
      {/* Accessible image for screen readers / SEO */}
      <img src={backgroundImage} alt={alt} className="sr-only" />
    </div>
  );
}
