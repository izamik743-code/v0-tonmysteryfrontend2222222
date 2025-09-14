-- Note: This would typically be handled by a cron job or scheduled function
-- For demonstration, we'll create the structure

-- Create a simple job scheduler table
CREATE TABLE IF NOT EXISTS public.scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  interval_minutes INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert periodic jobs
INSERT INTO public.scheduled_jobs (job_name, next_run, interval_minutes) VALUES
('update_online_count', NOW() + INTERVAL '1 minute', 1),
('add_fake_win', NOW() + INTERVAL '30 seconds', 2),
('cleanup_old_data', NOW() + INTERVAL '1 hour', 60)
ON CONFLICT DO NOTHING;

-- Function to run scheduled jobs (would be called by external scheduler)
CREATE OR REPLACE FUNCTION run_scheduled_jobs()
RETURNS VOID AS $$
DECLARE
  job RECORD;
BEGIN
  FOR job IN 
    SELECT * FROM public.scheduled_jobs 
    WHERE is_active = true AND next_run <= NOW()
  LOOP
    CASE job.job_name
      WHEN 'update_online_count' THEN
        PERFORM update_online_count();
      WHEN 'add_fake_win' THEN
        PERFORM add_fake_recent_win();
      WHEN 'cleanup_old_data' THEN
        -- Clean up old case openings (keep last 1000)
        DELETE FROM public.case_openings 
        WHERE id NOT IN (
          SELECT id FROM public.case_openings 
          ORDER BY opened_at DESC 
          LIMIT 1000
        );
        
        -- Clean up old upgrade contracts (keep last 500)
        DELETE FROM public.upgrade_contracts 
        WHERE id NOT IN (
          SELECT id FROM public.upgrade_contracts 
          ORDER BY created_at DESC 
          LIMIT 500
        );
    END CASE;
    
    -- Update next run time
    UPDATE public.scheduled_jobs 
    SET 
      last_run = NOW(),
      next_run = NOW() + (interval_minutes || ' minutes')::INTERVAL
    WHERE id = job.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
