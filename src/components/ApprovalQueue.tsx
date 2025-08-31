import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  MapPin, 
  Calendar, 
  User,
  FileText,
  AlertTriangle,
  MessageSquare,
  Check,
  X,
  Loader2
} from "lucide-react";
import { useRoleBasedSubmissions } from "@/hooks/useRoleBasedSubmissions";
import { MetricApproval } from "@/types/submissions";


const ApprovalQueue = () => {
  const { 
    submissions: rawSubmissions, 
    loading, 
    error, 
    approveMetric, 
    rejectMetric, 
    finalApproveSubmission, 
    finalRejectSubmission 
  } = useRoleBasedSubmissions();
  
  const [rejectionReason, setRejectionReason] = useState("");
  const [metricRejectionReason, setMetricRejectionReason] = useState("");

  // Transform data to match existing component structure
  const submissions = rawSubmissions
    .filter(sub => sub.status !== 'approved') // Only show pending/partial approvals
    .map(sub => ({
      id: sub.id,
      submittedBy: sub.submittedBy,
      submittedAt: sub.submittedAt,
      lastModified: sub.lastModified,
      category: sub.category,
      location: sub.location,
      description: sub.description,
      changes: sub.submission_changes?.map(change => ({
        field: change.field,
        oldValue: change.old_value || '',
        newValue: change.new_value,
        reason: change.reason,
        timestamp: new Date(change.created_at).toLocaleString()
      })) || [],
      metrics: sub.submission_metrics?.map(metric => ({
        field: metric.field,
        value: metric.value,
        approval: {
          status: metric.approval_status as 'pending' | 'approved' | 'rejected',
          approvedBy: metric.approved_by,
          approvedAt: metric.approved_at,
          rejectionReason: metric.rejection_reason
        }
      })) || [],
      status: sub.status as 'pending' | 'partially_approved' | 'ready_for_final' | 'approved' | 'rejected',
      priority: sub.priority as 'low' | 'normal' | 'high',
      finalApproval: {
        status: sub.final_approved_by ? 'approved' : 'pending' as 'pending' | 'approved' | 'rejected',
        approvedBy: sub.final_approved_by,
        approvedAt: sub.final_approved_at,
        rejectionReason: sub.final_rejection_reason
      }
    }));

  const handleMetricApprove = (submissionId: string, metricField: string) => {
    approveMetric(submissionId, metricField);
  };

  const handleMetricReject = (submissionId: string, metricField: string, reason: string) => {
    rejectMetric(submissionId, metricField, reason);
    setMetricRejectionReason("");
  };

  const handleFinalApprove = (submissionId: string) => {
    finalApproveSubmission(submissionId);
  };

  const handleFinalReject = (submissionId: string, reason: string) => {
    finalRejectSubmission(submissionId, reason);
    setRejectionReason("");
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High Priority</Badge>;
      case "normal":
        return <Badge variant="secondary">Normal</Badge>;
      case "low":
        return <Badge variant="outline">Low Priority</Badge>;
      default:
        return <Badge variant="secondary">Normal</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="border-warning text-warning">Pending Review</Badge>;
      case "partially_approved":
        return <Badge variant="outline" className="border-primary text-primary">Partially Approved</Badge>;
      case "ready_for_final":
        return <Badge variant="outline" className="border-success text-success">Ready for Final Approval</Badge>;
      case "approved":
        return <Badge variant="outline" className="border-success text-success">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="border-destructive text-destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getMetricApprovalBadge = (approval: MetricApproval) => {
    switch (approval.status) {
      case "approved":
        return <Badge variant="outline" className="border-success text-success text-xs">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="border-destructive text-destructive text-xs">Rejected</Badge>;
      case "pending":
        return <Badge variant="outline" className="border-warning text-warning text-xs">Pending</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Unknown</Badge>;
    }
  };

  const formatMetricLabel = (field: string) => {
    return field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading submissions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
            <p className="text-muted-foreground text-center">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Approval Queue</h2>
          <p className="text-muted-foreground">Review and approve data submissions</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="border-warning text-warning">
            {submissions.length} Pending
          </Badge>
          <Badge variant="outline" className="border-destructive text-destructive">
            {submissions.filter(s => s.priority === "high").length} High Priority
          </Badge>
        </div>
      </div>

      <div className="space-y-4">
        {submissions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-12 w-12 text-success mb-4" />
              <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
              <p className="text-muted-foreground text-center">
                No pending submissions to review at this time.
              </p>
            </CardContent>
          </Card>
        ) : (
          submissions.map((submission) => (
            <Card key={submission.id} className="border-l-4 border-l-warning">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-base">{submission.id}</CardTitle>
                      {getPriorityBadge(submission.priority)}
                      {submission.changes.length > 0 && (
                        <Badge variant="outline" className="border-primary text-primary">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Updated
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="flex items-center space-x-4 text-sm">
                      <span className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {submission.submittedBy}
                      </span>
                      <span className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {submission.location}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {submission.submittedAt}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Review Submission: {submission.id}</DialogTitle>
                          <DialogDescription>
                            Detailed review of data submission from {submission.submittedBy}
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-6">
                          {/* Basic Info */}
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <Label className="text-sm font-medium">Category</Label>
                              <p className="text-sm text-muted-foreground">{submission.category}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Location</Label>
                              <p className="text-sm text-muted-foreground">{submission.location}</p>
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm font-medium">Description</Label>
                            <p className="text-sm text-muted-foreground mt-1">{submission.description}</p>
                          </div>

                          {/* Metrics with Individual Approvals */}
                          <div>
                            <Label className="text-sm font-medium mb-3 block">Submitted Metrics - Individual Approval Required</Label>
                            <div className="space-y-3">
                              {submission.metrics.map((metric) => (
                                <div key={metric.field} className="flex items-center justify-between p-4 border rounded-lg">
                                  <div className="space-y-1">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium text-sm">{formatMetricLabel(metric.field)}</span>
                                      {getMetricApprovalBadge(metric.approval)}
                                    </div>
                                    <div className="text-lg font-bold text-primary">{metric.value}</div>
                                    {metric.approval.status === "approved" && (
                                      <div className="text-xs text-muted-foreground">
                                        Approved by {metric.approval.approvedBy} at {metric.approval.approvedAt}
                                      </div>
                                    )}
                                    {metric.approval.status === "rejected" && (
                                      <div className="text-xs text-destructive">
                                        Rejected: {metric.approval.rejectionReason}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {metric.approval.status === "pending" && (
                                    <div className="flex space-x-2">
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button variant="outline" size="sm" className="border-destructive text-destructive">
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                          <DialogHeader>
                                            <DialogTitle>Reject Metric</DialogTitle>
                                            <DialogDescription>
                                              Reject {formatMetricLabel(metric.field)} and provide feedback
                                            </DialogDescription>
                                          </DialogHeader>
                                          <div className="space-y-4">
                                            <div>
                                              <Label htmlFor="metric-rejection-reason">Rejection Reason</Label>
                                              <Textarea
                                                id="metric-rejection-reason"
                                                placeholder="Explain why this metric is being rejected..."
                                                value={metricRejectionReason}
                                                onChange={(e) => setMetricRejectionReason(e.target.value)}
                                                rows={3}
                                              />
                                            </div>
                                            <div className="flex justify-end space-x-2">
                                              <Button variant="outline" onClick={() => setMetricRejectionReason("")}>
                                                Cancel
                                              </Button>
                                              <Button 
                                                variant="destructive"
                                                onClick={() => handleMetricReject(submission.id, metric.field, metricRejectionReason)}
                                                disabled={!metricRejectionReason.trim()}
                                              >
                                                Reject Metric
                                              </Button>
                                            </div>
                                          </div>
                                        </DialogContent>
                                      </Dialog>
                                      
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="border-success text-success hover:bg-success hover:text-success-foreground"
                                        onClick={() => handleMetricApprove(submission.id, metric.field)}
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Changes */}
                          {submission.changes.length > 0 && (
                            <div>
                              <Label className="text-sm font-medium mb-3 block text-primary">Recent Changes</Label>
                              <div className="space-y-3">
                                {submission.changes.map((change, index) => (
                                  <div key={index} className="p-4 border border-primary/20 bg-primary/5 rounded-lg">
                                    <div className="flex justify-between items-start mb-2">
                                      <span className="font-medium text-sm">
                                        {change.field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                      </span>
                                      <span className="text-xs text-muted-foreground">{change.timestamp}</span>
                                    </div>
                                    <div className="text-sm space-y-1">
                                      <div>
                                        <span className="text-muted-foreground">Changed from: </span>
                                        <span className="line-through">{change.oldValue}</span>
                                        <span className="text-muted-foreground"> to: </span>
                                        <span className="font-medium">{change.newValue}</span>
                                      </div>
                                      <div className="flex items-start space-x-2">
                                        <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <span className="text-muted-foreground">Reason: {change.reason}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Final Submission Approval */}
                          {submission.status === "ready_for_final" && (
                            <div className="p-4 bg-success/5 border border-success/20 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium text-success">Ready for Final Approval</h4>
                                  <p className="text-sm text-muted-foreground">All metrics have been individually approved. Finalize to add to live metrics.</p>
                                </div>
                                <div className="flex space-x-2">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline" className="border-destructive text-destructive">
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Reject Final
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Reject Final Submission</DialogTitle>
                                        <DialogDescription>
                                          Reject the entire submission even though individual metrics were approved.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <div>
                                          <Label htmlFor="final-rejection-reason">Final Rejection Reason</Label>
                                          <Textarea
                                            id="final-rejection-reason"
                                            placeholder="Explain why the final submission is being rejected..."
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            rows={4}
                                          />
                                        </div>
                                        <div className="flex justify-end space-x-2">
                                          <Button variant="outline" onClick={() => setRejectionReason("")}>
                                            Cancel
                                          </Button>
                                          <Button 
                                            variant="destructive"
                                            onClick={() => handleFinalReject(submission.id, rejectionReason)}
                                            disabled={!rejectionReason.trim()}
                                          >
                                            Reject Final Submission
                                          </Button>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                  
                                  <Button 
                                    onClick={() => handleFinalApprove(submission.id)}
                                    className="bg-success hover:bg-success/90 text-success-foreground"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Finalize & Add to Live Metrics
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}

                          {submission.status !== "ready_for_final" && (
                            <div className="p-4 bg-warning/5 border border-warning/20 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-warning" />
                                <span className="text-sm font-medium text-warning">
                                  {submission.status === "pending" 
                                    ? "Waiting for individual metric approvals" 
                                    : "Some metrics still need approval"}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{submission.description}</p>
                    {getStatusBadge(submission.status)}
                  </div>
                  
                  {submission.changes.length > 0 && (
                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-primary">
                          {submission.changes.length} Recent Change{submission.changes.length > 1 ? 's' : ''}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Last updated: {submission.lastModified}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Fields updated: {submission.changes.map(c => c.field).join(', ')}
                      </div>
                    </div>
                  )}

                  {/* Metrics Overview */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Metrics Status:</span>
                      <div className="flex space-x-2">
                        <Badge variant="outline" className="border-success text-success text-xs">
                          {submission.metrics.filter(m => m.approval.status === "approved").length} Approved
                        </Badge>
                        <Badge variant="outline" className="border-warning text-warning text-xs">
                          {submission.metrics.filter(m => m.approval.status === "pending").length} Pending
                        </Badge>
                        {submission.metrics.filter(m => m.approval.status === "rejected").length > 0 && (
                          <Badge variant="outline" className="border-destructive text-destructive text-xs">
                            {submission.metrics.filter(m => m.approval.status === "rejected").length} Rejected
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {submission.metrics.slice(0, 4).map((metric) => (
                        <Badge key={metric.field} variant="outline" className="text-xs">
                          {formatMetricLabel(metric.field)}: {metric.value}
                        </Badge>
                      ))}
                      {submission.metrics.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{submission.metrics.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ApprovalQueue;