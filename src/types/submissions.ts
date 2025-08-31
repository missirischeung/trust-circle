export interface MetricApproval {
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export interface SubmissionMetric {
  field: string;
  value: number;
  approval: MetricApproval;
}

export interface SubmissionChange {
  field: string;
  oldValue: string;
  newValue: string;
  reason: string;
  timestamp: string;
}

export interface Submission {
  id: string;
  submittedBy: string;
  submittedAt: string;
  lastModified: string;
  category: string;
  location: string;
  description: string;
  changes: SubmissionChange[];
  metrics: SubmissionMetric[];
  status: 'pending' | 'partially_approved' | 'ready_for_final' | 'approved' | 'rejected';
  priority: 'low' | 'normal' | 'high';
  finalApproval?: {
    status: 'pending' | 'approved' | 'rejected';
    approvedBy?: string;
    approvedAt?: string;
    rejectionReason?: string;
  };
}