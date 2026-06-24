'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { FireLead, FireLeadStatus } from '@/lib/supabase'

// Real data only — loaded from Supabase

const STATUS_CONFIG: Record<FireLeadStatus, { label: string; color: string; bg: string; dot: string }> = {
  new: { label: '🟢 New', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', dot: '#22c55e' },
  assigned: { label: '🔵 Assigned', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', dot: '#3b82f6' },
  in_progress: { label: '🟡 In Progress', color: '#eab308', bg: 'rgba(234,179,8,0.1)', dot: '#eab308' },
  closed: { label: '✅ Closed', color: '#71717a', bg: 'rgba(113,113,122,0.1)', dot: '#71717a' },
}

function ProgressBar({ knocked, total }: { knocked: number; total: number }) {
  const pct = total > 0 ? Math.round((knocked / total) * 100) : 0
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#71717a', marginBottom: '6px' }}>
        <span>Doors knocked</span>
        <span style={{ color: '#f4f4f5' }}>{knocked} / {total} ({pct}%)</span>
      </div>
      <div style={{ height: '6px', background: '#2a2d35', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: pct === 100 ? '#22c55e' : 'linear-gradient(90deg, #f97316, #ef4444)',
          borderRadius: '99px',
          transition: 'width 0.3s',
        }} />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ email: string } | null>(null)
  const [leads, setLeads] = useState<FireLead[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FireLeadStatus | 'all'>('all')

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUser({ email: session.user.email || '' })

      // Fetch real leads from Supabase
      const { data, error } = await supabase
        .from('fire_leads')
        .select('*')
        .order('created_at', { ascending: false })
      if (data) setLeads(data)
      if (error) console.error('Failed to load leads:', error.message)
      setLoading(false)
    }
    checkAuth()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const filteredLeads = filter === 'all' ? leads : leads.filter(l => l.status === filter)

  const stats = {
    active: leads.filter(l => l.status !== 'closed').length,
    doorsKnocked: leads.reduce((a, l) => a + l.doors_knocked, 0),
    inspectionsSet: leads.filter(l => l.status === 'in_progress' || l.status === 'closed').length,
    jobsClosed: leads.filter(l => l.status === 'closed').length,
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: '#71717a' }}>
        Loading...
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', color: '#f4f4f5' }}>
      {/* Top nav */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: '60px',
        background: '#1a1d24',
        borderBottom: '1px solid #2a2d35',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>🔥</span>
          <span style={{ fontWeight: '800', color: '#f97316', fontSize: '16px', letterSpacing: '-0.3px' }}>SMOKE COMMAND</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px', color: '#71717a' }}>Houston South District</span>
          <button
            onClick={handleSignOut}
            style={{
              padding: '6px 14px',
              background: 'transparent',
              border: '1px solid #2a2d35',
              borderRadius: '6px',
              color: '#a1a1aa',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {/* New fire alert banner — shows most urgent unassigned lead */}
        {leads.filter(l => l.status === 'new').slice(0, 1).map(urgentLead => (
        <div key={urgentLead.id} style={{
          padding: '14px 20px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '10px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{ fontSize: '20px', animation: 'pulse 2s infinite' }}>🔥</span>
          <div>
            <div style={{ fontWeight: '700', color: '#ef4444', fontSize: '14px' }}>
              NEW FIRE DETECTED — Canvass window is OPEN NOW
            </div>
            <div style={{ fontSize: '13px', color: '#a1a1aa', marginTop: '2px' }}>
              {urgentLead.fire_name} — {new Date(urgentLead.incident_date).toLocaleDateString('en-US', {month:'short', day:'numeric'})} · Neighborhoods: {urgentLead.neighborhoods?.slice(0,3).join(', ')}
            </div>
          </div>
          <button style={{
            marginLeft: 'auto',
            padding: '8px 16px',
            background: '#ef4444',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}>
            Open Lead →
          </button>
        </div>
        ))}

        {/* Stat cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}>
          {[
            { label: 'Active Leads', value: stats.active, color: '#f97316' },
            { label: 'Doors Knocked', value: stats.doorsKnocked, color: '#f4f4f5' },
            { label: 'Inspections Set', value: stats.inspectionsSet, color: '#22c55e' },
            { label: 'Jobs Closed', value: stats.jobsClosed, color: '#3b82f6' },
          ].map((stat, i) => (
            <div key={i} style={{
              padding: '20px',
              background: '#1a1d24',
              border: '1px solid #2a2d35',
              borderRadius: '10px',
            }}>
              <div style={{ fontSize: '28px', fontWeight: '800', color: stat.color, letterSpacing: '-1px' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '13px', color: '#71717a', marginTop: '4px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {(['all', 'new', 'assigned', 'in_progress', 'closed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px',
                background: filter === f ? '#f97316' : '#1a1d24',
                border: `1px solid ${filter === f ? '#f97316' : '#2a2d35'}`,
                borderRadius: '20px',
                color: filter === f ? 'white' : '#a1a1aa',
                fontSize: '13px',
                fontWeight: filter === f ? '600' : '400',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {f === 'all' ? 'All Leads' : f.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Lead cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredLeads.map(lead => {
            const sc = STATUS_CONFIG[lead.status]
            const daysSince = Math.floor((Date.now() - new Date(lead.incident_date).getTime()) / 86400000)
            return (
              <div key={lead.id} style={{
                background: '#1a1d24',
                border: '1px solid #2a2d35',
                borderRadius: '12px',
                padding: '24px',
                transition: 'border-color 0.2s',
              }}>
                {/* Lead header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '20px' }}>🔥</span>
                      <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#f4f4f5' }}>
                        {lead.fire_name}
                      </h3>
                    </div>
                    <div style={{ fontSize: '13px', color: '#71717a' }}>
                      {lead.location} · {new Date(lead.incident_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {daysSince}d ago
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
                    <span style={{
                      padding: '4px 10px',
                      background: sc.bg,
                      border: `1px solid ${sc.color}40`,
                      borderRadius: '20px',
                      color: sc.color,
                      fontSize: '12px',
                      fontWeight: '600',
                    }}>
                      {sc.label}
                    </span>
                    <button style={{
                      padding: '8px 16px',
                      background: lead.status === 'closed' ? '#1a1d24' : 'linear-gradient(135deg, #f97316, #ef4444)',
                      border: lead.status === 'closed' ? '1px solid #2a2d35' : 'none',
                      borderRadius: '8px',
                      color: lead.status === 'closed' ? '#71717a' : 'white',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}>
                      {lead.status === 'closed' ? 'View' : 'Open →'}
                    </button>
                  </div>
                </div>

                {/* Neighborhoods */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                  {lead.neighborhoods.map((n, i) => (
                    <span key={i} style={{
                      padding: '4px 10px',
                      background: '#0f1117',
                      border: '1px solid #2a2d35',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#a1a1aa',
                    }}>
                      🏘️ {n}
                    </span>
                  ))}
                  <span style={{
                    padding: '4px 10px',
                    background: 'rgba(249,115,22,0.05)',
                    border: '1px solid rgba(249,115,22,0.2)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#f97316',
                  }}>
                    💨 {lead.wind_direction}
                  </span>
                </div>

                {/* Air quality */}
                {lead.air_quality_data && (
                  <div style={{
                    padding: '10px 14px',
                    background: 'rgba(234,179,8,0.08)',
                    border: '1px solid rgba(234,179,8,0.2)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#ca8a04',
                    marginBottom: '16px',
                  }}>
                    📊 {(() => {
                      const aq = lead.air_quality_data
                      if (!aq) return null
                      if (typeof aq === 'string') return aq
                      const aqi = aq.peak_aqi ?? aq.aqi
                      const pm25 = aq.pm25
                      const level = aq.alert_level ?? aq.level
                      const sip = aq.shelter_in_place
                      return [
                        aqi ? `AQI: ${aqi}` : null,
                        pm25 ? `PM2.5: ${pm25} µg/m³` : null,
                        level ? level : null,
                        sip ? '⚠️ Shelter-in-Place' : null,
                      ].filter(Boolean).join(' · ')
                    })()}
                  </div>
                )}

                {/* Progress bar */}
                {lead.doors_total > 0 && (
                  <ProgressBar knocked={lead.doors_knocked} total={lead.doors_total} />
                )}
              </div>
            )
          })}

          {filteredLeads.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '60px',
              color: '#71717a',
              background: '#1a1d24',
              border: '1px solid #2a2d35',
              borderRadius: '12px',
            }}>
              No leads matching this filter.
            </div>
          )}
        </div>

        {/* Blaze feed footer */}
        <div style={{
          marginTop: '32px',
          padding: '16px 20px',
          background: '#1a1d24',
          border: '1px solid #2a2d35',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <span style={{ fontSize: '16px' }}>🔥</span>
          <span style={{ fontSize: '13px', color: '#71717a' }}>
            <strong style={{ color: '#a1a1aa' }}>Live feed from Blaze:</strong> Monitoring fires within 85 miles of Houston · Next check in ~4 hours
          </span>
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#71717a' }}>
            Last updated: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  )
}
