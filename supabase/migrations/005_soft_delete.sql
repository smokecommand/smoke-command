-- ============================================================
-- Smoke Command — Soft Delete Support
-- ============================================================
-- Add deleted_at to jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add deleted_at to leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add deleted_at to fire_leads
ALTER TABLE fire_leads ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add deleted_at to canvass_entries
ALTER TABLE canvass_entries ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Indexes for soft delete queries
CREATE INDEX IF NOT EXISTS idx_jobs_deleted_at ON jobs(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_deleted_at ON leads(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_fire_leads_deleted_at ON fire_leads(deleted_at) WHERE deleted_at IS NULL;
