
-- Enable RLS if not already enabled
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Policy: Allow INSERT for all users (public for demo; restrict as needed)
CREATE POLICY "Allow attendance inserts for all" ON public.attendance
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow SELECT for all users (public for now)
CREATE POLICY "Allow attendance select for all" ON public.attendance
  FOR SELECT
  USING (true);

-- Policy: Allow UPDATE for all users (not strictly needed, but useful)
CREATE POLICY "Allow attendance update for all" ON public.attendance
  FOR UPDATE
  USING (true);

-- Policy: Allow DELETE for all users (only if needed)
CREATE POLICY "Allow attendance delete for all" ON public.attendance
  FOR DELETE
  USING (true);
