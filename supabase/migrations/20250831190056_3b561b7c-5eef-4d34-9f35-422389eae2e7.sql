-- Fix search_path for get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid DEFAULT auth.uid())
RETURNS app_role
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE user_id = user_uuid);
END;
$function$;

-- Fix search_path for update_submission_status function
CREATE OR REPLACE FUNCTION public.update_submission_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  total_metrics INTEGER;
  approved_metrics INTEGER;
  rejected_metrics INTEGER;
  new_status submission_status;
BEGIN
  -- Count metrics for this submission
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE approval_status = 'approved'),
    COUNT(*) FILTER (WHERE approval_status = 'rejected')
  INTO total_metrics, approved_metrics, rejected_metrics
  FROM public.submission_metrics 
  WHERE submission_id = COALESCE(NEW.submission_id, OLD.submission_id);

  -- Determine new status
  IF rejected_metrics > 0 THEN
    new_status = 'rejected';
  ELSIF approved_metrics = total_metrics AND total_metrics > 0 THEN
    new_status = 'ready_for_final';
  ELSIF approved_metrics > 0 THEN
    new_status = 'partially_approved';
  ELSE
    new_status = 'pending';
  END IF;

  -- Update submission status
  UPDATE public.submissions 
  SET 
    status = new_status,
    last_modified = now()
  WHERE id = COALESCE(NEW.submission_id, OLD.submission_id);

  RETURN COALESCE(NEW, OLD);
END;
$function$;