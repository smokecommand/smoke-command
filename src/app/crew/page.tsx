'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const C = {
  bg: '#0f1117', surface: '#1a1d24', border: '#2a2d35',
  text: '#f4f4f5', muted: '#71717a', accent: '#f97316',
  success: '#22c55e', warning: '#eab308', danger: '#ef4444',
}

const CREW_MEMBERS = [
  { id: 'c1', name: 'Marcus Webb', role: 'Lead Tech', phone: '(713) 555-0191', available: true },
  { id: 'c2', name: 'Devon Carter', role: 'Entry Tech', phone: '(713) 555-0244', available: true },
  { id: 'c3', name: 'Javier Reyes', role: 'Entry Tech', phone: '(713) 555-0317', available: false },
  { id: 'c4', name: 'Antoine Russell', role: 'Entry Tech', phone: '(713) 555-0388', available: true },
  { id: 'c5', name: 'Terrance Boyd', role: 'Entry Tech', phone: '(713) 555-0412', available: true },
]

type Job = { id: string; job_number: string; property_address: string; property_city: string; status: string; assigned_crew: string[] }

const STATUS_LABEL: Record<string, string> = {
  inspection_scheduled: 'Inspection Scheduled',
  scope_written: 'Scope Written',
  work_auth_signed: 'Work Auth Signed',
  equipment_in: 'Equipment In',
  mitigation_active: '🧹 Mitigation Active',
  hygienist_clearance: 'Hygienist Clearance',
  reconstruction: 'Reconstruction',
  billing: 'Billing',
  closed: 'Closed',
}

export default function CrewPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJob, setSelectedJob] = useState<string | null>(null)
  const [dispatch, setDispatch] = useState<Record<string, string[]>>({})
  const [saved, setSaved] = useState(false)
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('jobs').select('id,job_number,property_address,property_city,status,assigned_crew').neq('status', 'closed').neq('status', 'cancelled').order('created_at')
      if (data) {
        setJobs(data)
        const d: Record<string, string[]> = {}
        data.forEach(j => { d[j.id] = j.assigned_crew ?? [] })
        setDispatch(d)
      }
    }
    init()
  }, [router])

  const toggleCrewOnJob = (jobId: string, crewId: string) => {
    setDispatch(prev => {
      const current = prev[jobId] ?? []
      return { ...prev, [jobId]: current.includes(crewId) ? current.filter(c => c !== crewId) : [...current, crewId] }
    })
    setSaved(false)
  }

  const saveDispatch = async () => {
    await Promise.all(jobs.map(j => supabase.from('jobs').update({ assigned_crew: dispatch[j.id] ?? [] }).eq('id', j.id)))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const isAssigned = (crewId: string) => Object.values(dispatch).some(crew => crew.includes(crewId))
  const getCrewJobs = (crewId: string) => jobs.filter(j => (dispatch[j.id] ?? []).includes(crewId))

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui,sans-serif', display: 'flex' }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: '#0c0e14', borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '20px 16px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.accent }}>🔥 SMOKE COMMAND</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2, background: C.border, display: 'inline-block', padding: '2px 8px', borderRadius: 4 }}>CREW & DISPATCH</div>
        </div>
        <nav style={{ padding: '12px 10px', flex: 1 }}>
          {[
            { label: '📋 Job Board', href: '/jobs' },
            { label: '👥 Daily Dispatch', href: '/crew', active: true },
            { label: '📄 Documents', href: '#' },
            { label: '💰 Payments', href: '#' },
          ].map(item => (
            <div key={item.label} onClick={() => item.href !== '#' && router.push(item.href)}
              style={{ padding: '9px 12px', borderRadius: 8, marginBottom: 2, cursor: 'pointer', fontSize: 13.5,
                background: item.active ? 'rgba(249,115,22,0.12)' : 'transparent',
                color: item.active ? C.accent : C.muted, fontWeight: item.active ? 600 : 400 }}>
              {item.label}
            </div>
          ))}
        </nav>
        <div style={{ padding: '14px 16px', borderTop: `1px solid ${C.border}` }}>
          <div onClick={() => router.push('/admin')} style={{ fontSize: 13, color: C.muted, cursor: 'pointer' }}>← Admin Dashboard</div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: '32px 28px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Daily Dispatch</h1>
            <div style={{ fontSize: 13, color: C.muted }}>{today}</div>
          </div>
          <button onClick={saveDispatch} style={{ padding: '10px 20px', background: saved ? C.success : `linear-gradient(135deg,${C.accent},#ea580c)`, border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
            {saved ? '✅ Saved' : 'Save Dispatch'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Left: Active Jobs */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Active Jobs — Assign Crew</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {jobs.map(job => (
                <div key={job.id} onClick={() => setSelectedJob(selectedJob === job.id ? null : job.id)}
                  style={{ background: C.surface, border: `1px solid ${selectedJob === job.id ? C.accent : C.border}`, borderRadius: 12, padding: '16px 18px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, color: C.muted, marginBottom: 2 }}>{job.job_number}</div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{job.property_address}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>{job.property_city}</div>
                    </div>
                    <div style={{ fontSize: 11, padding: '3px 8px', background: 'rgba(249,115,22,0.1)', color: C.accent, borderRadius: 6, whiteSpace: 'nowrap' }}>
                      {STATUS_LABEL[job.status] ?? job.status}
                    </div>
                  </div>
                  {/* Assigned crew chips */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                    {(dispatch[job.id] ?? []).length === 0
                      ? <div style={{ fontSize: 12, color: C.danger, fontWeight: 600 }}>⚠️ No crew assigned</div>
                      : (dispatch[job.id] ?? []).map(cid => {
                          const member = CREW_MEMBERS.find(c => c.id === cid)
                          return member ? <div key={cid} style={{ fontSize: 11, padding: '3px 8px', background: 'rgba(34,197,94,0.1)', color: C.success, borderRadius: 12, fontWeight: 600 }}>{member.name}</div> : null
                        })}
                  </div>
                  {/* Expand: crew selector */}
                  {selectedJob === job.id && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: 12, color: C.muted, marginBottom: 10, fontWeight: 600 }}>TAP TO ASSIGN / REMOVE</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {CREW_MEMBERS.map(member => {
                          const assigned = (dispatch[job.id] ?? []).includes(member.id)
                          return (
                            <div key={member.id} onClick={e => { e.stopPropagation(); toggleCrewOnJob(job.id, member.id) }}
                              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                                background: assigned ? 'rgba(34,197,94,0.1)' : C.bg, border: `1px solid ${assigned ? C.success : C.border}` }}>
                              <div style={{ width: 20, height: 20, borderRadius: '50%', background: assigned ? C.success : C.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 700 }}>
                                {assigned ? '✓' : ''}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{member.name}</div>
                                <div style={{ fontSize: 11, color: C.muted }}>{member.role}</div>
                              </div>
                              {!member.available && <div style={{ fontSize: 10, color: C.danger, fontWeight: 700 }}>OFF</div>}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Crew Status */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Crew Status</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {CREW_MEMBERS.map(member => {
                const assignedJobs = getCrewJobs(member.id)
                return (
                  <div key={member.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg,${C.accent},#ef4444)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{member.name}</div>
                        <div style={{ fontSize: 12, color: C.muted }}>{member.role} · {member.phone}</div>
                      </div>
                      <div style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, fontWeight: 700,
                        background: !member.available ? 'rgba(239,68,68,0.1)' : assignedJobs.length > 0 ? 'rgba(249,115,22,0.1)' : 'rgba(34,197,94,0.1)',
                        color: !member.available ? C.danger : assignedJobs.length > 0 ? C.accent : C.success }}>
                        {!member.available ? 'Off Today' : assignedJobs.length > 0 ? `On ${assignedJobs.length} Job${assignedJobs.length > 1 ? 's' : ''}` : 'Available'}
                      </div>
                    </div>
                    {assignedJobs.length > 0 && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                        {assignedJobs.map(j => (
                          <div key={j.id} style={{ fontSize: 12, color: C.muted, marginBottom: 3 }}>
                            📍 {j.job_number} — {j.property_address}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
