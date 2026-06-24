'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { Job, JobStatus, PhaseLogEntry } from '@/lib/supabase'

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

// ─── Stage config ───────────────────────────────────────────────────────────
const STAGES: { status: JobStatus; label: string; icon: string; color: string }[] = [
  { status: 'inspection_scheduled', label: 'Inspection Scheduled', icon: '📅', color: '#3b82f6' },
  { status: 'scope_written',        label: 'Scope Written',        icon: '📝', color: '#8b5cf6' },
  { status: 'work_auth_signed',     label: 'Work Auth Signed',     icon: '✅', color: '#f97316' },
  { status: 'equipment_in',         label: 'Equipment In',         icon: '🚛', color: '#eab308' },
  { status: 'mitigation_active',    label: 'Mitigation Active',    icon: '🧹', color: '#22c55e' },
  { status: 'hygienist_clearance',  label: 'Hygienist Clearance',  icon: '🔬', color: '#06b6d4' },
  { status: 'reconstruction',       label: 'Reconstruction',       icon: '🏗️', color: '#f97316' },
  { status: 'billing',              label: 'Billing',              icon: '💰', color: '#a855f7' },
  { status: 'closed',               label: 'Closed',               icon: '✔️', color: '#71717a' },
]

const fmt$ = (n: number | null) =>
  n == null ? '—' : '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

const daysOn = (startDate: string | null) => {
  if (!startDate) return null
  const d = Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000)
  return d
}

// ─── Nav item ───────────────────────────────────────────────────────────────
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
      <span>{label}</span>
    </button>
  )
}

// ─── Job Card ────────────────────────────────────────────────────────────────
function JobCard({ job, onClick }: { job: Job; onClick: () => void }) {
  const stage = STAGES.find(s => s.status === job.status)
  const days = daysOn(job.start_date)

  return (
    <div
      onClick={onClick}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderLeft: `3px solid ${stage?.color ?? C.accent}`,
        borderRadius: '10px',
        padding: '14px',
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
        marginBottom: '10px',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#1f2330')}
      onMouseLeave={e => (e.currentTarget.style.background = C.surface)}
    >
      {/* Job # + address */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontSize: '11px', color: C.muted, fontWeight: '600', letterSpacing: '0.06em', marginBottom: '2px' }}>
          {job.job_number}
        </div>
        <div style={{ fontSize: '13px', fontWeight: '700', color: C.text, lineHeight: 1.3 }}>
          {job.property_address}
        </div>
        {(job.property_city || job.property_state) && (
          <div style={{ fontSize: '11px', color: C.muted, marginTop: '1px' }}>
            {[job.property_city, job.property_state, job.property_zip].filter(Boolean).join(', ')}
          </div>
        )}
      </div>

      {/* Homeowner */}
      {job.homeowner_name && (
        <div style={{ fontSize: '12px', color: C.muted, marginBottom: '6px' }}>
          👤 {job.homeowner_name}
        </div>
      )}

      {/* Carrier + Claim */}
      {job.carrier_name && (
        <div style={{ fontSize: '11px', color: C.muted, marginBottom: '6px' }}>
          🏛️ {job.carrier_name} · {job.claim_number ?? '—'}
        </div>
      )}

      {/* Estimate row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
        <div style={{ fontSize: '14px', fontWeight: '800', color: C.accent }}>
          {fmt$(job.xactimate_estimate)}
        </div>
        {days != null && (
          <div style={{
            fontSize: '10px', padding: '2px 8px', borderRadius: '99px',
            background: days > 30 ? 'rgba(239,68,68,0.12)' : 'rgba(249,115,22,0.12)',
            color: days > 30 ? C.danger : C.accent,
            fontWeight: '600',
          }}>
            Day {days}
          </div>
        )}
      </div>

      {/* Open button */}
      <div style={{ marginTop: '10px', textAlign: 'right' }}>
        <span style={{
          fontSize: '11px', color: C.accent, fontWeight: '600',
          display: 'inline-flex', alignItems: 'center', gap: '3px',
        }}>
          Open →
        </span>
      </div>
    </div>
  )
}

// ─── Pipeline View ───────────────────────────────────────────────────────────
function PipelineView({ jobs, onSelectJob }: { jobs: Job[]; onSelectJob: (j: Job) => void }) {
  const activeStages = STAGES.filter(s => s.status !== 'cancelled')

  return (
    <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', paddingBottom: '16px', alignItems: 'flex-start' }}>
      {activeStages.map(stage => {
        const stageJobs = jobs.filter(j => j.status === stage.status)
        return (
          <div key={stage.status} style={{
            minWidth: '260px', maxWidth: '260px', flexShrink: 0,
          }}>
            {/* Column header */}
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderTop: `3px solid ${stage.color}`,
              borderRadius: '10px', padding: '12px 14px', marginBottom: '10px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: C.text }}>
                  {stage.icon} {stage.label}
                </div>
              </div>
              <div style={{
                minWidth: '22px', height: '22px', borderRadius: '50%',
                background: stageJobs.length > 0 ? stage.color : C.border,
                color: 'white', fontSize: '11px', fontWeight: '800',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {stageJobs.length}
              </div>
            </div>

            {/* Job cards */}
            {stageJobs.map(job => (
              <JobCard key={job.id} job={job} onClick={() => onSelectJob(job)} />
            ))}

            {stageJobs.length === 0 && (
              <div style={{
                border: `1px dashed ${C.border}`, borderRadius: '10px', padding: '20px',
                textAlign: 'center', color: C.muted, fontSize: '12px',
              }}>
                No jobs
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── List View ───────────────────────────────────────────────────────────────
function ListView({ jobs, onSelectJob }: { jobs: Job[]; onSelectJob: (j: Job) => void }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: '12px', overflow: 'hidden',
    }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: C.bg }}>
              {['Job #', 'Address', 'Homeowner', 'Carrier / Claim', 'Estimate', 'Status', 'Days', ''].map((h, i) => (
                <th key={i} style={{
                  padding: '11px 14px', textAlign: 'left',
                  color: C.muted, fontWeight: '600', fontSize: '11px', letterSpacing: '0.07em',
                  borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.map((job, idx) => {
              const stage = STAGES.find(s => s.status === job.status)
              const days = daysOn(job.start_date)
              return (
                <tr key={job.id} style={{
                  borderBottom: idx < jobs.length - 1 ? `1px solid ${C.border}` : 'none',
                  cursor: 'pointer',
                }}
                  onClick={() => onSelectJob(job)}
                  onMouseEnter={e => (e.currentTarget.style.background = '#1f2330')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '12px 14px', fontWeight: '700', color: C.muted, fontSize: '11px', whiteSpace: 'nowrap' }}>
                    {job.job_number}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: '600', color: C.text }}>{job.property_address}</div>
                    <div style={{ fontSize: '11px', color: C.muted }}>
                      {[job.property_city, job.property_state].filter(Boolean).join(', ')}
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', color: C.muted, whiteSpace: 'nowrap' }}>
                    {job.homeowner_name ?? '—'}
                  </td>
                  <td style={{ padding: '12px 14px', color: C.muted, fontSize: '12px' }}>
                    <div>{job.carrier_name ?? '—'}</div>
                    <div style={{ fontSize: '11px' }}>{job.claim_number ?? ''}</div>
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: '700', color: C.accent, whiteSpace: 'nowrap' }}>
                    {fmt$(job.xactimate_estimate)}
                  </td>
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                    <span style={{
                      padding: '3px 9px', borderRadius: '99px', fontSize: '11px', fontWeight: '700',
                      background: `${stage?.color ?? C.muted}20`, color: stage?.color ?? C.muted,
                      border: `1px solid ${stage?.color ?? C.muted}40`,
                    }}>
                      {stage?.icon} {stage?.label ?? job.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', color: C.muted, fontSize: '12px', whiteSpace: 'nowrap' }}>
                    {days != null ? `Day ${days}` : '—'}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <button style={{
                      padding: '5px 12px', background: 'none',
                      border: `1px solid ${C.border}`, borderRadius: '6px',
                      color: C.accent, fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                    }}>
                      Open →
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {jobs.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: C.muted, fontSize: '13px' }}>
            No jobs found.
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Progress Tracker ────────────────────────────────────────────────────────
function PhaseTracker({ currentStatus }: { currentStatus: JobStatus }) {
  const orderedStages = STAGES.filter(s => s.status !== 'cancelled' && s.status !== 'closed').concat(
    STAGES.filter(s => s.status === 'closed')
  )
  const currentIdx = orderedStages.findIndex(s => s.status === currentStatus)

  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
      {orderedStages.map((stage, idx) => {
        const done = idx < currentIdx
        const active = idx === currentIdx
        return (
          <div key={stage.status} style={{
            display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '4px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: '600',
              background: active ? `${stage.color}20` : done ? 'rgba(34,197,94,0.1)' : 'rgba(42,45,53,0.5)',
              color: active ? stage.color : done ? C.success : C.muted,
              border: `1px solid ${active ? stage.color + '60' : done ? C.success + '40' : C.border}`,
            }}>
              <span style={{ fontSize: '10px' }}>{done ? '✓' : stage.icon}</span>
              <span style={{ whiteSpace: 'nowrap' }}>{stage.label}</span>
            </div>
            {idx < orderedStages.length - 1 && (
              <span style={{ color: C.border, fontSize: '12px' }}>›</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Job Detail Panel ────────────────────────────────────────────────────────
function JobDetailPanel({ job, open, onClose, onUpdate }: {
  job: Job | null
  open: boolean
  onClose: () => void
  onUpdate: (updatedJob: Job) => void
}) {
  const [saving, setSaving] = useState(false)
  const [editNotes, setEditNotes] = useState(false)
  const [notesValue, setNotesValue] = useState('')
  const [statusChanging, setStatusChanging] = useState(false)
  const [newStatus, setNewStatus] = useState<JobStatus | ''>('')

  useEffect(() => {
    if (job) {
      setNotesValue(job.notes ?? '')
      setNewStatus('')
      setEditNotes(false)
    }
  }, [job?.id])

  if (!open || !job) return null

  const stage = STAGES.find(s => s.status === job.status)
  const days = daysOn(job.start_date)
  const totalPipeline = (job.xactimate_estimate ?? 0)
  const patriotSplit = totalPipeline * (job.split_patriot_pct / 100)
  const rmSplit = totalPipeline * (job.split_restoremedics_pct / 100)
  const paSplit = totalPipeline * (job.split_pa_pct / 100)

  const saveNotes = async () => {
    setSaving(true)
    const { data, error } = await supabase
      .from('jobs').update({ notes: notesValue }).eq('id', job.id).select().single()
    setSaving(false)
    if (!error && data) { onUpdate(data as Job); setEditNotes(false) }
  }

  const handleStatusChange = async () => {
    if (!newStatus || newStatus === job.status) return
    setSaving(true)
    const logEntry: PhaseLogEntry = {
      phase: newStatus,
      timestamp: new Date().toISOString(),
      note: `Status changed to ${STAGES.find(s => s.status === newStatus)?.label ?? newStatus}`,
    }
    const updatedLog = [...(job.phase_log ?? []), logEntry]
    const { data, error } = await supabase
      .from('jobs')
      .update({ status: newStatus, phase_log: updatedLog })
      .eq('id', job.id).select().single()
    setSaving(false)
    if (!error && data) { onUpdate(data as Job); setStatusChanging(false); setNewStatus('') }
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: '24px' }}>
      <div style={{
        fontSize: '11px', fontWeight: '700', color: C.muted,
        letterSpacing: '0.1em', marginBottom: '12px', paddingBottom: '8px',
        borderBottom: `1px solid ${C.border}`,
      }}>
        {title}
      </div>
      {children}
    </div>
  )

  const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ fontSize: '11px', color: C.muted, marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '13px', color: value ? C.text : C.muted }}>
        {value || '—'}
      </div>
    </div>
  )

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200,
      }} />
      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '560px',
        background: C.surface, borderLeft: `1px solid ${C.border}`,
        zIndex: 201, overflowY: 'auto', display: 'flex', flexDirection: 'column',
      }}>
        {/* Panel header */}
        <div style={{
          padding: '20px 24px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          position: 'sticky', top: 0, background: C.surface, zIndex: 1,
        }}>
          <div>
            <div style={{ fontSize: '12px', color: C.muted, fontWeight: '700', letterSpacing: '0.06em', marginBottom: '4px' }}>
              {job.job_number}
            </div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: C.text, lineHeight: 1.2 }}>
              {job.property_address}
            </div>
            <div style={{ fontSize: '13px', color: C.muted, marginTop: '2px' }}>
              {[job.property_city, job.property_state, job.property_zip].filter(Boolean).join(', ')}
            </div>
            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: '700',
                background: `${stage?.color ?? C.muted}20`, color: stage?.color ?? C.muted,
                border: `1px solid ${stage?.color ?? C.muted}40`,
              }}>
                {stage?.icon} {stage?.label ?? job.status}
              </span>
              {days != null && (
                <span style={{ fontSize: '12px', color: C.muted }}>Day {days}</span>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: C.muted,
            fontSize: '22px', cursor: 'pointer', lineHeight: 1, padding: '2px',
          }}>✕</button>
        </div>

        {/* Panel body */}
        <div style={{ padding: '24px', flex: 1 }}>

          {/* Phase tracker */}
          <Section title="JOB PROGRESS">
            <PhaseTracker currentStatus={job.status} />
            <div style={{ marginTop: '12px' }}>
              {!statusChanging ? (
                <button onClick={() => setStatusChanging(true)} style={{
                  padding: '7px 14px', background: 'none',
                  border: `1px solid ${C.border}`, borderRadius: '7px',
                  color: C.accent, fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                }}>
                  ⬆️ Advance Stage
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value as JobStatus)}
                    style={{
                      padding: '7px 10px', background: C.bg, border: `1px solid ${C.border}`,
                      borderRadius: '7px', color: C.text, fontSize: '12px',
                    }}
                  >
                    <option value="">Select new stage...</option>
                    {STAGES.filter(s => s.status !== job.status).map(s => (
                      <option key={s.status} value={s.status}>{s.icon} {s.label}</option>
                    ))}
                  </select>
                  <button onClick={handleStatusChange} disabled={!newStatus || saving} style={{
                    padding: '7px 14px', background: C.accent,
                    border: 'none', borderRadius: '7px',
                    color: 'white', fontSize: '12px', fontWeight: '700',
                    cursor: newStatus ? 'pointer' : 'not-allowed', opacity: newStatus ? 1 : 0.5,
                  }}>
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button onClick={() => { setStatusChanging(false); setNewStatus('') }} style={{
                    padding: '7px 10px', background: 'none',
                    border: `1px solid ${C.border}`, borderRadius: '7px',
                    color: C.muted, fontSize: '12px', cursor: 'pointer',
                  }}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </Section>

          {/* Property & Homeowner */}
          <Section title="PROPERTY & HOMEOWNER">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Field label="Address" value={job.property_address} />
              <Field label="City / State / Zip" value={[job.property_city, job.property_state, job.property_zip].filter(Boolean).join(', ')} />
              <Field label="Homeowner" value={job.homeowner_name} />
              <Field label="Phone" value={job.homeowner_phone} />
              <Field label="Email" value={job.homeowner_email} />
            </div>
          </Section>

          {/* Insurance */}
          <Section title="INSURANCE">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Field label="Carrier" value={job.carrier_name} />
              <Field label="Claim #" value={job.claim_number} />
              <Field label="Policy #" value={job.policy_number} />
              <Field label="Adjuster" value={job.adjuster_name} />
              <Field label="Adjuster Phone" value={job.adjuster_phone} />
              <Field label="Adjuster Email" value={job.adjuster_email} />
            </div>
          </Section>

          {/* Financials */}
          <Section title="FINANCIALS">
            <div style={{
              background: C.bg, borderRadius: '10px', padding: '16px',
              border: `1px solid ${C.border}`, marginBottom: '12px',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: C.muted, marginBottom: '3px' }}>Xactimate Estimate</div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: C.accent }}>
                    {fmt$(job.xactimate_estimate)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: C.muted, marginBottom: '3px' }}>Amount Collected</div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: C.success }}>
                    {fmt$(job.amount_collected)}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: C.muted, marginBottom: '8px' }}>Revenue Split</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { label: `Patriot (${job.split_patriot_pct}%)`, value: patriotSplit, color: C.accent },
                { label: `Restore Medics (${job.split_restoremedics_pct}%)`, value: rmSplit, color: '#3b82f6' },
                { label: `PA (${job.split_pa_pct}%)`, value: paSplit, color: '#8b5cf6' },
              ].map(s => (
                <div key={s.label} style={{
                  background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px',
                  padding: '10px 14px', flex: '1', minWidth: '130px',
                }}>
                  <div style={{ fontSize: '11px', color: C.muted, marginBottom: '3px' }}>{s.label}</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: s.color }}>{fmt$(s.value)}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* Crew & Equipment */}
          <Section title="CREW & EQUIPMENT">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Field label="Lead Tech" value={job.lead_tech_id ? 'Dustin Abshire' : null} />
              <Field label="Trailer ID" value={job.trailer_id} />
              <Field label="Hydroxyl Units" value={`${job.hydroxyl_units} unit${job.hydroxyl_units !== 1 ? 's' : ''}`} />
              <Field label="Equipment In" value={job.equipment_in_date ? new Date(job.equipment_in_date).toLocaleDateString() : null} />
              <Field label="Equipment Out" value={job.equipment_out_date ? new Date(job.equipment_out_date).toLocaleDateString() : null} />
            </div>
          </Section>

          {/* Subcontractors */}
          <Section title="SUBCONTRACTORS">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Field label="Drywall" value={job.sub_drywall} />
              <Field label="Electrical" value={job.sub_electrical} />
              <Field label="HVAC" value={job.sub_hvac} />
              <Field label="Flooring" value={job.sub_flooring} />
              <Field label="Paint" value={job.sub_paint} />
            </div>
          </Section>

          {/* Timeline */}
          <Section title="TIMELINE">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Field label="Inspection Date" value={job.inspection_date ? new Date(job.inspection_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null} />
              <Field label="Start Date" value={job.start_date ? new Date(job.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null} />
              <Field label="Target Completion" value={job.target_completion_date ? new Date(job.target_completion_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null} />
              <Field label="Actual Completion" value={job.actual_completion_date ? new Date(job.actual_completion_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null} />
            </div>
          </Section>

          {/* Phase Log */}
          {job.phase_log && job.phase_log.length > 0 && (
            <Section title="PHASE LOG">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[...job.phase_log].reverse().map((entry, idx) => {
                  const s = STAGES.find(st => st.status === entry.phase)
                  return (
                    <div key={idx} style={{
                      display: 'flex', gap: '10px', padding: '8px 12px',
                      background: C.bg, borderRadius: '7px', border: `1px solid ${C.border}`,
                    }}>
                      <span style={{ fontSize: '14px', flexShrink: 0 }}>{s?.icon ?? '📌'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: C.text }}>{entry.note}</div>
                        <div style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>
                          {new Date(entry.timestamp).toLocaleString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Section>
          )}

          {/* Notes */}
          <Section title="NOTES">
            {!editNotes ? (
              <div>
                <div style={{
                  padding: '12px', background: C.bg, borderRadius: '8px',
                  border: `1px solid ${C.border}`, fontSize: '13px', color: job.notes ? C.text : C.muted,
                  lineHeight: '1.6', minHeight: '60px',
                }}>
                  {job.notes || 'No notes yet.'}
                </div>
                <button onClick={() => setEditNotes(true)} style={{
                  marginTop: '8px', padding: '6px 12px', background: 'none',
                  border: `1px solid ${C.border}`, borderRadius: '6px',
                  color: C.muted, fontSize: '12px', cursor: 'pointer',
                }}>
                  ✏️ Edit Notes
                </button>
              </div>
            ) : (
              <div>
                <textarea
                  value={notesValue}
                  onChange={e => setNotesValue(e.target.value)}
                  rows={4}
                  style={{
                    width: '100%', padding: '12px',
                    background: C.bg, border: `1px solid ${C.accent}`,
                    borderRadius: '8px', color: C.text, fontSize: '13px',
                    resize: 'vertical', fontFamily: 'system-ui', lineHeight: '1.6',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button onClick={saveNotes} disabled={saving} style={{
                    padding: '7px 14px', background: C.accent,
                    border: 'none', borderRadius: '7px', color: 'white',
                    fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                  }}>
                    {saving ? 'Saving…' : 'Save Notes'}
                  </button>
                  <button onClick={() => { setEditNotes(false); setNotesValue(job.notes ?? '') }} style={{
                    padding: '7px 12px', background: 'none',
                    border: `1px solid ${C.border}`, borderRadius: '7px',
                    color: C.muted, fontSize: '12px', cursor: 'pointer',
                  }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </Section>
        </div>
      </div>
    </>
  )
}

// ─── New Job Panel ───────────────────────────────────────────────────────────
function NewJobPanel({ open, onClose, onCreated }: {
  open: boolean
  onClose: () => void
  onCreated: (job: Job) => void
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    property_address: '',
    property_city: '',
    property_state: 'TX',
    property_zip: '',
    homeowner_name: '',
    homeowner_phone: '',
    homeowner_email: '',
    carrier_name: '',
    claim_number: '',
    adjuster_name: '',
    adjuster_phone: '',
    adjuster_email: '',
    xactimate_estimate: '',
    notes: '',
    district_id: 'houston-south',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload: Record<string, unknown> = {
      district_id: form.district_id || null,
      property_address: form.property_address,
      property_city: form.property_city || null,
      property_state: form.property_state,
      property_zip: form.property_zip || null,
      homeowner_name: form.homeowner_name || null,
      homeowner_phone: form.homeowner_phone || null,
      homeowner_email: form.homeowner_email || null,
      carrier_name: form.carrier_name || null,
      claim_number: form.claim_number || null,
      adjuster_name: form.adjuster_name || null,
      adjuster_phone: form.adjuster_phone || null,
      adjuster_email: form.adjuster_email || null,
      xactimate_estimate: form.xactimate_estimate ? parseFloat(form.xactimate_estimate) : null,
      notes: form.notes || null,
      status: 'inspection_scheduled',
      phase_log: [{
        phase: 'inspection_scheduled',
        timestamp: new Date().toISOString(),
        note: 'Job created',
      }],
    }

    const { data, error: err } = await supabase
      .from('jobs').insert(payload).select().single()

    setSaving(false)
    if (err) {
      setError(err.message)
    } else if (data) {
      onCreated(data as Job)
      setForm({
        property_address: '', property_city: '', property_state: 'TX', property_zip: '',
        homeowner_name: '', homeowner_phone: '', homeowner_email: '',
        carrier_name: '', claim_number: '', adjuster_name: '', adjuster_phone: '', adjuster_email: '',
        xactimate_estimate: '', notes: '', district_id: 'houston-south',
      })
      onClose()
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px',
    background: C.bg, border: `1px solid ${C.border}`,
    borderRadius: '7px', color: C.text, fontSize: '13px',
    boxSizing: 'border-box',
  }

  if (!open) return null
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200 }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '480px',
        background: C.surface, borderLeft: `1px solid ${C.border}`,
        zIndex: 201, overflowY: 'auto', padding: '24px',
        display: 'flex', flexDirection: 'column', gap: '4px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '17px', fontWeight: '800' }}>New Job</div>
            <div style={{ fontSize: '12px', color: C.muted, marginTop: '2px' }}>Create a new restoration job</div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: C.muted, fontSize: '22px', cursor: 'pointer',
          }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Property */}
          <div style={{ fontSize: '11px', fontWeight: '700', color: C.muted, letterSpacing: '0.1em' }}>PROPERTY</div>
          <div>
            <label style={{ fontSize: '12px', color: C.muted, display: 'block', marginBottom: '5px' }}>Street Address *</label>
            <input required value={form.property_address} onChange={e => setForm(p => ({ ...p, property_address: e.target.value }))}
              placeholder="1234 Oak Street" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '12px', color: C.muted, display: 'block', marginBottom: '5px' }}>City</label>
              <input value={form.property_city} onChange={e => setForm(p => ({ ...p, property_city: e.target.value }))}
                placeholder="Houston" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: C.muted, display: 'block', marginBottom: '5px' }}>State</label>
              <input value={form.property_state} onChange={e => setForm(p => ({ ...p, property_state: e.target.value }))}
                placeholder="TX" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: C.muted, display: 'block', marginBottom: '5px' }}>ZIP</label>
              <input value={form.property_zip} onChange={e => setForm(p => ({ ...p, property_zip: e.target.value }))}
                placeholder="77001" style={inputStyle} />
            </div>
          </div>

          {/* Homeowner */}
          <div style={{ fontSize: '11px', fontWeight: '700', color: C.muted, letterSpacing: '0.1em', marginTop: '6px' }}>HOMEOWNER</div>
          <div>
            <label style={{ fontSize: '12px', color: C.muted, display: 'block', marginBottom: '5px' }}>Homeowner Name *</label>
            <input required value={form.homeowner_name} onChange={e => setForm(p => ({ ...p, homeowner_name: e.target.value }))}
              placeholder="John Smith" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '12px', color: C.muted, display: 'block', marginBottom: '5px' }}>Phone</label>
              <input value={form.homeowner_phone} onChange={e => setForm(p => ({ ...p, homeowner_phone: e.target.value }))}
                placeholder="(713) 555-0000" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: C.muted, display: 'block', marginBottom: '5px' }}>Email</label>
              <input type="email" value={form.homeowner_email} onChange={e => setForm(p => ({ ...p, homeowner_email: e.target.value }))}
                placeholder="owner@email.com" style={inputStyle} />
            </div>
          </div>

          {/* Insurance */}
          <div style={{ fontSize: '11px', fontWeight: '700', color: C.muted, letterSpacing: '0.1em', marginTop: '6px' }}>INSURANCE</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '12px', color: C.muted, display: 'block', marginBottom: '5px' }}>Carrier *</label>
              <input required value={form.carrier_name} onChange={e => setForm(p => ({ ...p, carrier_name: e.target.value }))}
                placeholder="State Farm" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: C.muted, display: 'block', marginBottom: '5px' }}>Claim # *</label>
              <input required value={form.claim_number} onChange={e => setForm(p => ({ ...p, claim_number: e.target.value }))}
                placeholder="TX-2026-000000" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '12px', color: C.muted, display: 'block', marginBottom: '5px' }}>Adjuster Name</label>
              <input value={form.adjuster_name} onChange={e => setForm(p => ({ ...p, adjuster_name: e.target.value }))}
                placeholder="Jane Adjuster" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: C.muted, display: 'block', marginBottom: '5px' }}>Adjuster Phone</label>
              <input value={form.adjuster_phone} onChange={e => setForm(p => ({ ...p, adjuster_phone: e.target.value }))}
                placeholder="(713) 555-0000" style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: C.muted, display: 'block', marginBottom: '5px' }}>Adjuster Email</label>
            <input type="email" value={form.adjuster_email} onChange={e => setForm(p => ({ ...p, adjuster_email: e.target.value }))}
              placeholder="adjuster@insurer.com" style={inputStyle} />
          </div>

          {/* Financials */}
          <div style={{ fontSize: '11px', fontWeight: '700', color: C.muted, letterSpacing: '0.1em', marginTop: '6px' }}>FINANCIALS</div>
          <div>
            <label style={{ fontSize: '12px', color: C.muted, display: 'block', marginBottom: '5px' }}>Xactimate Estimate ($)</label>
            <input type="number" step="0.01" value={form.xactimate_estimate}
              onChange={e => setForm(p => ({ ...p, xactimate_estimate: e.target.value }))}
              placeholder="45000.00" style={inputStyle} />
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontSize: '12px', color: C.muted, display: 'block', marginBottom: '5px' }}>Notes</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={3} placeholder="Fire source, damage scope, special considerations..."
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'system-ui', lineHeight: '1.5' }} />
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.3)', borderRadius: '7px',
              color: C.danger, fontSize: '13px',
            }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={saving} style={{
            padding: '12px', background: `linear-gradient(135deg, ${C.accent}, ${C.danger})`,
            border: 'none', borderRadius: '8px', color: 'white',
            fontSize: '14px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer',
            marginTop: '6px', opacity: saving ? 0.7 : 1,
          }}>
            {saving ? 'Creating Job…' : '+ Create Job'}
          </button>
        </form>
      </div>
    </>
  )
}

// ─── Main Jobs Page ──────────────────────────────────────────────────────────
type JobsTab = 'jobs' | 'schedule' | 'crew' | 'documents' | 'payments'

export default function JobsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [viewMode, setViewMode] = useState<'pipeline' | 'list'>('pipeline')
  const [activeTab, setActiveTab] = useState<JobsTab>('jobs')
  const [newJobOpen, setNewJobOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all')

  const loadJobs = useCallback(async () => {
    const { data, error } = await supabase
      .from('jobs').select('*').order('created_at', { ascending: false })
    if (data) setJobs(data as Job[])
    if (error) console.error('Failed to load jobs:', error.message)
  }, [])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      await loadJobs()
      setLoading(false)
    }
    init()
  }, [router, loadJobs])

  const handleJobUpdate = (updatedJob: Job) => {
    setJobs(prev => prev.map(j => j.id === updatedJob.id ? updatedJob : j))
    setSelectedJob(updatedJob)
  }

  const handleJobCreated = (newJob: Job) => {
    setJobs(prev => [newJob, ...prev])
    setSelectedJob(newJob)
  }

  const filteredJobs = statusFilter === 'all' ? jobs : jobs.filter(j => j.status === statusFilter)

  const totalPipeline = jobs.reduce((sum, j) => sum + (j.xactimate_estimate ?? 0), 0)
  const activJobs = jobs.filter(j => j.status !== 'closed' && j.status !== 'cancelled').length

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
        <span style={{ fontSize: '32px' }}>🔥</span>
        <span style={{ color: C.muted, fontSize: '14px' }}>Loading Jobs…</span>
      </div>
    </div>
  )

  const sidebarW = sidebarCollapsed ? 64 : 220

  const navItems: { icon: string; label: string; tab: JobsTab }[] = [
    { icon: '📋', label: 'Jobs', tab: 'jobs' },
    { icon: '🗓️', label: 'Schedule', tab: 'schedule' },
    { icon: '👥', label: 'Crew', tab: 'crew' },
    { icon: '📄', label: 'Documents', tab: 'documents' },
    { icon: '💰', label: 'Payments', tab: 'payments' },
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
                <div style={{
                  fontSize: '10px', fontWeight: '700', color: C.muted,
                  background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)',
                  borderRadius: '4px', padding: '1px 6px', display: 'inline-block', marginTop: '3px', letterSpacing: '0.04em',
                }}>
                  JOB MANAGER
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

        {/* New Job button */}
        {!sidebarCollapsed && (
          <div style={{ padding: '12px 10px', borderBottom: `1px solid ${C.border}` }}>
            <button onClick={() => { setNewJobOpen(true); setActiveTab('jobs') }} style={{
              width: '100%', padding: '9px 12px',
              background: `linear-gradient(135deg, ${C.accent}, ${C.danger})`,
              border: 'none', borderRadius: '8px', color: 'white',
              fontSize: '13px', fontWeight: '700', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center',
            }}>
              ➕ New Job
            </button>
          </div>
        )}
        {sidebarCollapsed && (
          <div style={{ padding: '8px 10px', borderBottom: `1px solid ${C.border}` }}>
            <button onClick={() => { setNewJobOpen(true); setActiveTab('jobs') }} title="New Job" style={{
              width: '100%', padding: '9px', borderRadius: '8px',
              background: `linear-gradient(135deg, ${C.accent}, ${C.danger})`,
              border: 'none', cursor: 'pointer', fontSize: '16px', display: 'flex', justifyContent: 'center',
            }}>➕</button>
          </div>
        )}

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
                <NavItem icon={item.icon} label={item.label} active={activeTab === item.tab} onClick={() => setActiveTab(item.tab)} />
              )}
            </div>
          ))}
        </div>

        {/* Bottom nav */}
        <div style={{ padding: '12px 10px', borderTop: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {sidebarCollapsed ? (
            <>
              <button onClick={() => router.push('/admin')} title="Admin" style={{
                width: '100%', padding: '9px', borderRadius: '8px', border: 'none',
                background: 'transparent', cursor: 'pointer', fontSize: '16px', display: 'flex', justifyContent: 'center',
              }}>📊</button>
              <button onClick={async () => { await supabase.auth.signOut(); router.push('/login') }} title="Sign Out" style={{
                width: '100%', padding: '9px', borderRadius: '8px', border: 'none',
                background: 'transparent', cursor: 'pointer', fontSize: '16px', display: 'flex', justifyContent: 'center',
              }}>🚪</button>
            </>
          ) : (
            <>
              <button onClick={() => router.push('/admin')} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                width: '100%', padding: '9px 12px', borderRadius: '8px', border: 'none',
                background: 'transparent', color: C.muted, fontSize: '13px', cursor: 'pointer', textAlign: 'left',
              }}>
                📊 <span>Admin Dashboard</span>
              </button>
              <button onClick={async () => { await supabase.auth.signOut(); router.push('/login') }} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                width: '100%', padding: '9px 12px', borderRadius: '8px', border: 'none',
                background: 'transparent', color: C.muted, fontSize: '13px', cursor: 'pointer', textAlign: 'left',
              }}>
                🚪 <span>Sign Out</span>
              </button>
            </>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '15px', fontWeight: '700' }}>
              {navItems.find(i => i.tab === activeTab)?.icon}&nbsp;
              {activeTab === 'jobs' ? 'Jobs' : navItems.find(i => i.tab === activeTab)?.label}
            </div>
            {activeTab === 'jobs' && (
              <span style={{
                fontSize: '11px', padding: '2px 9px', borderRadius: '99px',
                background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)',
                color: C.accent, fontWeight: '700',
              }}>
                Houston South District
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {activeTab === 'jobs' && (
              <>
                {/* View toggle */}
                <div style={{
                  display: 'flex', background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: '7px', overflow: 'hidden',
                }}>
                  {(['pipeline', 'list'] as const).map(v => (
                    <button key={v} onClick={() => setViewMode(v)} style={{
                      padding: '5px 12px', border: 'none', fontSize: '12px', fontWeight: '600',
                      background: viewMode === v ? C.accent : 'transparent',
                      color: viewMode === v ? 'white' : C.muted,
                      cursor: 'pointer',
                    }}>
                      {v === 'pipeline' ? '⫠ Pipeline' : '☰ List'}
                    </button>
                  ))}
                </div>
                <button onClick={() => setNewJobOpen(true)} style={{
                  padding: '7px 16px', background: `linear-gradient(135deg, ${C.accent}, ${C.danger})`,
                  border: 'none', borderRadius: '7px', color: 'white',
                  fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '5px',
                }}>
                  ➕ New Job
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}>

          {/* ── JOBS TAB ── */}
          {activeTab === 'jobs' && (
            <>
              {/* Summary stats */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Total Jobs', value: jobs.length, color: C.text },
                  { label: 'Active', value: activJobs, color: C.accent },
                  { label: 'Pipeline Value', value: fmt$(totalPipeline), color: C.success },
                  { label: 'Closed', value: jobs.filter(j => j.status === 'closed').length, color: C.muted },
                ].map((s, i) => (
                  <div key={i} style={{
                    background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px',
                    padding: '14px 20px', minWidth: '120px',
                  }}>
                    <div style={{ fontSize: typeof s.value === 'number' ? '26px' : '18px', fontWeight: '800', color: s.color, letterSpacing: '-0.5px' }}>
                      {s.value}
                    </div>
                    <div style={{ fontSize: '11px', color: C.muted, marginTop: '3px' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* List view status filter */}
              {viewMode === 'list' && (
                <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <button onClick={() => setStatusFilter('all')} style={{
                    padding: '5px 13px', borderRadius: '20px',
                    border: `1px solid ${statusFilter === 'all' ? C.accent : C.border}`,
                    background: statusFilter === 'all' ? C.accent : C.surface,
                    color: statusFilter === 'all' ? 'white' : C.muted,
                    fontSize: '12px', fontWeight: statusFilter === 'all' ? '700' : '400', cursor: 'pointer',
                  }}>
                    All ({jobs.length})
                  </button>
                  {STAGES.map(s => {
                    const count = jobs.filter(j => j.status === s.status).length
                    const active = statusFilter === s.status
                    return (
                      <button key={s.status} onClick={() => setStatusFilter(s.status)} style={{
                        padding: '5px 13px', borderRadius: '20px',
                        border: `1px solid ${active ? s.color : C.border}`,
                        background: active ? `${s.color}20` : C.surface,
                        color: active ? s.color : C.muted,
                        fontSize: '12px', fontWeight: active ? '700' : '400', cursor: 'pointer',
                      }}>
                        {s.icon} {s.label} ({count})
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Views */}
              {viewMode === 'pipeline' ? (
                <PipelineView jobs={jobs} onSelectJob={setSelectedJob} />
              ) : (
                <ListView jobs={filteredJobs} onSelectJob={setSelectedJob} />
              )}
            </>
          )}

          {/* ── PLACEHOLDERS ── */}
          {activeTab !== 'jobs' && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              height: '340px', gap: '12px', color: C.muted,
            }}>
              <span style={{ fontSize: '48px' }}>
                {navItems.find(i => i.tab === activeTab)?.icon}
              </span>
              <div style={{ fontSize: '18px', fontWeight: '700', color: C.text }}>
                {navItems.find(i => i.tab === activeTab)?.label}
              </div>
              <div style={{ fontSize: '14px' }}>Coming soon</div>
              <div style={{
                marginTop: '8px', padding: '6px 16px', borderRadius: '99px',
                background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)',
                color: C.accent, fontSize: '12px', fontWeight: '600',
              }}>
                Coming Soon
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Job detail slide panel ── */}
      <JobDetailPanel
        job={selectedJob}
        open={selectedJob !== null}
        onClose={() => setSelectedJob(null)}
        onUpdate={handleJobUpdate}
      />

      {/* ── New job slide panel ── */}
      <NewJobPanel
        open={newJobOpen}
        onClose={() => setNewJobOpen(false)}
        onCreated={handleJobCreated}
      />
    </div>
  )
}
