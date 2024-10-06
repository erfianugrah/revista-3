'use client'

import React, { useEffect, useRef, useState } from 'react'

interface HeroImageProps {
  title: string
  tags: string[]
  backgroundImage: string
  mobileBackgroundImage: string
  positionX?: string
  positionY?: string
  alt: string
}

export default function HeroImage({
  title,
  tags,
  backgroundImage,
  mobileBackgroundImage,
  positionX = '30%',
  positionY = '50%',
  alt,
}: HeroImageProps) {
  const [scrollY, setScrollY] = useState(0)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const parallaxStyle = {
    transform: `translate3d(0, ${scrollY * 0.3}px, 0)`,
    willChange: 'transform',
  }

  return (
    <div
      ref={heroRef}
      className="relative flex flex-col justify-center items-center text-center h-screen mb-8 md:-mx-16 -mx-8 overflow-hidden"
      data-pagefind-body
    >
      <div
        className="absolute inset-0 bg-cover bg-no-repeat"
        style={{
          ...parallaxStyle,
          backgroundImage: `url(${mobileBackgroundImage})`,
          backgroundPosition: `${positionX} ${positionY}`,
          top: '-20%',
          height: '120%',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-cover bg-no-repeat hidden md:block"
        style={{
          ...parallaxStyle,
          backgroundImage: `url(${backgroundImage})`,
          backgroundPosition: `${positionX} ${positionY}`,
          top: '-20%',
          height: '120%',
        }}
        aria-hidden="true"
      />
      <div className="relative">
        <h1 className="prose prose-slate uppercase font-overpass-mono text-[rgb(245,245,245)] text-4xl fade-in-up delay-150">
          {title}
        </h1>
        <div className="flex gap-2 mt-2 fade-in-up delay-300 justify-center">
          {tags.map((tag) => (
            <p key={tag} className="font-overpass-mono text-xl">
              <a
                className="bg-slate-600 text-[rgb(245,245,245)] bg-opacity-50 px-2 py-1 rounded no-underline"
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
  )
}
