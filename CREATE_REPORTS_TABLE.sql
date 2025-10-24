-- Create Reports Table for Admin Dashboard
-- This table stores reports from buyers and sellers

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL, -- ID of the user who reported
  reporter_type TEXT NOT NULL CHECK (reporter_type IN ('buyer', 'seller')), -- Type of user who reported
  reporter_name TEXT NOT NULL, -- Name of the reporter
  reporter_email TEXT NOT NULL, -- Email of the reporter
  report_reason TEXT NOT NULL, -- Reason for the report
  report_description TEXT, -- Detailed description of the issue
  proof_image_url TEXT, -- URL of the proof image uploaded
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  admin_notes TEXT, -- Notes from admin
  admin_id UUID, -- ID of admin who reviewed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_type ON public.reports(reporter_type);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Simple policy: Allow authenticated users to insert reports
CREATE POLICY "Allow authenticated users to insert reports" ON public.reports
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Simple policy: Allow authenticated users to view their own reports
CREATE POLICY "Allow users to view their own reports" ON public.reports
FOR SELECT USING (auth.uid()::text = reporter_id::text);

-- Simple policy: Allow authenticated users to update their own reports
CREATE POLICY "Allow users to update their own reports" ON public.reports
FOR UPDATE USING (auth.uid()::text = reporter_id::text);

-- Policy: Allow service role to do everything (for admin operations)
CREATE POLICY "Allow service role full access" ON public.reports
FOR ALL USING (auth.role() = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_reports_updated_at_trigger
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION update_reports_updated_at();
