import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Blaze → Smoke Command fire lead intake
// Called by Blaze when a qualifying fire is detected

interface BlazeFireEvent {
  fire_id: string         // unique Blaze fire ID
  fire_name: string
  incident_date: string   // ISO date
  location: string
  lat?: number
  lng?: number
  neighborhoods?: string[]
  wind_direction?: string
  news_links?: string[]
  air_quality_summary?: string
  affected_district_ids?: string[]  // which districts to assign to
}

export async function POST(req: NextRequest) {
  // Verify webhook secret
  const secret = req.headers.get('x-blaze-secret')
  if (secret !== process.env.BLAZE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: BlazeFireEvent
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Use service role key to bypass RLS (server-side only)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Determine which districts to create leads for
  const districtIds: string[] = body.affected_district_ids?.length
    ? body.affected_district_ids
    : ['houston-south']  // default to Houston until geo-routing is built

  const leads = districtIds.map(district_id => ({
    fire_name: body.fire_name,
    incident_date: body.incident_date,
    location: body.location,
    lat: body.lat ?? null,
    lng: body.lng ?? null,
    neighborhoods: body.neighborhoods ?? [],
    wind_direction: body.wind_direction ?? null,
    news_links: body.news_links ?? [],
    air_quality_data: body.air_quality_summary ?? null,
    status: 'new',
    district_id,
    blaze_fire_id: `${body.fire_id}:${district_id}`,
    source: 'blaze',
  }))

  const { data, error } = await supabase
    .from('fire_leads')
    .upsert(leads, { onConflict: 'blaze_fire_id', ignoreDuplicates: true })
    .select('id, district_id')

  if (error) {
    console.error('[blaze-webhook] Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log(`[blaze-webhook] Created ${data?.length ?? 0} lead(s) for fire: ${body.fire_name}`)
  return NextResponse.json({ created: data?.length ?? 0, leads: data })
}
