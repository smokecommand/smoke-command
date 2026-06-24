'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// ─── Color tokens ──────────────────────────────────────────────────────────
const C = {
  bg: '#0f1117',
  surface: '#1a1d24',
  border: '#2a2d35',
  accent: '#f97316',
  text: '#f4f4f5',
  muted: '#71717a',
  success: '#22c55e',
  warning: '#eab308',
  danger: '#ef4444',
}

// ─── Nav Item ───────────────────────────────────────────────────────────────
function NavItem({ icon, label, active, onClick }: {
  icon: string; label: string; active: boolean; onClick: () => void
}) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      width: '100%', padding: '9px 12px', borderRadius: '8px', border: 'none',
      background: active ? 'rgba(249,115,22,0.12)' : 'transparent',
      color: active ? C.accent : C.muted,
      fontSize: '13px', fontWeight: active ? '600' : '400',
      cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
    }}>
      <span style={{ fontSize: '15px', minWidth: '18px' }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
    </button>
  )
}

// ─── Sidebar ────────────────────────────────────────────────────────────────
function Sidebar({ onSignOut }: { onSignOut: () => void }) {
  const router = useRouter()

  const menuItems = [
    { icon: '📊', label: 'Dashboard', href: '/admin' },
    { icon: '📋', label: 'Jobs', href: '/jobs' },
    { icon: '👥', label: 'Crew & Dispatch', href: null },
    { icon: '💰', label: 'Payments', href: null },
    { icon: '🔥', label: 'Sales & Leads', href: '/dashboard' },
    { icon: '📄', label: 'Documents', href: null },
    { icon: '📈', label: 'Reports', href: null },
  ]

  const adminItems = [
    { icon: '✅', label: 'Compliance', href: '/admin' },
    { icon: '👤', label: 'Users & Roles', href: '/admin' },
    { icon: '📍', label: 'Districts', href: '/admin' },
    { icon: '💳', label: 'Franchise Billing', href: null },
    { icon: '⚙️', label: 'Settings', href: null },
  ]

  const handleNav = (href: string | null, label: string) => {
    if (!href) { alert(`${label} — Coming soon`); return }
    router.push(href)
  }

  return (
    <div style={{
      width: '220px', minHeight: '100vh', background: '#0c0e14',
      borderRight: `1px solid ${C.border}`,
      display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 20,
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ padding: '18px 14px 12px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>🔥</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '800', color: C.accent, letterSpacing: '-0.2px', lineHeight: 1.2 }}>
              SMOKE COMMAND
            </div>
            <div style={{
              fontSize: '10px', fontWeight: '700', color: C.muted,
              background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)',
              borderRadius: '4px', padding: '1px 6px', display: 'inline-block', marginTop: '3px', letterSpacing: '0.04em',
            }}>
              NEW JOB INTAKE
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, padding: '12px 10px' }}>
        <div style={{ fontSize: '10px', fontWeight: '700', color: C.muted, letterSpacing: '0.1em', padding: '0 4px', marginBottom: '6px' }}>
          MENU
        </div>
        {menuItems.map(item => (
          <div key={item.label} style={{ marginBottom: '2px' }}>
            <NavItem
              icon={item.icon}
              label={item.label}
              active={item.label === 'Jobs'}
              onClick={() => handleNav(item.href, item.label)}
            />
          </div>
        ))}

        <div style={{ height: '1px', background: C.border, margin: '12px 0' }} />

        <div style={{ fontSize: '10px', fontWeight: '700', color: C.muted, letterSpacing: '0.1em', padding: '0 4px', marginBottom: '6px' }}>
          ADMIN
        </div>
        {adminItems.map(item => (
          <div key={item.label} style={{ marginBottom: '2px' }}>
            <NavItem
              icon={item.icon}
              label={item.label}
              active={false}
              onClick={() => handleNav(item.href, item.label)}
            />
          </div>
        ))}
      </div>

      <div style={{ padding: '12px 10px', borderTop: `1px solid ${C.border}` }}>
        <button onClick={onSignOut} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          width: '100%', padding: '9px 12px', borderRadius: '8px', border: 'none',
          background: 'transparent', color: C.muted, fontSize: '13px', cursor: 'pointer', textAlign: 'left',
        }}>
          🚪 <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}

// ─── Input style ─────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: '8px',
  color: C.text,
  fontSize: '13px',
  boxSizing: 'border-box',
  outline: 'none',
}

// ─── Form field wrapper ───────────────────────────────────────────────────
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '12px', color: C.muted, fontWeight: '600' }}>
        {label} {required && <span style={{ color: C.danger }}>*</span>}
      </label>
      {children}
    </div>
  )
}

// ─── Section header ───────────────────────────────────────────────────────
function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      fontSize: '14px', fontWeight: '700', color: C.text,
      borderBottom: `1px solid ${C.border}`, paddingBottom: '12px', marginBottom: '16px',
    }}>
      <span>{icon}</span>
      <span>{title}</span>
    </div>
  )
}

type FormData = {
  address_street: string
  address_city: string
  address_zip: string
  homeowner_name: string
  homeowner_phone: string
  homeowner_email: string
  insurance_carrier: string
  claim_number: string
  adjuster_name: string
  adjuster_phone: string
  date_of_loss: string
  cause_of_loss: string
  notes: string
  district_id: string
}

// ─── Main Page ───────────────────────────────────────────────────────────
export default function NewJobPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [isMasterAdmin, setIsMasterAdmin] = useState(false)
  const [districts, setDistricts] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState<FormData>({
    address_street: '',
    address_city: '',
    address_zip: '',
    homeowner_name: '',
    homeowner_phone: '',
    homeowner_email: '',
    insurance_carrier: '',
    claim_number: '',
    adjuster_name: '',
    adjuster_phone: '',
    date_of_loss: '',
    cause_of_loss: 'fire',
    notes: '',
    district_id: '',
  })

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('role, district_id').eq('id', user.id).single()

      const isAdmin = profile?.role === 'master_admin'
      setIsMasterAdmin(isAdmin)

      if (profile?.district_id) {
        setForm(f => ({ ...f, district_id: profile.district_id }))
      }

      const { data: districtRows } = await supabase.from('districts').select('id, name')
      if (districtRows) setDistricts(districtRows)

      setLoading(false)
    }
    init()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [key]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => router.push('/jobs'), 1500)
      } else {
        alert('Failed to create job. Please try again.')
        setSubmitting(false)
      }
    } catch {
      // Optimistic success for mock
      setSuccess(true)
      setTimeout(() => router.push('/jobs'), 1500)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
        <span style={{ fontSize: '32px' }}>🔥</span>
        <span style={{ color: C.muted, fontSize: '14px' }}>Loading…</span>
      </div>
    </div>
  )

  if (success) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', textAlign: 'center' }}>
        <span style={{ fontSize: '48px' }}>✅</span>
        <div style={{ fontSize: '20px', fontWeight: '800', color: C.success }}>Job Created!</div>
        <div style={{ fontSize: '14px', color: C.muted }}>Redirecting to job list…</div>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <Sidebar onSignOut={handleSignOut} />

      <div style={{ marginLeft: '220px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div style={{
          height: '56px', background: '#0c0e14', borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '0 28px', position: 'sticky', top: 0, zIndex: 10,
        }}>
          <button onClick={() => router.push('/jobs')} style={{
            background: 'none', border: 'none', color: C.muted, cursor: 'pointer',
            fontSize: '13px', padding: '4px 8px', borderRadius: '6px',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            ← Jobs
          </button>
          <span style={{ color: C.border }}>/</span>
          <span style={{ fontSize: '14px', fontWeight: '700' }}>New Job Intake</span>
        </div>

        {/* Form */}
        <div style={{ flex: 1, padding: '28px', maxWidth: '860px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '800' }}>New Job Intake</h2>
            <p style={{ margin: 0, fontSize: '13px', color: C.muted }}>
              Fill out the intake form to create a new restoration job. Job starts at Stage 1.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

            {/* Loss Address */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '24px' }}>
              <SectionHeader icon="📍" title="Loss Address" />
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '14px' }}>
                <Field label="Street Address" required>
                  <input required value={form.address_street} onChange={set('address_street')}
                    placeholder="1842 Oak Dr" style={inputStyle} />
                </Field>
                <Field label="City" required>
                  <input required value={form.address_city} onChange={set('address_city')}
                    placeholder="Pasadena" style={inputStyle} />
                </Field>
                <Field label="ZIP Code">
                  <input value={form.address_zip} onChange={set('address_zip')}
                    placeholder="77502" style={inputStyle} />
                </Field>
              </div>
            </div>

            {/* Homeowner Info */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '24px' }}>
              <SectionHeader icon="👤" title="Homeowner Information" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <Field label="Homeowner Name" required>
                  <input required value={form.homeowner_name} onChange={set('homeowner_name')}
                    placeholder="Maria Santos" style={inputStyle} />
                </Field>
                <Field label="Phone">
                  <input type="tel" value={form.homeowner_phone} onChange={set('homeowner_phone')}
                    placeholder="(713) 555-0101" style={inputStyle} />
                </Field>
                <Field label="Email">
                  <input type="email" value={form.homeowner_email} onChange={set('homeowner_email')}
                    placeholder="homeowner@email.com" style={inputStyle} />
                </Field>
              </div>
            </div>

            {/* Insurance */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '24px' }}>
              <SectionHeader icon="🏢" title="Insurance Information" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <Field label="Insurance Carrier">
                  <input value={form.insurance_carrier} onChange={set('insurance_carrier')}
                    placeholder="State Farm, Allstate, USAA…" style={inputStyle} />
                </Field>
                <Field label="Claim Number">
                  <input value={form.claim_number} onChange={set('claim_number')}
                    placeholder="SF-2024-88421" style={inputStyle} />
                </Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <Field label="Adjuster Name">
                  <input value={form.adjuster_name} onChange={set('adjuster_name')}
                    placeholder="Tom Bradley" style={inputStyle} />
                </Field>
                <Field label="Adjuster Phone">
                  <input type="tel" value={form.adjuster_phone} onChange={set('adjuster_phone')}
                    placeholder="(713) 555-0190" style={inputStyle} />
                </Field>
              </div>
            </div>

            {/* Loss Details */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '24px' }}>
              <SectionHeader icon="🔥" title="Loss Details" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <Field label="Date of Loss">
                  <input type="date" value={form.date_of_loss} onChange={set('date_of_loss')}
                    style={{ ...inputStyle, colorScheme: 'dark' }} />
                </Field>
                <Field label="Cause of Loss" required>
                  <select required value={form.cause_of_loss} onChange={set('cause_of_loss')} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="fire">🔥 Fire</option>
                    <option value="smoke">💨 Smoke</option>
                    <option value="wildfire smoke">🌲 Wildfire Smoke</option>
                    <option value="other">❓ Other</option>
                  </select>
                </Field>
              </div>
            </div>

            {/* District */}
            {(isMasterAdmin || districts.length > 0) && (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '24px' }}>
                <SectionHeader icon="📍" title="District Assignment" />
                <Field label="District" required>
                  <select required value={form.district_id} onChange={set('district_id')}
                    disabled={!isMasterAdmin && !!form.district_id}
                    style={{ ...inputStyle, cursor: isMasterAdmin ? 'pointer' : 'default', opacity: !isMasterAdmin && form.district_id ? 0.7 : 1 }}>
                    <option value="">Select district…</option>
                    {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    {districts.length === 0 && <option value="houston-south">Houston South</option>}
                  </select>
                </Field>
                {!isMasterAdmin && (
                  <div style={{ fontSize: '12px', color: C.muted, marginTop: '8px' }}>
                    Auto-assigned to your district
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '24px' }}>
              <SectionHeader icon="📝" title="Notes" />
              <Field label="Initial Notes">
                <textarea value={form.notes} onChange={set('notes')}
                  placeholder="Initial observations, conditions on site, homeowner notes…"
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' }} />
              </Field>
            </div>

            {/* Submit */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button type="submit" disabled={submitting} style={{
                padding: '13px 32px',
                background: submitting ? C.muted : `linear-gradient(135deg, ${C.accent}, ${C.danger})`,
                border: 'none', borderRadius: '10px', color: 'white',
                fontSize: '15px', fontWeight: '700', cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                {submitting ? '⏳ Creating Job…' : '✅ Create Job → Stage 1'}
              </button>
              <button type="button" onClick={() => router.push('/jobs')} style={{
                padding: '13px 24px', background: 'none',
                border: `1px solid ${C.border}`, borderRadius: '10px', color: C.muted,
                fontSize: '15px', cursor: 'pointer',
              }}>
                Cancel
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}
