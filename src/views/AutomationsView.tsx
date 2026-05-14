import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Client, Automation } from '../types'
import { AUTOMATION_ICON, AUTOMATION_LABEL } from '../types'

interface Props { client: Client }

const STATUS_LABEL: Record<string, string> = {
  active:      'Activa',
  paused:      'Pausada',
  error:       'Error',
  configuring: 'Configurando',
}

function fmtDate(iso: string | null) {
  if (!iso) return 'nunca'
  return new Date(iso).toLocaleString('es-CL', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export default function AutomationsView({ client }: Props) {
  const [automations, setAutomations] = useState<Automation[]>([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    supabase
      .from('automations')
      .select('*')
      .eq('client_id', client.id)
      .order('created_at')
      .then(({ data }) => {
        setAutomations((data as Automation[]) ?? [])
        setLoading(false)
      })
  }, [client.id])

  return (
    <>
      <div className="page-header">
        <h2>Automatizaciones</h2>
        <p>Todos los flujos configurados en tu cuenta</p>
      </div>

      <div className="section-card">
        <div className="section-head">
          <div>
            <h3>Flujos activos</h3>
            <p>{loading ? '…' : `${automations.length} automatización${automations.length !== 1 ? 'es' : ''}`}</p>
          </div>
        </div>

        <div className="automations-list">
          {loading ? (
            <div style={{ padding: '48px 24px', color: 'var(--muted)', fontSize: '0.875rem', textAlign: 'center' }}>
              Cargando…
            </div>
          ) : automations.length === 0 ? (
            <div style={{ padding: '56px 24px', color: 'var(--muted)', fontSize: '0.9375rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>⚡</div>
              No tienes automatizaciones configuradas aún.<br />
              <span style={{ fontSize: '0.875rem' }}>Contacta a tu asesor IGoIA para activar tus flujos.</span>
            </div>
          ) : automations.map(a => (
            <div className="automation-row" key={a.id} style={{ alignItems: 'flex-start', padding: '20px 24px' }}>
              <div className="auto-icon" style={{ marginTop: 2 }}>{AUTOMATION_ICON[a.type]}</div>

              <div className="auto-info">
                <div className="auto-name">{a.name}</div>
                <div className="auto-meta">{AUTOMATION_LABEL[a.type]}</div>
                {a.description && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginTop: 6, lineHeight: 1.5 }}>
                    {a.description}
                  </div>
                )}
                {a.status === 'error' && a.error_message && (
                  <div style={{
                    marginTop: 8, padding: '8px 12px',
                    background: 'rgba(255,83,112,0.08)',
                    border: '1px solid rgba(255,83,112,0.2)',
                    borderRadius: 6, fontSize: '0.8125rem', color: 'var(--red)',
                  }}>
                    ⚠️ {a.error_message}
                  </div>
                )}
              </div>

              <div className="auto-stats" style={{ marginTop: 2, minWidth: 140, alignItems: 'flex-end' }}>
                <span className={`badge badge-${a.status}`}>{STATUS_LABEL[a.status]}</span>
                <div style={{ marginTop: 8 }}>
                  <div className="auto-runs" style={{ textAlign: 'right' }}>
                    {a.runs_count.toLocaleString('es-CL')} ejecuciones
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 2, textAlign: 'right' }}>
                    Última: {fmtDate(a.last_run_at)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info box */}
      <div style={{
        padding: '20px 24px',
        background: 'rgba(0,200,240,0.04)',
        border: '1px solid rgba(0,200,240,0.12)',
        borderRadius: 12, fontSize: '0.875rem', color: 'var(--muted)',
        display: 'flex', gap: 14, alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>💬</span>
        <div>
          <strong style={{ color: 'var(--text)' }}>¿Necesitas agregar o modificar un flujo?</strong><br />
          Escríbenos a{' '}
          <a href="mailto:hola@igoia.cl" style={{ color: 'var(--cyan)' }}>hola@igoia.cl</a>
          {' '}o por WhatsApp y lo configuramos en menos de 24h.
        </div>
      </div>
    </>
  )
}
