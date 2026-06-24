-- Smoke Command — Jobs Table Migration
-- Run this in the Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id TEXT NOT NULL REFERENCES districts(id),
  address_street TEXT NOT NULL,
  address_city TEXT NOT NULL,
  address_zip TEXT,
  homeowner_name TEXT NOT NULL,
  homeowner_phone TEXT,
  homeowner_email TEXT,
  insurance_carrier TEXT,
  claim_number TEXT,
  adjuster_name TEXT,
  adjuster_phone TEXT,
  date_of_loss DATE,
  cause_of_loss TEXT DEFAULT 'smoke',
  current_stage INTEGER NOT NULL DEFAULT 1,
  stage_data JSONB DEFAULT '{}',
  carrier_approval NUMERIC(10,2),
  amount_collected NUMERIC(10,2) DEFAULT 0,
  crew_lead_id UUID REFERENCES profiles(id),
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_district ON jobs(district_id);
CREATE INDEX IF NOT EXISTS idx_jobs_stage ON jobs(current_stage);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Master admin can see/do everything
CREATE POLICY "master_admin_all_jobs" ON jobs FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'master_admin')
);

-- District users can see/edit jobs in their district
CREATE POLICY "district_users_own_jobs" ON jobs FOR ALL USING (
  district_id = (SELECT district_id FROM profiles WHERE id = auth.uid())
);
