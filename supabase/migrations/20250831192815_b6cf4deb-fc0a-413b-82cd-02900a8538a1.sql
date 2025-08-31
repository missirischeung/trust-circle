-- Update RLS to match new visibility rules - fixed quotes
-- Submissions
DROP POLICY IF EXISTS "Admins and partners can view all submissions" ON submissions;

-- Ensure own-view policy exists (idempotent create)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'submissions' AND policyname = 'Users can view own submissions'
  ) THEN
    CREATE POLICY "Users can view own submissions" 
    ON submissions 
    FOR SELECT 
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Admins can view all
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'submissions' AND policyname = 'Admins can view all submissions'
  ) THEN
    CREATE POLICY "Admins can view all submissions" 
    ON submissions 
    FOR SELECT 
    USING (get_user_role() = 'admin'::app_role);
  END IF;
END $$;

-- Partners can view agent submissions only (and their own via the policy above)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'submissions' AND policyname = 'Partners can view agent submissions'
  ) THEN
    CREATE POLICY "Partners can view agent submissions" 
    ON submissions 
    FOR SELECT 
    USING (
      get_user_role() = 'partner'::app_role
      AND EXISTS (
        SELECT 1 
        FROM public.profiles p 
        WHERE p.user_id = submissions.user_id
          AND p.role = 'agent'::app_role
      )
    );
  END IF;
END $$;

-- submission_metrics
DROP POLICY IF EXISTS "Admins and partners can view all submission metrics" ON submission_metrics;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'submission_metrics' AND policyname = 'Users can view own submission metrics'
  ) THEN
    CREATE POLICY "Users can view own submission metrics" 
    ON submission_metrics 
    FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM submissions s 
        WHERE s.id = submission_metrics.submission_id 
          AND s.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'submission_metrics' AND policyname = 'Admins can view all submission metrics'
  ) THEN
    CREATE POLICY "Admins can view all submission metrics" 
    ON submission_metrics 
    FOR SELECT 
    USING (get_user_role() = 'admin'::app_role);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'submission_metrics' AND policyname = 'Partners can view agents submission metrics'
  ) THEN
    CREATE POLICY "Partners can view agents submission metrics" 
    ON submission_metrics 
    FOR SELECT 
    USING (
      get_user_role() = 'partner'::app_role
      AND EXISTS (
        SELECT 1 
        FROM submissions s 
        JOIN profiles p ON p.user_id = s.user_id
        WHERE s.id = submission_metrics.submission_id
          AND p.role = 'agent'::app_role
      )
    );
  END IF;
END $$;