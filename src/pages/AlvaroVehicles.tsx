import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const BOOSTR_API_KEY = import.meta.env.VITE_BOOSTR_API_KEY

// ── Types ──────────────────────────────────────────────────────────────────
interface Vehicle {
  id: string
  patente: string
  marca: string
  modelo: string
  anio: number
  version?: string
  vin?: string
  combustible?: string
  num_duenos?: number
  soap_vigente?: boolean
  revision_tecnica?: boolean
  kilometraje?: number
  estado_general?: 'excelente' | 'bueno' | 'regular'
  mantencion?: 'concesionario' | 'taller' | 'mixto'
  mantencion_detalle?: string
  precio: number
  precio_negociable: boolean
  fotos?: string[]
  link_publicacion?: string
  status: 'disponible' | 'reservado' | 'vendido'
  destacado: boolean
  created_at: string
}

interface PatenteLookup {
  marca?: string
  modelo?: string
  anio?: number
  vin?: string
  motor?: string
  combustible?: string
  num_duenos?: number
  soap_vigente?: boolean
  revision_tecnica?: boolean
}

// ── Helpers ────────────────────────────────────────────────────────────────
const formatPrice = (n: number) =>
  '$' + n.toLocaleString('es-CL')

const statusColor: Record<string, string> = {
  disponible: '#16a34a',
  reservado:  '#d97706',
  vendido:    '#6b7280',
}

const statusLabel: Record<string, string> = {
  disponible: 'Disponible',
  reservado:  'Reservado',
  vendido:    'Vendido',
}

// ── Empty form ─────────────────────────────────────────────────────────────
const emptyForm = (): Partial<Vehicle> => ({
  patente: '', marca: '', modelo: '', anio: new Date().getFullYear(),
  kilometraje: undefined, estado_general: 'bueno',
  mantencion: 'taller', precio: 0, precio_negociable: false,
  status: 'disponible', destacado: false,
})

// ── Component ──────────────────────────────────────────────────────────────
export default function AlvaroVehicles({ clientId }: { clientId: string }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Partial<Vehicle>>(emptyForm())
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupDone, setLookupDone] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'disponible' | 'vendido' | 'todos'>('disponible')

  useEffect(() => { fetchVehicles() }, [clientId])

  async function fetchVehicles() {
    setLoading(true)
    const { data } = await supabase
      .from('alvaro_vehicles')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
    setVehicles(data || [])
    setLoading(false)
  }

  async function lookupPatente(patente: string) {
    if (!patente || patente.length < 5) return
    setLookupLoading(true)
    try {
      const res = await fetch(`https://api.boostr.cl/car/${patente}.json`, {
        headers: { Authorization: `Bearer ${BOOSTR_API_KEY}` }
      })
      if (!res.ok) throw new Error('No encontrado')
      const data: PatenteLookup = await res.json()
      setForm(prev => ({
        ...prev,
        marca: data.marca || prev.marca,
        modelo: data.modelo || prev.modelo,
        anio: data.anio || prev.anio,
        vin: data.vin || prev.vin,
        combustible: data.combustible || prev.combustible,
        num_duenos: data.num_duenos || prev.num_duenos,
        soap_vigente: data.soap_vigente ?? prev.soap_vigente,
        revision_tecnica: data.revision_tecnica ?? prev.revision_tecnica,
      }))
      setLookupDone(true)
    } catch {
      alert('No se encontró información para esta patente. Ingresa los datos manualmente.')
    } finally {
      setLookupLoading(false)
    }
  }

  async function saveVehicle() {
    if (!form.marca || !form.modelo || !form.precio) {
      alert('Completa al menos marca, modelo y precio')
      return
    }
    setSaving(true)
    const payload = { ...form, client_id: clientId }
    if (form.id) {
      await supabase.from('alvaro_vehicles').update(payload).eq('id', form.id)
    } else {
      await supabase.from('alvaro_vehicles').insert(payload)
    }
    setSaving(false)
    setShowForm(false)
    setForm(emptyForm())
    setLookupDone(false)
    fetchVehicles()
  }

  async function markSold(id: string) {
    if (!confirm('¿Marcar este auto como vendido?')) return
    await supabase.from('alvaro_vehicles')
      .update({ status: 'vendido', fecha_venta: new Date().toISOString() })
      .eq('id', id)
    fetchVehicles()
  }

  async function deleteVehicle(id: string) {
    if (!confirm('¿Eliminar este auto del catálogo?')) return
    await supabase.from('alvaro_vehicles').delete().eq('id', id)
    fetchVehicles()
  }

  const filtered = vehicles.filter(v =>
    activeTab === 'todos' ? true : v.status === activeTab
  )

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Mi catálogo</h1>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>
            {vehicles.filter(v => v.status === 'disponible').length} disponibles · {vehicles.filter(v => v.status === 'vendido').length} vendidos
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setForm(emptyForm()); setLookupDone(false) }}
          style={{ background: '#111', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, cursor: 'pointer', fontWeight: 500 }}
        >
          + Agregar auto
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #e5e7eb', marginBottom: '1.25rem' }}>
        {(['disponible', 'vendido', 'todos'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            padding: '8px 16px', fontSize: 13, cursor: 'pointer', background: 'none',
            border: 'none', borderBottom: activeTab === t ? '2px solid #111' : '2px solid transparent',
            color: activeTab === t ? '#111' : '#6b7280', fontWeight: activeTab === t ? 500 : 400,
            textTransform: 'capitalize'
          }}>
            {t === 'disponible' ? 'Disponibles' : t === 'vendido' ? 'Vendidos' : 'Todos'}
          </button>
        ))}
      </div>

      {/* Vehicle list */}
      {loading ? (
        <p style={{ color: '#6b7280', fontSize: 14 }}>Cargando...</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#6b7280' }}>
          <p style={{ fontSize: 15 }}>No hay autos en esta sección</p>
          <p style={{ fontSize: 13 }}>Agrega tu primer auto con el botón de arriba</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(v => (
            <div key={v.id} style={{
              background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: 12,
              padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{v.marca} {v.modelo} {v.anio}</span>
                  {v.patente && <span style={{ fontSize: 11, color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: 20 }}>{v.patente}</span>}
                  <span style={{ fontSize: 11, fontWeight: 500, color: statusColor[v.status], background: statusColor[v.status] + '18', padding: '2px 8px', borderRadius: 20 }}>
                    {statusLabel[v.status]}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#6b7280' }}>
                  {v.kilometraje && <span>🏁 {v.kilometraje.toLocaleString()} km</span>}
                  {v.num_duenos && <span>👤 {v.num_duenos} dueño{v.num_duenos !== 1 ? 's' : ''}</span>}
                  {v.mantencion && <span>🔧 {v.mantencion}</span>}
                  {v.estado_general && <span>Estado: {v.estado_general}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: '#111' }}>{formatPrice(v.precio)}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setForm(v); setShowForm(true); setLookupDone(true) }}
                    style={{ fontSize: 12, padding: '6px 12px', border: '0.5px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>
                    Editar
                  </button>
                  {v.status === 'disponible' && (
                    <button onClick={() => markSold(v.id)}
                      style={{ fontSize: 12, padding: '6px 12px', border: '0.5px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: 'pointer', color: '#16a34a' }}>
                      Vendido ✓
                    </button>
                  )}
                  <button onClick={() => deleteVehicle(v.id)}
                    style={{ fontSize: 12, padding: '6px 12px', border: '0.5px solid #fca5a5', borderRadius: 6, background: '#fff', cursor: 'pointer', color: '#dc2626' }}>
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: '1.25rem' }}>
              {form.id ? 'Editar auto' : 'Agregar auto'}
            </h2>

            {/* Patente lookup */}
            {!form.id && (
              <div style={{ marginBottom: '1.25rem', padding: '1rem', background: '#f0fdf4', borderRadius: 10, border: '0.5px solid #bbf7d0' }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#166534', display: 'block', marginBottom: 6 }}>
                  🔍 Buscar ficha técnica por patente
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    placeholder="Ej: ABCD12"
                    value={form.patente || ''}
                    onChange={e => setForm(p => ({ ...p, patente: e.target.value.toUpperCase() }))}
                    style={{ flex: 1, padding: '8px 12px', border: '0.5px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
                  />
                  <button onClick={() => lookupPatente(form.patente || '')} disabled={lookupLoading}
                    style={{ padding: '8px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>
                    {lookupLoading ? '...' : 'Buscar'}
                  </button>
                </div>
                {lookupDone && <p style={{ fontSize: 12, color: '#16a34a', marginTop: 6 }}>✅ Ficha cargada — revisa y completa los datos</p>}
              </div>
            )}

            {/* Form fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              {[
                ['Marca *', 'marca', 'text'],
                ['Modelo *', 'modelo', 'text'],
                ['Año *', 'anio', 'number'],
                ['Versión', 'version', 'text'],
                ['Kilometraje', 'kilometraje', 'number'],
                ['N° dueños anteriores', 'num_duenos', 'number'],
              ].map(([label, key, type]) => (
                <div key={key as string}>
                  <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>{label}</label>
                  <input
                    type={type as string}
                    value={(form as any)[key as string] || ''}
                    onChange={e => setForm(p => ({ ...p, [key as string]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: '0.5px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Estado general</label>
                <select value={form.estado_general || 'bueno'} onChange={e => setForm(p => ({ ...p, estado_general: e.target.value as any }))}
                  style={{ width: '100%', padding: '8px 12px', border: '0.5px solid #d1d5db', borderRadius: 8, fontSize: 14 }}>
                  <option value="excelente">Excelente</option>
                  <option value="bueno">Bueno</option>
                  <option value="regular">Regular</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Mantención</label>
                <select value={form.mantencion || 'taller'} onChange={e => setForm(p => ({ ...p, mantencion: e.target.value as any }))}
                  style={{ width: '100%', padding: '8px 12px', border: '0.5px solid #d1d5db', borderRadius: 8, fontSize: 14 }}>
                  <option value="concesionario">Concesionario</option>
                  <option value="taller">Taller particular</option>
                  <option value="mixto">Mixta</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Precio CLP *</label>
                <input type="number" value={form.precio || ''} onChange={e => setForm(p => ({ ...p, precio: Number(e.target.value) }))}
                  style={{ width: '100%', padding: '8px 12px', border: '0.5px solid #d1d5db', borderRadius: 8, fontSize: 14 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Link publicación</label>
                <input type="url" value={form.link_publicacion || ''} onChange={e => setForm(p => ({ ...p, link_publicacion: e.target.value }))}
                  placeholder="https://chileautos.cl/..."
                  style={{ width: '100%', padding: '8px 12px', border: '0.5px solid #d1d5db', borderRadius: 8, fontSize: 14 }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: '1.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.precio_negociable || false} onChange={e => setForm(p => ({ ...p, precio_negociable: e.target.checked }))} />
                Precio negociable
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.soap_vigente || false} onChange={e => setForm(p => ({ ...p, soap_vigente: e.target.checked }))} />
                SOAP vigente
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.revision_tecnica || false} onChange={e => setForm(p => ({ ...p, revision_tecnica: e.target.checked }))} />
                Rev. técnica al día
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowForm(false); setForm(emptyForm()); setLookupDone(false) }}
                style={{ padding: '10px 20px', border: '0.5px solid #d1d5db', borderRadius: 8, background: '#fff', fontSize: 14, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={saveVehicle} disabled={saving}
                style={{ padding: '10px 20px', border: 'none', borderRadius: 8, background: '#111', color: '#fff', fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>
                {saving ? 'Guardando...' : form.id ? 'Guardar cambios' : 'Publicar auto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
// cache bust Wed May 13 19:58:38 -04 2026
