import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Client } from '../types'
import { PLAN_LABEL } from '../types'
import DashboardView   from '../views/DashboardView'
import AutomationsView from '../views/AutomationsView'
import CatalogView     from '../views/CatalogView'
import AlvaroVehicles  from './AlvaroVehicles'
import BusinessView    from '../views/BusinessView'

type View = 'dashboard' | 'automations' | 'catalog' | 'business'

const NAV = [
  { id: 'dashboard'   as View, icon: '📊', label: 'Dashboard' },
  { id: 'automations' as View, icon: '⚡', label: 'Automatizaciones' },
  { id: 'catalog'     as View, icon: '📦', label: 'Catálogo' },
  { id: 'business'    as View, icon: '🏢', label: 'Mi Negocio' },
]

interface Props { session: Session }

export default function Portal({ session }: Props) {
  const [view,       setView]       = useState<View>('dashboard')
  const [client,     setClient]     = useState<Client | null | undefined>(undefined)
  const [isAlvaro,   setIsAlvaro]   = useState<boolean>(false)

  useEffect(() => {
    supabase
      .from('clients')
      .select('*')
      .eq('user_id', session.user.id)
      .single()
      .then(({ data }) => {
        const c = (data as Client) ?? null
        setClient(c)

        // Detectar si el cliente tiene bot Álvaro activo
        if (c) {
          supabase
            .from('automations')
            .select('id, type, status')
            .eq('client_id', c.id)
            .then(({ data, error }) => {
              console.log('todas las automations:', data, error)
              const hasAlvaro = (data ?? []).some(a => a.type === 'alvaro_bot' && a.status === 'active')
              setIsAlvaro(hasAlvaro)
            })
        }
      })
  }, [session.user.id])

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  // Aún cargando
  if (client === undefined) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        Cargando tu portal...
      </div>
    )
  }

  // Usuario autenticado pero sin registro de cliente aún
  if (client === null) {
    return (
      <div className="pending-screen">
        <div className="icon">⏳</div>
        <h2>Tu cuenta está siendo configurada</h2>
        <p>
          Nuestro equipo está preparando tu portal. Te avisamos cuando esté listo.
          Si crees que es un error, escríbenos a{' '}
          <a href="mailto:hola@igoia.cl" style={{ color: 'var(--green)' }}>hola@igoia.cl</a>
        </p>
        <button className="btn-ghost" style={{ marginTop: 8 }} onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>
    )
  }

  // Nav label dinámico según tipo de cliente
  const nav = NAV.map(n =>
    n.id === 'catalog'
      ? { ...n, icon: isAlvaro ? '🚗' : '📦', label: isAlvaro ? 'Mis Autos' : 'Catálogo' }
      : n
  )

  return (
    <div className="portal-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>IGoIA<span>.</span></h1>
          <p>Portal del Cliente</p>
        </div>
        <nav className="sidebar-nav">
          {nav.map(n => (
            <div
              key={n.id}
              className={`nav-item ${view === n.id ? 'active' : ''}`}
              onClick={() => setView(n.id)}
            >
              <span className="nav-icon">{n.icon}</span>
              {n.label}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="business-info">
            <div className="business-name">{client.business_name}</div>
            <span className={`plan-badge plan-${client.plan}`}>
              {PLAN_LABEL[client.plan]}
            </span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="main-content">
        {view === 'dashboard'   && <DashboardView   client={client} />}
        {view === 'automations' && <AutomationsView client={client} />}
        {view === 'catalog' && isAlvaro && <AlvaroVehicles clientId={client.id} />}
        {view === 'catalog' && !isAlvaro && <CatalogView client={client} />}
        {view === 'business'    && <BusinessView    client={client} onUpdate={setClient} />}
      </main>
    </div>
  )
}
