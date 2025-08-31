import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type SubmissionWithRelations = Database['public']['Tables']['submissions']['Row'] & {
  profiles?: Database['public']['Tables']['profiles']['Row'] | null;
  submission_metrics?: Database['public']['Tables']['submission_metrics']['Row'][];
  submission_changes?: Database['public']['Tables']['submission_changes']['Row'][];
};

export interface SubmissionData {
  id: string;
  submittedBy: string;
  submittedAt: string;
  lastModified: string;
  category: string;
  location: string;
  description: string;
  status: string;
  priority: string;
  profiles?: Database['public']['Tables']['profiles']['Row'] | null;
  submission_metrics?: Database['public']['Tables']['submission_metrics']['Row'][];
  submission_changes?: Database['public']['Tables']['submission_changes']['Row'][];
  final_approved_by?: string | null;
  final_approved_at?: string | null;
  final_rejection_reason?: string | null;
}

export const useRoleBasedSubmissions = () => {
  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user and their role
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError('Authentication required');
        return;
      }

      // Fetch submissions with related data
      const { data: rawData, error: fetchError } = await supabase
        .from('submissions')
        .select(`
          *,
          profiles!submissions_user_id_fkey (
            full_name,
            role
          ),
          submission_metrics (*),
          submission_changes (*)
        `)
        .order('submitted_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching submissions:', fetchError);
        setError('Failed to fetch submissions');
        toast({
          title: "Error",
          description: "Failed to load submissions. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Transform data to match component interface
      const transformedData: SubmissionData[] = (rawData || []).map((item: any) => ({
        id: item.id,
        submittedBy: item.profiles?.full_name || 'Unknown User',
        submittedAt: new Date(item.submitted_at).toLocaleString(),
        lastModified: new Date(item.last_modified).toLocaleString(),
        category: item.category,
        location: item.location,
        description: item.description,
        status: item.status,
        priority: item.priority,
        profiles: item.profiles,
        submission_metrics: item.submission_metrics,
        submission_changes: item.submission_changes,
        final_approved_by: item.final_approved_by,
        final_approved_at: item.final_approved_at,
        final_rejection_reason: item.final_rejection_reason
      }));

      setSubmissions(transformedData);
    } catch (err) {
      console.error('Unexpected error fetching submissions:', err);
      setError('Unexpected error occurred');
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const approveMetric = async (submissionId: string, metricField: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required');

      const { error } = await supabase
        .from('submission_metrics')
        .update({
          approval_status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('submission_id', submissionId)
        .eq('field', metricField);

      if (error) throw error;

      toast({
        title: "Metric Approved",
        description: `${metricField.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} has been approved.`,
        variant: "default"
      });

      // Refresh data
      await fetchSubmissions();
    } catch (error) {
      console.error('Error approving metric:', error);
      toast({
        title: "Error",
        description: "Failed to approve metric. Please try again.",
        variant: "destructive"
      });
    }
  };

  const rejectMetric = async (submissionId: string, metricField: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('submission_metrics')
        .update({
          approval_status: 'rejected',
          rejection_reason: reason
        })
        .eq('submission_id', submissionId)
        .eq('field', metricField);

      if (error) throw error;

      toast({
        title: "Metric Rejected",
        description: `${metricField.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} has been rejected.`,
        variant: "destructive"
      });

      // Refresh data
      await fetchSubmissions();
    } catch (error) {
      console.error('Error rejecting metric:', error);
      toast({
        title: "Error",
        description: "Failed to reject metric. Please try again.",
        variant: "destructive"
      });
    }
  };

  const finalApproveSubmission = async (submissionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required');

      const { error } = await supabase
        .from('submissions')
        .update({
          status: 'approved',
          final_approved_by: user.id,
          final_approved_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (error) throw error;

      toast({
        title: "Submission Approved",
        description: "All data has been approved and added to live metrics.",
        variant: "default"
      });

      // Refresh data
      await fetchSubmissions();
    } catch (error) {
      console.error('Error approving submission:', error);
      toast({
        title: "Error",
        description: "Failed to approve submission. Please try again.",
        variant: "destructive"
      });
    }
  };

  const finalRejectSubmission = async (submissionId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          status: 'rejected',
          final_rejection_reason: reason
        })
        .eq('id', submissionId);

      if (error) throw error;

      toast({
        title: "Submission Rejected",
        description: "Submitter has been notified with feedback for revision.",
        variant: "destructive"
      });

      // Refresh data
      await fetchSubmissions();
    } catch (error) {
      console.error('Error rejecting submission:', error);
      toast({
        title: "Error",
        description: "Failed to reject submission. Please try again.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  return {
    submissions,
    loading,
    error,
    refetch: fetchSubmissions,
    approveMetric,
    rejectMetric,
    finalApproveSubmission,
    finalRejectSubmission
  };
};