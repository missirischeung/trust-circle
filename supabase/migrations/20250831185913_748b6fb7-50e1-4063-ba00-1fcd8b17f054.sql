-- Ensure app_role enum exists
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('admin', 'partner', 'agent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Fix the handle_new_user function to handle missing role data gracefully
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'agent'::app_role)
  );
  RETURN NEW;
END;
$function$;