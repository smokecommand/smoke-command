import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type UserRole = 'master_admin' | 'district_admin' | 'pm' | 'sales_rep' | 'tech'

export type District = {
  id: string
  name: string
  center_lat: number
  center_lng: number
  radius_miles: number
}

export type Profile = {
  id: string
  full_name: string
  role: UserRole
  district_id: string
  district?: District
}

export type FireLeadStatus = 'new' | 'assigned' | 'in_progress' | 'closed'

export type JobStatus =
  | 'inspection_scheduled'
  | 'scope_written'
  | 'work_auth_signed'
  | 'equipment_in'
  | 'mitigation_active'
  | 'hygienist_clearance'
  | 'reconstruction'
  | 'billing'
  | 'closed'
  | 'cancelled'

export type PhaseLogEntry = {
  phase: JobStatus
  timestamp: string
  note: string
}

export type Job = {
  id: string
  job_number: string
  district_id: string | null
  fire_lead_id: string | null
  // Property
  property_address: string
  property_city: string | null
  property_state: string
  property_zip: string | null
  // Homeowner
  homeowner_name: string | null
  homeowner_phone: string | null
  homeowner_email: string | null
  // Insurance
  carrier_name: string | null
  claim_number: string | null
  adjuster_name: string | null
  adjuster_phone: string | null
  adjuster_email: string | null
  policy_number: string | null
  // Job
  status: JobStatus
  // Financials
  xactimate_estimate: number | null
  amount_collected: number
  split_patriot_pct: number
  split_restoremedics_pct: number
  split_pa_pct: number
  // Crew
  lead_tech_id: string | null
  assigned_crew: string[]
  // Equipment
  hydroxyl_units: number
  trailer_id: string | null
  equipment_in_date: string | null
  equipment_out_date: string | null
  // Subs
  sub_drywall: string | null
  sub_electrical: string | null
  sub_hvac: string | null
  sub_flooring: string | null
  sub_paint: string | null
  // Dates
  inspection_date: string | null
  start_date: string | null
  target_completion_date: string | null
  actual_completion_date: string | null
  // Meta
  notes: string | null
  phase_log: PhaseLogEntry[]
  created_by: string | null
  created_at: string
  updated_at: string
}

export type FireLead = {
  id: string
  fire_name: string
  incident_date: string
  location: string
  lat: number
  lng: number
  neighborhoods: string[]
  wind_direction: string
  news_links: string[]
  air_quality_data: string
  status: FireLeadStatus
  district_id: string
  assigned_to: string | null
  doors_knocked: number
  doors_total: number
  created_at: string
}
