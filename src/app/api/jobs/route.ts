import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Mock data fallback
const MOCK_JOBS = [
  {
    id: 'mock-1',
    address_street: '1842 Oak Dr',
    address_city: 'Pasadena',
    address_zip: '77502',
    homeowner_name: 'Maria Santos',
    homeowner_phone: '(713) 555-0101',
    homeowner_email: 'maria.santos@email.com',
    insurance_carrier: 'State Farm',
    claim_number: 'SF-2024-88421',
    adjuster_name: 'Tom Bradley',
    adjuster_phone: '(713) 555-0190',
    date_of_loss: '2024-06-20',
    cause_of_loss: 'fire',
    current_stage: 2,
    stage_data: {},
    carrier_approval: 28400,
    amount_collected: 0,
    crew_lead_id: null,
    notes: 'Pasadena structure fire — smoke penetration throughout main floor and attic.',
    district_id: 'houston-south',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-2',
    address_street: '504 Oleander Ave',
    address_city: 'La Marque',
    address_zip: '77568',
    homeowner_name: 'Robert Tran',
    homeowner_phone: '(409) 555-0202',
    homeowner_email: 'robert.tran@email.com',
    insurance_carrier: 'Allstate',
    claim_number: 'ALL-2024-55193',
    adjuster_name: 'Sarah Nguyen',
    adjuster_phone: '(409) 555-0299',
    date_of_loss: '2024-06-13',
    cause_of_loss: 'smoke',
    current_stage: 5,
    stage_data: {},
    carrier_approval: 41750,
    amount_collected: 20875,
    crew_lead_id: null,
    notes: 'La Marque smoke damage — heavy smoke in kitchen and living area.',
    district_id: 'galveston',
    created_at: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-3',
    address_street: '2217 Bayou Rd',
    address_city: 'Texas City',
    address_zip: '77590',
    homeowner_name: 'James Kelley',
    homeowner_phone: '(409) 555-0303',
    homeowner_email: 'james.kelley@email.com',
    insurance_carrier: 'USAA',
    claim_number: 'USAA-2024-31087',
    adjuster_name: 'Mike Torres',
    adjuster_phone: '(409) 555-0388',
    date_of_loss: '2024-06-17',
    cause_of_loss: 'wildfire smoke',
    current_stage: 6,
    stage_data: {},
    carrier_approval: 63200,
    amount_collected: 44240,
    crew_lead_id: null,
    notes: 'Texas City refinery smoke — extensive contamination across entire structure.',
    district_id: 'texas-city',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
]

async function getSupabaseAdmin() {
  if (!supabaseUrl || !serviceKey) return null
  return createClient(supabaseUrl, serviceKey)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const districtId = searchParams.get('district_id')

  try {
    const admin = await getSupabaseAdmin()
    if (!admin) {
      return NextResponse.json({ jobs: MOCK_JOBS, source: 'mock' })
    }

    let query = admin.from('jobs').select('*').order('created_at', { ascending: false })
    if (districtId) {
      query = query.eq('district_id', districtId)
    }

    const { data, error } = await query
    if (error) {
      // Table likely doesn't exist yet — return mock data
      console.warn('Supabase jobs query error (using mock):', error.message)
      return NextResponse.json({ jobs: MOCK_JOBS, source: 'mock' })
    }

    const jobs = data && data.length > 0 ? data : MOCK_JOBS
    return NextResponse.json({ jobs, source: data && data.length > 0 ? 'supabase' : 'mock' })
  } catch (err) {
    console.error('GET /api/jobs error:', err)
    return NextResponse.json({ jobs: MOCK_JOBS, source: 'mock' })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const admin = await getSupabaseAdmin()

    if (!admin) {
      const newJob = { id: `mock-${Date.now()}`, ...body, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      return NextResponse.json({ job: newJob, source: 'mock' }, { status: 201 })
    }

    const { data, error } = await admin.from('jobs').insert([{
      district_id: body.district_id || 'houston-south',
      address_street: body.address_street,
      address_city: body.address_city,
      address_zip: body.address_zip,
      homeowner_name: body.homeowner_name,
      homeowner_phone: body.homeowner_phone,
      homeowner_email: body.homeowner_email,
      insurance_carrier: body.insurance_carrier,
      claim_number: body.claim_number,
      adjuster_name: body.adjuster_name,
      adjuster_phone: body.adjuster_phone,
      date_of_loss: body.date_of_loss,
      cause_of_loss: body.cause_of_loss || 'smoke',
      notes: body.notes,
      current_stage: 1,
      stage_data: {},
      carrier_approval: null,
      amount_collected: 0,
    }]).select().single()

    if (error) {
      console.warn('Supabase jobs insert error (mock response):', error.message)
      const newJob = { id: `mock-${Date.now()}`, ...body, current_stage: 1, created_at: new Date().toISOString() }
      return NextResponse.json({ job: newJob, source: 'mock' }, { status: 201 })
    }

    return NextResponse.json({ job: data, source: 'supabase' }, { status: 201 })
  } catch (err) {
    console.error('POST /api/jobs error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
