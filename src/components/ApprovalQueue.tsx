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
  MessageSquare
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock data for pending submissions
const pendingSubmissions = [
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
    metrics: {
      individualsReached: 175,
      scholarshipsDistributed: 25,
      schoolsReached: 5,
      communitiesEngaged: 3
    },
    status: "pending",
    priority: "normal"
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
    metrics: {
      safeHomes: 12,
      newSurvivors: 3,
      careStaff: 8,
      traumaCare: 15
    },
    status: "pending",
    priority: "high"
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
    metrics: {
      leadersTrained: 15,
      presentationsConducted: 3,
      communitiesEngaged: 2
    },
    status: "pending",
    priority: "normal"
  }
];

const ApprovalQueue = () => {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState(pendingSubmissions);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApprove = (submissionId: string) => {
    setSubmissions(prev => 
      prev.filter(sub => sub.id !== submissionId)
    );
    toast({
      title: "Submission Approved",
      description: "Data has been approved and added to live metrics.",
      variant: "default"
    });
  };

  const handleReject = (submissionId: string, reason: string) => {
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

  const formatMetrics = (metrics: any) => {
    return Object.entries(metrics)
      .filter(([_, value]) => typeof value === 'number' && value > 0)
      .map(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        return { label, value: value as number };
      });
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

                          {/* Metrics */}
                          <div>
                            <Label className="text-sm font-medium mb-3 block">Submitted Metrics</Label>
                            <div className="grid gap-3 md:grid-cols-2">
                              {formatMetrics(submission.metrics).map(({ label, value }) => (
                                <div key={label} className="flex justify-between items-center p-3 bg-muted/50 rounded">
                                  <span className="text-sm">{label}</span>
                                  <span className="font-medium">{value}</span>
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

                          {/* Action Buttons */}
                          <div className="flex justify-end space-x-4 pt-4 border-t">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Reject Submission</DialogTitle>
                                  <DialogDescription>
                                    Please provide a reason for rejection. This will be sent to the submitter for revision.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="rejection-reason">Rejection Reason</Label>
                                    <Textarea
                                      id="rejection-reason"
                                      placeholder="Explain what needs to be corrected or provide additional guidance..."
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
                                      onClick={() => handleReject(submission.id, rejectionReason)}
                                      disabled={!rejectionReason.trim()}
                                    >
                                      Send Rejection
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            
                            <Button 
                              onClick={() => handleApprove(submission.id)}
                              className="bg-success hover:bg-success/90 text-success-foreground"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">{submission.description}</p>
                  
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

                  <div className="flex flex-wrap gap-2">
                    {formatMetrics(submission.metrics).slice(0, 4).map(({ label, value }) => (
                      <Badge key={label} variant="outline" className="text-xs">
                        {label}: {value}
                      </Badge>
                    ))}
                    {formatMetrics(submission.metrics).length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{formatMetrics(submission.metrics).length - 4} more
                      </Badge>
                    )}
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