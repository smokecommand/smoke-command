import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POST /api/canvass — log a door knock
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { lead_id, rep_id, address, result, notes, photo_url } = body

  if (!lead_id || !rep_id || !address || !result) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data, error } = await supabase
    .from('canvass_entries')
    .insert({ lead_id, rep_id, address, result, notes, photo_url })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Increment doors_knocked if result is meaningful
  if (['knocked','interested','scheduled'].includes(result)) {
    await supabase.rpc('increment_doors_knocked', { p_lead_id: lead_id })
  }

  return NextResponse.json(data)
}
