-- Adds claude_report_id so the NPR-<ReportID>-<YYYYMMDD>.pdf download name
-- survives page reloads (history-record downloads). Nullable, additive, safe.
ALTER TABLE algorithm_results ADD COLUMN IF NOT EXISTS claude_report_id text;
