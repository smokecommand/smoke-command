'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { Lead, LeadStatus, LeadSource, LossReason, Touchpoint } from '@/lib/supabase'

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

// ─── Constants ──────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<LeadStatus, string> = {
  active: '#3b82f6',
  signed: '#22c55e',
  lost: '#ef4444',
}

const STATUS_LABELS: Record<LeadStatus, string> = {
  active: '🔵 Active',
  signed: '✅ Signed',
  lost: '❌ Lost',
}

const SOURCE_LABELS: Record<LeadSource, string> = {
  canvassing: '🚶 Canvassing',
  referral: '🤝 Referral',
  fire_lead: '🔥 Fire Lead',
  other: '📌 Other',
}

const LOSS_REASON_LABELS: Record<LossReason, string> = {
  declined: 'Declined',
  no_insurance: 'No Insurance',
  carrier_denied: 'Carrier Denied',
  competitor: 'Competitor Signed',
  couldnt_reach: "Couldn't Reach",
  other: 'Other',
}

const daysSince = (dateStr: string | null) => {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

// ─── Nav item ──────────────────────────────────────────────────────────────
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

// ─── Status Badge ──────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: LeadStatus }) {
  const color = STATUS_COLORS[status]
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: '700',
      background: `${color}20`, color, border: `1px solid ${color}40`,
    }}>
      {STATUS_LABELS[status]}
    </span>
  )
}

// ─── Lead Detail Panel ──────────────────────────────────────────────────────
function LeadDetailPanel({ lead, open, onClose, onUpdate, onCreateJob }: {
  lead: Lead | null
  open: boolean
  onClose: () => void
  onUpdate: (l: Lead) => void
  onCreateJob: (l: Lead) => void
}) {
  const [saving, setSaving] = useState(false)
  const [editStatus, setEditStatus] = useState(false)
  const [newStatus, setNewStatus] = useState<LeadStatus | ''>('')
  const [lossReason, setLossReason] = useState<LossReason | ''>('')
  const [tpText, setTpText] = useState('')
  const [tpType, setTpType] = useState('call')
  const [addingTp, setAddingTp] = useState(false)
  const [editNotes, setEditNotes] = useState(false)
  const [notesVal, setNotesVal] = useState('')

  useEffect(() => {
    if (lead) {
      setNotesVal(lead.notes ?? '')
      setNewStatus('')
      setLossReason('')
      setEditStatus(false)
      setEditNotes(false)
    }
  }, [lead?.id])

  if (!open || !lead) return null

  const days = daysSince(lead.date_contacted)

  const handleStatusChange = async () => {
    if (!newStatus) return
    if (newStatus === 'lost' && !lossReason) {
      alert('Please select a loss reason.')
      return
    }
    setSaving(true)
    const { data, error } = await supabase
      .from('leads')
      .update({ status: newStatus, loss_reason: newStatus === 'lost' ? lossReason : null })
      .eq('id', lead.id)
      .select()
      .single()
    setSaving(false)
    if (!error && data) { onUpdate(data as Lead); setEditStatus(false) }
  }

  const addTouchpoint = async () => {
    if (!tpText.trim()) return
    const tp: Touchpoint = {
      date: new Date().toISOString(),
      type: tpType,
      notes: tpText.trim(),
    }
    const updated = [...(lead.touchpoints ?? []), tp]
    setSaving(true)
    const { data, error } = await supabase
      .from('leads')
      .update({ touchpoints: updated })
      .eq('id', lead.id)
      .select()
      .single()
    setSaving(false)
    if (!error && data) {
      onUpdate(data as Lead)
      setTpText('')
      setAddingTp(false)
    }
  }

  const saveNotes = async () => {
    setSaving(true)
    const { data, error } = await supabase
      .from('leads')
      .update({ notes: notesVal })
      .eq('id', lead.id)
      .select()
      .single()
    setSaving(false)
    if (!error && data) { onUpdate(data as Lead); setEditNotes(false) }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 11px',
    background: C.bg, border: `1px solid ${C.border}`,
    borderRadius: '7px', color: C.text, fontSize: '13px',
    boxSizing: 'border-box',
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: '22px' }}>
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
      <div style={{ fontSize: '13px', color: value ? C.text : C.muted }}>{value || '—'}</div>
    </div>
  )

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200,
      }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '540px',
        background: C.surface, borderLeft: `1px solid ${C.border}`,
        zIndex: 201, overflowY: 'auto', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          position: 'sticky', top: 0, background: C.surface, zIndex: 1,
        }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: C.text, lineHeight: 1.2, marginBottom: '4px' }}>
              {lead.homeowner_name}
            </div>
            <div style={{ fontSize: '13px', color: C.muted }}>{lead.property_address}</div>
            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <StatusBadge status={lead.status} />
              <span style={{ fontSize: '12px', color: C.muted }}>
                {SOURCE_LABELS[lead.source]}
              </span>
              {days != null && (
                <span style={{
                  fontSize: '11px', color: days > 14 ? C.warning : C.muted,
                  fontWeight: days > 14 ? '700' : '400',
                }}>
                  Day {days}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: C.muted,
            fontSize: '22px', cursor: 'pointer', lineHeight: 1, padding: '2px',
          }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', flex: 1 }}>

          {/* Status change */}
          <Section title="STATUS">
            <div style={{ marginBottom: '12px' }}>
              {!editStatus ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <StatusBadge status={lead.status} />
                  <button onClick={() => setEditStatus(true)} style={{
                    padding: '5px 12px', background: 'none',
                    border: `1px solid ${C.border}`, borderRadius: '6px',
                    color: C.accent, fontSize: '12px', cursor: 'pointer',
                  }}>
                    Change Status
                  </button>
                  {lead.status === 'signed' && (
                    <button
                      onClick={() => onCreateJob(lead)}
                      style={{
                        padding: '5px 12px',
                        background: `linear-gradient(135deg, ${C.accent}, ${C.danger})`,
                        border: 'none', borderRadius: '6px',
                        color: 'white', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                      }}>
                      📋 Create Job →
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value as LeadStatus)}
                    style={inputStyle}
                  >
                    <option value="">Select status...</option>
                    <option value="active">🔵 Active</option>
                    <option value="signed">✅ Signed</option>
                    <option value="lost">❌ Lost</option>
                  </select>

                  {newStatus === 'lost' && (
                    <select
                      value={lossReason}
                      onChange={e => setLossReason(e.target.value as LossReason)}
                      style={inputStyle}
                    >
                      <option value="">Select loss reason... *</option>
                      {(Object.entries(LOSS_REASON_LABELS) as [LossReason, string][]).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  )}

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleStatusChange} disabled={!newStatus || saving} style={{
                      padding: '7px 14px', background: C.accent,
                      border: 'none', borderRadius: '7px', color: 'white',
                      fontSize: '12px', fontWeight: '700',
                      cursor: newStatus ? 'pointer' : 'not-allowed',
                      opacity: newStatus ? 1 : 0.5,
                    }}>
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                    <button onClick={() => setEditStatus(false)} style={{
                      padding: '7px 12px', background: 'none',
                      border: `1px solid ${C.border}`, borderRadius: '7px',
                      color: C.muted, fontSize: '12px', cursor: 'pointer',
                    }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
            {lead.status === 'lost' && lead.loss_reason && (
              <div style={{
                padding: '8px 12px', background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)', borderRadius: '7px',
                fontSize: '12px', color: C.danger,
              }}>
                Loss reason: {LOSS_REASON_LABELS[lead.loss_reason as LossReason] ?? lead.loss_reason}
              </div>
            )}
          </Section>

          {/* Contact info */}
          <Section title="CONTACT INFO">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Field label="Homeowner" value={lead.homeowner_name} />
              <Field label="Phone" value={lead.phone} />
              <Field label="Address" value={lead.property_address} />
              <Field label="Source" value={SOURCE_LABELS[lead.source]} />
              <Field label="First Contact" value={lead.date_contacted ? new Date(lead.date_contacted).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null} />
              <Field label="Days in Pipeline" value={days != null ? `${days} days` : null} />
            </div>
          </Section>

          {/* Touchpoint Log */}
          <Section title="TOUCHPOINT LOG">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
              {(lead.touchpoints ?? []).length === 0 && (
                <div style={{ color: C.muted, fontSize: '13px' }}>No touchpoints logged yet.</div>
              )}
              {[...(lead.touchpoints ?? [])].reverse().map((tp, idx) => (
                <div key={idx} style={{
                  padding: '10px 12px', background: C.bg,
                  borderRadius: '8px', border: `1px solid ${C.border}`,
                  display: 'flex', gap: '10px',
                }}>
                  <div style={{ fontSize: '14px', flexShrink: 0 }}>
                    {tp.type === 'call' ? '📞' : tp.type === 'door' ? '🚪' : tp.type === 'text' ? '💬' : tp.type === 'email' ? '📧' : '📌'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: C.text }}>{tp.notes}</div>
                    <div style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>
                      {tp.type} · {new Date(tp.date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!addingTp ? (
              <button onClick={() => setAddingTp(true)} style={{
                padding: '7px 14px', background: 'none',
                border: `1px solid ${C.border}`, borderRadius: '7px',
                color: C.accent, fontSize: '12px', fontWeight: '600', cursor: 'pointer',
              }}>
                + Log Touchpoint
              </button>
            ) : (
              <div style={{
                background: C.bg, border: `1px solid ${C.border}`,
                borderRadius: '10px', padding: '14px',
                display: 'flex', flexDirection: 'column', gap: '10px',
              }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { value: 'call', label: '📞 Call' },
                    { value: 'door', label: '🚪 Door' },
                    { value: 'text', label: '💬 Text' },
                    { value: 'email', label: '📧 Email' },
                    { value: 'other', label: '📌 Other' },
                  ].map(t => (
                    <button
                      key={t.value}
                      onClick={() => setTpType(t.value)}
                      style={{
                        padding: '4px 10px', fontSize: '11px', fontWeight: '600',
                        background: tpType === t.value ? C.accent : 'transparent',
                        border: `1px solid ${tpType === t.value ? C.accent : C.border}`,
                        borderRadius: '5px',
                        color: tpType === t.value ? 'white' : C.muted,
                        cursor: 'pointer',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <input
                  value={tpText}
                  onChange={e => setTpText(e.target.value)}
                  placeholder="Notes about this touchpoint..."
                  style={inputStyle}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={addTouchpoint} disabled={saving || !tpText.trim()} style={{
                    padding: '7px 14px', background: C.accent,
                    border: 'none', borderRadius: '7px', color: 'white',
                    fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                  }}>
                    {saving ? 'Saving…' : 'Log It'}
                  </button>
                  <button onClick={() => setAddingTp(false)} style={{
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

          {/* Notes */}
          <Section title="NOTES">
            {!editNotes ? (
              <div>
                <div style={{
                  padding: '12px', background: C.bg, borderRadius: '8px',
                  border: `1px solid ${C.border}`, fontSize: '13px',
                  color: lead.notes ? C.text : C.muted, lineHeight: '1.6', minHeight: '60px',
                }}>
                  {lead.notes || 'No notes yet.'}
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
                  value={notesVal}
                  onChange={e => setNotesVal(e.target.value)}
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
                  <button onClick={() => { setEditNotes(false); setNotesVal(lead.notes ?? '') }} style={{
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

// ─── New Lead Panel ──────────────────────────────────────────────────────────
function NewLeadPanel({ open, onClose, onCreated }: {
  open: boolean
  onClose: () => void
  onCreated: (l: Lead) => void
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    homeowner_name: '',
    property_address: '',
    phone: '',
    date_contacted: new Date().toISOString().slice(0, 10),
    source: 'canvassing' as LeadSource,
    notes: '',
    district_id: 'houston-south',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()

    const { data, error: err } = await supabase
      .from('leads')
      .insert({
        homeowner_name: form.homeowner_name,
        property_address: form.property_address,
        phone: form.phone || null,
        date_contacted: form.date_contacted || null,
        source: form.source,
        notes: form.notes || null,
        district_id: form.district_id || null,
        created_by: user?.id ?? null,
        status: 'active',
        touchpoints: [],
      })
      .select()
      .single()

    setSaving(false)
    if (err) {
      setError(err.message)
    } else if (data) {
      onCreated(data as Lead)
      setForm({
        homeowner_name: '', property_address: '', phone: '',
        date_contacted: new Date().toISOString().slice(0, 10),
        source: 'canvassing', notes: '', district_id: 'houston-south',
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
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '440px',
        background: C.surface, borderLeft: `1px solid ${C.border}`,
        zIndex: 201, overflowY: 'auto', padding: '24px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '17px', fontWeight: '800' }}>New Lead</div>
            <div style={{ fontSize: '12px', color: C.muted, marginTop: '2px' }}>Log a prospect or canvassing lead</div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: C.muted, fontSize: '22px', cursor: 'pointer',
          }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', color: C.muted, display: 'block', marginBottom: '5px' }}>Homeowner Name *</label>
            <input required value={form.homeowner_name} onChange={e => setForm(p => ({ ...p, homeowner_name: e.target.value }))}
              placeholder="John Smith" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: C.muted, display: 'block', marginBottom: '5px' }}>Property Address *</label>
            <input required value={form.property_address} onChange={e => setForm(p => ({ ...p, property_address: e.target.value }))}
              placeholder="1234 Oak Street, Houston TX" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: C.muted, display: 'block', marginBottom: '5px' }}>Phone</label>
            <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              placeholder="(713) 555-0000" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '12px', color: C.muted, display: 'block', marginBottom: '5px' }}>Date Contacted</label>
              <input type="date" value={form.date_contacted}
                onChange={e => setForm(p => ({ ...p, date_contacted: e.target.value }))}
                style={{ ...inputStyle, colorScheme: 'dark' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: C.muted, display: 'block', marginBottom: '5px' }}>Source *</label>
              <select value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value as LeadSource }))}
                style={inputStyle}>
                <option value="canvassing">🚶 Canvassing</option>
                <option value="referral">🤝 Referral</option>
                <option value="fire_lead">🔥 Fire Lead</option>
                <option value="other">📌 Other</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: C.muted, display: 'block', marginBottom: '5px' }}>Notes</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={3} placeholder="Damage observed, homeowner attitude, follow-up needed..."
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
            fontSize: '14px', fontWeight: '700',
            cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
          }}>
            {saving ? 'Saving…' : '+ Add Lead'}
          </button>
        </form>
      </div>
    </>
  )
}

// ─── Accountability Dashboard ────────────────────────────────────────────────
function AccountabilityDashboard({ leads }: { leads: Lead[] }) {
  const now = Date.now()
  const weekMs = 7 * 24 * 60 * 60 * 1000
  const monthMs = 30 * 24 * 60 * 60 * 1000

  const thisWeek = leads.filter(l => new Date(l.created_at).getTime() > now - weekMs)
  const thisMonth = leads.filter(l => new Date(l.created_at).getTime() > now - monthMs)

  const signed = leads.filter(l => l.status === 'signed')
  const lost = leads.filter(l => l.status === 'lost')
  const active = leads.filter(l => l.status === 'active')

  const convRate = leads.length > 0
    ? Math.round((signed.length / leads.length) * 100)
    : 0

  // Loss reason breakdown
  const lossBreakdown = lost.reduce<Record<string, number>>((acc, l) => {
    const r = l.loss_reason ?? 'other'
    acc[r] = (acc[r] ?? 0) + 1
    return acc
  }, {})

  const topLossReasons = Object.entries(lossBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  return (
    <div>
      <div style={{ fontSize: '13px', fontWeight: '700', color: C.muted, letterSpacing: '0.1em', marginBottom: '16px' }}>
        ACCOUNTABILITY DASHBOARD
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {[
          { label: 'Total Leads', value: leads.length, color: C.text },
          { label: 'Active', value: active.length, color: '#3b82f6' },
          { label: 'Signed', value: signed.length, color: C.success },
          { label: 'Lost', value: lost.length, color: C.danger },
          { label: 'This Week', value: thisWeek.length, color: C.accent },
          { label: 'This Month', value: thisMonth.length, color: C.accent },
          { label: 'Conv. Rate', value: `${convRate}%`, color: convRate > 20 ? C.success : convRate > 10 ? C.warning : C.danger },
        ].map((s, i) => (
          <div key={i} style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px',
            padding: '14px 18px', minWidth: '100px',
          }}>
            <div style={{ fontSize: '22px', fontWeight: '800', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: C.muted, marginTop: '3px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Top loss reasons */}
      {topLossReasons.length > 0 && (
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: '10px', padding: '16px', marginBottom: '20px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: C.muted, marginBottom: '12px' }}>
            TOP LOSS REASONS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {topLossReasons.map(([reason, count]) => {
              const pct = lost.length > 0 ? Math.round((count / lost.length) * 100) : 0
              return (
                <div key={reason}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: C.text }}>
                      {LOSS_REASON_LABELS[reason as LossReason] ?? reason}
                    </span>
                    <span style={{ fontSize: '12px', color: C.muted }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: '5px', background: C.border, borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`,
                      background: C.danger, borderRadius: '99px',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Leads Page ──────────────────────────────────────────────────────────
export default function LeadsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [newLeadOpen, setNewLeadOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [filter, setFilter] = useState<LeadStatus | 'all'>('all')
  const [createJobPrefill, setCreateJobPrefill] = useState<{ homeowner_name?: string; property_address?: string; phone?: string } | undefined>()
  const [createJobOpen, setCreateJobOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'dashboard'>('list')

  const loadLeads = useCallback(async () => {
    const { data, error } = await supabase
      .from('leads').select('*').order('created_at', { ascending: false })
    if (data) setLeads(data as Lead[])
    if (error) console.error('Failed to load leads:', error.message)
  }, [])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      await loadLeads()
      setLoading(false)
    }
    init()
  }, [router, loadLeads])

  const handleLeadUpdate = (updated: Lead) => {
    setLeads(prev => prev.map(l => l.id === updated.id ? updated : l))
    setSelectedLead(updated)
  }

  const handleLeadCreated = (l: Lead) => {
    setLeads(prev => [l, ...prev])
    setSelectedLead(l)
  }

  const handleCreateJob = (lead: Lead) => {
    setSelectedLead(null)
    setCreateJobPrefill({
      homeowner_name: lead.homeowner_name,
      property_address: lead.property_address,
      phone: lead.phone ?? undefined,
    })
    setCreateJobOpen(true)
  }

  const filteredLeads = filter === 'all' ? leads : leads.filter(l => l.status === filter)

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
        <span style={{ fontSize: '32px' }}>🎯</span>
        <span style={{ color: C.muted, fontSize: '14px' }}>Loading Leads…</span>
      </div>
    </div>
  )

  const sidebarW = sidebarCollapsed ? 64 : 220
  const activeCt = leads.filter(l => l.status === 'active').length
  const signedCt = leads.filter(l => l.status === 'signed').length
  const lostCt = leads.filter(l => l.status === 'lost').length

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
        <div style={{ padding: '18px 14px 12px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px', flexShrink: 0 }}>🔥</span>
            {!sidebarCollapsed && (
              <div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: C.accent, lineHeight: 1.2 }}>
                  SMOKE COMMAND
                </div>
                <div style={{
                  fontSize: '10px', fontWeight: '700', color: C.muted,
                  background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)',
                  borderRadius: '4px', padding: '1px 6px', display: 'inline-block', marginTop: '3px',
                }}>
                  SALES & LEADS
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

        {!sidebarCollapsed && (
          <div style={{ padding: '12px 10px', borderBottom: `1px solid ${C.border}` }}>
            <button onClick={() => setNewLeadOpen(true)} style={{
              width: '100%', padding: '9px 12px',
              background: `linear-gradient(135deg, ${C.accent}, ${C.danger})`,
              border: 'none', borderRadius: '8px', color: 'white',
              fontSize: '13px', fontWeight: '700', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center',
            }}>
              🎯 New Lead
            </button>
          </div>
        )}
        {sidebarCollapsed && (
          <div style={{ padding: '8px 10px', borderBottom: `1px solid ${C.border}` }}>
            <button onClick={() => setNewLeadOpen(true)} title="New Lead" style={{
              width: '100%', padding: '9px', borderRadius: '8px',
              background: `linear-gradient(135deg, ${C.accent}, ${C.danger})`,
              border: 'none', cursor: 'pointer', fontSize: '16px', display: 'flex', justifyContent: 'center',
            }}>🎯</button>
          </div>
        )}

        <div style={{ flex: 1, padding: '12px 10px' }}>
          {[
            { icon: '📋', label: 'All Leads', tab: 'all' as const, count: leads.length },
            { icon: '🔵', label: 'Active', tab: 'active' as const, count: activeCt },
            { icon: '✅', label: 'Signed', tab: 'signed' as const, count: signedCt },
            { icon: '❌', label: 'Lost', tab: 'lost' as const, count: lostCt },
          ].map(item => (
            <div key={item.tab} style={{ marginBottom: '2px' }}>
              {sidebarCollapsed ? (
                <button onClick={() => setFilter(item.tab as LeadStatus | 'all')} title={item.label} style={{
                  width: '100%', padding: '9px', borderRadius: '8px', border: 'none',
                  background: filter === item.tab ? 'rgba(249,115,22,0.12)' : 'transparent',
                  cursor: 'pointer', fontSize: '16px', display: 'flex', justifyContent: 'center',
                }}>
                  {item.icon}
                </button>
              ) : (
                <button onClick={() => setFilter(item.tab as LeadStatus | 'all')} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  width: '100%', padding: '9px 12px', borderRadius: '8px', border: 'none',
                  background: filter === item.tab ? 'rgba(249,115,22,0.12)' : 'transparent',
                  color: filter === item.tab ? C.accent : C.muted,
                  fontSize: '13px', fontWeight: filter === item.tab ? '600' : '400',
                  cursor: 'pointer', textAlign: 'left',
                }}>
                  <span style={{ fontSize: '15px', minWidth: '18px' }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <span style={{
                    fontSize: '10px', padding: '1px 6px', borderRadius: '99px',
                    background: 'rgba(113,113,122,0.2)', color: C.muted, fontWeight: '700',
                  }}>{item.count}</span>
                </button>
              )}
            </div>
          ))}
        </div>

        <div style={{ padding: '12px 10px', borderTop: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {sidebarCollapsed ? (
            <>
              <button onClick={() => router.push('/jobs')} title="Jobs" style={{
                width: '100%', padding: '9px', borderRadius: '8px', border: 'none',
                background: 'transparent', cursor: 'pointer', fontSize: '16px', display: 'flex', justifyContent: 'center',
              }}>📋</button>
              <button onClick={() => router.push('/admin')} title="Admin" style={{
                width: '100%', padding: '9px', borderRadius: '8px', border: 'none',
                background: 'transparent', cursor: 'pointer', fontSize: '16px', display: 'flex', justifyContent: 'center',
              }}>📊</button>
            </>
          ) : (
            <>
              <NavItem icon="📋" label="Jobs" active={false} onClick={() => router.push('/jobs')} />
              <NavItem icon="📊" label="Admin Dashboard" active={false} onClick={() => router.push('/admin')} />
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
            <div style={{ fontSize: '15px', fontWeight: '700' }}>🎯 Sales & Leads</div>
            <span style={{
              fontSize: '11px', padding: '2px 9px', borderRadius: '99px',
              background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)',
              color: C.accent, fontWeight: '700',
            }}>
              Houston South District
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{
              display: 'flex', background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: '7px', overflow: 'hidden',
            }}>
              {(['list', 'dashboard'] as const).map(v => (
                <button key={v} onClick={() => setViewMode(v)} style={{
                  padding: '5px 12px', border: 'none', fontSize: '12px', fontWeight: '600',
                  background: viewMode === v ? C.accent : 'transparent',
                  color: viewMode === v ? 'white' : C.muted, cursor: 'pointer',
                }}>
                  {v === 'list' ? '☰ List' : '📊 Dashboard'}
                </button>
              ))}
            </div>
            <button onClick={() => setNewLeadOpen(true)} style={{
              padding: '7px 16px', background: `linear-gradient(135deg, ${C.accent}, ${C.danger})`,
              border: 'none', borderRadius: '7px', color: 'white',
              fontSize: '13px', fontWeight: '700', cursor: 'pointer',
            }}>
              🎯 New Lead
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}>

          {viewMode === 'dashboard' && (
            <AccountabilityDashboard leads={leads} />
          )}

          {viewMode === 'list' && (
            <>
              {/* Lead list */}
              <div style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: '12px', overflow: 'hidden',
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: C.bg }}>
                        {['Homeowner', 'Address', 'Phone', 'Source', 'First Contact', 'Days', 'Status', 'Touchpoints', ''].map((h, i) => (
                          <th key={i} style={{
                            padding: '11px 14px', textAlign: 'left',
                            color: C.muted, fontWeight: '600', fontSize: '11px', letterSpacing: '0.07em',
                            borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap',
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map((lead, idx) => {
                        const days = daysSince(lead.date_contacted)
                        return (
                          <tr
                            key={lead.id}
                            style={{
                              borderBottom: idx < filteredLeads.length - 1 ? `1px solid ${C.border}` : 'none',
                              cursor: 'pointer',
                            }}
                            onClick={() => setSelectedLead(lead)}
                            onMouseEnter={e => (e.currentTarget.style.background = '#1f2330')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <td style={{ padding: '12px 14px', fontWeight: '700', color: C.text }}>
                              {lead.homeowner_name}
                            </td>
                            <td style={{ padding: '12px 14px', color: C.muted, fontSize: '12px' }}>
                              {lead.property_address}
                            </td>
                            <td style={{ padding: '12px 14px', color: C.muted, fontSize: '12px' }}>
                              {lead.phone ?? '—'}
                            </td>
                            <td style={{ padding: '12px 14px', fontSize: '12px', color: C.muted, whiteSpace: 'nowrap' }}>
                              {SOURCE_LABELS[lead.source]}
                            </td>
                            <td style={{ padding: '12px 14px', fontSize: '12px', color: C.muted, whiteSpace: 'nowrap' }}>
                              {lead.date_contacted ? new Date(lead.date_contacted).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                            </td>
                            <td style={{ padding: '12px 14px', fontSize: '12px', whiteSpace: 'nowrap' }}>
                              <span style={{
                                color: days != null && days > 14 ? C.warning : C.muted,
                                fontWeight: days != null && days > 14 ? '700' : '400',
                              }}>
                                {days != null ? `Day ${days}` : '—'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                              <StatusBadge status={lead.status} />
                            </td>
                            <td style={{ padding: '12px 14px', fontSize: '12px', color: C.muted }}>
                              {(lead.touchpoints ?? []).length}
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
                  {filteredLeads.length === 0 && (
                    <div style={{ padding: '48px', textAlign: 'center', color: C.muted, fontSize: '13px' }}>
                      {filter === 'all' ? 'No leads yet. Hit "+ New Lead" to log your first prospect.' : `No ${filter} leads.`}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Lead detail panel */}
      <LeadDetailPanel
        lead={selectedLead}
        open={selectedLead !== null}
        onClose={() => setSelectedLead(null)}
        onUpdate={handleLeadUpdate}
        onCreateJob={handleCreateJob}
      />

      {/* New lead panel */}
      <NewLeadPanel
        open={newLeadOpen}
        onClose={() => setNewLeadOpen(false)}
        onCreated={handleLeadCreated}
      />

      {/* Create Job from lead (uses router push for now) */}
      {createJobOpen && createJobPrefill && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: '14px', padding: '28px', maxWidth: '420px', width: '100%',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>📋</div>
            <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Create Job from Lead</div>
            <div style={{ fontSize: '13px', color: C.muted, marginBottom: '20px' }}>
              Navigate to Jobs to create a job pre-filled with:<br />
              <strong style={{ color: C.text }}>{createJobPrefill.homeowner_name}</strong><br />
              <span style={{ color: C.muted }}>{createJobPrefill.property_address}</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  router.push('/jobs')
                }}
                style={{
                  padding: '10px 20px',
                  background: `linear-gradient(135deg, ${C.accent}, ${C.danger})`,
                  border: 'none', borderRadius: '8px', color: 'white',
                  fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                }}
              >
                Go to Jobs →
              </button>
              <button onClick={() => setCreateJobOpen(false)} style={{
                padding: '10px 16px', background: 'none',
                border: `1px solid ${C.border}`, borderRadius: '8px',
                color: C.muted, fontSize: '13px', cursor: 'pointer',
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
