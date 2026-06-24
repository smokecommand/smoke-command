'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Check role and route accordingly
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single()

      if (profile?.role === 'master_admin') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    }
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#0f1117',
    }}>
      {/* Left panel — branding */}
      <div style={{
        flex: 1,
        display: 'none',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px',
        background: 'linear-gradient(135deg, #1a0a00 0%, #0f1117 60%)',
        borderRight: '1px solid #2a2d35',
      }}
        className="left-panel"
      >
        {/* Logo */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{ fontSize: '28px' }}>🔥</span>
            <span style={{ fontSize: '24px', fontWeight: '800', color: '#f97316', letterSpacing: '-0.5px' }}>
              SMOKE COMMAND
            </span>
          </div>
          <div style={{ fontSize: '13px', color: '#71717a', letterSpacing: '2px', textTransform: 'uppercase' }}>
            Restore Medics USA
          </div>
        </div>

        <h1 style={{
          fontSize: '42px',
          fontWeight: '800',
          color: '#f4f4f5',
          lineHeight: '1.1',
          marginBottom: '24px',
          letterSpacing: '-1px',
        }}>
          Every fire<br />
          <span style={{ color: '#f97316' }}>is a live lead.</span>
        </h1>

        <p style={{
          fontSize: '16px',
          color: '#a1a1aa',
          lineHeight: '1.6',
          maxWidth: '380px',
          marginBottom: '48px',
        }}>
          Real-time fire intelligence, district canvassing, and lead tracking — all in one platform.
        </p>

        {/* Feature list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { icon: '🔥', text: 'Live fire alerts piped directly to your leads board' },
            { icon: '🏘️', text: 'Auto-mapped neighborhoods with canvass street lists' },
            { icon: '📊', text: 'District-scoped KPIs — your numbers, your view only' },
            { icon: '📍', text: 'Door-by-door canvass log with photo upload' },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '18px' }}>{f.icon}</span>
              <span style={{ fontSize: '14px', color: '#a1a1aa' }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — login form */}
      <div style={{
        width: '100%',
        maxWidth: '480px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px 32px',
        margin: '0 auto',
      }}>
        {/* Mobile logo */}
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '24px' }}>🔥</span>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#f97316', letterSpacing: '-0.5px' }}>
              SMOKE COMMAND
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#71717a', letterSpacing: '2px', textTransform: 'uppercase' }}>
            Restore Medics USA
          </div>
        </div>

        <div style={{ width: '100%', maxWidth: '380px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#f4f4f5', marginBottom: '8px' }}>
            Sign in to your district
          </h2>
          <p style={{ fontSize: '14px', color: '#71717a', marginBottom: '32px' }}>
            Enter your credentials to access your dashboard.
          </p>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#a1a1aa', marginBottom: '8px' }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@restoremedicsusa.com"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#1a1d24',
                  border: '1px solid #2a2d35',
                  borderRadius: '8px',
                  color: '#f4f4f5',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
              />
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#a1a1aa', marginBottom: '8px' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#1a1d24',
                  border: '1px solid #2a2d35',
                  borderRadius: '8px',
                  color: '#f4f4f5',
                  fontSize: '15px',
                  outline: 'none',
                }}
              />
            </div>

            {error && (
              <div style={{
                padding: '12px 16px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#ef4444',
                fontSize: '14px',
                marginBottom: '20px',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: loading ? '#7c3a1a' : 'linear-gradient(135deg, #f97316, #ef4444)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '15px',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s',
                letterSpacing: '0.3px',
              }}
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <p style={{ marginTop: '24px', fontSize: '13px', color: '#71717a', textAlign: 'center' }}>
            Don&apos;t have an account? Contact your district admin.
          </p>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .left-panel {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  )
}
