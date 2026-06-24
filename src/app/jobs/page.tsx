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

// ─── Stage names ────────────────────────────────────────────────────────────
const STAGE_NAMES: Record<number, string> = {
  1: 'Job Intake',
  2: 'Site Assessment',
  3: 'Photo Documentation',
  4: 'Carrier Submission',
  5: 'Awaiting Payment',
  6: 'Heavy Clean',
  7: 'Final Walkthrough',
  8: 'Job Closed',
}

const STAGE_COLORS: Record<number, { bg: string; color: string; border: string }> = {
  1: { bg: 'rgba(113,113,122,0.15)', color: '#71717a', border: 'rgba(113,113,122,0.3)' },
  2: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
  3: { bg: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: 'rgba(139,92,246,0.3)' },
  4: { bg: 'rgba(234,179,8,0.15)', color: '#eab308', border: 'rgba(234,179,8,0.3)' },
  5: { bg: 'rgba(249,115,22,0.15)', color: '#f97316', border: 'rgba(249,115,22,0.3)' },
  6: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'rgba(239,68,68,0.3)' },
  7: { bg: 'rgba(34,197,94,0.15)', color: '#22c55e', border: 'rgba(34,197,94,0.3)' },
  8: { bg: 'rgba(34,197,94,0.2)', color: '#22c55e', border: 'rgba(34,197,94,0.4)' },
}

// ─── Mock jobs ──────────────────────────────────────────────────────────────
const MOCK_JOBS = [
  {
    id: 'mock-1',
    address_street: '1842 Oak Dr',
    address_city: 'Pasadena',
    homeowner_name: 'Maria Santos',
    insurance_carrier: 'State Farm',
    claim_number: 'SF-2024-88421',
    current_stage: 2,
    carrier_approval: 28400,
    district_id: 'houston-south',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-2',
    address_street: '504 Oleander Ave',
    address_city: 'La Marque',
    homeowner_name: 'Robert Tran',
    insurance_carrier: 'Allstate',
    claim_number: 'ALL-2024-55193',
    current_stage: 5,
    carrier_approval: 41750,
    district_id: 'galveston',
    created_at: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-3',
    address_street: '2217 Bayou Rd',
    address_city: 'Texas City',
    homeowner_name: 'James Kelley',
    insurance_carrier: 'USAA',
    claim_number: 'USAA-2024-31087',
    current_stage: 6,
    carrier_approval: 63200,
    district_id: 'texas-city',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

type Job = typeof MOCK_JOBS[0]

function daysAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
}

function fmtMoney(n: number | null): string {
  if (!n) return '—'
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0 })
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
              JOB MANAGEMENT
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

      {/* Sign out */}
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

// ─── Stage Badge ─────────────────────────────────────────────────────────────
function StageBadge({ stage }: { stage: number }) {
  const s = STAGE_COLORS[stage] || STAGE_COLORS[1]
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: '700',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap',
    }}>
      {stage} · {STAGE_NAMES[stage]}
    </span>
  )
}

// ─── Job Card ─────────────────────────────────────────────────────────────
function JobCard({ job, onOpen }: { job: Job; onOpen: (id: string) => void }) {
  const days = daysAgo(job.created_at)
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: '12px',
      padding: '18px 22px',
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      transition: 'border-color 0.15s',
      cursor: 'default',
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = C.accent)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}
    >
      {/* Stage indicator */}
      <div style={{
        width: '44px', height: '44px', borderRadius: '10px',
        background: STAGE_COLORS[job.current_stage]?.bg || 'rgba(113,113,122,0.15)',
        border: `1px solid ${STAGE_COLORS[job.current_stage]?.border || 'rgba(113,113,122,0.3)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '18px', fontWeight: '800',
        color: STAGE_COLORS[job.current_stage]?.color || C.muted,
        flexShrink: 0,
      }}>
        {job.current_stage}
      </div>

      {/* Main info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '15px', fontWeight: '700', color: C.text }}>
            {job.address_street}, {job.address_city}
          </div>
          <StageBadge stage={job.current_stage} />
        </div>
        <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: C.muted, flexWrap: 'wrap' }}>
          <span>👤 {job.homeowner_name}</span>
          <span>🏢 {job.insurance_carrier} · {job.claim_number || 'No claim #'}</span>
          <span>📅 {days} day{days !== 1 ? 's' : ''} on job</span>
        </div>
      </div>

      {/* Value */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: '17px', fontWeight: '800', color: C.accent }}>
          {fmtMoney(job.carrier_approval)}
        </div>
        <div style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>approved value</div>
      </div>

      {/* Open button */}
      <button onClick={() => onOpen(job.id)} style={{
        padding: '9px 18px', background: `linear-gradient(135deg, ${C.accent}, ${C.danger})`,
        border: 'none', borderRadius: '8px', color: 'white',
        fontSize: '13px', fontWeight: '700', cursor: 'pointer',
        whiteSpace: 'nowrap', flexShrink: 0,
      }}>
        Open →
      </button>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function JobsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState<Job[]>([])
  const [stageFilter, setStageFilter] = useState<number | null>(null)
  const [districtFilter, setDistrictFilter] = useState<string>('all')
  const [isMasterAdmin, setIsMasterAdmin] = useState(false)
  const [districts, setDistricts] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('role, district_id').eq('id', user.id).single()

      const isAdmin = profile?.role === 'master_admin'
      setIsMasterAdmin(isAdmin)

      // Load districts for filter
      const { data: districtRows } = await supabase.from('districts').select('id, name')
      if (districtRows) setDistricts(districtRows)

      // Load jobs from API
      try {
        const params = new URLSearchParams()
        if (!isAdmin && profile?.district_id) {
          params.set('district_id', profile.district_id)
        }
        const res = await fetch(`/api/jobs?${params}`)
        if (res.ok) {
          const json = await res.json()
          setJobs(json.jobs || MOCK_JOBS)
        } else {
          setJobs(MOCK_JOBS)
        }
      } catch {
        setJobs(MOCK_JOBS)
      }

      setLoading(false)
    }
    init()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const filteredJobs = jobs.filter(j => {
    if (stageFilter !== null && j.current_stage !== stageFilter) return false
    if (districtFilter !== 'all' && j.district_id !== districtFilter) return false
    return true
  })

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
        <span style={{ fontSize: '32px' }}>🔥</span>
        <span style={{ color: C.muted, fontSize: '14px' }}>Loading jobs…</span>
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
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px', position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div style={{ fontSize: '15px', fontWeight: '700' }}>📋 Jobs</div>
          <button
            onClick={() => router.push('/jobs/new')}
            style={{
              padding: '9px 18px', background: `linear-gradient(135deg, ${C.accent}, ${C.danger})`,
              border: 'none', borderRadius: '8px', color: 'white',
              fontSize: '13px', fontWeight: '700', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            + New Job
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '800' }}>Job Pipeline</h2>
            <p style={{ margin: 0, fontSize: '13px', color: C.muted }}>
              {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} · {isMasterAdmin ? 'All districts' : 'Your district'}
            </p>
          </div>

          {/* Filter bar */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: C.muted, fontWeight: '600' }}>Stage:</span>
            {[null, 1, 2, 3, 4, 5, 6, 7, 8].map(s => (
              <button key={s === null ? 'all' : s} onClick={() => setStageFilter(s)} style={{
                padding: '5px 12px', borderRadius: '99px', border: `1px solid ${stageFilter === s ? C.accent : C.border}`,
                background: stageFilter === s ? 'rgba(249,115,22,0.12)' : 'transparent',
                color: stageFilter === s ? C.accent : C.muted,
                fontSize: '12px', fontWeight: '600', cursor: 'pointer',
              }}>
                {s === null ? 'All' : `${s} · ${STAGE_NAMES[s]}`}
              </button>
            ))}

            {isMasterAdmin && districts.length > 0 && (
              <>
                <div style={{ width: '1px', height: '20px', background: C.border, margin: '0 4px' }} />
                <span style={{ fontSize: '12px', color: C.muted, fontWeight: '600' }}>District:</span>
                <select
                  value={districtFilter}
                  onChange={e => setDistrictFilter(e.target.value)}
                  style={{
                    padding: '5px 10px', borderRadius: '8px',
                    background: C.surface, border: `1px solid ${C.border}`,
                    color: C.text, fontSize: '12px', cursor: 'pointer',
                  }}
                >
                  <option value="all">All Districts</option>
                  {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </>
            )}
          </div>

          {/* Job list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredJobs.length === 0 ? (
              <div style={{
                padding: '64px', textAlign: 'center',
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px',
                color: C.muted, fontSize: '14px',
              }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>📋</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: C.text, marginBottom: '8px' }}>No jobs found</div>
                <div>Adjust filters or create a new job to get started.</div>
              </div>
            ) : (
              filteredJobs.map(job => (
                <JobCard key={job.id} job={job} onOpen={id => router.push(`/jobs/${id}`)} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
