import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Mic, FileText, Save, MapPin, Calendar, Users, WifiOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import FileUpload from "@/components/FileUpload";
import VoiceRecorder from "@/components/VoiceRecorder";
import GoogleDocsIntegration from "@/components/GoogleDocsIntegration";

interface DataSubmissionFormProps {
  userRole: "admin" | "partner" | "agent";
}

const DataSubmissionForm: React.FC<DataSubmissionFormProps> = ({ userRole }) => {
  const { toast } = useToast();
  const [isOffline, setIsOffline] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    category: "",
    location: "",
    date: "",
    language: "english",
    description: "",
    numbers: {
      individualsReached: "",
      scholarshipsDistributed: "",
      schoolsReached: "",
      communitiesEngaged: "",
      presentationsConducted: "",
      leadersTrained: "",
      safeSchooling: "",
      universityScholarships: "",
      vocationalTraining: "",
      traumaCare: "",
      safeHomes: "",
      newSurvivors: "",
      careStaff: "",
      totalStaff: "",
      counselingSupport: "",
      financialPackages: "",
      familyReintegration: "",
      repatriation: ""
    }
  });

  const categories = [
    "Prevention Resources",
    "Safe Housing",
    "Education Support",
    "Trauma Care",
    "Community Engagement",
    "Staff Training",
    "Reintegration",
    "Financial Support"
  ];

  const languages = [
    { value: "english", label: "English" },
    { value: "khmer", label: "Khmer (ខ្មែរ)" },
    { value: "nepali", label: "Nepali (नेपाली)" }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Include attachments in submission
    const submissionData = {
      ...formData,
      attachments: attachments
    };
    
    // Simulate offline storage
    if (isOffline) {
      localStorage.setItem('offline_submission_' + Date.now(), JSON.stringify(submissionData));
      toast({
        title: "Saved Offline",
        description: `Your submission with ${attachments.length} attachment(s) has been saved locally and will be synced when connection is restored.`,
        variant: "default"
      });
    } else {
      toast({
        title: "Submission Sent",
        description: `Your data with ${attachments.length} attachment(s) has been submitted for review and approval.`,
        variant: "default"
      });
    }

    // Reset form data but keep attachments
    setFormData({
      category: "",
      location: "",
      date: "",
      language: "english",
      description: "",
      numbers: {
        individualsReached: "",
        scholarshipsDistributed: "",
        schoolsReached: "",
        communitiesEngaged: "",
        presentationsConducted: "",
        leadersTrained: "",
        safeSchooling: "",
        universityScholarships: "",
        vocationalTraining: "",
        traumaCare: "",
        safeHomes: "",
        newSurvivors: "",
        careStaff: "",
        totalStaff: "",
        counselingSupport: "",
        financialPackages: "",
        familyReintegration: "",
        repatriation: ""
      }
    });
    // Don't reset attachments - keep them for the next submission
  };

  const handleNumberChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      numbers: {
        ...prev.numbers,
        [field]: value
      }
    }));
  };

  const handleFileUpload = (files: any[]) => {
    setAttachments(prev => [...prev, ...files.map(f => ({ ...f, type: 'file' }))]);
    toast({
      title: "Files Added",
      description: `${files.length} file(s) added to your submission.`,
      variant: "default"
    });
  };

  const handleVoiceRecording = (audioBlob: Blob, duration: number) => {
    const recording = {
      id: Date.now().toString(),
      type: 'voice',
      blob: audioBlob,
      duration: duration,
      name: `Voice Note ${new Date().toLocaleTimeString()}`,
      size: audioBlob.size
    };
    setAttachments(prev => [...prev, recording]);
    toast({
      title: "Voice Note Added",
      description: `Voice recording (${Math.round(duration)}s) added to your submission.`,
      variant: "default"
    });
  };

  // Add function to remove individual attachments
  const removeAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
    toast({
      title: "Attachment Removed",
      description: "File has been removed from your submission.",
      variant: "default"
    });
  };

  // Add a function to clear all attachments if needed
  const clearAllAttachments = () => {
    setAttachments([]);
    toast({
      title: "Attachments Cleared",
      description: "All files, voice notes, and documents have been removed.",
      variant: "default"
    });
  };

  const handleDocumentImport = (document: any) => {
    const docAttachment = {
      id: document.id,
      type: 'document',
      name: document.title,
      content: document.content,
      url: document.url,
      lastModified: document.lastModified,
      size: document.content.length
    };
    setAttachments(prev => [...prev, docAttachment]);
    toast({
      title: "Document Added",
      description: `"${document.title}" imported from Google Docs.`,
      variant: "default"
    });
  };

  // Calculate deadline information
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const currentDay = currentDate.getDate();
  
  // Deadline is the 10th of current month
  const deadlineDate = new Date(currentYear, currentMonth, 10);
  const isAfterDeadline = currentDay > 10;
  const nextDeadlineDate = new Date(currentYear, currentMonth + 1, 10);
  const daysUntilDeadline = isAfterDeadline 
    ? Math.ceil((nextDeadlineDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
    : Math.ceil((deadlineDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      {userRole === "partner" && (
        <Card className={`border-2 ${isAfterDeadline ? 'border-destructive' : daysUntilDeadline <= 5 ? 'border-warning' : 'border-info'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Submission Deadline
            </CardTitle>
            <CardDescription>
              {isAfterDeadline ? (
                <span className="text-destructive font-medium">
                  The submission deadline for this month has passed. Next deadline: {nextDeadlineDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              ) : (
                <span className={daysUntilDeadline <= 5 ? 'text-warning font-medium' : 'text-info'}>
                  Deadline: {deadlineDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} 
                  {daysUntilDeadline === 0 ? ' (Today!)' : ` (${daysUntilDeadline} days remaining)`}
                </span>
              )}
            </CardDescription>
          </CardHeader>
        </Card>
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Data Submission</h2>
          <p className="text-muted-foreground">Submit humanitarian impact data for review</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOffline(!isOffline)}
            className={isOffline ? "border-warning text-warning" : ""}
          >
            <WifiOff className="h-4 w-4 mr-2" />
            {isOffline ? "Offline Mode" : "Online Mode"}
          </Button>
          {isOffline && <Badge variant="outline" className="border-warning text-warning">Offline</Badge>}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>General details about this submission</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category.toLowerCase().replace(/\s+/g, '_')}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={formData.language} onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map(lang => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Location
                </Label>
                <Input
                  id="location"
                  placeholder="City, Region, Country"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Provide detailed description of activities and outcomes..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Impact Metrics</CardTitle>
            <CardDescription>Enter numerical data for impact tracking (leave blank if not applicable)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="individualsReached">Individuals Reached with Prevention Resources</Label>
                <Input
                  id="individualsReached"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.numbers.individualsReached}
                  onChange={(e) => handleNumberChange('individualsReached', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scholarshipsDistributed">Prevention Scholarships/Kits Distributed</Label>
                <Input
                  id="scholarshipsDistributed"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.numbers.scholarshipsDistributed}
                  onChange={(e) => handleNumberChange('scholarshipsDistributed', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="schoolsReached">Schools Reached with Prevention Resources</Label>
                <Input
                  id="schoolsReached"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.numbers.schoolsReached}
                  onChange={(e) => handleNumberChange('schoolsReached', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="communitiesEngaged">Communities Engaged</Label>
                <Input
                  id="communitiesEngaged"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.numbers.communitiesEngaged}
                  onChange={(e) => handleNumberChange('communitiesEngaged', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="presentationsConducted">Prevention Presentations Conducted</Label>
                <Input
                  id="presentationsConducted"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.numbers.presentationsConducted}
                  onChange={(e) => handleNumberChange('presentationsConducted', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="leadersTrained">Makwa Community Leaders Trained</Label>
                <Input
                  id="leadersTrained"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.numbers.leadersTrained}
                  onChange={(e) => handleNumberChange('leadersTrained', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="safeSchooling">Individuals with Safe Schooling</Label>
                <Input
                  id="safeSchooling"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.numbers.safeSchooling}
                  onChange={(e) => handleNumberChange('safeSchooling', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="universityScholarships">University Scholarships Supported</Label>
                <Input
                  id="universityScholarships"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.numbers.universityScholarships}
                  onChange={(e) => handleNumberChange('universityScholarships', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vocationalTraining">Individuals in Vocational Training</Label>
                <Input
                  id="vocationalTraining"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.numbers.vocationalTraining}
                  onChange={(e) => handleNumberChange('vocationalTraining', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="traumaCare">Individuals with Trauma-Informed Care</Label>
                <Input
                  id="traumaCare"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.numbers.traumaCare}
                  onChange={(e) => handleNumberChange('traumaCare', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="safeHomes">Individuals in Safe Homes</Label>
                <Input
                  id="safeHomes"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.numbers.safeHomes}
                  onChange={(e) => handleNumberChange('safeHomes', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newSurvivors">New Survivors in Safe Housing This Year</Label>
                <Input
                  id="newSurvivors"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.numbers.newSurvivors}
                  onChange={(e) => handleNumberChange('newSurvivors', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="careStaff">Staff Providing Trauma-Informed Care</Label>
                <Input
                  id="careStaff"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.numbers.careStaff}
                  onChange={(e) => handleNumberChange('careStaff', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalStaff">Total Staff Across Project</Label>
                <Input
                  id="totalStaff"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.numbers.totalStaff}
                  onChange={(e) => handleNumberChange('totalStaff', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="counselingSupport">Individuals with Counseling Support</Label>
                <Input
                  id="counselingSupport"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.numbers.counselingSupport}
                  onChange={(e) => handleNumberChange('counselingSupport', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="financialPackages">Financial Assistance Packages Provided</Label>
                <Input
                  id="financialPackages"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.numbers.financialPackages}
                  onChange={(e) => handleNumberChange('financialPackages', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="familyReintegration">Individuals Reintegrated with Family</Label>
                <Input
                  id="familyReintegration"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.numbers.familyReintegration}
                  onChange={(e) => handleNumberChange('familyReintegration', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="repatriation">Individuals Repatriated</Label>
                <Input
                  id="repatriation"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.numbers.repatriation}
                  onChange={(e) => handleNumberChange('repatriation', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attachments & Media</CardTitle>
            <CardDescription>Add supporting documents, voice notes, and files from various sources</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="files" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="files" className="flex items-center space-x-2">
                  <Upload className="h-4 w-4" />
                  <span>Upload Files</span>
                </TabsTrigger>
                <TabsTrigger value="voice" className="flex items-center space-x-2">
                  <Mic className="h-4 w-4" />
                  <span>Voice Notes</span>
                </TabsTrigger>
                <TabsTrigger value="docs" className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Google Docs</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="files" className="mt-4">
                <FileUpload onFilesUpload={handleFileUpload} />
              </TabsContent>
              
              <TabsContent value="voice" className="mt-4">
                <VoiceRecorder onRecordingComplete={handleVoiceRecording} />
              </TabsContent>
              
              <TabsContent value="docs" className="mt-4">
                <GoogleDocsIntegration onDocumentImport={handleDocumentImport} />
              </TabsContent>
            </Tabs>
            
            {attachments.length > 0 && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-3">Attachments Summary ({attachments.length})</h4>
                <div className="grid gap-2">
                  {attachments.map((attachment, index) => (
                    <div key={attachment.id || index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        {attachment.type === 'voice' && <Mic className="h-4 w-4 text-primary" />}
                        {attachment.type === 'file' && <Upload className="h-4 w-4 text-primary" />}
                        {attachment.type === 'document' && <FileText className="h-4 w-4 text-primary" />}
                        <span className="truncate max-w-48">{attachment.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {attachment.type === 'voice' 
                          ? `${Math.round(attachment.duration || 0)}s` 
                          : typeof attachment.size === 'number'
                            ? `${Math.round(attachment.size / 1024)}KB`
                            : attachment.size
                        }
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          {attachments.length > 0 && (
            <Button 
              variant="ghost" 
              type="button" 
              onClick={clearAllAttachments}
              className="text-muted-foreground hover:text-destructive"
            >
              Clear Attachments ({attachments.length})
            </Button>
          )}
          <Button variant="outline" type="button">
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button type="submit">
            Submit for Review
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DataSubmissionForm;