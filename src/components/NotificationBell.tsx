'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Notif = { id: string; message: string; ts: string; read: boolean; type: 'job' | 'payment' | 'stage' | 'crew' }

export default function NotificationBell() {
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [open, setOpen] = useState(false)

  const unread = notifs.filter(n => !n.read).length

  useEffect(() => {
    // Subscribe to job changes via Supabase realtime
    const channel = supabase.channel('job-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'jobs' }, payload => {
        const job = payload.new as any
        const old = payload.old as any
        let message = ''
        let type: Notif['type'] = 'job'

        if (old.status !== job.status) {
          message = `${job.job_number} moved to ${job.status.replace(/_/g, ' ')}`
          type = 'stage'
        } else if (old.amount_collected !== job.amount_collected) {
          message = `Payment logged on ${job.job_number}: $${(job.amount_collected ?? 0).toLocaleString()}`
          type = 'payment'
        } else if (JSON.stringify(old.assigned_crew) !== JSON.stringify(job.assigned_crew)) {
          message = `Crew updated on ${job.job_number}`
          type = 'crew'
        }

        if (message) {
          const n: Notif = { id: Date.now().toString(), message, ts: new Date().toLocaleTimeString(), read: false, type }
          setNotifs(prev => [n, ...prev].slice(0, 20))
          // Browser notification if permission granted
          if (Notification.permission === 'granted') {
            new Notification('Smoke Command', { body: message, icon: '/icon-192.png' })
          }
        }
      })
      .subscribe()

    // Request permission on mount
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    return () => { supabase.removeChannel(channel) }
  }, [])

  const markRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  const typeIcon = (t: Notif['type']) => ({ job: '📋', payment: '💰', stage: '🔄', crew: '👥' }[t])

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => { setOpen(!open); if (!open) markRead() }}
        style={{ position: 'relative', background: 'none', border: '1px solid #2a2d35', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
        🔔
        {unread > 0 && (
          <div style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, background: '#ef4444', borderRadius: '50%', fontSize: 9, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {unread > 9 ? '9+' : unread}
          </div>
        )}
      </button>

      {open && (
        <div style={{ position: 'absolute', top: 44, right: 0, width: 320, background: '#1a1d24', border: '1px solid #2a2d35', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 100, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #2a2d35', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f4f4f5' }}>Notifications</div>
            {notifs.length > 0 && <button onClick={() => setNotifs([])} style={{ background: 'none', border: 'none', color: '#71717a', fontSize: 12, cursor: 'pointer' }}>Clear all</button>}
          </div>
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {notifs.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: '#71717a', fontSize: 13 }}>No notifications yet.<br />Updates appear in real-time.</div>
            ) : (
              notifs.map(n => (
                <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid #2a2d35', background: n.read ? 'transparent' : 'rgba(249,115,22,0.05)' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 16 }}>{typeIcon(n.type)}</span>
                    <div>
                      <div style={{ fontSize: 13, color: '#f4f4f5', lineHeight: 1.4 }}>{n.message}</div>
                      <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>{n.ts}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
