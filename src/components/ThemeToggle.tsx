import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'light'
    setIsDark(theme === 'dark')
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [])

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark'
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark', !isDark)
    localStorage.setItem('theme', newTheme)
  }

  return (
    <button
      id="themeToggle"
      onClick={toggleTheme}
      className="w-[28px] h-[28px] bg-transparent border-0 p-0 cursor-pointer relative flex items-center justify-center"
      aria-label="Toggle theme"
    >
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 28 28"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full"
      >
        <motion.circle
          cx="14"
          cy="14"
          r="6"
          fill="currentColor"
          animate={{
            r: isDark ? 6 : 11,
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
          <line x1="14" y1="1" x2="14" y2="3" />
          <line x1="14" y1="25" x2="14" y2="27" />
          <line x1="5" y1="5" x2="7" y2="7" />
          <line x1="21" y1="21" x2="23" y2="23" />
          <line x1="1" y1="14" x2="3" y2="14" />
          <line x1="25" y1="14" x2="27" y2="14" />
          <line x1="5" y1="23" x2="7" y2="21" />
          <line x1="21" y1="7" x2="23" y2="5" />
        </motion.g>
      </motion.svg>
    </button>
  )
}
