'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { Job, JobStatus } from '@/lib/supabase'

const C = { bg: '#0f1117', surface: '#1a1d24', border: '#2a2d35', accent: '#f97316', text: '#f4f4f5', muted: '#71717a', success: '#22c55e', warning: '#eab308', danger: '#ef4444' }

const STAGE_LABELS: Record<JobStatus, string> = {
  inspection_scheduled: '📅 Inspection Scheduled',
  scope_written: '📝 Scope Written',
  work_auth_signed: '✅ Work Auth Signed',
  equipment_in: '🚛 Equipment In',
  mitigation_active: '🧹 Mitigation Active',
  hygienist_clearance: '🔬 Hygienist Clearance',
  reconstruction: '🏗️ Reconstruction',
  billing: '💰 Billing',
  closed: '✔️ Closed',
  cancelled: '❌ Cancelled',
}

export default function TechPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [photoLabel, setPhotoLabel] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserName(user.email?.split('@')[0] ?? 'Tech')
      // Load jobs assigned to this tech
      const { data } = await supabase.from('jobs')
        .select('*')
        .contains('assigned_crew', [user.id])
        .neq('status', 'closed')
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })
      if (data) setJobs(data as Job[])
      setLoading(false)
    }
    init()
  }, [router])

  const toggleCheck = async (itemId: string, stageKey: string) => {
    if (!selectedJob) return
    const checklists = { ...(selectedJob.stage_checklists ?? {}) }
    const items = (checklists[stageKey] ?? []).map((item: any) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    )
    checklists[stageKey] = items
    const { data } = await supabase.from('jobs').update({ stage_checklists: checklists }).eq('id', selectedJob.id).select().single()
    if (data) {
      setSelectedJob(data as Job)
      setJobs(prev => prev.map(j => j.id === data.id ? data as Job : j))
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedJob) return
    setUploading(true)
    const path = `jobs/${selectedJob.id}/${Date.now()}.${file.name.split('.').pop()}`
    await supabase.storage.from('job-photos').upload(path, file, { upsert: true })
    setUploading(false)
    setPhotoLabel('')
    alert('Photo uploaded! PM can see it now.')
  }

  const getStageKey = (status: JobStatus) => {
    const map: Partial<Record<JobStatus, string>> = {
      inspection_scheduled: 'job_intake',
      scope_written: 'site_assessment',
      work_auth_signed: 'photo_documentation',
      equipment_in: 'carrier_submission',
      mitigation_active: 'heavy_clean_treatment',
      hygienist_clearance: 'awaiting_payment',
      billing: 'final_walkthrough',
      closed: 'job_closed',
    }
    return map[status] ?? null
  }

  if (loading) return <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>Loading...</div>

  // Job list view
  if (!selectedJob) return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui,sans-serif', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: '#0c0e14', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, borderBottom: `1px solid ${C.border}` }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.accent }}>🔥 Smoke Command</div>
          <div style={{ fontSize: 12, color: C.muted }}>Welcome, {userName}</div>
        </div>
        <button onClick={() => { supabase.auth.signOut(); router.push('/login') }} style={{ background: 'none', border: `1px solid ${C.border}`, padding: '6px 12px', borderRadius: 8, color: C.muted, fontSize: 12, cursor: 'pointer' }}>Sign Out</button>
      </div>

      <div style={{ padding: '20px 16px' }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>My Jobs Today</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>{jobs.length} active job{jobs.length !== 1 ? 's' : ''} assigned to you</div>

        {jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>No jobs assigned</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Check back after dispatch</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {jobs.map(job => (
              <div key={job.id} onClick={() => setSelectedJob(job)}
                style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 16px', cursor: 'pointer', activeOpacity: 0.8 } as any}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 12, color: C.muted, marginBottom: 2 }}>{job.job_number}</div>
                    <div style={{ fontSize: 17, fontWeight: 700 }}>{job.property_address}</div>
                    <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{job.property_city}, TX</div>
                  </div>
                  <div style={{ fontSize: 11, padding: '4px 10px', background: 'rgba(249,115,22,0.12)', color: C.accent, borderRadius: 20, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {STAGE_LABELS[job.status]}
                  </div>
                </div>
                {job.homeowner_name && <div style={{ fontSize: 13, color: C.muted }}>🏠 {job.homeowner_name}</div>}
                {/* Checklist progress */}
                {(() => {
                  const key = getStageKey(job.status)
                  const items = key ? (job.stage_checklists?.[key] ?? []) : []
                  const done = items.filter((i: any) => i.done).length
                  const total = items.length
                  if (!total) return null
                  const pct = Math.round((done / total) * 100)
                  return (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.muted, marginBottom: 4 }}>
                        <span>Stage checklist</span>
                        <span style={{ color: pct === 100 ? C.success : C.text, fontWeight: 600 }}>{done}/{total}</span>
                      </div>
                      <div style={{ height: 5, background: C.bg, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? C.success : C.accent, borderRadius: 3 }} />
                      </div>
                    </div>
                  )
                })()}
                <div style={{ marginTop: 12, fontSize: 13, color: C.accent, fontWeight: 600 }}>Open Job →</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  // Job detail view
  const stageKey = getStageKey(selectedJob.status)
  const checklistItems: any[] = stageKey ? (selectedJob.stage_checklists?.[stageKey] ?? []) : []
  const done = checklistItems.filter(i => i.done).length
  const total = checklistItems.length
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui,sans-serif', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: '#0c0e14', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10, borderBottom: `1px solid ${C.border}` }}>
        <button onClick={() => setSelectedJob(null)} style={{ background: 'none', border: 'none', color: C.accent, fontSize: 20, cursor: 'pointer', padding: 0 }}>←</button>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{selectedJob.job_number}</div>
          <div style={{ fontSize: 12, color: C.muted }}>{selectedJob.property_address}</div>
        </div>
      </div>

      <div style={{ padding: '20px 16px' }}>
        {/* Current stage */}
        <div style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>CURRENT STAGE</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.accent }}>{STAGE_LABELS[selectedJob.status]}</div>
        </div>

        {/* Homeowner & address */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>Property</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{selectedJob.property_address}</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>{selectedJob.property_city}, TX {selectedJob.property_zip}</div>
          {selectedJob.homeowner_name && <div style={{ fontSize: 14 }}>🏠 {selectedJob.homeowner_name}</div>}
          {selectedJob.homeowner_phone && (
            <a href={`tel:${selectedJob.homeowner_phone}`} style={{ display: 'block', marginTop: 8, fontSize: 14, color: C.accent, fontWeight: 600 }}>
              📞 {selectedJob.homeowner_phone}
            </a>
          )}
        </div>

        {/* Checklist */}
        {total > 0 && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Stage Checklist</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: done === total ? C.success : C.muted }}>{done} / {total}</div>
            </div>
            <div style={{ height: 6, background: C.bg, borderRadius: 3, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ width: `${Math.round((done / total) * 100)}%`, height: '100%', background: done === total ? C.success : C.accent, borderRadius: 3, transition: 'width 0.3s' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {checklistItems.map((item: any) => (
                <div key={item.id} onClick={() => stageKey && toggleCheck(item.id, stageKey)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '12px', background: item.done ? 'rgba(34,197,94,0.06)' : C.bg, borderRadius: 10, cursor: 'pointer', border: `1px solid ${item.done ? 'rgba(34,197,94,0.2)' : C.border}` }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: item.done ? C.success : 'transparent', border: `2px solid ${item.done ? C.success : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    {item.done && <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>✓</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, color: item.done ? C.muted : C.text, textDecoration: item.done ? 'line-through' : 'none', lineHeight: 1.4 }}>{item.text}</div>
                    {item.type === 'doc' && !item.done && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <div style={{ fontSize: 11, padding: '4px 10px', background: 'rgba(249,115,22,0.1)', color: C.accent, borderRadius: 6, fontWeight: 600 }}>📧 Email DocuSign</div>
                        <div style={{ fontSize: 11, padding: '4px 10px', background: 'rgba(249,115,22,0.1)', color: C.accent, borderRadius: 6, fontWeight: 600 }}>✍️ Sign in App</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photo upload */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>📷 Upload Photo</div>
          <input value={photoLabel} onChange={e => setPhotoLabel(e.target.value)} placeholder="Label (e.g. Living Room, HVAC)" style={{ width: '100%', padding: '10px 14px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 14, boxSizing: 'border-box', marginBottom: 10 }} />
          <label style={{ display: 'block', padding: '14px', background: `linear-gradient(135deg,${C.accent},#ea580c)`, borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 15, textAlign: 'center', cursor: 'pointer' }}>
            {uploading ? 'Uploading...' : '📸 Take / Choose Photo'}
            <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handlePhotoUpload} />
          </label>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 8, textAlign: 'center' }}>PM sees it instantly when uploaded</div>
        </div>

        {/* Notes */}
        {selectedJob.notes && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>📋 Notes from PM</div>
            <div style={{ fontSize: 14, color: C.text, lineHeight: 1.6 }}>{selectedJob.notes}</div>
          </div>
        )}
      </div>
    </div>
  )
}
