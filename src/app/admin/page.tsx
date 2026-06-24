'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { UserRole, Job, JobStatus } from '@/lib/supabase'

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

// ─── Types ─────────────────────────────────────────────────────────────────
type Tab =
  | 'dashboard' | 'jobs' | 'crew' | 'payments' | 'sales' | 'documents' | 'reports'
  | 'compliance' | 'users' | 'districts' | 'franchise' | 'settings'

type ComplianceStatus = 'CURRENT' | 'DUE SOON' | 'OVERDUE' | 'UNKNOWN'

interface ComplianceItem {
  id: string
  name: string
  category: string
  recurrence: string
  reference: string
  status: ComplianceStatus
  dueDate: string
  assignedTo: string
}

interface JobStats {
  total: number
  active: number
  pipelineValue: number
  byStatus: Record<string, number>
}

interface DistrictStat {
  id: string
  name: string
  leads_new: number
  leads_in_progress: number
  leads_closed: number
  doors_knocked: number
}

interface InviteForm {
  email: string
  full_name: string
  role: UserRole
  district_id: string
}

// ─── Default compliance data ────────────────────────────────────────────────
const DEFAULT_COMPLIANCE: ComplianceItem[] = [
  {
    id: '1', name: 'Respirator Fit Test', category: 'People — Medical',
    recurrence: 'Annual', reference: 'OSHA 29 CFR 1910.134',
    status: 'CURRENT', dueDate: '2025-10-01', assignedTo: 'All field techs',
  },
  {
    id: '2', name: 'OSHA Respiratory Medical Evaluation', category: 'People — Medical',
    recurrence: 'Annual', reference: 'OSHA 29 CFR 1910.134',
    status: 'CURRENT', dueDate: '2025-09-15', assignedTo: 'Required before fit test',
  },
  {
    id: '3', name: 'IICRC S-520 Certification', category: 'People — Cert',
    recurrence: 'Every 3 years', reference: 'Applied Microbial Remediation',
    status: 'DUE SOON', dueDate: '2025-08-20', assignedTo: 'Lead techs',
  },
  {
    id: '4', name: 'OSHA 10-Hour Training', category: 'People — Training',
    recurrence: 'One-time', reference: 'General Industry',
    status: 'CURRENT', dueDate: 'N/A', assignedTo: 'All field personnel',
  },
  {
    id: '5', name: '10-Panel Drug Screen', category: 'People — Medical',
    recurrence: 'Pre-employment + random', reference: 'Per drug-free workplace policy',
    status: 'CURRENT', dueDate: 'Ongoing', assignedTo: 'Concentra Pearland',
  },
  {
    id: '6', name: 'Employee Handbook Acknowledgment', category: 'Onboarding',
    recurrence: 'Annual', reference: 'Annual policy review',
    status: 'DUE SOON', dueDate: '2025-07-31', assignedTo: 'All employees',
  },
  {
    id: '7', name: 'Written Respiratory Protection Program', category: 'Documents',
    recurrence: 'Annual review', reference: 'OSHA 29 CFR 1910.134(c)',
    status: 'CURRENT', dueDate: '2026-01-01', assignedTo: 'On file requirement',
  },
]

// ─── Status badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: ComplianceStatus }) {
  const map = {
    CURRENT: { bg: 'rgba(34,197,94,0.15)', color: C.success, border: 'rgba(34,197,94,0.3)' },
    'DUE SOON': { bg: 'rgba(234,179,8,0.15)', color: C.warning, border: 'rgba(234,179,8,0.3)' },
    OVERDUE: { bg: 'rgba(239,68,68,0.15)', color: C.danger, border: 'rgba(239,68,68,0.3)' },
    UNKNOWN: { bg: 'rgba(113,113,122,0.15)', color: C.muted, border: 'rgba(113,113,122,0.3)' },
  }
  const s = map[status] || map.UNKNOWN
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: '700',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`, letterSpacing: '0.05em',
    }}>
      {status}
    </span>
  )
}

// ─── Sidebar nav item ───────────────────────────────────────────────────────
function NavItem({ icon, label, active, onClick, badge }: {
  icon: string; label: string; active: boolean; onClick: () => void; badge?: string
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
      {badge && (
        <span style={{
          fontSize: '10px', fontWeight: '700', padding: '1px 6px', borderRadius: '99px',
          background: C.accent, color: 'white',
        }}>{badge}</span>
      )}
    </button>
  )
}

// ─── Placeholder section ────────────────────────────────────────────────────
function ComingSoon({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '340px', gap: '12px', color: C.muted,
    }}>
      <span style={{ fontSize: '48px' }}>{icon}</span>
      <div style={{ fontSize: '18px', fontWeight: '700', color: C.text }}>{title}</div>
      <div style={{ fontSize: '14px' }}>{desc}</div>
      <div style={{
        marginTop: '8px', padding: '6px 16px', borderRadius: '99px',
        background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)',
        color: C.accent, fontSize: '12px', fontWeight: '600',
      }}>
        Coming Soon
      </div>
    </div>
  )
}

// ─── Add Compliance Slide Panel ─────────────────────────────────────────────
function AddCompliancePanel({ open, onClose, onAdd }: {
  open: boolean
  onClose: () => void
  onAdd: (item: ComplianceItem) => void
}) {
  const [form, setForm] = useState({
    name: '', category: 'People — Medical', recurrence: 'Annual',
    reference: '', status: 'CURRENT' as ComplianceStatus,
    dueDate: '', assignedTo: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd({ ...form, id: Date.now().toString() })
    setForm({ name: '', category: 'People — Medical', recurrence: 'Annual', reference: '', status: 'CURRENT', dueDate: '', assignedTo: '' })
    onClose()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    background: C.bg, border: `1px solid ${C.border}`,
    borderRadius: '7px', color: C.text, fontSize: '13px',
    boxSizing: 'border-box' as const,
  }

  if (!open) return null
  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100,
      }} />
      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '420px',
        background: C.surface, borderLeft: `1px solid ${C.border}`,
        zIndex: 101, overflowY: 'auto', padding: '28px 24px',
        display: 'flex', flexDirection: 'column', gap: '18px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '17px', fontWeight: '700' }}>Add Compliance Item</div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: C.muted,
            fontSize: '20px', cursor: 'pointer', lineHeight: 1,
          }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', color: C.muted, display: 'block', marginBottom: '6px' }}>Item Name *</label>
            <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Respirator Fit Test" style={inputStyle} />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: C.muted, display: 'block', marginBottom: '6px' }}>Category</label>
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={inputStyle}>
              {['People — Medical', 'People — Cert', 'People — Training', 'Onboarding', 'Documents', 'Equipment', 'Other'].map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: C.muted, display: 'block', marginBottom: '6px' }}>Recurrence</label>
            <select value={form.recurrence} onChange={e => setForm(p => ({ ...p, recurrence: e.target.value }))} style={inputStyle}>
              {['Annual', 'Every 3 years', 'One-time', 'Monthly', 'Quarterly', 'Pre-employment + random', 'Annual review'].map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: C.muted, display: 'block', marginBottom: '6px' }}>Reference / Notes</label>
            <input value={form.reference} onChange={e => setForm(p => ({ ...p, reference: e.target.value }))}
              placeholder="OSHA 29 CFR 1910.134, etc." style={inputStyle} />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: C.muted, display: 'block', marginBottom: '6px' }}>Status</label>
            <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as ComplianceStatus }))} style={inputStyle}>
              {(['CURRENT', 'DUE SOON', 'OVERDUE', 'UNKNOWN'] as ComplianceStatus[]).map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: C.muted, display: 'block', marginBottom: '6px' }}>Due Date</label>
            <input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
              style={{ ...inputStyle, colorScheme: 'dark' }} />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: C.muted, display: 'block', marginBottom: '6px' }}>Assigned To</label>
            <input value={form.assignedTo} onChange={e => setForm(p => ({ ...p, assignedTo: e.target.value }))}
              placeholder="All field techs, John D., etc." style={inputStyle} />
          </div>

          {/* Notification rules section */}
          <div style={{
            padding: '14px', background: C.bg, borderRadius: '8px',
            border: `1px solid ${C.border}`,
          }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: C.text, marginBottom: '10px' }}>🔔 Notification Rules</div>
            <button type="button" style={{
              padding: '7px 12px', background: 'none',
              border: `1px dashed ${C.border}`, borderRadius: '6px',
              color: C.muted, fontSize: '12px', cursor: 'pointer',
            }}>
              + Add reminder
            </button>
            <div style={{ fontSize: '11px', color: C.muted, marginTop: '8px' }}>
              Send alerts 30, 14, and 7 days before due date
            </div>
          </div>

          {/* Escalation */}
          <div style={{
            padding: '14px', background: C.bg, borderRadius: '8px',
            border: `1px solid ${C.border}`,
          }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: C.text, marginBottom: '6px' }}>⚡ Escalation</div>
            <div style={{ fontSize: '11px', color: C.muted }}>
              If overdue by 7 days → notify District Admin<br />
              If overdue by 14 days → notify Master Admin
            </div>
          </div>

          <button type="submit" style={{
            padding: '12px', background: `linear-gradient(135deg, ${C.accent}, ${C.danger})`,
            border: 'none', borderRadius: '8px', color: 'white',
            fontSize: '14px', fontWeight: '700', cursor: 'pointer', marginTop: '4px',
          }}>
            Add Compliance Item
          </button>
        </form>
      </div>
    </>
  )
}

// ─── Main Admin Page ─────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [districts, setDistricts] = useState<DistrictStat[]>([])
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>(DEFAULT_COMPLIANCE)
  const [addComplianceOpen, setAddComplianceOpen] = useState(false)
  const [inviteForm, setInviteForm] = useState<InviteForm>({
    email: '', full_name: '', role: 'sales_rep', district_id: 'houston-south'
  })
  const [inviteMsg, setInviteMsg] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [jobStats, setJobStats] = useState<JobStats | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      if (!profile || profile.role !== 'master_admin') {
        router.push('/dashboard'); return
      }

      // Load job stats
      const { data: jobRows } = await supabase.from('jobs').select('status, xactimate_estimate')
      if (jobRows) {
        const byStatus: Record<string, number> = {}
        let pipelineValue = 0
        for (const j of jobRows) {
          byStatus[j.status] = (byStatus[j.status] ?? 0) + 1
          if (j.status !== 'closed' && j.status !== 'cancelled') {
            pipelineValue += j.xactimate_estimate ?? 0
          }
        }
        setJobStats({
          total: jobRows.length,
          active: jobRows.filter(j => j.status !== 'closed' && j.status !== 'cancelled').length,
          pipelineValue,
          byStatus,
        })
      }

      const { data: districtRows } = await supabase.from('districts').select('*')
      if (districtRows) {
        const stats = await Promise.all(
          districtRows.map(async (d) => {
            const { data: leads } = await supabase
              .from('fire_leads').select('status, doors_knocked').eq('district_id', d.id)
            return {
              id: d.id, name: d.name,
              leads_new: leads?.filter(l => l.status === 'new').length ?? 0,
              leads_in_progress: leads?.filter(l => l.status === 'in_progress').length ?? 0,
              leads_closed: leads?.filter(l => l.status === 'closed').length ?? 0,
              doors_knocked: leads?.reduce((s, l) => s + (l.doors_knocked ?? 0), 0) ?? 0,
            }
          })
        )
        setDistricts(stats)
      }
      setLoading(false)
    }
    init()
  }, [router])

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    setInviteMsg(
      `Step 1: Go to supabase.com → project zojeykqnrlsqnjyblnlx → Authentication → Invite user → enter ${inviteForm.email}\n` +
      `Step 2: After they accept, go to Table Editor → profiles → find their row → set role="${inviteForm.role}" and district_id="${inviteForm.district_id}"`
    )
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
        <span style={{ fontSize: '32px' }}>🔥</span>
        <span style={{ color: C.muted, fontSize: '14px' }}>Loading Smoke Command…</span>
      </div>
    </div>
  )

  const sidebarW = sidebarCollapsed ? 64 : 240

  const menuItems: { icon: string; label: string; tab: Tab }[] = [
    { icon: '📊', label: 'Dashboard', tab: 'dashboard' },
    { icon: '📋', label: 'Jobs', tab: 'jobs' },
    { icon: '👥', label: 'Crew & Dispatch', tab: 'crew' },
    { icon: '💰', label: 'Payments', tab: 'payments' },
    { icon: '🔥', label: 'Sales & Leads', tab: 'sales' },
    { icon: '📄', label: 'Documents', tab: 'documents' },
    { icon: '📈', label: 'Reports', tab: 'reports' },
  ]

  const adminItems: { icon: string; label: string; tab: Tab }[] = [
    { icon: '✅', label: 'Compliance', tab: 'compliance' },
    { icon: '👤', label: 'Users & Roles', tab: 'users' },
    { icon: '📍', label: 'Districts', tab: 'districts' },
    { icon: '💳', label: 'Franchise Billing', tab: 'franchise' },
    { icon: '⚙️', label: 'Settings', tab: 'settings' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <div style={{
        width: sidebarW, minHeight: '100vh', background: '#0c0e14',
        borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.2s', overflow: 'hidden', flexShrink: 0, position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 20,
      }}>
        {/* Logo area */}
        <div style={{ padding: '18px 14px 12px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: sidebarCollapsed ? 0 : '6px' }}>
            <span style={{ fontSize: '20px', flexShrink: 0 }}>🔥</span>
            {!sidebarCollapsed && (
              <div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: C.accent, letterSpacing: '-0.2px', lineHeight: 1.2 }}>
                  SMOKE COMMAND
                </div>
                <div style={{
                  fontSize: '10px', fontWeight: '700', color: C.muted,
                  background: 'rgba(249,115,22,0.1)', border: `1px solid rgba(249,115,22,0.2)`,
                  borderRadius: '4px', padding: '1px 6px', display: 'inline-block', marginTop: '3px', letterSpacing: '0.04em',
                }}>
                  MASTER ADMIN
                </div>
              </div>
            )}
            <button onClick={() => setSidebarCollapsed(p => !p)} style={{
              marginLeft: 'auto', background: 'none', border: 'none',
              color: C.muted, cursor: 'pointer', fontSize: '14px', padding: '2px',
            }}>
              {sidebarCollapsed ? '→' : '←'}
            </button>
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
          {!sidebarCollapsed && (
            <div style={{ fontSize: '10px', fontWeight: '700', color: C.muted, letterSpacing: '0.1em', padding: '0 4px', marginBottom: '6px' }}>
              MENU
            </div>
          )}
          {menuItems.map(item => (
            <div key={item.tab} style={{ marginBottom: '2px' }}>
              {sidebarCollapsed ? (
                <button onClick={() => setActiveTab(item.tab)} title={item.label} style={{
                  width: '100%', padding: '9px', borderRadius: '8px', border: 'none',
                  background: activeTab === item.tab ? 'rgba(249,115,22,0.12)' : 'transparent',
                  cursor: 'pointer', fontSize: '16px', display: 'flex', justifyContent: 'center',
                }}>
                  {item.icon}
                </button>
              ) : (
                <NavItem
                  icon={item.icon} label={item.label}
                  active={activeTab === item.tab}
                  onClick={() => setActiveTab(item.tab)}
                />
              )}
            </div>
          ))}

          <div style={{ height: '1px', background: C.border, margin: '12px 0' }} />

          {!sidebarCollapsed && (
            <div style={{ fontSize: '10px', fontWeight: '700', color: C.muted, letterSpacing: '0.1em', padding: '0 4px', marginBottom: '6px' }}>
              ADMIN
            </div>
          )}
          {adminItems.map(item => (
            <div key={item.tab} style={{ marginBottom: '2px' }}>
              {sidebarCollapsed ? (
                <button onClick={() => setActiveTab(item.tab)} title={item.label} style={{
                  width: '100%', padding: '9px', borderRadius: '8px', border: 'none',
                  background: activeTab === item.tab ? 'rgba(249,115,22,0.12)' : 'transparent',
                  cursor: 'pointer', fontSize: '16px', display: 'flex', justifyContent: 'center',
                }}>
                  {item.icon}
                </button>
              ) : (
                <NavItem
                  icon={item.icon} label={item.label}
                  active={activeTab === item.tab}
                  onClick={() => setActiveTab(item.tab)}
                  badge={item.tab === 'compliance' ? complianceItems.filter(c => c.status === 'DUE SOON' || c.status === 'OVERDUE').length.toString() || undefined : undefined}
                />
              )}
            </div>
          ))}
        </div>

        {/* Sign out */}
        <div style={{ padding: '12px 10px', borderTop: `1px solid ${C.border}` }}>
          {sidebarCollapsed ? (
            <button onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
              title="Sign Out" style={{
                width: '100%', padding: '9px', borderRadius: '8px', border: 'none',
                background: 'transparent', cursor: 'pointer', fontSize: '16px', display: 'flex', justifyContent: 'center',
              }}>🚪</button>
          ) : (
            <button onClick={async () => { await supabase.auth.signOut(); router.push('/login') }} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              width: '100%', padding: '9px 12px', borderRadius: '8px', border: 'none',
              background: 'transparent', color: C.muted, fontSize: '13px', cursor: 'pointer', textAlign: 'left',
            }}>
              🚪 <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div style={{ marginLeft: sidebarW, flex: 1, minHeight: '100vh', transition: 'margin-left 0.2s', display: 'flex', flexDirection: 'column' }}>

        {/* Top bar */}
        <div style={{
          height: '56px', background: '#0c0e14', borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px', position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div style={{ fontSize: '15px', fontWeight: '700' }}>
            {[...menuItems, ...adminItems].find(i => i.tab === activeTab)?.icon}&nbsp;
            {[...menuItems, ...adminItems].find(i => i.tab === activeTab)?.label}
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: C.muted }}>🟢 Live</span>
          </div>
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>

          {/* ── DASHBOARD ── */}
          {activeTab === 'dashboard' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '800' }}>All Districts Overview</h2>
                <p style={{ margin: 0, fontSize: '13px', color: C.muted }}>Live data from Supabase · fire_leads table</p>
              </div>

              {/* District cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                {districts.map(d => (
                  <div key={d.id} style={{
                    background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '22px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                      <span style={{ fontSize: '18px' }}>📍</span>
                      <div style={{ fontSize: '15px', fontWeight: '700' }}>{d.name}</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {[
                        { label: 'New Leads', value: d.leads_new, color: C.warning },
                        { label: 'In Progress', value: d.leads_in_progress, color: C.accent },
                        { label: 'Closed', value: d.leads_closed, color: C.success },
                        { label: 'Doors Knocked', value: d.doors_knocked, color: C.text },
                      ].map(s => (
                        <div key={s.label} style={{ background: C.bg, borderRadius: '10px', padding: '14px' }}>
                          <div style={{ fontSize: '26px', fontWeight: '800', color: s.color, letterSpacing: '-1px' }}>{s.value}</div>
                          <div style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {districts.length === 0 && (
                  <div style={{
                    gridColumn: '1 / -1', padding: '48px', textAlign: 'center',
                    background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px',
                    color: C.muted, fontSize: '14px',
                  }}>
                    No districts found. Add districts in Supabase → districts table.
                  </div>
                )}
              </div>

              {/* Summary totals */}
              {districts.length > 0 && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: C.muted, marginBottom: '12px', letterSpacing: '0.05em' }}>PLATFORM TOTALS</div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {[
                      { label: 'Total New', value: districts.reduce((a, d) => a + d.leads_new, 0), color: C.warning },
                      { label: 'Total In Progress', value: districts.reduce((a, d) => a + d.leads_in_progress, 0), color: C.accent },
                      { label: 'Total Closed', value: districts.reduce((a, d) => a + d.leads_closed, 0), color: C.success },
                      { label: 'Total Doors', value: districts.reduce((a, d) => a + d.doors_knocked, 0), color: C.text },
                    ].map(s => (
                      <div key={s.label} style={{
                        background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px',
                        padding: '16px 20px', minWidth: '120px',
                      }}>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── COMPLIANCE ── */}
          {activeTab === 'compliance' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '800' }}>Compliance Tracker</h2>
                  <p style={{ margin: 0, fontSize: '13px', color: C.muted }}>OSHA · IICRC · Drug Testing · HR Obligations</p>
                </div>
                <button onClick={() => setAddComplianceOpen(true)} style={{
                  padding: '10px 18px', background: `linear-gradient(135deg, ${C.accent}, ${C.danger})`,
                  border: 'none', borderRadius: '8px', color: 'white',
                  fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  + Add Item
                </button>
              </div>

              {/* Status summary */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {([
                  { label: 'Current', status: 'CURRENT', color: C.success },
                  { label: 'Due Soon', status: 'DUE SOON', color: C.warning },
                  { label: 'Overdue', status: 'OVERDUE', color: C.danger },
                ] as const).map(({ label, status, color }) => {
                  const count = complianceItems.filter(c => c.status === status).length
                  return (
                    <div key={status} style={{
                      background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px',
                      padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '10px',
                    }}>
                      <div style={{ fontSize: '22px', fontWeight: '800', color }}>{count}</div>
                      <div style={{ fontSize: '12px', color: C.muted }}>{label}</div>
                    </div>
                  )
                })}
              </div>

              {/* Compliance table */}
              <div style={{
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', overflow: 'hidden',
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: C.bg }}>
                        {['Item Name', 'Category', 'Recurrence', 'Status', 'Due Date', 'Assigned To', ''].map((h, i) => (
                          <th key={i} style={{
                            padding: '12px 16px', textAlign: 'left',
                            color: C.muted, fontWeight: '600', fontSize: '11px', letterSpacing: '0.07em',
                            borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap',
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {complianceItems.map((item, idx) => (
                        <tr key={item.id} style={{
                          borderBottom: idx < complianceItems.length - 1 ? `1px solid ${C.border}` : 'none',
                          transition: 'background 0.1s',
                        }}>
                          <td style={{ padding: '14px 16px', fontWeight: '600', color: C.text, maxWidth: '220px' }}>
                            {item.name}
                            <div style={{ fontSize: '11px', color: C.muted, marginTop: '2px', fontWeight: '400' }}>{item.reference}</div>
                          </td>
                          <td style={{ padding: '14px 16px', color: C.muted, whiteSpace: 'nowrap' }}>{item.category}</td>
                          <td style={{ padding: '14px 16px', color: C.muted, whiteSpace: 'nowrap' }}>{item.recurrence}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <StatusBadge status={item.status} />
                          </td>
                          <td style={{ padding: '14px 16px', color: C.muted, whiteSpace: 'nowrap' }}>{item.dueDate}</td>
                          <td style={{ padding: '14px 16px', color: C.muted, fontSize: '12px' }}>{item.assignedTo}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <button
                              onClick={() => {
                                const next = [...complianceItems]
                                const statuses: ComplianceStatus[] = ['CURRENT', 'DUE SOON', 'OVERDUE', 'UNKNOWN']
                                const cur = statuses.indexOf(item.status)
                                next[idx] = { ...item, status: statuses[(cur + 1) % statuses.length] }
                                setComplianceItems(next)
                              }}
                              style={{
                                padding: '4px 10px', background: 'none', border: `1px solid ${C.border}`,
                                borderRadius: '6px', color: C.muted, fontSize: '11px', cursor: 'pointer',
                              }}
                            >
                              Update
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── USERS ── */}
          {activeTab === 'users' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '800' }}>Users & Roles</h2>
                <p style={{ margin: 0, fontSize: '13px', color: C.muted }}>Invite and manage platform users.</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px', maxWidth: '900px' }}>
                {/* Invite form */}
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '24px' }}>
                  <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '18px' }}>Invite New User</div>
                  <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {([
                      { key: 'email', label: 'Email', type: 'email', placeholder: 'rep@restoremedicsusa.com' },
                      { key: 'full_name', label: 'Full Name', type: 'text', placeholder: 'First Last' },
                    ] as const).map(f => (
                      <div key={f.key}>
                        <label style={{ display: 'block', fontSize: '12px', color: C.muted, marginBottom: '6px' }}>{f.label}</label>
                        <input type={f.type} value={inviteForm[f.key]} required placeholder={f.placeholder}
                          onChange={e => setInviteForm(p => ({ ...p, [f.key]: e.target.value }))}
                          style={{ width: '100%', padding: '10px 12px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: '7px', color: C.text, fontSize: '13px', boxSizing: 'border-box' }} />
                      </div>
                    ))}
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: C.muted, marginBottom: '6px' }}>Role</label>
                      <select value={inviteForm.role} onChange={e => setInviteForm(p => ({ ...p, role: e.target.value as UserRole }))}
                        style={{ width: '100%', padding: '10px 12px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: '7px', color: C.text, fontSize: '13px' }}>
                        <option value="sales_rep">Sales Rep</option>
                        <option value="pm">Project Manager</option>
                        <option value="district_admin">District Admin</option>
                        <option value="tech">Field Tech</option>
                        <option value="master_admin">Master Admin</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: C.muted, marginBottom: '6px' }}>District</label>
                      <select value={inviteForm.district_id} onChange={e => setInviteForm(p => ({ ...p, district_id: e.target.value }))}
                        style={{ width: '100%', padding: '10px 12px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: '7px', color: C.text, fontSize: '13px' }}>
                        {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <button type="submit" style={{
                      padding: '11px', background: `linear-gradient(135deg, ${C.accent}, ${C.danger})`,
                      border: 'none', borderRadius: '8px', color: 'white',
                      fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                    }}>
                      Get Invite Instructions
                    </button>
                  </form>
                  {inviteMsg && (
                    <div style={{
                      marginTop: '14px', padding: '14px',
                      background: 'rgba(249,115,22,0.08)', border: `1px solid rgba(249,115,22,0.25)`,
                      borderRadius: '8px', fontSize: '13px', color: C.accent,
                      whiteSpace: 'pre-line', lineHeight: '1.6',
                    }}>
                      {inviteMsg}
                    </div>
                  )}
                </div>

                {/* Role legend */}
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '24px' }}>
                  <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '18px' }}>Role Permissions</div>
                  {[
                    { role: 'master_admin', label: 'Master Admin', desc: 'Full platform access, billing, compliance', color: C.danger },
                    { role: 'district_admin', label: 'District Admin', desc: 'Manage their district, view all leads', color: C.accent },
                    { role: 'pm', label: 'Project Manager', desc: 'Jobs, crew, payments', color: '#3b82f6' },
                    { role: 'sales_rep', label: 'Sales Rep', desc: 'Door log, leads, their territory', color: C.success },
                    { role: 'tech', label: 'Field Tech', desc: 'Job assignments, compliance tasks', color: C.muted },
                  ].map(r => (
                    <div key={r.role} style={{
                      display: 'flex', gap: '12px', alignItems: 'flex-start',
                      padding: '10px 0', borderBottom: `1px solid ${C.border}`,
                    }}>
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: r.color, flexShrink: 0, marginTop: '5px',
                      }} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '2px' }}>{r.label}</div>
                        <div style={{ fontSize: '12px', color: C.muted }}>{r.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── DISTRICTS ── */}
          {activeTab === 'districts' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '800' }}>Districts</h2>
                <p style={{ margin: 0, fontSize: '13px', color: C.muted }}>Manage service districts and territories.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '640px' }}>
                {districts.map(d => (
                  <div key={d.id} style={{
                    background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px',
                    padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ fontWeight: '700', marginBottom: '4px', fontSize: '15px' }}>{d.name}</div>
                      <div style={{ fontSize: '12px', color: C.muted }}>
                        {d.leads_new + d.leads_in_progress + d.leads_closed} total leads · {d.doors_knocked} doors knocked
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div style={{
                        fontSize: '11px', padding: '4px 10px',
                        background: 'rgba(34,197,94,0.12)', color: C.success,
                        border: `1px solid rgba(34,197,94,0.25)`, borderRadius: '99px', fontWeight: '700',
                      }}>Active</div>
                    </div>
                  </div>
                ))}
                {districts.length === 0 && (
                  <div style={{
                    padding: '48px', textAlign: 'center',
                    background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px',
                    color: C.muted, fontSize: '14px',
                  }}>
                    No districts. Add them in Supabase → districts table.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── SALES & LEADS ── */}
          {activeTab === 'sales' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '800' }}>Sales & Leads</h2>
                <p style={{ margin: 0, fontSize: '13px', color: C.muted }}>Monitor active fire lead pipeline across all districts.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <a href="/dashboard" target="_blank" rel="noopener noreferrer" style={{
                  padding: '10px 18px', background: `linear-gradient(135deg, ${C.accent}, ${C.danger})`,
                  border: 'none', borderRadius: '8px', color: 'white',
                  fontSize: '13px', fontWeight: '700', textDecoration: 'none',
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                }}>
                  🔥 Open Sales Dashboard →
                </a>
              </div>
              <div style={{
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px',
                padding: '32px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔥</div>
                <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Fire Lead Pipeline</div>
                <div style={{ fontSize: '13px', color: C.muted, marginBottom: '20px' }}>
                  View live leads, canvass windows, and neighborhood coverage in the sales dashboard.
                </div>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                  {[
                    { label: 'Total New Leads', value: districts.reduce((a, d) => a + d.leads_new, 0), color: C.warning },
                    { label: 'In Progress', value: districts.reduce((a, d) => a + d.leads_in_progress, 0), color: C.accent },
                    { label: 'Closed', value: districts.reduce((a, d) => a + d.leads_closed, 0), color: C.success },
                  ].map(s => (
                    <div key={s.label} style={{ background: C.bg, borderRadius: '10px', padding: '16px 20px' }}>
                      <div style={{ fontSize: '28px', fontWeight: '800', color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: '11px', color: C.muted }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── JOBS ── */}
          {activeTab === 'jobs' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '800' }}>Job Pipeline</h2>
                  <p style={{ margin: 0, fontSize: '13px', color: C.muted }}>Active restoration jobs across all districts.</p>
                </div>
                <a href="/jobs/new" style={{
                  padding: '10px 18px', background: `linear-gradient(135deg, ${C.accent}, ${C.danger})`,
                  border: 'none', borderRadius: '8px', color: 'white',
                  fontSize: '13px', fontWeight: '700', textDecoration: 'none',
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                }}>
                  + New Job
                </a>
              </div>

              {/* Summary stats */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Active Jobs', value: 3, color: C.accent },
                  { label: 'Pending Payment', value: 1, color: C.warning },
                  { label: 'In Progress', value: 1, color: '#60a5fa' },
                  { label: 'Total Value', value: '$133,350', color: C.success, wide: true },
                ].map(s => (
                  <div key={s.label} style={{
                    background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px',
                    padding: '14px 18px',
                  }}>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Job list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  {
                    id: 'mock-1', street: '1842 Oak Dr', city: 'Pasadena',
                    owner: 'Maria Santos', carrier: 'State Farm', claim: 'SF-2024-88421',
                    stage: 2, stageName: 'Site Assessment', value: '$28,400', days: 3,
                    stageColor: '#60a5fa', stageBg: 'rgba(59,130,246,0.12)', stageBorder: 'rgba(59,130,246,0.3)',
                  },
                  {
                    id: 'mock-2', street: '504 Oleander Ave', city: 'La Marque',
                    owner: 'Robert Tran', carrier: 'Allstate', claim: 'ALL-2024-55193',
                    stage: 5, stageName: 'Awaiting Payment', value: '$41,750', days: 11,
                    stageColor: C.accent, stageBg: 'rgba(249,115,22,0.12)', stageBorder: 'rgba(249,115,22,0.3)',
                  },
                  {
                    id: 'mock-3', street: '2217 Bayou Rd', city: 'Texas City',
                    owner: 'James Kelley', carrier: 'USAA', claim: 'USAA-2024-31087',
                    stage: 6, stageName: 'Heavy Clean', value: '$63,200', days: 7,
                    stageColor: C.danger, stageBg: 'rgba(239,68,68,0.12)', stageBorder: 'rgba(239,68,68,0.3)',
                  },
                ].map(job => (
                  <div key={job.id} style={{
                    background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px',
                    padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '18px',
                  }}>
                    {/* Stage badge */}
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '10px',
                      background: job.stageBg, border: `1px solid ${job.stageBorder}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '17px', fontWeight: '800', color: job.stageColor, flexShrink: 0,
                    }}>
                      {job.stage}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '14px', fontWeight: '700' }}>{job.street}, {job.city}</span>
                        <span style={{
                          padding: '2px 8px', borderRadius: '99px', fontSize: '10px', fontWeight: '700',
                          background: job.stageBg, color: job.stageColor, border: `1px solid ${job.stageBorder}`,
                        }}>
                          {job.stage} · {job.stageName}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: C.muted, flexWrap: 'wrap' }}>
                        <span>👤 {job.owner}</span>
                        <span>🏢 {job.carrier} · {job.claim}</span>
                        <span>📅 {job.days} days on job</span>
                      </div>
                    </div>

                    {/* Value */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: C.accent }}>{job.value}</div>
                      <div style={{ fontSize: '11px', color: C.muted }}>approved</div>
                    </div>

                    {/* Open */}
                    <a href={`/jobs/${job.id}`} style={{
                      padding: '8px 16px', background: `linear-gradient(135deg, ${C.accent}, ${C.danger})`,
                      borderRadius: '8px', color: 'white', textDecoration: 'none',
                      fontSize: '13px', fontWeight: '700', flexShrink: 0, whiteSpace: 'nowrap',
                    }}>
                      Open →
                    </a>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <a href="/jobs" style={{
                  fontSize: '13px', color: C.accent, textDecoration: 'none', fontWeight: '600',
                }}>
                  View all jobs in full Job Management →
                </a>
              </div>
            </div>
          )}
          {activeTab === 'crew' && (
            <ComingSoon icon="👥" title="Crew & Dispatch" desc="Manage crew assignments, availability, and dispatch scheduling." />
          )}
          {activeTab === 'payments' && (
            <ComingSoon icon="💰" title="Payments" desc="Track invoices, insurance claims, and payment collections." />
          )}
          {activeTab === 'documents' && (
            <ComingSoon icon="📄" title="Documents" desc="Store scope sheets, certificates of completion, insurance docs, and contracts." />
          )}
          {activeTab === 'reports' && (
            <ComingSoon icon="📈" title="Reports" desc="Revenue reports, rep performance, lead conversion, and compliance summaries." />
          )}
          {activeTab === 'franchise' && (
            <ComingSoon icon="💳" title="Franchise Billing" desc="Royalty tracking, franchise fee invoicing, and territory financials." />
          )}
          {activeTab === 'settings' && (
            <ComingSoon icon="⚙️" title="Settings" desc="Platform configuration, integrations, notification rules, and branding." />
          )}

        </div>
      </div>

      {/* Add compliance slide panel */}
      <AddCompliancePanel
        open={addComplianceOpen}
        onClose={() => setAddComplianceOpen(false)}
        onAdd={item => setComplianceItems(p => [...p, item])}
      />
    </div>
  )
}
