-- Fix RLS policy for submissions - partners should only see their own submissions, admins should see all
DROP POLICY IF EXISTS "Users can view own submissions" ON submissions;

-- Create proper policies
CREATE POLICY "Users can view own submissions" 
ON submissions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins and partners can view all submissions" 
ON submissions 
FOR SELECT 
USING (get_user_role() = ANY (ARRAY['admin'::app_role, 'partner'::app_role]));

-- Similar fix for related tables
DROP POLICY IF EXISTS "Users can view metrics for accessible submissions" ON submission_metrics;
CREATE POLICY "Users can view own submission metrics" 
ON submission_metrics 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM submissions s 
  WHERE s.id = submission_metrics.submission_id 
  AND s.user_id = auth.uid()
));

CREATE POLICY "Admins and partners can view all submission metrics" 
ON submission_metrics 
FOR SELECT 
USING (get_user_role() = ANY (ARRAY['admin'::app_role, 'partner'::app_role]));

-- Fix submission_changes policies
DROP POLICY IF EXISTS "Users can view changes for accessible submissions" ON submission_changes;
CREATE POLICY "Users can view own submission changes" 
ON submission_changes 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM submissions s 
  WHERE s.id = submission_changes.submission_id 
  AND s.user_id = auth.uid()
));

CREATE POLICY "Admins and partners can view all submission changes" 
ON submission_changes 
FOR SELECT 
USING (get_user_role() = ANY (ARRAY['admin'::app_role, 'partner'::app_role]));

-- Fix submission_attachments policies  
DROP POLICY IF EXISTS "Users can view attachments for accessible submissions" ON submission_attachments;
CREATE POLICY "Users can view own submission attachments" 
ON submission_attachments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM submissions s 
  WHERE s.id = submission_attachments.submission_id 
  AND s.user_id = auth.uid()
));

CREATE POLICY "Admins and partners can view all submission attachments" 
ON submission_attachments 
FOR SELECT 
USING (get_user_role() = ANY (ARRAY['admin'::app_role, 'partner'::app_role]));