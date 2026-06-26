-- ============================================================
-- Smoke Command — Drop Revenue Split Columns
-- ============================================================
ALTER TABLE jobs
  DROP COLUMN IF EXISTS split_patriot_pct,
  DROP COLUMN IF EXISTS split_restoremedics_pct,
  DROP COLUMN IF EXISTS split_pa_pct;
