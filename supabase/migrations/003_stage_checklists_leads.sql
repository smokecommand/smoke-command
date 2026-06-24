-- ============================================================
-- Smoke Command — Stage Checklists + Leads Table
-- ============================================================

-- Add stage_checklists to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS stage_checklists JSONB DEFAULT '{}';

-- ─── Leads Table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id TEXT REFERENCES districts(id),
  created_by UUID,
  homeowner_name TEXT NOT NULL,
  property_address TEXT NOT NULL,
  phone TEXT,
  date_contacted DATE DEFAULT CURRENT_DATE,
  source TEXT DEFAULT 'canvassing' CHECK (source IN ('canvassing','referral','fire_lead','other')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','signed','lost')),
  loss_reason TEXT,
  notes TEXT,
  touchpoints JSONB DEFAULT '[]',
  converted_job_id UUID REFERENCES jobs(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "leads_master_admin" ON leads FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'master_admin')
);

CREATE POLICY "leads_own" ON leads FOR ALL USING (
  created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('master_admin','district_admin'))
);

-- Updated_at trigger
DROP TRIGGER IF EXISTS leads_updated_at ON leads;
CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
