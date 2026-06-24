'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { UserRole } from '@/lib/supabase'

type DistrictStat = {
  id: string
  name: string
  leads_new: number
  leads_in_progress: number
  leads_closed: number
  doors_knocked: number
}

type InviteForm = {
  email: string
  full_name: string
  role: UserRole
  district_id: string
}

const colors = {
  bg: '#0f1117',
  surface: '#1a1d24',
  border: '#2a2d35',
  text: '#f4f4f5',
  muted: '#71717a',
  accent: '#f97316',
  success: '#22c55e',
  warning: '#eab308',
}

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [districts, setDistricts] = useState<DistrictStat[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'districts'>('overview')
  const [inviteForm, setInviteForm] = useState<InviteForm>({
    email: '', full_name: '', role: 'sales_rep', district_id: 'houston-south'
  })
  const [inviteMsg, setInviteMsg] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()

      if (!profile || profile.role !== 'master_admin') {
        router.push('/dashboard'); return
      }

      const { data: districtRows } = await supabase.from('districts').select('*')
      if (districtRows) {
        const stats = await Promise.all(
          districtRows.map(async (d) => {
            const { data: leads } = await supabase
              .from('fire_leads').select('status, doors_knocked').eq('district_id', d.id)
            return {
              id: d.id,
              name: d.name,
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
    <div style={{ minHeight: '100vh', background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: colors.muted, fontSize: '14px' }}>Loading...</span>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${colors.border}`, padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '18px' }}>🔥</span>
          <span style={{ fontSize: '16px', fontWeight: '700', color: colors.accent }}>SMOKE COMMAND</span>
          <span style={{ fontSize: '12px', color: colors.muted, background: colors.border, padding: '2px 8px', borderRadius: '4px' }}>
            Master Admin
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => router.push('/dashboard')}
            style={{ padding: '8px 14px', background: 'none', border: `1px solid ${colors.border}`, borderRadius: '6px', color: colors.muted, cursor: 'pointer', fontSize: '13px' }}>
            ← Dashboard
          </button>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
            style={{ padding: '8px 14px', background: 'none', border: `1px solid ${colors.border}`, borderRadius: '6px', color: colors.muted, cursor: 'pointer', fontSize: '13px' }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: `1px solid ${colors.border}`, padding: '0 32px', display: 'flex' }}>
        {(['overview', 'users', 'districts'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{
              padding: '14px 20px', background: 'none', border: 'none',
              borderBottom: activeTab === tab ? `2px solid ${colors.accent}` : '2px solid transparent',
              color: activeTab === tab ? colors.text : colors.muted,
              cursor: 'pointer', fontSize: '14px', fontWeight: activeTab === tab ? '600' : '400',
              textTransform: 'capitalize',
            }}>
            {tab}
          </button>
        ))}
      </div>

      <div style={{ padding: '32px' }}>
        {activeTab === 'overview' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>All Districts</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {districts.map(d => (
                <div key={d.id} style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '24px' }}>
                  <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>{d.name}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {[
                      { label: 'New', value: d.leads_new, color: colors.warning },
                      { label: 'In Progress', value: d.leads_in_progress, color: colors.accent },
                      { label: 'Closed', value: d.leads_closed, color: colors.success },
                      { label: 'Doors Knocked', value: d.doors_knocked, color: colors.text },
                    ].map(s => (
                      <div key={s.label} style={{ background: colors.bg, borderRadius: '8px', padding: '12px' }}>
                        <div style={{ fontSize: '22px', fontWeight: '800', color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: '12px', color: colors.muted }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {districts.length === 0 && (
                <p style={{ color: colors.muted, fontSize: '14px' }}>No districts yet.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div style={{ maxWidth: '500px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Add User</h2>
            <p style={{ fontSize: '14px', color: colors.muted, marginBottom: '24px' }}>Invite a rep, PM, or district admin.</p>
            <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { key: 'email', label: 'Email', type: 'email', placeholder: 'rep@restoremedicsusa.com' },
                { key: 'full_name', label: 'Full Name', type: 'text', placeholder: 'First Last' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: '13px', color: colors.muted, marginBottom: '6px' }}>{f.label}</label>
                  <input type={f.type} value={inviteForm[f.key as keyof InviteForm]} required placeholder={f.placeholder}
                    onChange={e => setInviteForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '8px', color: colors.text, fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: colors.muted, marginBottom: '6px' }}>Role</label>
                <select value={inviteForm.role} onChange={e => setInviteForm(p => ({ ...p, role: e.target.value as UserRole }))}
                  style={{ width: '100%', padding: '10px 14px', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '8px', color: colors.text, fontSize: '14px' }}>
                  <option value="sales_rep">Sales Rep</option>
                  <option value="pm">Project Manager</option>
                  <option value="district_admin">District Admin</option>
                  <option value="tech">Field Tech</option>
                  <option value="master_admin">Master Admin</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: colors.muted, marginBottom: '6px' }}>District</label>
                <select value={inviteForm.district_id} onChange={e => setInviteForm(p => ({ ...p, district_id: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '8px', color: colors.text, fontSize: '14px' }}>
                  {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <button type="submit"
                style={{ padding: '12px', background: `linear-gradient(135deg, ${colors.accent}, #ef4444)`, border: 'none', borderRadius: '8px', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                Get Invite Instructions
              </button>
            </form>
            {inviteMsg && (
              <div style={{ marginTop: '16px', padding: '14px', background: 'rgba(249,115,22,0.1)', border: `1px solid rgba(249,115,22,0.3)`, borderRadius: '8px', fontSize: '13px', color: colors.accent, whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                {inviteMsg}
              </div>
            )}
          </div>
        )}

        {activeTab === 'districts' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>Districts</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {districts.map(d => (
                <div key={d.id} style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '2px' }}>{d.name}</div>
                    <div style={{ fontSize: '12px', color: colors.muted }}>ID: {d.id}</div>
                  </div>
                  <div style={{ fontSize: '12px', padding: '3px 10px', background: 'rgba(34,197,94,0.15)', color: colors.success, borderRadius: '6px' }}>Active</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
