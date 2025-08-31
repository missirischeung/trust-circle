-- Update the trigger function to handle the new status flow
CREATE OR REPLACE FUNCTION public.update_submission_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

  -- Determine new status based on metrics
  IF rejected_metrics > 0 THEN
    new_status = 'rejected';
  ELSIF approved_metrics = total_metrics AND total_metrics > 0 THEN
    new_status = 'ready_for_final';
  ELSIF approved_metrics > 0 THEN
    new_status = 'partially_approved';
  ELSE
    -- Keep original status if no metrics or all pending
    -- This preserves the partner approval flow
    SELECT status INTO new_status
    FROM public.submissions 
    WHERE id = COALESCE(NEW.submission_id, OLD.submission_id);
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

-- Create the trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_submission_status_trigger'
    ) THEN
        CREATE TRIGGER update_submission_status_trigger
        AFTER INSERT OR UPDATE OR DELETE ON public.submission_metrics
        FOR EACH ROW EXECUTE FUNCTION public.update_submission_status();
    END IF;
END
$$;