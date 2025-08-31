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
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Submission, SubmissionMetric, MetricApproval } from "@/types/submissions";

// Mock data for pending submissions with individual metric approvals
const pendingSubmissions: Submission[] = [
  {
    id: "SUB-001",
    submittedBy: "partner.cambodia@org.com",
    submittedAt: "2024-01-15 14:30",
    lastModified: "2024-01-15 16:45",
    category: "Prevention Resources",
    location: "Phnom Penh, Cambodia",
    description: "Distribution of prevention materials and educational resources to 5 local schools in the Phnom Penh area.",
    changes: [
      {
        field: "individualsReached",
        oldValue: "150",
        newValue: "175",
        reason: "Found additional registration forms from afternoon session",
        timestamp: "2024-01-15 16:45"
      }
    ],
    metrics: [
      { field: "individualsReached", value: 175, approval: { status: "pending" } },
      { field: "scholarshipsDistributed", value: 25, approval: { status: "approved", approvedBy: "admin@org.com", approvedAt: "2024-01-15 17:00" } },
      { field: "schoolsReached", value: 5, approval: { status: "pending" } },
      { field: "communitiesEngaged", value: 3, approval: { status: "pending" } }
    ],
    status: "partially_approved",
    priority: "normal",
    finalApproval: { status: "pending" }
  },
  {
    id: "SUB-002",
    submittedBy: "field.kathmandu@org.com",
    submittedAt: "2024-01-14 09:15",
    lastModified: "2024-01-14 09:15",
    category: "Safe Housing",
    location: "Kathmandu, Nepal",
    description: "Monthly report on safe housing capacity and new survivor intake.",
    changes: [],
    metrics: [
      { field: "safeHomes", value: 12, approval: { status: "pending" } },
      { field: "newSurvivors", value: 3, approval: { status: "pending" } },
      { field: "careStaff", value: 8, approval: { status: "pending" } },
      { field: "traumaCare", value: 15, approval: { status: "pending" } }
    ],
    status: "pending",
    priority: "high",
    finalApproval: { status: "pending" }
  },
  {
    id: "SUB-003",
    submittedBy: "partner.bangkok@org.com",
    submittedAt: "2024-01-13 11:20",
    lastModified: "2024-01-14 08:30",
    category: "Community Engagement",
    location: "Bangkok, Thailand",
    description: "Community leader training session and prevention presentation outcomes.",
    changes: [
      {
        field: "leadersTrained",
        oldValue: "12",
        newValue: "15",
        reason: "Three additional attendees joined late and completed full training",
        timestamp: "2024-01-14 08:30"
      },
      {
        field: "presentationsConducted",
        oldValue: "2",
        newValue: "3",
        reason: "Added impromptu session for local government officials",
        timestamp: "2024-01-14 08:30"
      }
    ],
    metrics: [
      { field: "leadersTrained", value: 15, approval: { status: "approved", approvedBy: "admin@org.com", approvedAt: "2024-01-14 10:00" } },
      { field: "presentationsConducted", value: 3, approval: { status: "approved", approvedBy: "admin@org.com", approvedAt: "2024-01-14 10:00" } },
      { field: "communitiesEngaged", value: 2, approval: { status: "approved", approvedBy: "admin@org.com", approvedAt: "2024-01-14 10:00" } }
    ],
    status: "ready_for_final",
    priority: "normal",
    finalApproval: { status: "pending" }
  }
];

const ApprovalQueue = () => {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState(pendingSubmissions);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [metricRejectionReason, setMetricRejectionReason] = useState("");

  const handleMetricApprove = (submissionId: string, metricField: string) => {
    setSubmissions(prev => 
      prev.map(sub => {
        if (sub.id === submissionId) {
          const updatedMetrics = sub.metrics.map(metric => 
            metric.field === metricField 
              ? { ...metric, approval: { status: "approved" as const, approvedBy: "admin@org.com", approvedAt: new Date().toISOString() } }
              : metric
          );
          
          // Check if all metrics are approved to update submission status
          const allApproved = updatedMetrics.every(m => m.approval.status === "approved");
          const newStatus: Submission['status'] = allApproved ? "ready_for_final" : "partially_approved";
          
          return { ...sub, metrics: updatedMetrics, status: newStatus };
        }
        return sub;
      })
    );
    
    toast({
      title: "Metric Approved",
      description: `${metricField.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} has been approved.`,
      variant: "default"
    });
  };

  const handleMetricReject = (submissionId: string, metricField: string, reason: string) => {
    setSubmissions(prev => 
      prev.map(sub => {
        if (sub.id === submissionId) {
          const updatedMetrics = sub.metrics.map(metric => 
            metric.field === metricField 
              ? { ...metric, approval: { status: "rejected" as const, rejectionReason: reason } }
              : metric
          );
          return { ...sub, metrics: updatedMetrics };
        }
        return sub;
      })
    );
    
    toast({
      title: "Metric Rejected",
      description: `${metricField.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} has been rejected.`,
      variant: "destructive"
    });
    setMetricRejectionReason("");
  };

  const handleFinalApprove = (submissionId: string) => {
    setSubmissions(prev => 
      prev.map(sub => {
        if (sub.id === submissionId) {
          const updatedStatus: Submission['status'] = "approved";
          const updatedFinalApproval: Submission['finalApproval'] = { 
            status: "approved", 
            approvedBy: "admin@org.com", 
            approvedAt: new Date().toISOString() 
          };
          return { 
            ...sub, 
            status: updatedStatus,
            finalApproval: updatedFinalApproval
          };
        }
        return sub;
      }).filter(sub => sub.id !== submissionId) // Remove from queue after final approval
    );
    
    toast({
      title: "Submission Finalized",
      description: "All data has been approved and added to live metrics.",
      variant: "default"
    });
  };

  const handleFinalReject = (submissionId: string, reason: string) => {
    setSubmissions(prev => 
      prev.filter(sub => sub.id !== submissionId)
    );
    toast({
      title: "Submission Rejected",
      description: "Submitter has been notified with feedback for revision.",
      variant: "destructive"
    });
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