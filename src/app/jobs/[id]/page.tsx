'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'

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

// ─── Stage definitions ──────────────────────────────────────────────────────
const STAGE_NAMES: Record<number, string> = {
  1: 'Job Intake',
  2: 'Site Assessment',
  3: 'Photo Documentation',
  4: 'Carrier Submission',
  5: 'Awaiting Payment',
  6: 'Heavy Clean & Treatment',
  7: 'Final Walkthrough',
  8: 'Job Closed',
}

// ─── Checklist item type ────────────────────────────────────────────────────
type ChecklistItemDef = {
  id: string
  label: string
  docusign?: boolean
  upload?: boolean
  dropdown?: { key: string; options: string[] }
}

// ─── Stage checklists ────────────────────────────────────────────────────────
const STAGE_CHECKLISTS: Record<number, ChecklistItemDef[]> = {
  1: [
    { id: 's1-1', label: 'Homeowner name + contact info collected' },
    { id: 's1-2', label: 'Loss address confirmed' },
    { id: 's1-3', label: 'Insurance carrier identified' },
    { id: 's1-4', label: 'Date of loss recorded' },
    { id: 's1-5', label: 'Cause of loss noted' },
    { id: 's1-6', label: 'Contingency Contract signed', docusign: true },
    { id: 's1-7', label: 'Direction to Pay signed', docusign: true },
    { id: 's1-8', label: 'Work Authorization signed', docusign: true },
    { id: 's1-9', label: 'Photos of ID collected' },
    { id: 's1-10', label: 'Sample swabs obtained for lab testing' },
    { id: 's1-11', label: 'Hover sketch completed' },
  ],
  2: [
    { id: 's2-1', label: 'Site walkthrough completed' },
    { id: 's2-2', label: 'Affected rooms/areas documented' },
    { id: 's2-3', label: 'Smoke penetration level noted', dropdown: { key: 'smoke_level', options: ['Light', 'Moderate', 'Heavy'] } },
    { id: 's2-4', label: 'Ductwork condition assessed', dropdown: { key: 'ductwork', options: ['Clean', 'Replace'] } },
    { id: 's2-5', label: 'Drywall condition assessed', dropdown: { key: 'drywall', options: ['Clean', 'Replace'] } },
    { id: 's2-6', label: 'Equipment needs identified (# of hydroxyls, trailer setup, etc.)' },
    { id: 's2-7', label: 'Scope of work drafted' },
    { id: 's2-8', label: 'Photos taken (pre-remediation)', upload: true },
  ],
  3: [
    { id: 's3-1', label: 'Exterior of structure photographed' },
    { id: 's3-2', label: 'All affected rooms photographed' },
    { id: 's3-3', label: 'HVAC/ductwork photographed' },
    { id: 's3-4', label: 'Attic photographed (if affected)' },
    { id: 's3-5', label: 'Crawl space photographed (if applicable)' },
    { id: 's3-6', label: 'Close-ups of smoke damage on surfaces' },
    { id: 's3-7', label: 'Photos uploaded to job record', upload: true },
  ],
  4: [
    { id: 's4-1', label: 'Xactimate estimate completed' },
    { id: 's4-2', label: 'Photo report attached' },
    { id: 's4-3', label: 'Lab results attached' },
    { id: 's4-4', label: 'Hover sketch attached' },
    { id: 's4-5', label: 'Scope of work finalized' },
    { id: 's4-6', label: 'Carrier submission packet compiled' },
    { id: 's4-7', label: 'Packet submitted to carrier' },
    { id: 's4-8', label: 'Claim number received' },
    { id: 's4-9', label: 'Adjuster assigned' },
    { id: 's4-10', label: 'Approval received' },
  ],
  5: [
    { id: 's5-1', label: 'Approval amount confirmed' },
    { id: 's5-2', label: 'Invoice sent to carrier' },
    { id: 's5-3', label: 'Check sent to mortgage company for endorsement' },
    { id: 's5-4', label: 'Initial payment received (50–80%)' },
    { id: 's5-5', label: 'Payment recorded in job record' },
    { id: 's5-6', label: 'Crew scheduled / job greenlit to start' },
  ],
  6: [
    { id: 's6-1', label: 'Crew assigned' },
    { id: 's6-2', label: 'Equipment staged on site' },
    { id: 's6-3', label: 'Hydroxyl generators started' },
    { id: 's6-4', label: 'All surfaces cleaned (walls, ceilings, floors)' },
    { id: 's6-5', label: 'Cabinets/trim cleaned' },
    { id: 's6-6', label: 'Light fixtures/outlets cleaned' },
    { id: 's6-7', label: 'HVAC returns cleaned/covered' },
    { id: 's6-8', label: 'Debris removed from structure' },
    { id: 's6-9', label: 'Structure fully sealed (doors/windows closed)' },
    { id: 's6-10', label: 'Thermal fog applied to all affected areas' },
    { id: 's6-11', label: 'Dwell time completed' },
    { id: 's6-12', label: 'Structure ventilated post-fog' },
    { id: 's6-13', label: 'Hydroxyl treatment duration logged (start/end time)' },
    { id: 's6-14', label: 'Post-treatment air quality check' },
    { id: 's6-15', label: 'Lead tech sign-off' },
  ],
  7: [
    { id: 's7-1', label: 'All stages confirmed complete' },
    { id: 's7-2', label: 'Post-remediation photos taken', upload: true },
    { id: 's7-3', label: 'Structure cleared of all equipment' },
    { id: 's7-4', label: 'Homeowner walkthrough completed' },
    { id: 's7-5', label: 'Homeowner sign-off obtained', docusign: true },
    { id: 's7-6', label: 'Certificate of completion signed', docusign: true },
    { id: 's7-7', label: 'Final payment received' },
    { id: 's7-8', label: 'Lien waiver signed', docusign: true },
  ],
  8: [
    { id: 's8-1', label: 'All documents collected and attached to job record' },
    { id: 's8-2', label: 'All payments reconciled' },
    { id: 's8-3', label: 'Job marked closed' },
    { id: 's8-4', label: 'File archived' },
  ],
}

// ─── Mock jobs ──────────────────────────────────────────────────────────────
const MOCK_JOBS: Record<string, Job> = {
  'mock-1': {
    id: 'mock-1',
    address_street: '1842 Oak Dr',
    address_city: 'Pasadena',
    address_zip: '77502',
    homeowner_name: 'Maria Santos',
    homeowner_phone: '(713) 555-0101',
    homeowner_email: 'maria.santos@email.com',
    insurance_carrier: 'State Farm',
    claim_number: 'SF-2024-88421',
    adjuster_name: 'Tom Bradley',
    adjuster_phone: '(713) 555-0190',
    date_of_loss: '2024-06-20',
    cause_of_loss: 'Fire',
    current_stage: 2,
    stage_data: {},
    carrier_approval: 28400,
    amount_collected: 0,
    crew_lead_id: null,
    notes: 'Pasadena structure fire — smoke penetration throughout main floor and attic.',
    district_id: 'houston-south',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  'mock-2': {
    id: 'mock-2',
    address_street: '504 Oleander Ave',
    address_city: 'La Marque',
    address_zip: '77568',
    homeowner_name: 'Robert Tran',
    homeowner_phone: '(409) 555-0202',
    homeowner_email: 'robert.tran@email.com',
    insurance_carrier: 'Allstate',
    claim_number: 'ALL-2024-55193',
    adjuster_name: 'Sarah Nguyen',
    adjuster_phone: '(409) 555-0299',
    date_of_loss: '2024-06-13',
    cause_of_loss: 'Smoke',
    current_stage: 5,
    stage_data: {},
    carrier_approval: 41750,
    amount_collected: 20875,
    crew_lead_id: null,
    notes: 'La Marque smoke damage — heavy smoke in kitchen and living area.',
    district_id: 'galveston',
    created_at: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
  },
  'mock-3': {
    id: 'mock-3',
    address_street: '2217 Bayou Rd',
    address_city: 'Texas City',
    address_zip: '77590',
    homeowner_name: 'James Kelley',
    homeowner_phone: '(409) 555-0303',
    homeowner_email: 'james.kelley@email.com',
    insurance_carrier: 'USAA',
    claim_number: 'USAA-2024-31087',
    adjuster_name: 'Mike Torres',
    adjuster_phone: '(409) 555-0388',
    date_of_loss: '2024-06-17',
    cause_of_loss: 'Wildfire Smoke',
    current_stage: 6,
    stage_data: {},
    carrier_approval: 63200,
    amount_collected: 44240,
    crew_lead_id: null,
    notes: 'Texas City refinery smoke — extensive contamination across entire structure.',
    district_id: 'texas-city',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
}

type Job = {
  id: string
  address_street: string
  address_city: string
  address_zip?: string
  homeowner_name: string
  homeowner_phone?: string
  homeowner_email?: string
  insurance_carrier?: string
  claim_number?: string
  adjuster_name?: string
  adjuster_phone?: string
  date_of_loss?: string
  cause_of_loss?: string
  current_stage: number
  stage_data: Record<string, unknown>
  carrier_approval?: number | null
  amount_collected?: number | null
  crew_lead_id?: string | null
  notes?: string
  district_id: string
  created_at: string
}

function daysAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
}

function fmtMoney(n: number | null | undefined): string {
  if (!n) return '$0'
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
              JOB DETAIL
            </div>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, padding: '12px 10px' }}>
        <div style={{ fontSize: '10px', fontWeight: '700', color: C.muted, letterSpacing: '0.1em', padding: '0 4px', marginBottom: '6px' }}>MENU</div>
        {menuItems.map(item => (
          <div key={item.label} style={{ marginBottom: '2px' }}>
            <NavItem icon={item.icon} label={item.label} active={item.label === 'Jobs'} onClick={() => handleNav(item.href, item.label)} />
          </div>
        ))}
        <div style={{ height: '1px', background: C.border, margin: '12px 0' }} />
        <div style={{ fontSize: '10px', fontWeight: '700', color: C.muted, letterSpacing: '0.1em', padding: '0 4px', marginBottom: '6px' }}>ADMIN</div>
        {adminItems.map(item => (
          <div key={item.label} style={{ marginBottom: '2px' }}>
            <NavItem icon={item.icon} label={item.label} active={false} onClick={() => handleNav(item.href, item.label)} />
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

// ─── Stage Stepper ──────────────────────────────────────────────────────────
function StageStepper({ currentStage }: { currentStage: number }) {
  return (
    <div style={{ overflowX: 'auto', paddingBottom: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', minWidth: 'max-content', gap: '0' }}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((stage, idx) => {
          const done = stage < currentStage
          const active = stage === currentStage

          return (
            <div key={stage} style={{ display: 'flex', alignItems: 'center' }}>
              {/* Connector */}
              {idx > 0 && (
                <div style={{
                  width: '28px', height: '2px',
                  background: done ? C.success : C.border,
                  transition: 'background 0.3s',
                }} />
              )}

              {/* Stage dot */}
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
              }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: done ? C.success : active ? C.accent : C.border,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: '800', color: done || active ? 'white' : C.muted,
                  border: active ? `2px solid ${C.accent}` : 'none',
                  boxShadow: active ? `0 0 0 4px rgba(249,115,22,0.15)` : 'none',
                  transition: 'all 0.3s',
                  flexShrink: 0,
                }}>
                  {done ? '✓' : stage}
                </div>
                <div style={{
                  fontSize: '10px', fontWeight: active ? '700' : '400',
                  color: done ? C.success : active ? C.accent : C.muted,
                  whiteSpace: 'nowrap', maxWidth: '70px', textAlign: 'center', lineHeight: '1.3',
                }}>
                  {STAGE_NAMES[stage]}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Checklist ──────────────────────────────────────────────────────────────
function StageChecklist({
  stage,
  jobId,
  homeownerEmail,
  checkedItems,
  onToggle,
  onAdvanceStage,
}: {
  stage: number
  jobId: string
  homeownerEmail?: string
  checkedItems: Set<string>
  onToggle: (id: string) => void
  onAdvanceStage: () => void
}) {
  const items = STAGE_CHECKLISTS[stage] || []
  const allChecked = items.length > 0 && items.every(i => checkedItems.has(i.id))

  return (
    <div>
      <div style={{ fontSize: '14px', fontWeight: '700', color: C.text, marginBottom: '14px' }}>
        Stage {stage} Checklist — {STAGE_NAMES[stage]}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {items.map(item => {
          const checked = checkedItems.has(item.id)
          return (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px',
              padding: '10px 12px', borderRadius: '8px',
              background: checked ? 'rgba(34,197,94,0.05)' : C.bg,
              border: `1px solid ${checked ? 'rgba(34,197,94,0.2)' : C.border}`,
              transition: 'all 0.15s',
            }}>
              {/* Checkbox */}
              <button
                onClick={() => onToggle(item.id)}
                style={{
                  width: '20px', height: '20px', borderRadius: '5px', flexShrink: 0,
                  background: checked ? C.success : 'transparent',
                  border: `2px solid ${checked ? C.success : C.border}`,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: '1px',
                }}
              >
                {checked && <span style={{ color: 'white', fontSize: '12px', fontWeight: '800' }}>✓</span>}
              </button>

              {/* Label + extras */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '13px',
                  color: checked ? C.muted : C.text,
                  textDecoration: checked ? 'line-through' : 'none',
                  lineHeight: '1.4',
                }}>
                  {item.label}
                </div>

                {/* DocuSign buttons */}
                {item.docusign && (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => alert(`DocuSign link would be emailed to ${homeownerEmail || '[homeowner email]'}`)}
                      style={{
                        padding: '4px 10px', borderRadius: '6px', border: `1px solid rgba(59,130,246,0.3)`,
                        background: 'rgba(59,130,246,0.08)', color: '#60a5fa',
                        fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                      }}
                    >
                      📄 Email DocuSign
                    </button>
                    <button
                      onClick={() => alert('In-app signing would open here (DocuSign embed)')}
                      style={{
                        padding: '4px 10px', borderRadius: '6px', border: `1px solid rgba(139,92,246,0.3)`,
                        background: 'rgba(139,92,246,0.08)', color: '#a78bfa',
                        fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                      }}
                    >
                      ✍️ Sign in App
                    </button>
                  </div>
                )}

                {/* Upload button */}
                {item.upload && (
                  <div style={{ marginTop: '6px' }}>
                    <button
                      onClick={() => alert('Photo upload would open here (Supabase Storage)')}
                      style={{
                        padding: '4px 10px', borderRadius: '6px', border: `1px solid rgba(249,115,22,0.3)`,
                        background: 'rgba(249,115,22,0.08)', color: C.accent,
                        fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                      }}
                    >
                      📷 Upload Photos
                    </button>
                  </div>
                )}

                {/* Dropdown */}
                {item.dropdown && (
                  <div style={{ marginTop: '6px' }}>
                    <select
                      style={{
                        padding: '4px 8px', borderRadius: '6px',
                        background: C.surface, border: `1px solid ${C.border}`,
                        color: C.text, fontSize: '11px', cursor: 'pointer',
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>Select…</option>
                      {item.dropdown.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Progress */}
      <div style={{ marginTop: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', color: C.muted }}>
            {[...checkedItems].filter(id => items.some(i => i.id === id)).length} / {items.length} complete
          </span>
          <span style={{ fontSize: '11px', color: C.muted }}>
            {Math.round(([...checkedItems].filter(id => items.some(i => i.id === id)).length / Math.max(items.length, 1)) * 100)}%
          </span>
        </div>
        <div style={{ height: '4px', background: C.border, borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: '99px',
            background: allChecked ? C.success : C.accent,
            width: `${([...checkedItems].filter(id => items.some(i => i.id === id)).length / Math.max(items.length, 1)) * 100}%`,
            transition: 'width 0.3s',
          }} />
        </div>
      </div>

      {/* Advance stage button */}
      {allChecked && stage < 8 && (
        <button
          onClick={onAdvanceStage}
          style={{
            marginTop: '16px',
            width: '100%', padding: '13px',
            background: `linear-gradient(135deg, ${C.success}, #16a34a)`,
            border: 'none', borderRadius: '10px', color: 'white',
            fontSize: '14px', fontWeight: '700', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
        >
          ✅ Stage {stage} Complete — Advance to Stage {stage + 1}: {STAGE_NAMES[stage + 1]}
        </button>
      )}
      {allChecked && stage === 8 && (
        <div style={{
          marginTop: '16px', padding: '14px', borderRadius: '10px',
          background: 'rgba(34,197,94,0.1)', border: `1px solid rgba(34,197,94,0.3)`,
          color: C.success, fontSize: '14px', fontWeight: '700', textAlign: 'center',
        }}>
          🎉 Job Complete — All stages finished!
        </div>
      )}
    </div>
  )
}

// ─── Info Row ────────────────────────────────────────────────────────────────
function InfoRow({ label, value, editable, onSave }: {
  label: string; value: string | null | undefined
  editable?: boolean; onSave?: (v: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')

  const handleSave = () => {
    onSave?.(draft)
    setEditing(false)
  }

  return (
    <div style={{ display: 'flex', gap: '8px', padding: '7px 0', borderBottom: `1px solid ${C.border}`, alignItems: 'flex-start' }}>
      <div style={{ fontSize: '12px', color: C.muted, minWidth: '130px', paddingTop: '1px' }}>{label}</div>
      <div style={{ flex: 1, fontSize: '13px', color: C.text }}>
        {editing ? (
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              style={{ flex: 1, padding: '4px 8px', background: C.bg, border: `1px solid ${C.accent}`, borderRadius: '6px', color: C.text, fontSize: '12px' }}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
            />
            <button onClick={handleSave} style={{ padding: '4px 10px', background: C.success, border: 'none', borderRadius: '6px', color: 'white', fontSize: '11px', cursor: 'pointer' }}>Save</button>
            <button onClick={() => setEditing(false)} style={{ padding: '4px 8px', background: 'none', border: `1px solid ${C.border}`, borderRadius: '6px', color: C.muted, fontSize: '11px', cursor: 'pointer' }}>✕</button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: value ? C.text : C.muted }}>{value || '—'}</span>
            {editable && (
              <button onClick={() => { setDraft(value || ''); setEditing(true) }} style={{
                padding: '2px 6px', background: 'none', border: `1px solid ${C.border}`,
                borderRadius: '4px', color: C.muted, fontSize: '10px', cursor: 'pointer',
              }}>✏️</button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function JobDetailPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string

  const [loading, setLoading] = useState(true)
  const [job, setJob] = useState<Job | null>(null)
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const [notes, setNotes] = useState('')
  const [notesSaved, setNotesSaved] = useState(false)
  const [claimNumber, setClaimNumber] = useState('')
  const [carrierApproval, setCarrierApproval] = useState<string>('')
  const [amountCollected, setAmountCollected] = useState<string>('')

  const loadJob = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Try Supabase first
    try {
      const { data, error } = await supabase.from('jobs').select('*').eq('id', jobId).single()
      if (!error && data) {
        setJob(data)
        setNotes(data.notes || '')
        setClaimNumber(data.claim_number || '')
        setCarrierApproval(data.carrier_approval?.toString() || '')
        setAmountCollected(data.amount_collected?.toString() || '')
        // Restore checked items from stage_data
        const stageChecked = (data.stage_data as Record<string, string[]>)?.checked_items || []
        setCheckedItems(new Set(stageChecked))
        setLoading(false)
        return
      }
    } catch { /* fall through */ }

    // Fall back to mock
    const mockJob = MOCK_JOBS[jobId]
    if (mockJob) {
      setJob(mockJob)
      setNotes(mockJob.notes || '')
      setClaimNumber(mockJob.claim_number || '')
      setCarrierApproval(mockJob.carrier_approval?.toString() || '')
      setAmountCollected(mockJob.amount_collected?.toString() || '')
    } else {
      // Unknown job — show first mock
      const fallback = MOCK_JOBS['mock-1']
      setJob({ ...fallback, id: jobId })
      setNotes(fallback.notes || '')
      setClaimNumber(fallback.claim_number || '')
      setCarrierApproval(fallback.carrier_approval?.toString() || '')
      setAmountCollected(fallback.amount_collected?.toString() || '')
    }
    setLoading(false)
  }, [jobId, router])

  useEffect(() => { loadJob() }, [loadJob])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const toggleItem = (itemId: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  const handleAdvanceStage = () => {
    if (!job) return
    const confirmed = window.confirm(
      `Advance job from Stage ${job.current_stage} (${STAGE_NAMES[job.current_stage]}) to Stage ${job.current_stage + 1} (${STAGE_NAMES[job.current_stage + 1]})?`
    )
    if (!confirmed) return

    const nextStage = job.current_stage + 1
    setJob(j => j ? { ...j, current_stage: nextStage } : j)
    setCheckedItems(new Set()) // Reset checklist for new stage

    // Persist to Supabase if possible
    supabase.from('jobs').update({
      current_stage: nextStage,
      stage_data: { checked_items: [] },
      updated_at: new Date().toISOString(),
    }).eq('id', jobId).then(({ error }) => {
      if (error) console.warn('Stage advance not persisted:', error.message)
    })
  }

  const handleSaveNotes = () => {
    supabase.from('jobs').update({ notes, updated_at: new Date().toISOString() }).eq('id', jobId).then(() => {
      setNotesSaved(true)
      setTimeout(() => setNotesSaved(false), 2000)
    })
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 2000)
  }

  const handleSaveField = async (field: string, value: string) => {
    if (!job) return
    const update: Record<string, unknown> = { [field]: value, updated_at: new Date().toISOString() }
    setJob(j => j ? { ...j, [field]: value } : j)
    await supabase.from('jobs').update(update).eq('id', jobId)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
        <span style={{ fontSize: '32px' }}>🔥</span>
        <span style={{ color: C.muted, fontSize: '14px' }}>Loading job…</span>
      </div>
    </div>
  )

  if (!job) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
      Job not found
    </div>
  )

  const outstanding = (parseFloat(carrierApproval) || 0) - (parseFloat(amountCollected) || 0)
  const days = daysAgo(job.created_at)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <Sidebar onSignOut={handleSignOut} />

      <div style={{ marginLeft: '220px', flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar */}
        <div style={{
          height: '56px', background: '#0c0e14', borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '0 28px', position: 'sticky', top: 0, zIndex: 10, flexWrap: 'wrap',
        }}>
          <button onClick={() => router.push('/jobs')} style={{
            background: 'none', border: 'none', color: C.muted, cursor: 'pointer',
            fontSize: '13px', padding: '4px 8px', borderRadius: '6px',
          }}>
            ← Jobs
          </button>
          <span style={{ color: C.border }}>/</span>
          <span style={{ fontSize: '13px', color: C.text, fontWeight: '600' }}>
            {job.address_street}, {job.address_city}
          </span>
          <div style={{
            marginLeft: '6px',
            padding: '2px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: '700',
            background: 'rgba(249,115,22,0.15)', color: C.accent, border: '1px solid rgba(249,115,22,0.3)',
          }}>
            Stage {job.current_stage} · {STAGE_NAMES[job.current_stage]}
          </div>
        </div>

        {/* Two-column layout */}
        <div style={{ flex: 1, padding: '24px', display: 'flex', gap: '20px', alignItems: 'flex-start', overflowY: 'auto' }}>

          {/* ── LEFT COLUMN (60%) ── */}
          <div style={{ flex: '0 0 60%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Stage Stepper */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '22px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: C.muted, marginBottom: '16px', letterSpacing: '0.06em' }}>
                JOB PROGRESS
              </div>
              <StageStepper currentStage={job.current_stage} />
            </div>

            {/* Active Stage Checklist */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '22px' }}>
              <StageChecklist
                stage={job.current_stage}
                jobId={job.id}
                homeownerEmail={job.homeowner_email}
                checkedItems={checkedItems}
                onToggle={toggleItem}
                onAdvanceStage={handleAdvanceStage}
              />
            </div>

          </div>

          {/* ── RIGHT COLUMN (40%) ── */}
          <div style={{ flex: '0 0 calc(40% - 20px)', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Job Info Card */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: C.muted, marginBottom: '12px', letterSpacing: '0.06em' }}>
                📋 JOB INFO
              </div>
              <InfoRow label="Homeowner" value={job.homeowner_name} />
              <InfoRow label="Phone" value={job.homeowner_phone} />
              <InfoRow label="Email" value={job.homeowner_email} />
              <InfoRow label="Address" value={`${job.address_street}, ${job.address_city}${job.address_zip ? ` ${job.address_zip}` : ''}`} />
              <InfoRow label="Carrier" value={job.insurance_carrier} />
              <InfoRow label="Claim #" value={claimNumber} editable onSave={v => { setClaimNumber(v); handleSaveField('claim_number', v) }} />
              <InfoRow label="Adjuster" value={job.adjuster_name} />
              <InfoRow label="Adjuster Phone" value={job.adjuster_phone} />
              <InfoRow label="Date of Loss" value={job.date_of_loss} />
              <InfoRow label="Cause" value={job.cause_of_loss} />
              <InfoRow label="Stage" value={`${job.current_stage} — ${STAGE_NAMES[job.current_stage]}`} />
              <div style={{ padding: '7px 0', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', color: C.muted, minWidth: '130px' }}>Days on Job</div>
                <div style={{ fontSize: '13px', color: C.text }}>{days} day{days !== 1 ? 's' : ''}</div>
              </div>
            </div>

            {/* Financials Card */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: C.muted, marginBottom: '12px', letterSpacing: '0.06em' }}>
                💰 FINANCIALS
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: C.muted, marginBottom: '4px' }}>Carrier Approval Amount</div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ color: C.muted, fontSize: '13px' }}>$</span>
                    <input
                      type="number"
                      value={carrierApproval}
                      onChange={e => setCarrierApproval(e.target.value)}
                      onBlur={() => handleSaveField('carrier_approval', carrierApproval)}
                      placeholder="0.00"
                      style={{
                        flex: 1, padding: '8px 10px', background: C.bg, border: `1px solid ${C.border}`,
                        borderRadius: '7px', color: C.text, fontSize: '14px', fontWeight: '700',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: C.muted, marginBottom: '4px' }}>Amount Collected</div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ color: C.muted, fontSize: '13px' }}>$</span>
                    <input
                      type="number"
                      value={amountCollected}
                      onChange={e => setAmountCollected(e.target.value)}
                      onBlur={() => handleSaveField('amount_collected', amountCollected)}
                      placeholder="0.00"
                      style={{
                        flex: 1, padding: '8px 10px', background: C.bg, border: `1px solid ${C.border}`,
                        borderRadius: '7px', color: C.text, fontSize: '14px', fontWeight: '700',
                      }}
                    />
                  </div>
                </div>

                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', borderRadius: '8px',
                  background: outstanding > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
                  border: `1px solid ${outstanding > 0 ? 'rgba(239,68,68,0.25)' : 'rgba(34,197,94,0.25)'}`,
                }}>
                  <div style={{ fontSize: '12px', color: C.muted }}>Outstanding Balance</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: outstanding > 0 ? C.danger : C.success }}>
                    {outstanding > 0 ? `-${fmtMoney(outstanding)}` : '✓ Paid'}
                  </div>
                </div>
              </div>
            </div>

            {/* Crew Card */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: C.muted, marginBottom: '12px', letterSpacing: '0.06em' }}>
                👥 CREW
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: C.muted, marginBottom: '4px' }}>Crew Lead</div>
                  <div style={{ padding: '8px 10px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: '7px', fontSize: '13px', color: job.crew_lead_id ? C.text : C.muted }}>
                    {job.crew_lead_id || 'Not assigned'}
                  </div>
                </div>
                <button
                  onClick={() => alert('Crew assignment coming soon — will pull from crew/users table')}
                  style={{
                    padding: '8px 12px', background: 'none',
                    border: `1px dashed ${C.border}`, borderRadius: '7px',
                    color: C.muted, fontSize: '12px', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  + Assign Crew Lead
                </button>
              </div>
            </div>

            {/* Notes Card */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: C.muted, letterSpacing: '0.06em' }}>
                  📝 NOTES
                </div>
                {notesSaved && (
                  <span style={{ fontSize: '11px', color: C.success }}>✓ Saved</span>
                )}
              </div>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                onBlur={handleSaveNotes}
                placeholder="Add notes about this job…"
                rows={5}
                style={{
                  width: '100%', padding: '10px 12px',
                  background: C.bg, border: `1px solid ${C.border}`,
                  borderRadius: '8px', color: C.text, fontSize: '13px',
                  lineHeight: '1.6', resize: 'vertical', boxSizing: 'border-box',
                }}
              />
              <button onClick={handleSaveNotes} style={{
                marginTop: '8px', padding: '8px 16px',
                background: 'rgba(249,115,22,0.1)', border: `1px solid rgba(249,115,22,0.25)`,
                borderRadius: '7px', color: C.accent, fontSize: '12px', fontWeight: '600', cursor: 'pointer',
              }}>
                Save Notes
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
