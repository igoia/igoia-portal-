import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Client, Automation, ActivityEvent } from '../types'
import { AUTOMATION_ICON, AUTOMATION_LABEL, ACTIVITY_ICON } from '../types'

interface Props { client: Client }

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'hace un momento'
  if (m < 60) return `hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h}h`
  return `hace ${Math.floor(h / 24)}d`
}

export default function DashboardView({ client }: Props) {
  const [automations, setAutomations] = useState<Automation[]>([])
  const [activity,    setActivity]    = useState<ActivityEvent[]>([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    async function load() {
      const [autoRes, actRes] = await Promise.all([
        supabase.from('automations').select('*').eq('client_id', client.id).order('created_at'),
        supabase.from('activity').select('*').eq('client_id', client.id)
          .order('created_at', { ascending: false }).limit(10),
      ])
      setAutomations((autoRes.data as Automation[]) ?? [])
      setActivity((actRes.data as ActivityEvent[]) ?? [])
      setLoading(false)
    }
    load()
  }, [client.id])

  const active    = automations.filter(a => a.status === 'active')
  const withError = automations.filter(a => a.status === 'error')

  return (
    <>
      <div className="page-header">
        <h2>Hola, {client.business_name} 👋</h2>
        <p>Aquí tienes el resumen de tu cuenta IGoIA</p>
      </div>

      {/* Stats */}
      <div className="cards-grid">
        <div className="stat-card">
          <div className="stat-label"><span>⚡</span> Automatizaciones activas</div>
          <div className="stat-value green">{loading ? '—' : active.length}</div>
          <div className="stat-sub">de {automations.length} configuradas</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><span>🔄</span> Ejecuciones totales</div>
          <div className="stat-value cyan">
            {loading ? '—' : automations.reduce((s, a) => s + a.runs_count, 0).toLocaleString('es-CL')}
          </div>
          <div className="stat-sub">desde que comenzaste</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><span>⚠️</span> Con errores</div>
          <div className="stat-value" style={{ color: withError.length > 0 ? 'var(--red)' : 'var(--muted)' }}>
            {loading ? '—' : withError.length}
          </div>
          <div className="stat-sub">{withError.length > 0 ? 'requieren atención' : 'todo funcionando'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><span>📋</span> Eventos recientes</div>
          <div className="stat-value">{loading ? '—' : activity.length}</div>
          <div className="stat-sub">en las últimas horas</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Automatizaciones activas */}
        <div className="section-card">
          <div className="section-head">
            <div>
              <h3>Automatizaciones activas</h3>
              <p>{active.length} corriendo ahora</p>
            </div>
          </div>
          <div className="automations-list">
            {loading ? (
              <div style={{ padding: '32px 24px', color: 'var(--muted)', fontSize: '0.875rem' }}>Cargando…</div>
            ) : active.length === 0 ? (
              <div style={{ padding: '32px 24px', color: 'var(--muted)', fontSize: '0.875rem', textAlign: 'center' }}>
                Sin automatizaciones activas aún
              </div>
            ) : active.map(a => (
              <div className="automation-row" key={a.id}>
                <div className="auto-icon">{AUTOMATION_ICON[a.type]}</div>
                <div className="auto-info">
                  <div className="auto-name">{a.name}</div>
                  <div className="auto-meta">{AUTOMATION_LABEL[a.type]}</div>
                </div>
                <div className="auto-stats">
                  <span className="badge badge-active">activa</span>
                  <span className="auto-runs">{a.runs_count.toLocaleString('es-CL')} runs</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actividad reciente */}
        <div className="section-card">
          <div className="section-head">
            <div>
              <h3>Actividad reciente</h3>
              <p>Últimos eventos del sistema</p>
            </div>
          </div>
          <div className="activity-feed">
            {loading ? (
              <div style={{ padding: '32px 24px', color: 'var(--muted)', fontSize: '0.875rem' }}>Cargando…</div>
            ) : activity.length === 0 ? (
              <div style={{ padding: '32px 24px', color: 'var(--muted)', fontSize: '0.875rem', textAlign: 'center' }}>
                Sin actividad registrada aún
              </div>
            ) : activity.map(ev => (
              <div className="activity-item" key={ev.id}>
                <div className="activity-emoji">{ACTIVITY_ICON[ev.type] ?? '📌'}</div>
                <div className="activity-text">
                  <div className="activity-desc">{ev.description ?? ev.type}</div>
                  <div className="activity-time">{timeAgo(ev.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
