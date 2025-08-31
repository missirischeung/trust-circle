-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'partner', 'agent');

-- Create submission status enum
CREATE TYPE public.submission_status AS ENUM ('pending', 'partially_approved', 'ready_for_final', 'approved', 'rejected');

-- Create metric approval status enum  
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Create priority enum
CREATE TYPE public.priority_level AS ENUM ('low', 'normal', 'high');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  role app_role NOT NULL DEFAULT 'agent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create submissions table
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  status submission_status NOT NULL DEFAULT 'pending',
  priority priority_level NOT NULL DEFAULT 'normal',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT now(),
  final_approved_by UUID REFERENCES auth.users(id),
  final_approved_at TIMESTAMP WITH TIME ZONE,
  final_rejection_reason TEXT
);

-- Create submission changes table
CREATE TABLE public.submission_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE NOT NULL,
  field TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create submission metrics table
CREATE TABLE public.submission_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE NOT NULL,
  field TEXT NOT NULL,
  value NUMERIC NOT NULL,
  approval_status approval_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create submission attachments table
CREATE TABLE public.submission_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  file_path TEXT,
  attachment_type TEXT NOT NULL CHECK (attachment_type IN ('file', 'voice', 'google_doc')),
  google_doc_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create live metrics table (approved data goes here)
CREATE TABLE public.live_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  field TEXT NOT NULL,
  value NUMERIC NOT NULL,
  year INTEGER NOT NULL,
  submission_id UUID REFERENCES public.submissions(id),
  approved_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  approved_by UUID REFERENCES auth.users(id) NOT NULL
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_metrics ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID DEFAULT auth.uid())
RETURNS app_role AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE user_id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for submissions
CREATE POLICY "Users can view own submissions" ON public.submissions
  FOR SELECT USING (auth.uid() = user_id OR get_user_role() IN ('admin', 'partner'));

CREATE POLICY "Users can insert own submissions" ON public.submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own submissions" ON public.submissions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins and partners can update all submissions" ON public.submissions
  FOR UPDATE USING (get_user_role() IN ('admin', 'partner'));

-- RLS Policies for submission changes
CREATE POLICY "Users can view changes for accessible submissions" ON public.submission_changes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.submissions s 
      WHERE s.id = submission_id 
      AND (s.user_id = auth.uid() OR get_user_role() IN ('admin', 'partner'))
    )
  );

CREATE POLICY "Users can insert changes for own submissions" ON public.submission_changes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.submissions s 
      WHERE s.id = submission_id 
      AND s.user_id = auth.uid()
    )
  );

-- RLS Policies for submission metrics
CREATE POLICY "Users can view metrics for accessible submissions" ON public.submission_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.submissions s 
      WHERE s.id = submission_id 
      AND (s.user_id = auth.uid() OR get_user_role() IN ('admin', 'partner'))
    )
  );

CREATE POLICY "Users can insert metrics for own submissions" ON public.submission_metrics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.submissions s 
      WHERE s.id = submission_id 
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Partners and admins can update metric approvals" ON public.submission_metrics
  FOR UPDATE USING (get_user_role() IN ('admin', 'partner'));

-- RLS Policies for attachments
CREATE POLICY "Users can view attachments for accessible submissions" ON public.submission_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.submissions s 
      WHERE s.id = submission_id 
      AND (s.user_id = auth.uid() OR get_user_role() IN ('admin', 'partner'))
    )
  );

CREATE POLICY "Users can insert attachments for own submissions" ON public.submission_attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.submissions s 
      WHERE s.id = submission_id 
      AND s.user_id = auth.uid()
    )
  );

-- RLS Policies for live metrics
CREATE POLICY "Everyone can view live metrics" ON public.live_metrics
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert live metrics" ON public.live_metrics
  FOR INSERT WITH CHECK (get_user_role() = 'admin');

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'agent')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for file attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('attachments', 'attachments', false);

-- Storage policies for attachments
CREATE POLICY "Users can upload attachments" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'attachments' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own attachments" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'attachments' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Partners and admins can view all attachments" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'attachments' 
    AND EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() 
      AND p.role IN ('admin', 'partner')
    )
  );

-- Create function to update submission status based on metrics
CREATE OR REPLACE FUNCTION public.update_submission_status()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update submission status when metrics change
CREATE TRIGGER update_submission_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.submission_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_submission_status();

-- Create indexes for better performance
CREATE INDEX idx_submissions_user_id ON public.submissions(user_id);
CREATE INDEX idx_submissions_status ON public.submissions(status);
CREATE INDEX idx_submission_metrics_submission_id ON public.submission_metrics(submission_id);
CREATE INDEX idx_submission_changes_submission_id ON public.submission_changes(submission_id);
CREATE INDEX idx_live_metrics_category_location ON public.live_metrics(category, location);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);