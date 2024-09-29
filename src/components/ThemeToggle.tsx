'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark')
    setIsDark(isDarkMode)
  }, [])

  const toggleTheme = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)
    document.documentElement.classList.toggle('dark')
    localStorage.setItem('theme', newIsDark ? 'light' : 'dark')
  }

  return (
    <button
      id="themeToggle"
      onClick={toggleTheme}
      className="w-[30px] h-[30px] bg-transparent border-0 p-0 cursor-pointer relative dark:invert flex items-center justify-center"
      aria-label="Toggle theme"
    >
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 30 30"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full"
      >
        <motion.circle
          cx="15"
          cy="15"
          r="7"
          fill="currentColor"
          animate={{
            r: isDark ? 7 : 12,
          }}
          transition={{ duration: 0.3 }}
        />
        <motion.g
          stroke="currentColor"
          animate={{
            opacity: isDark ? 1 : 0,
            scale: isDark ? 1 : 0.3,
          }}
          transition={{ duration: 0.3 }}
        >
          <line x1="15" y1="1" x2="15" y2="3" />
          <line x1="15" y1="27" x2="15" y2="29" />
          <line x1="5" y1="5" x2="7" y2="7" />
          <line x1="23" y1="23" x2="25" y2="25" />
          <line x1="1" y1="15" x2="3" y2="15" />
          <line x1="27" y1="15" x2="29" y2="15" />
          <line x1="5" y1="25" x2="7" y2="23" />
          <line x1="23" y1="7" x2="25" y2="5" />
        </motion.g>
      </motion.svg>
    </button>
  )
}
