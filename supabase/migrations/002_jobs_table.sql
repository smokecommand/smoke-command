-- ============================================================
-- Smoke Command — Jobs Table
-- ============================================================

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_number TEXT UNIQUE NOT NULL DEFAULT 'JOB-' || LPAD(floor(random()*99999+1)::text, 5, '0'),
  district_id TEXT REFERENCES districts(id),
  fire_lead_id UUID REFERENCES fire_leads(id),
  
  -- Property
  property_address TEXT NOT NULL,
  property_city TEXT,
  property_state TEXT DEFAULT 'TX',
  property_zip TEXT,
  
  -- Homeowner
  homeowner_name TEXT,
  homeowner_phone TEXT,
  homeowner_email TEXT,
  
  -- Insurance
  carrier_name TEXT,
  claim_number TEXT,
  adjuster_name TEXT,
  adjuster_phone TEXT,
  adjuster_email TEXT,
  policy_number TEXT,
  
  -- Job details
  status TEXT NOT NULL DEFAULT 'inspection_scheduled' CHECK (status IN (
    'inspection_scheduled',
    'scope_written',
    'work_auth_signed',
    'equipment_in',
    'mitigation_active',
    'hygienist_clearance',
    'reconstruction',
    'billing',
    'closed',
    'cancelled'
  )),
  
  -- Financials
  xactimate_estimate NUMERIC(10,2),
  amount_collected NUMERIC(10,2) DEFAULT 0,
  split_patriot_pct NUMERIC(5,2) DEFAULT 70,
  split_restoremedics_pct NUMERIC(5,2) DEFAULT 20,
  split_pa_pct NUMERIC(5,2) DEFAULT 10,
  
  -- Crew
  lead_tech_id UUID,
  assigned_crew JSONB DEFAULT '[]',
  
  -- Equipment
  hydroxyl_units INTEGER DEFAULT 3,
  trailer_id TEXT,
  equipment_in_date TIMESTAMPTZ,
  equipment_out_date TIMESTAMPTZ,
  
  -- Subs
  sub_drywall TEXT,
  sub_electrical TEXT,
  sub_hvac TEXT,
  sub_flooring TEXT,
  sub_paint TEXT,
  
  -- Dates
  inspection_date TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  target_completion_date TIMESTAMPTZ,
  actual_completion_date TIMESTAMPTZ,
  
  -- Meta
  notes TEXT,
  phase_log JSONB DEFAULT '[]',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "jobs_master_admin" ON jobs FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'master_admin')
);

CREATE POLICY "jobs_district" ON jobs FOR SELECT USING (
  district_id = (SELECT district_id FROM profiles WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'master_admin')
);

-- Updated_at trigger
DROP TRIGGER IF EXISTS jobs_updated_at ON jobs;
CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- Auto-increment job number sequence
CREATE SEQUENCE IF NOT EXISTS job_number_seq START 1000;

-- Safer job number default
ALTER TABLE jobs ALTER COLUMN job_number SET DEFAULT 'JOB-' || LPAD(nextval('job_number_seq')::text, 5, '0');
