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
    // Uncomment the following line if you want to handle after-swap events as well
    // document.addEventListener('astro:after-swap', handlePageLoad)

    return () => {
      document.removeEventListener('astro:page-load', handlePageLoad)
      // document.removeEventListener('astro:after-swap', handlePageLoad)
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
      className={`w-[30px] h-[30px] bg-transparent border-0 p-0 cursor-pointer relative hamburger ${isOpen ? 'open' : ''}`}
      aria-label={isOpen ? "Close menu" : "Open menu"}
    >
      <motion.div
        className="absolute w-[30px] h-[30px]"
        animate={isOpen ? "open" : "closed"}
      >
        <motion.span
          className="absolute h-[2px] w-[24px] bg-current left-[3px]"
          variants={{
            closed: { rotate: 0, translateY: 0, top: '7px' },
            open: { rotate: 45, translateY: 9, top: '7px' },
          }}
          transition={{ duration: 0.3 }}
        />
        <motion.span
          className="absolute h-[2px] w-[24px] bg-current left-[3px] top-[14px]"
          variants={{
            closed: { opacity: 1 },
            open: { opacity: 0 },
          }}
          transition={{ duration: 0.3 }}
        />
        <motion.span
          className="absolute h-[2px] w-[24px] bg-current left-[3px]"
          variants={{
            closed: { rotate: 0, translateY: 0, top: '21px' },
            open: { rotate: -45, translateY: -5, top: '21px' },
          }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>
    </button>
  )
}
