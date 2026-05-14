export type PlanType        = 'trial' | 'starter' | 'business' | 'scale'
export type ClientStatus    = 'trial' | 'active' | 'suspended' | 'cancelled'
export type AutomationType  = 'whatsapp_bot' | 'cotizaciones' | 'facturacion' | 'reviews' | 'reportes' | 'crm' | 'custom'
export type AutomationStatus = 'configuring' | 'active' | 'paused' | 'error'

export interface Client {
  id: string
  user_id: string
  business_name: string
  rut: string | null
  email: string
  phone: string | null
  address: string | null
  comuna: string | null
  ciudad: string | null
  plan: PlanType
  status: ClientStatus
  trial_ends_at: string | null
  onboarding_completed_at: string | null
  notes: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Automation {
  id: string
  client_id: string
  name: string
  type: AutomationType
  status: AutomationStatus
  description: string | null
  n8n_workflow_id: string | null
  config: Record<string, unknown>
  last_run_at: string | null
  runs_count: number
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface CatalogItem {
  id: string
  client_id: string
  name: string
  description: string | null
  sku: string | null
  price: number
  unit: string
  tax_rate: number
  category: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface ActivityEvent {
  id: string
  client_id: string
  automation_id: string | null
  type: string
  description: string | null
  entity_type: string | null
  entity_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

// ── Display helpers ───────────────────────────────────────────────────────
export const PLAN_LABEL: Record<PlanType, string> = {
  trial: 'Trial', starter: 'Starter', business: 'Business', scale: 'Scale',
}

export const AUTOMATION_ICON: Record<AutomationType, string> = {
  whatsapp_bot: '💬',
  cotizaciones: '📄',
  facturacion:  '🧾',
  reviews:      '⭐',
  reportes:     '📊',
  crm:          '🗂️',
  custom:       '⚡',
}

export const AUTOMATION_LABEL: Record<AutomationType, string> = {
  whatsapp_bot: 'Bot WhatsApp',
  cotizaciones: 'Cotizaciones PDF',
  facturacion:  'Factura SII',
  reviews:      'Google Reviews',
  reportes:     'Reportes IA',
  crm:          'CRM',
  custom:       'Personalizado',
}

export const ACTIVITY_ICON: Record<string, string> = {
  message_received:    '📨',
  message_sent:        '📤',
  quotation_sent:      '📄',
  quotation_viewed:    '👁️',
  invoice_issued:      '🧾',
  invoice_accepted:    '✅',
  invoice_rejected:    '❌',
  lead_captured:       '🎯',
  lead_updated:        '✏️',
  appointment_booked:  '📅',
  appointment_updated: '🔄',
  review_requested:    '⭐',
  review_received:     '🌟',
  report_generated:    '📊',
  automation_run:      '⚡',
  automation_error:    '⚠️',
  login:               '🔐',
}
