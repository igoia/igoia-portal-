import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Client, CatalogItem } from '../types'

interface Props { client: Client }

const BLANK = {
  name: '', description: '', sku: '', price: '',
  unit: 'unidad', tax_rate: '19', category: '',
}

function fmtCLP(n: number) {
  return n.toLocaleString('es-CL', { minimumFractionDigits: 0 })
}

export default function CatalogView({ client }: Props) {
  const [items,   setItems]   = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [adding,  setAdding]  = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [form,    setForm]    = useState(BLANK)
  const [error,   setError]   = useState<string | null>(null)

  async function load() {
    const { data } = await supabase
      .from('client_catalogs')
      .select('*')
      .eq('client_id', client.id)
      .order('created_at')
    setItems((data as CatalogItem[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [client.id])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    setError(null)
    const { error: dbErr } = await supabase.from('client_catalogs').insert({
      client_id:   client.id,
      name:        form.name.trim(),
      description: form.description.trim() || null,
      sku:         form.sku.trim() || null,
      price:       parseFloat(form.price) || 0,
      unit:        form.unit || 'unidad',
      tax_rate:    parseFloat(form.tax_rate) || 19,
      category:    form.category.trim() || null,
      active:      true,
    })
    if (dbErr) {
      setError(dbErr.message)
    } else {
      setForm(BLANK)
      setAdding(false)
      await load()
    }
    setSaving(false)
  }

  async function toggleActive(item: CatalogItem) {
    await supabase.from('client_catalogs').update({ active: !item.active }).eq('id', item.id)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, active: !i.active } : i))
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este producto del catálogo?')) return
    await supabase.from('client_catalogs').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  return (
    <>
      <div className="page-header">
        <h2>Catálogo</h2>
        <p>Productos y servicios que usa el bot para cotizar</p>
      </div>

      <div className="section-card">
        <div className="section-head">
          <div>
            <h3>Mis productos / servicios</h3>
            <p>{loading ? '…' : `${items.length} ítem${items.length !== 1 ? 's' : ''}`}</p>
          </div>
          {!adding && (
            <button className="add-btn" onClick={() => { setAdding(true); setError(null) }}>
              + Agregar ítem
            </button>
          )}
        </div>

        {/* Add form */}
        {adding && (
          <div className="add-form">
            <h4>Nuevo producto / servicio</h4>
            <form onSubmit={handleAdd}>
              {error && <div className="login-error" style={{ marginBottom: 16 }}>{error}</div>}
              <div className="form-grid">
                <div className="field span2">
                  <label>Nombre *</label>
                  <input name="name" value={form.name} onChange={handleChange}
                    placeholder="Ej: Diseño de logo" required />
                </div>
                <div className="field">
                  <label>Precio (CLP) *</label>
                  <input name="price" type="number" min="0" step="1"
                    value={form.price} onChange={handleChange}
                    placeholder="150000" required />
                </div>
                <div className="field">
                  <label>Unidad</label>
                  <select name="unit" value={form.unit} onChange={handleChange}>
                    {['unidad','hora','día','mes','metro','kg','litro','servicio','proyecto'].map(u =>
                      <option key={u}>{u}</option>
                    )}
                  </select>
                </div>
                <div className="field">
                  <label>IVA (%)</label>
                  <input name="tax_rate" type="number" min="0" max="100" step="1"
                    value={form.tax_rate} onChange={handleChange} />
                </div>
                <div className="field">
                  <label>SKU / Código</label>
                  <input name="sku" value={form.sku} onChange={handleChange}
                    placeholder="PROD-001" />
                </div>
                <div className="field">
                  <label>Categoría</label>
                  <input name="category" value={form.category} onChange={handleChange}
                    placeholder="Diseño, Consultoría…" />
                </div>
                <div className="field span2">
                  <label>Descripción</label>
                  <textarea name="description" value={form.description} onChange={handleChange}
                    placeholder="Describe brevemente el producto o servicio…" />
                </div>
              </div>
              <div className="form-actions">
                <button className="btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
                <button className="btn-ghost" type="button"
                  onClick={() => { setAdding(false); setForm(BLANK); setError(null) }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Grid */}
        <div className="catalog-grid">
          {loading ? (
            <div style={{ padding: '48px', color: 'var(--muted)', textAlign: 'center' }}>Cargando…</div>
          ) : items.length === 0 ? (
            <div className="catalog-empty">
              <div className="icon">📦</div>
              Tu catálogo está vacío.<br />
              <span style={{ fontSize: '0.875rem' }}>Agrega productos para que el bot pueda cotizar automáticamente.</span>
            </div>
          ) : items.map(item => (
            <div key={item.id} className={`catalog-card ${item.active ? '' : 'inactive'}`}>
              <div className="catalog-card-head">
                <div>
                  <div className="catalog-name">{item.name}</div>
                  {item.sku && <div className="catalog-sku">{item.sku}</div>}
                </div>
                <div className="catalog-actions">
                  <button
                    className={`icon-btn toggle ${item.active ? 'on' : ''}`}
                    title={item.active ? 'Desactivar' : 'Activar'}
                    onClick={() => toggleActive(item)}
                  >
                    {item.active ? '✓' : '○'}
                  </button>
                  <button className="icon-btn danger" title="Eliminar"
                    onClick={() => handleDelete(item.id)}>
                    ✕
                  </button>
                </div>
              </div>

              {item.description && (
                <div className="catalog-desc">{item.description}</div>
              )}

              <div>
                <div className="catalog-price">${fmtCLP(item.price)}</div>
                <div className="catalog-unit">por {item.unit} · IVA {item.tax_rate}%</div>
              </div>

              <div className="catalog-footer">
                {item.category
                  ? <span className="category-tag">{item.category}</span>
                  : <span />}
                <span style={{
                  fontSize: '0.75rem', fontFamily: 'var(--font-mono)',
                  color: item.active ? 'var(--green)' : 'var(--muted)',
                }}>
                  {item.active ? '● activo' : '○ inactivo'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
