import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, FileText, Download, ExternalLink, Key } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface GoogleDocsIntegrationProps {
  onDocumentImport: (document: ImportedDocument) => void;
}

interface ImportedDocument {
  id: string;
  title: string;
  content: string;
  url: string;
  lastModified: string;
  size: string;
}

const GoogleDocsIntegration: React.FC<GoogleDocsIntegrationProps> = ({ onDocumentImport }) => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState(localStorage.getItem('google_api_key') || '');
  const [docUrl, setDocUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [importedDocs, setImportedDocs] = useState<ImportedDocument[]>([]);

  const saveApiKey = () => {
    localStorage.setItem('google_api_key', apiKey);
    toast({
      title: "API Key Saved",
      description: "Your Google API key has been saved locally.",
      variant: "default"
    });
  };

  const extractDocId = (url: string): string | null => {
    // Extract document ID from various Google Docs URL formats
    const patterns = [
      /\/document\/d\/([a-zA-Z0-9-_]+)/,
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
      /\/presentation\/d\/([a-zA-Z0-9-_]+)/,
      /id=([a-zA-Z0-9-_]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const importFromGoogleDocs = async () => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your Google API key first.",
        variant: "destructive"
      });
      return;
    }

    if (!docUrl) {
      toast({
        title: "URL Required",
        description: "Please enter a Google Docs URL.",
        variant: "destructive"
      });
      return;
    }

    const docId = extractDocId(docUrl);
    if (!docId) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid Google Docs URL.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Try to fetch document metadata and content
      const metadataUrl = `https://www.googleapis.com/drive/v3/files/${docId}?fields=name,modifiedTime,size&key=${apiKey}`;
      const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;

      // Fetch metadata
      const metadataResponse = await fetch(metadataUrl);
      if (!metadataResponse.ok) {
        throw new Error('Failed to fetch document metadata');
      }
      const metadata = await metadataResponse.json();

      // For content, we'll simulate since direct export requires OAuth
      // In a real implementation, you'd need OAuth 2.0 flow
      const simulatedContent = `[Document content from: ${metadata.name}]\n\nThis is a simulated import from Google Docs. In a real implementation, the actual document content would be fetched using Google Drive API with proper OAuth 2.0 authentication.\n\nDocument: ${metadata.name}\nLast Modified: ${metadata.modifiedTime}\n\nTo get actual content, you would need to:\n1. Implement Google OAuth 2.0 flow\n2. Request appropriate scopes (https://www.googleapis.com/auth/documents.readonly)\n3. Use the Google Docs API to fetch the document content\n\nFor now, you can copy and paste the content manually from the Google Doc.`;

      const importedDoc: ImportedDocument = {
        id: docId,
        title: metadata.name,
        content: simulatedContent,
        url: docUrl,
        lastModified: new Date(metadata.modifiedTime).toLocaleString(),
        size: metadata.size ? `${Math.round(metadata.size / 1024)} KB` : 'Unknown'
      };

      setImportedDocs(prev => [importedDoc, ...prev]);
      onDocumentImport(importedDoc);
      setDocUrl('');

      toast({
        title: "Document Imported",
        description: `Successfully imported "${metadata.name}" from Google Docs.`,
        variant: "default"
      });

    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: "Failed to import document. Please check your API key and document URL.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openDocument = (doc: ImportedDocument) => {
    window.open(doc.url, '_blank');
  };

  const downloadDocument = (doc: ImportedDocument) => {
    const blob = new Blob([doc.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.title}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* API Key Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="h-5 w-5" />
            <span>Google API Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              To import from Google Docs, you need a Google API key. This is stored locally in your browser.
              <br />
              <strong>Get your API key:</strong> Go to Google Cloud Console → APIs & Services → Credentials → Create API Key
              <br />
              <strong>Enable:</strong> Google Drive API and Google Docs API
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Label htmlFor="api-key">Google API Key</Label>
            <div className="flex space-x-2">
              <Input
                id="api-key"
                type="password"
                placeholder="Enter your Google API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <Button onClick={saveApiKey} variant="outline">
                Save
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Import from Google Docs</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="doc-url">Google Docs URL</Label>
            <Input
              id="doc-url"
              placeholder="https://docs.google.com/document/d/..."
              value={docUrl}
              onChange={(e) => setDocUrl(e.target.value)}
            />
          </div>
          
          <Button 
            onClick={importFromGoogleDocs} 
            disabled={!apiKey || !docUrl || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Importing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Import Document
              </>
            )}
          </Button>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> Full content import requires OAuth 2.0 authentication. 
              This demo shows metadata import only. For production, implement proper Google OAuth flow.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Imported Documents */}
      {importedDocs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Imported Documents ({importedDocs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {importedDocs.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3 flex-1">
                    <FileText className="h-5 w-5 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.title}</p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>Modified: {doc.lastModified}</span>
                        <span>Size: {doc.size}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="border-primary text-primary">
                      Google Docs
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDocument(doc)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadDocument(doc)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GoogleDocsIntegration;