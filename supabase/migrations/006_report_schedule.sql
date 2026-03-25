-- =====================================================
-- 006_report_schedule.sql
-- Report scheduling + white-label branding per client
-- =====================================================

-- Add schedule and branding columns to reports
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS schedule jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS branding jsonb DEFAULT NULL;

-- Add branding to clients table (white-label)
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS branding jsonb DEFAULT '{}';

-- Comment: branding JSON structure:
-- {
--   "logo_url": "https://...",
--   "accent_color": "#1e40af",
--   "footer_text": "Relatório mensal de performance",
--   "cover_image_url": "https://..."
-- }

-- Comment: schedule JSON structure:
-- {
--   "enabled": true,
--   "frequency": "monthly",  -- daily | weekly | biweekly | monthly
--   "day_of_week": 1,        -- 0=Sun, 1=Mon (for weekly)
--   "day_of_month": 1,       -- (for monthly)
--   "time": "09:00",
--   "recipient_emails": ["client@example.com"],
--   "format": "pdf",         -- pdf | png
--   "last_sent_at": null,
--   "next_send_at": "2026-04-01T09:00:00Z"
-- }
