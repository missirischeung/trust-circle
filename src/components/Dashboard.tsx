import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Plus, Eye, CheckCircle, XCircle, Clock, Users, FileText, BarChart3, Globe } from "lucide-react";
import MetricsDashboard from "@/components/MetricsDashboard";
import DataSubmissionForm from "@/components/DataSubmissionForm";
import ApprovalQueue from "@/components/ApprovalQueue";

interface DashboardProps {
  user: { role: "admin" | "partner" | "agent"; name: string };
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState("overview");

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "admin": return "Administrator (Level A)";
      case "partner": return "Local Partner (Level B)";
      case "agent": return "Field Agent (Level C)";
      default: return role;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "default";
      case "partner": return "secondary";
      case "agent": return "outline";
      default: return "outline";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-foreground">SafeGuard Platform</h1>
              <Badge variant={getRoleBadgeVariant(user.role)}>
                {getRoleDisplayName(user.role)}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">Welcome, {user.name}</span>
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-none lg:inline-flex">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            {user.role !== "admin" && (
              <TabsTrigger value="submit" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Submit Data</span>
              </TabsTrigger>
            )}
            {user.role === "admin" && (
              <TabsTrigger value="approve" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Approvals</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Metrics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Submissions</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">
                    8 metrics pending approval
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ready for Final Approval</CardTitle>
                  <CheckCircle className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">3</div>
                  <p className="text-xs text-muted-foreground">
                    All metrics approved
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Partners</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">23</div>
                  <p className="text-xs text-muted-foreground">
                    Across 8 regions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Languages Supported</CardTitle>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-muted-foreground">
                    Khmer, Nepali, English
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest data submissions and approvals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-warning rounded-full"></div>
                      <div>
                        <p className="font-medium">Prevention Resource Distribution - Phnom Penh</p>
                        <p className="text-sm text-muted-foreground">Submitted by partner.cambodia@org.com</p>
                        <div className="flex space-x-2 mt-1">
                          <Badge variant="outline" className="border-success text-success text-xs">1 approved</Badge>
                          <Badge variant="outline" className="border-warning text-warning text-xs">3 pending</Badge>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">Partially Approved</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-success rounded-full"></div>
                      <div>
                        <p className="font-medium">Community Engagement Report - Bangkok</p>
                        <p className="text-sm text-muted-foreground">All metrics individually approved</p>
                        <div className="flex space-x-2 mt-1">
                          <Badge variant="outline" className="border-success text-success text-xs">3 approved</Badge>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-success text-success">Ready for Final</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <div>
                        <p className="font-medium">Safe Housing Report - Kathmandu</p>
                        <p className="text-sm text-muted-foreground">Awaiting individual metric reviews</p>
                        <div className="flex space-x-2 mt-1">
                          <Badge variant="outline" className="border-warning text-warning text-xs">4 pending</Badge>
                        </div>
                      </div>
                    </div>
                    <Badge>Pending Review</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {user.role !== "admin" && (
            <TabsContent value="submit">
              <DataSubmissionForm userRole={user.role} />
            </TabsContent>
          )}

          {user.role === "admin" && (
            <TabsContent value="approve">
              <ApprovalQueue />
            </TabsContent>
          )}

          <TabsContent value="metrics">
            <MetricsDashboard userRole={user.role} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;