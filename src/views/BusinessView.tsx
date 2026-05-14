import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import type { Client } from '../types'
import { PLAN_LABEL } from '../types'

interface Props {
  client:   Client
  onUpdate: (c: Client) => void
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function BusinessView({ client, onUpdate }: Props) {
  const [form, setForm] = useState({
    business_name: client.business_name,
    email:         client.email,
    phone:         client.phone         ?? '',
    rut:           client.rut           ?? '',
    address:       client.address       ?? '',
    comuna:        client.comuna        ?? '',
    ciudad:        client.ciudad        ?? '',
  })
  const [saving,   setSaving]   = useState(false)
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setFeedback(null)
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFeedback(null)

    const payload = {
      business_name: form.business_name.trim(),
      email:         form.email.trim(),
      phone:         form.phone.trim()   || null,
      rut:           form.rut.trim()     || null,
      address:       form.address.trim() || null,
      comuna:        form.comuna.trim()  || null,
      ciudad:        form.ciudad.trim()  || null,
    }

    const { data, error } = await supabase
      .from('clients')
      .update(payload)
      .eq('id', client.id)
      .select()
      .single()

    if (error) {
      setFeedback({ ok: false, msg: error.message })
    } else {
      onUpdate(data as Client)
      setFeedback({ ok: true, msg: '✓ Datos guardados correctamente.' })
    }
    setSaving(false)
  }

  return (
    <>
      <div className="page-header">
        <h2>Mi Negocio</h2>
        <p>Información de tu empresa en IGoIA</p>
      </div>

      {/* Plan info */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
      }}>
        {[
          { label: 'Plan actual',   value: PLAN_LABEL[client.plan],  color: 'var(--green)' },
          { label: 'Estado',        value: client.status === 'active' ? 'Activo' : client.status, color: 'var(--cyan)' },
          { label: 'Cliente desde', value: fmtDate(client.created_at), color: '' },
        ].map(c => (
          <div key={c.label} className="stat-card">
            <div className="stat-label">{c.label}</div>
            <div className="stat-value" style={{ fontSize: '1.25rem', color: c.color || 'var(--text)' }}>
              {c.value}
            </div>
          </div>
        ))}
      </div>

      {/* Edit form */}
      <div className="section-card">
        <div className="section-head">
          <div>
            <h3>Datos del negocio</h3>
            <p>Esta información se usa en cotizaciones y facturas</p>
          </div>
        </div>

        <form className="business-form" onSubmit={handleSave}>
          {feedback && (
            <div className={`save-feedback ${feedback.ok ? 'ok' : 'err'}`}>
              {feedback.msg}
            </div>
          )}

          {/* Identificación */}
          <div>
            <div className="form-section-title">Identificación</div>
            <div className="form-grid" style={{ marginTop: 12 }}>
              <div className="field">
                <label>Nombre empresa *</label>
                <input name="business_name" value={form.business_name}
                  onChange={handleChange} required placeholder="Mi Empresa SpA" />
              </div>
              <div className="field">
                <label>RUT empresa</label>
                <input name="rut" value={form.rut}
                  onChange={handleChange} placeholder="12.345.678-9" />
              </div>
            </div>
          </div>

          {/* Contacto */}
          <div>
            <div className="form-section-title">Contacto</div>
            <div className="form-grid" style={{ marginTop: 12 }}>
              <div className="field">
                <label>Email *</label>
                <input name="email" type="email" value={form.email}
                  onChange={handleChange} required placeholder="contacto@miempresa.cl" />
              </div>
              <div className="field">
                <label>Teléfono / WhatsApp</label>
                <input name="phone" value={form.phone}
                  onChange={handleChange} placeholder="+56 9 1234 5678" />
              </div>
            </div>
          </div>

          {/* Dirección */}
          <div>
            <div className="form-section-title">Dirección</div>
            <div className="form-grid" style={{ marginTop: 12 }}>
              <div className="field span2">
                <label>Dirección</label>
                <input name="address" value={form.address}
                  onChange={handleChange} placeholder="Av. Providencia 1234" />
              </div>
              <div className="field">
                <label>Comuna</label>
                <input name="comuna" value={form.comuna}
                  onChange={handleChange} placeholder="Providencia" />
              </div>
              <div className="field">
                <label>Ciudad</label>
                <input name="ciudad" value={form.ciudad}
                  onChange={handleChange} placeholder="Santiago" />
              </div>
            </div>
          </div>

          <div>
            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
