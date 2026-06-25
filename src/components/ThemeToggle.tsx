'use client'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('sc-theme')
    const isDark = saved !== 'light'
    setDark(isDark)
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }, [])

  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
    localStorage.setItem('sc-theme', next ? 'dark' : 'light')
  }

  return (
    <button onClick={toggle} title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      style={{
        background: dark ? '#1a1d24' : '#e2e8f0',
        border: `1px solid ${dark ? '#2a2d35' : '#cbd5e1'}`,
        borderRadius: 20,
        width: 52,
        height: 28,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        padding: '0 4px',
        transition: 'all 0.2s',
        position: 'relative',
      }}>
      <div style={{
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: dark ? '#f97316' : '#fbbf24',
        transform: dark ? 'translateX(0)' : 'translateX(24px)',
        transition: 'transform 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
      }}>
        {dark ? '🌙' : '☀️'}
      </div>
    </button>
  )
}
