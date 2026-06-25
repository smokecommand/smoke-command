'use client'
import { useRouter, usePathname } from 'next/navigation'

const NAV = [
  { icon: '📊', label: 'Dashboard', href: '/admin' },
  { icon: '📋', label: 'Jobs', href: '/jobs' },
  { icon: '👥', label: 'Crew', href: '/crew' },
  { icon: '🔥', label: 'Leads', href: '/leads' },
  { icon: '⚙️', label: 'More', href: '/admin?tab=settings' },
]

export default function MobileNav() {
  const router = useRouter()
  const path = usePathname()
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: '#0c0e14', borderTop: '1px solid #2a2d35',
      display: 'flex', height: 60,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {NAV.map(item => {
        const active = path === item.href.split('?')[0]
        return (
          <button key={item.href} onClick={() => router.push(item.href)}
            style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, padding: '6px 0' }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: active ? '#f97316' : '#71717a', letterSpacing: 0.3 }}>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
