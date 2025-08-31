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

      // Get user's role
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      const userRole = userProfile?.role || 'agent';

      // Fetch submissions based on role and status
      let query = supabase.from('submissions').select('*');
      
      if (userRole === 'partner') {
        // Partners see pending submissions from field agents (RLS will filter for agent submissions only)
        query = query.eq('status', 'pending');
      } else if (userRole === 'admin') {
        // Admins see submissions ready for final approval
        query = query.eq('status', 'ready_for_final');
      } else {
        // Agents see their own submissions
        query = query.eq('user_id', user.id);
      }
      
      const { data: submissionsData, error: fetchError } = await query
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

      const submissionIds = (submissionsData || []).map((s: any) => s.id);
      const userIds = (submissionsData || []).map((s: any) => s.user_id);

      // Fetch related data in parallel and join on the client
      const [metricsRes, changesRes, profilesRes] = await Promise.all([
        submissionIds.length
          ? supabase.from('submission_metrics').select('*').in('submission_id', submissionIds)
          : Promise.resolve({ data: [], error: null }),
        submissionIds.length
          ? supabase.from('submission_changes').select('*').in('submission_id', submissionIds)
          : Promise.resolve({ data: [], error: null }),
        userIds.length
          ? supabase.from('profiles').select('user_id, full_name, role').in('user_id', userIds)
          : Promise.resolve({ data: [], error: null })
      ] as any);

      if (metricsRes.error || changesRes.error || profilesRes.error) {
        console.error('Error fetching related data:', metricsRes.error || changesRes.error || profilesRes.error);
      }

      const metricsBySubmission = new Map<string, any[]>();
      (metricsRes.data || []).forEach((m: any) => {
        const arr = metricsBySubmission.get(m.submission_id) || [];
        arr.push(m);
        metricsBySubmission.set(m.submission_id, arr);
      });

      const changesBySubmission = new Map<string, any[]>();
      (changesRes.data || []).forEach((c: any) => {
        const arr = changesBySubmission.get(c.submission_id) || [];
        arr.push(c);
        changesBySubmission.set(c.submission_id, arr);
      });

      const profileMap = new Map<string, any>();
      (profilesRes.data || []).forEach((p: any) => {
        profileMap.set(p.user_id, p);
      });

      // Transform data to match component interface
      const transformedData: SubmissionData[] = (submissionsData || []).map((item: any) => ({
        id: item.id,
        submittedBy: profileMap.get(item.user_id)?.full_name || 'Unknown User',
        submittedAt: item.submitted_at ? new Date(item.submitted_at).toLocaleString() : '',
        lastModified: item.last_modified ? new Date(item.last_modified).toLocaleString() : '',
        category: item.category,
        location: item.location,
        description: item.description,
        status: item.status,
        priority: item.priority,
        submission_metrics: (metricsBySubmission.get(item.id) || []) as any,
        submission_changes: (changesBySubmission.get(item.id) || []) as any,
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

  const partnerApproveSubmission = async (submissionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required');

      // Mark submission as ready for final approval
      const { error: updateErr } = await supabase
        .from('submissions')
        .update({
          status: 'ready_for_final'
        })
        .eq('id', submissionId);
      if (updateErr) throw updateErr;

      toast({
        title: "Submission Approved",
        description: "Submission sent to administrators for final approval.",
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

  const finalApproveSubmission = async (submissionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required');

      // Fetch submission details and approved metrics
      const [submissionRes, metricsRes] = await Promise.all([
        supabase.from('submissions')
          .select('id, category, location, submitted_at')
          .eq('id', submissionId)
          .maybeSingle(),
        supabase.from('submission_metrics')
          .select('field, value, approval_status')
          .eq('submission_id', submissionId)
          .eq('approval_status', 'approved')
      ]);

      if (submissionRes.error) throw submissionRes.error;
      const submission = submissionRes.data;
      if (!submission) throw new Error('Submission not found');
      if (metricsRes.error) throw metricsRes.error;

      // Insert into live_metrics (Admins only - enforced by RLS)
      const approvedMetrics = metricsRes.data || [];
      if (approvedMetrics.length > 0) {
        const year = submission.submitted_at
          ? new Date(submission.submitted_at as any).getFullYear()
          : new Date().getFullYear();
        const rows = approvedMetrics.map((m: any) => ({
          submission_id: submission.id,
          field: m.field,
          value: m.value,
          approved_by: user.id,
          category: submission.category,
          location: submission.location,
          year
        }));
        const { error: liveErr } = await supabase.from('live_metrics').insert(rows);
        if (liveErr) throw liveErr;
      }

      // Mark submission as approved and record final approver
      const { error: updateErr } = await supabase
        .from('submissions')
        .update({
          status: 'approved',
          final_approved_by: user.id,
          final_approved_at: new Date().toISOString()
        })
        .eq('id', submissionId);
      if (updateErr) throw updateErr;

      toast({
        title: "Final Approval Complete",
        description: "Submission approved and live metrics updated.",
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
    partnerApproveSubmission,
    finalApproveSubmission,
    finalRejectSubmission
  };
};