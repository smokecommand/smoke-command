'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { FireLead, FireLeadStatus } from '@/lib/supabase'

// ─── Color tokens ───────────────────────────────────────────────────────────
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

// ─── Types ──────────────────────────────────────────────────────────────────
type RepTab = 'leads' | 'my_jobs' | 'door_log' | 'schedule' | 'my_stats'

const STATUS_CONFIG: Record<FireLeadStatus, { label: string; color: string; bg: string }> = {
  new: { label: '🟢 New', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  assigned: { label: '🔵 Assigned', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  in_progress: { label: '🟡 In Progress', color: '#eab308', bg: 'rgba(234,179,8,0.1)' },
  closed: { label: '✅ Closed', color: '#71717a', bg: 'rgba(113,113,122,0.1)' },
}

// ─── Sidebar nav item ────────────────────────────────────────────────────────
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
      cursor: 'pointer', textAlign: 'left',
    }}>
      <span style={{ fontSize: '15px', minWidth: '18px' }}>{icon}</span>
      <span>{label}</span>
    </button>
  )
}

// ─── Progress bar ────────────────────────────────────────────────────────────
function ProgressBar({ knocked, total }: { knocked: number; total: number }) {
  const pct = total > 0 ? Math.round((knocked / total) * 100) : 0
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: C.muted, marginBottom: '6px' }}>
        <span>Doors knocked</span>
        <span style={{ color: C.text }}>{knocked} / {total} ({pct}%)</span>
      </div>
      <div style={{ height: '6px', background: C.border, borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: pct === 100 ? C.success : `linear-gradient(90deg, ${C.accent}, ${C.danger})`,
          borderRadius: '99px', transition: 'width 0.3s',
        }} />
      </div>
    </div>
  )
}

// ─── Coming soon ─────────────────────────────────────────────────────────────
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

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState('')
  const [leads, setLeads] = useState<FireLead[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FireLeadStatus | 'all'>('all')
  const [activeTab, setActiveTab] = useState<RepTab>('leads')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUserEmail(session.user.email || '')

      const { data, error } = await supabase
        .from('fire_leads').select('*').order('created_at', { ascending: false })
      if (data) setLeads(data)
      if (error) console.error('Failed to load leads:', error.message)
      setLoading(false)
    }
    checkAuth()
  }, [router])

  const filteredLeads = filter === 'all' ? leads : leads.filter(l => l.status === filter)

  const stats = {
    active: leads.filter(l => l.status !== 'closed').length,
    doorsKnocked: leads.reduce((a, l) => a + l.doors_knocked, 0),
    inspectionsSet: leads.filter(l => l.status === 'in_progress' || l.status === 'closed').length,
    jobsClosed: leads.filter(l => l.status === 'closed').length,
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
        <span style={{ fontSize: '32px' }}>🔥</span>
        <span style={{ color: C.muted, fontSize: '14px' }}>Loading…</span>
      </div>
    </div>
  )

  const sidebarW = sidebarCollapsed ? 64 : 220

  const navItems: { icon: string; label: string; tab: RepTab }[] = [
    { icon: '🔥', label: 'Sales & Leads', tab: 'leads' },
    { icon: '🔨', label: 'My Jobs', tab: 'my_jobs' },
    { icon: '🚪', label: 'Door Log', tab: 'door_log' },
    { icon: '📅', label: 'Schedule', tab: 'schedule' },
    { icon: '📊', label: 'My Stats', tab: 'my_stats' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Sidebar ── */}
      <div style={{
        width: sidebarW, minHeight: '100vh', background: '#0c0e14',
        borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.2s', overflow: 'hidden', flexShrink: 0,
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 20,
      }}>
        {/* Logo */}
        <div style={{ padding: '18px 14px 12px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px', flexShrink: 0 }}>🔥</span>
            {!sidebarCollapsed && (
              <div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: C.accent, letterSpacing: '-0.2px', lineHeight: 1.2 }}>
                  SMOKE COMMAND
                </div>
                <div style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>
                  Sales Rep
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
        <div style={{ flex: 1, padding: '12px 10px' }}>
          {navItems.map(item => (
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
        </div>

        {/* User + sign out */}
        <div style={{ padding: '12px 10px', borderTop: `1px solid ${C.border}` }}>
          {!sidebarCollapsed && userEmail && (
            <div style={{
              fontSize: '11px', color: C.muted, padding: '6px 12px 10px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {userEmail}
            </div>
          )}
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

      {/* ── Main content ── */}
      <div style={{ marginLeft: sidebarW, flex: 1, minHeight: '100vh', transition: 'margin-left 0.2s', display: 'flex', flexDirection: 'column' }}>

        {/* Top bar */}
        <div style={{
          height: '56px', background: '#0c0e14', borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px', position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div style={{ fontSize: '15px', fontWeight: '700' }}>
            {navItems.find(i => i.tab === activeTab)?.icon}&nbsp;
            {navItems.find(i => i.tab === activeTab)?.label}
          </div>
          <div style={{ fontSize: '12px', color: C.muted }}>
            Houston South District
          </div>
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>

          {/* ── LEADS ── */}
          {activeTab === 'leads' && (
            <div>
              {/* Alert banner for urgent lead */}
              {leads.filter(l => l.status === 'new').slice(0, 1).map(lead => (
                <div key={lead.id} style={{
                  padding: '14px 20px', background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.35)', borderRadius: '10px',
                  marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px',
                }}>
                  <span style={{ fontSize: '20px' }}>🔥</span>
                  <div>
                    <div style={{ fontWeight: '700', color: C.danger, fontSize: '14px' }}>
                      NEW FIRE — Canvass window OPEN
                    </div>
                    <div style={{ fontSize: '13px', color: C.muted, marginTop: '2px' }}>
                      {lead.fire_name} · {new Date(lead.incident_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {lead.neighborhoods?.slice(0, 3).join(', ')}
                    </div>
                  </div>
                  <button style={{
                    marginLeft: 'auto', padding: '8px 16px', background: C.danger,
                    border: 'none', borderRadius: '6px', color: 'white',
                    fontSize: '13px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap',
                  }}>
                    Open Lead →
                  </button>
                </div>
              ))}

              {/* Stat cards */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '14px', marginBottom: '28px',
              }}>
                {[
                  { label: 'Active Leads', value: stats.active, color: C.accent },
                  { label: 'Doors Knocked', value: stats.doorsKnocked, color: C.text },
                  { label: 'Inspections Set', value: stats.inspectionsSet, color: C.success },
                  { label: 'Jobs Closed', value: stats.jobsClosed, color: '#3b82f6' },
                ].map((s, i) => (
                  <div key={i} style={{
                    padding: '18px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px',
                  }}>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: s.color, letterSpacing: '-1px' }}>{s.value}</div>
                    <div style={{ fontSize: '12px', color: C.muted, marginTop: '4px' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Filter tabs */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
                {(['all', 'new', 'assigned', 'in_progress', 'closed'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    padding: '6px 14px', borderRadius: '20px', border: `1px solid ${filter === f ? C.accent : C.border}`,
                    background: filter === f ? C.accent : C.surface,
                    color: filter === f ? 'white' : C.muted,
                    fontSize: '13px', fontWeight: filter === f ? '600' : '400',
                    cursor: 'pointer', textTransform: 'capitalize',
                  }}>
                    {f === 'all' ? 'All Leads' : f.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* Lead cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {filteredLeads.map(lead => {
                  const sc = STATUS_CONFIG[lead.status]
                  const daysSince = Math.floor((Date.now() - new Date(lead.incident_date).getTime()) / 86400000)
                  return (
                    <div key={lead.id} style={{
                      background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '22px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px', gap: '14px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                            <span style={{ fontSize: '18px' }}>🔥</span>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>{lead.fire_name}</h3>
                          </div>
                          <div style={{ fontSize: '12px', color: C.muted }}>
                            {lead.location} · {new Date(lead.incident_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {daysSince}d ago
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                          <span style={{
                            padding: '3px 10px', background: sc.bg, border: `1px solid ${sc.color}40`,
                            borderRadius: '20px', color: sc.color, fontSize: '11px', fontWeight: '600',
                          }}>{sc.label}</span>
                          <button style={{
                            padding: '7px 14px',
                            background: lead.status === 'closed' ? C.surface : `linear-gradient(135deg, ${C.accent}, ${C.danger})`,
                            border: lead.status === 'closed' ? `1px solid ${C.border}` : 'none',
                            borderRadius: '8px', color: lead.status === 'closed' ? C.muted : 'white',
                            fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                          }}>
                            {lead.status === 'closed' ? 'View' : 'Open →'}
                          </button>
                        </div>
                      </div>

                      {/* Neighborhoods */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                        {lead.neighborhoods.map((n, i) => (
                          <span key={i} style={{
                            padding: '3px 9px', background: C.bg, border: `1px solid ${C.border}`,
                            borderRadius: '6px', fontSize: '11px', color: C.muted,
                          }}>🏘️ {n}</span>
                        ))}
                        <span style={{
                          padding: '3px 9px', background: 'rgba(249,115,22,0.05)',
                          border: '1px solid rgba(249,115,22,0.2)', borderRadius: '6px',
                          fontSize: '11px', color: C.accent,
                        }}>💨 {lead.wind_direction}</span>
                      </div>

                      {/* Air quality */}
                      {lead.air_quality_data && (
                        <div style={{
                          padding: '9px 13px', background: 'rgba(234,179,8,0.07)',
                          border: '1px solid rgba(234,179,8,0.2)', borderRadius: '8px',
                          fontSize: '12px', color: '#ca8a04', marginBottom: '14px',
                        }}>
                          📊 {(() => {
                            const aq = lead.air_quality_data
                            if (!aq) return null
                            if (typeof aq === 'string') return aq
                            const aqi = (aq as Record<string, unknown>).peak_aqi ?? (aq as Record<string, unknown>).aqi
                            const pm25 = (aq as Record<string, unknown>).pm25
                            const level = (aq as Record<string, unknown>).alert_level ?? (aq as Record<string, unknown>).level
                            const sip = (aq as Record<string, unknown>).shelter_in_place
                            return [
                              aqi ? `AQI: ${aqi}` : null, pm25 ? `PM2.5: ${pm25} µg/m³` : null,
                              level || null, sip ? '⚠️ Shelter-in-Place' : null,
                            ].filter(Boolean).join(' · ')
                          })()}
                        </div>
                      )}

                      {lead.doors_total > 0 && (
                        <ProgressBar knocked={lead.doors_knocked} total={lead.doors_total} />
                      )}
                    </div>
                  )
                })}

                {filteredLeads.length === 0 && (
                  <div style={{
                    textAlign: 'center', padding: '60px', color: C.muted,
                    background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px',
                  }}>
                    No leads matching this filter.
                  </div>
                )}
              </div>

              {/* Blaze feed footer */}
              <div style={{
                marginTop: '28px', padding: '14px 18px', background: C.surface,
                border: `1px solid ${C.border}`, borderRadius: '10px',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <span style={{ fontSize: '14px' }}>🔥</span>
                <span style={{ fontSize: '13px', color: C.muted }}>
                  <strong style={{ color: '#a1a1aa' }}>Live feed from Blaze:</strong> Monitoring fires within 85 miles of Houston · Next check in ~4 hours
                </span>
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: C.muted }}>
                  {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          )}

          {/* ── OTHER TABS ── */}
          {activeTab === 'my_jobs' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '800' }}>My Jobs</h2>
                  <p style={{ margin: 0, fontSize: '13px', color: C.muted }}>Your assigned restoration jobs.</p>
                </div>
                <a href="/jobs" style={{
                  padding: '10px 18px', background: `linear-gradient(135deg, ${C.accent}, ${C.danger})`,
                  border: 'none', borderRadius: '8px', color: 'white',
                  fontSize: '13px', fontWeight: '700', textDecoration: 'none',
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                }}>
                  📋 Open Job Manager →
                </a>
              </div>
              <div style={{
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px',
                padding: '40px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔨</div>
                <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Job Pipeline</div>
                <div style={{ fontSize: '13px', color: C.muted, marginBottom: '20px' }}>
                  View and manage your assigned restoration jobs in the full job manager.
                </div>
                <a href="/jobs" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '10px 20px',
                  background: `linear-gradient(135deg, ${C.accent}, ${C.danger})`,
                  border: 'none', borderRadius: '8px', color: 'white',
                  fontSize: '13px', fontWeight: '700', textDecoration: 'none',
                  cursor: 'pointer',
                }}>
                  Open Job Manager →
                </a>
              </div>
            </div>
          )}
          {activeTab === 'door_log' && (
            <ComingSoon icon="🚪" title="Door Log" desc="Log every door knocked, conversation, and callback note." />
          )}
          {activeTab === 'schedule' && (
            <ComingSoon icon="📅" title="Schedule" desc="View your weekly canvass schedule and inspection appointments." />
          )}
          {activeTab === 'my_stats' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '800' }}>My Stats</h2>
                <p style={{ margin: 0, fontSize: '13px', color: C.muted }}>Your personal performance metrics.</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                {[
                  { label: 'Active Leads', value: stats.active, color: C.accent, icon: '🔥' },
                  { label: 'Doors Knocked', value: stats.doorsKnocked, color: C.text, icon: '🚪' },
                  { label: 'Inspections Set', value: stats.inspectionsSet, color: C.success, icon: '📋' },
                  { label: 'Jobs Closed', value: stats.jobsClosed, color: '#3b82f6', icon: '✅' },
                ].map((s, i) => (
                  <div key={i} style={{ padding: '20px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>{s.icon}</div>
                    <div style={{ fontSize: '32px', fontWeight: '800', color: s.color, letterSpacing: '-1px' }}>{s.value}</div>
                    <div style={{ fontSize: '12px', color: C.muted, marginTop: '4px' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px',
                padding: '24px', textAlign: 'center', color: C.muted, fontSize: '13px',
              }}>
                📊 Conversion rates, leaderboard, and detailed analytics — coming soon.
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
