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
