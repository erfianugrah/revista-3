'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function Hamburger() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handlePageLoad = () => {
      const navLinks = document.getElementById('nav-links')
      if (navLinks) {
        navLinks.classList.remove('open', 'collapsed')
        navLinks.classList.add(isOpen ? 'open' : 'collapsed')
      }
    }

    document.addEventListener('astro:page-load', handlePageLoad)
    return () => {
      document.removeEventListener('astro:page-load', handlePageLoad)
    }
  }, [isOpen])

  const toggleMenu = () => {
    setIsOpen(!isOpen)
    const navLinks = document.getElementById('nav-links')
    if (navLinks) {
      if (navLinks.classList.contains('open')) {
        navLinks.classList.remove('open')
        navLinks.classList.add('collapsed')
      } else {
        navLinks.classList.remove('collapsed')
        navLinks.classList.add('open')
      }
    }
  }

  return (
    <button
      onClick={toggleMenu}
      className="w-[30px] h-[30px] bg-transparent border-0 p-0 cursor-pointer relative hamburger flex items-center justify-center"
      aria-label={isOpen ? "Close menu" : "Open menu"}
    >
      <motion.div
        className="relative w-[24px] h-[18px]"
        animate={isOpen ? "open" : "closed"}
      >
        <motion.span
          className="absolute h-[2px] w-full bg-current left-0"
          variants={{
            closed: { rotate: 0, translateY: 0, top: '0px' },
            open: { rotate: 45, translateY: 8, top: '0px' },
          }}
          transition={{ duration: 0.3 }}
        />
        <motion.span
          className="absolute h-[2px] w-full bg-current left-0 top-[8px]"
          variants={{
            closed: { opacity: 1 },
            open: { opacity: 0 },
          }}
          transition={{ duration: 0.3 }}
        />
        <motion.span
          className="absolute h-[2px] w-full bg-current left-0"
          variants={{
            closed: { rotate: 0, translateY: 0, top: '16px' },
            open: { rotate: -45, translateY: -8, top: '16px' },
          }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>
    </button>
  )
}
