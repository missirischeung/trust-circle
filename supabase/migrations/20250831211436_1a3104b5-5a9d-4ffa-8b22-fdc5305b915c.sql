-- Fix security issue: Restrict profile access to own profile only
-- This replaces the overly permissive "Users can view all profiles" policy

-- First, drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a secure policy that only allows users to view their own profile
CREATE POLICY "Users can view own profile only" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- For cases where we need role information for authorization (like approval workflows),
-- we already have the get_user_role() function that can be used securely
-- This function uses SECURITY DEFINER so it can read profiles without exposing them to users

-- Verify the existing get_user_role function is still working correctly
-- (This function is used in other RLS policies and should continue to work)
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid DEFAULT auth.uid())
RETURNS app_role
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE user_id = user_uuid);
END;
$$;