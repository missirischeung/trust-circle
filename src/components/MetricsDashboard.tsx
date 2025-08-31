import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  BarChart3, 
  Users, 
  GraduationCap, 
  Home, 
  Heart, 
  MapPin, 
  TrendingUp, 
  Eye, 
  EyeOff,
  Download,
  Filter
} from "lucide-react";

interface MetricsDashboardProps {
  userRole: "admin" | "partner" | "agent";
}

const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ userRole }) => {
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedYear, setSelectedYear] = useState("2024");
  const [publicVisibility, setPublicVisibility] = useState({
    childrenSaved: true,
    survivorPercentage: true,
    countriesHelped: true,
    locationsAttended: true,
    successfulMissions: true
  });

  // Mock data - in real app, this would come from backend
  const metrics = {
    preventionResources: { current: 2547, previous: 2234, approved: true },
    scholarshipsDistributed: { current: 189, previous: 156, approved: true },
    schoolsReached: { current: 45, previous: 38, approved: true },
    communitiesEngaged: { current: 78, previous: 65, approved: true },
    presentationsConducted: { current: 234, previous: 198, approved: true },
    leadersTrained: { current: 134, previous: 112, approved: true },
    safeSchooling: { current: 456, previous: 398, approved: true },
    universityScholarships: { current: 67, previous: 54, approved: true },
    vocationalTraining: { current: 123, previous: 98, approved: true },
    traumaCare: { current: 234, previous: 201, approved: true },
    safeHomes: { current: 89, previous: 76, approved: true },
    newSurvivors: { current: 34, previous: 28, approved: true },
    careStaff: { current: 45, previous: 42, approved: true },
    totalStaff: { current: 156, previous: 143, approved: true },
    counselingSupport: { current: 198, previous: 167, approved: true },
    financialPackages: { current: 278, previous: 234, approved: true },
    familyReintegration: { current: 56, previous: 43, approved: true },
    repatriation: { current: 23, previous: 18, approved: true }
  };

  const publicMetrics = {
    childrenSaved: 1247,
    survivorPercentage: 94.7,
    countriesHelped: 3,
    locationsAttended: 25,
    successfulMissions: 89
  };

  const calculateGrowth = (current: number, previous: number) => {
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const togglePublicVisibility = (metric: string) => {
    if (userRole === "admin") {
      setPublicVisibility(prev => ({
        ...prev,
        [metric]: !prev[metric]
      }));
    }
  };

  const MetricCard = ({ 
    title, 
    icon: Icon, 
    current, 
    previous, 
    approved,
    format = "number"
  }: {
    title: string;
    icon: any;
    current: number;
    previous: number;
    approved: boolean;
    format?: "number" | "percentage";
  }) => {
    const growth = calculateGrowth(current, previous);
    const growthNum = parseFloat(growth);
    
    return (
      <Card className={!approved ? "border-warning/50 bg-warning/5" : ""}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className="flex items-center space-x-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            {!approved && <Badge variant="outline" className="border-warning text-warning text-xs">Pending</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {format === "percentage" ? `${current}%` : current.toLocaleString()}
          </div>
          <p className={`text-xs flex items-center ${growthNum >= 0 ? 'text-success' : 'text-destructive'}`}>
            <TrendingUp className="h-3 w-3 mr-1" />
            {growthNum >= 0 ? '+' : ''}{growth}% from last period
          </p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Impact Metrics</h2>
          <p className="text-muted-foreground">Real-time humanitarian impact tracking</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Advanced Filters
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Region Filter</Label>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  <SelectItem value="cambodia">Cambodia</SelectItem>
                  <SelectItem value="nepal">Nepal</SelectItem>
                  <SelectItem value="thailand">Thailand</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Time Period</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024 (Year-to-Date)</SelectItem>
                  <SelectItem value="2023">2023 (Full Year)</SelectItem>
                  <SelectItem value="q4-2024">Q4 2024</SelectItem>
                  <SelectItem value="q3-2024">Q3 2024</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data Status</Label>
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="border-success text-success">Approved: 156</Badge>
                <Badge variant="outline" className="border-warning text-warning">Pending: 12</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prevention & Education Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Prevention & Education</CardTitle>
          <CardDescription>Community outreach and prevention activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              title="Individuals Reached with Prevention Resources"
              icon={Users}
              current={metrics.preventionResources.current}
              previous={metrics.preventionResources.previous}
              approved={metrics.preventionResources.approved}
            />
            <MetricCard
              title="Prevention Scholarships/Kits Distributed"
              icon={GraduationCap}
              current={metrics.scholarshipsDistributed.current}
              previous={metrics.scholarshipsDistributed.previous}
              approved={metrics.scholarshipsDistributed.approved}
            />
            <MetricCard
              title="Schools Reached"
              icon={GraduationCap}
              current={metrics.schoolsReached.current}
              previous={metrics.schoolsReached.previous}
              approved={metrics.schoolsReached.approved}
            />
            <MetricCard
              title="Communities Engaged"
              icon={MapPin}
              current={metrics.communitiesEngaged.current}
              previous={metrics.communitiesEngaged.previous}
              approved={metrics.communitiesEngaged.approved}
            />
            <MetricCard
              title="Prevention Presentations"
              icon={BarChart3}
              current={metrics.presentationsConducted.current}
              previous={metrics.presentationsConducted.previous}
              approved={metrics.presentationsConducted.approved}
            />
            <MetricCard
              title="Community Leaders Trained"
              icon={Users}
              current={metrics.leadersTrained.current}
              previous={metrics.leadersTrained.previous}
              approved={metrics.leadersTrained.approved}
            />
          </div>
        </CardContent>
      </Card>

      {/* Support & Care Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Support & Care Services</CardTitle>
          <CardDescription>Direct support and care provision</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              title="Safe Schooling Provided"
              icon={GraduationCap}
              current={metrics.safeSchooling.current}
              previous={metrics.safeSchooling.previous}
              approved={metrics.safeSchooling.approved}
            />
            <MetricCard
              title="University Scholarships"
              icon={GraduationCap}
              current={metrics.universityScholarships.current}
              previous={metrics.universityScholarships.previous}
              approved={metrics.universityScholarships.approved}
            />
            <MetricCard
              title="Vocational Training"
              icon={Users}
              current={metrics.vocationalTraining.current}
              previous={metrics.vocationalTraining.previous}
              approved={metrics.vocationalTraining.approved}
            />
            <MetricCard
              title="Trauma-Informed Care"
              icon={Heart}
              current={metrics.traumaCare.current}
              previous={metrics.traumaCare.previous}
              approved={metrics.traumaCare.approved}
            />
            <MetricCard
              title="Individuals in Safe Homes"
              icon={Home}
              current={metrics.safeHomes.current}
              previous={metrics.safeHomes.previous}
              approved={metrics.safeHomes.approved}
            />
            <MetricCard
              title="New Survivors (This Year)"
              icon={Users}
              current={metrics.newSurvivors.current}
              previous={metrics.newSurvivors.previous}
              approved={metrics.newSurvivors.approved}
            />
          </div>
        </CardContent>
      </Card>

      {/* Staffing & Operations */}
      <Card>
        <CardHeader>
          <CardTitle>Staffing & Operations</CardTitle>
          <CardDescription>Team and operational metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Care Staff"
              icon={Users}
              current={metrics.careStaff.current}
              previous={metrics.careStaff.previous}
              approved={metrics.careStaff.approved}
            />
            <MetricCard
              title="Total Staff"
              icon={Users}
              current={metrics.totalStaff.current}
              previous={metrics.totalStaff.previous}
              approved={metrics.totalStaff.approved}
            />
            <MetricCard
              title="Counseling Support"
              icon={Heart}
              current={metrics.counselingSupport.current}
              previous={metrics.counselingSupport.previous}
              approved={metrics.counselingSupport.approved}
            />
            <MetricCard
              title="Financial Packages"
              icon={BarChart3}
              current={metrics.financialPackages.current}
              previous={metrics.financialPackages.previous}
              approved={metrics.financialPackages.approved}
            />
          </div>
        </CardContent>
      </Card>

      {/* Reintegration */}
      <Card>
        <CardHeader>
          <CardTitle>Reintegration & Recovery</CardTitle>
          <CardDescription>Long-term recovery and reintegration outcomes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <MetricCard
              title="Family Reintegration"
              icon={Home}
              current={metrics.familyReintegration.current}
              previous={metrics.familyReintegration.previous}
              approved={metrics.familyReintegration.approved}
            />
            <MetricCard
              title="Repatriation"
              icon={MapPin}
              current={metrics.repatriation.current}
              previous={metrics.repatriation.previous}
              approved={metrics.repatriation.approved}
            />
          </div>
        </CardContent>
      </Card>

      {/* Public Metrics Control (Admin Only) */}
      {userRole === "admin" && (
        <Card>
          <CardHeader>
            <CardTitle>Public Visibility Controls</CardTitle>
            <CardDescription>Control which metrics are visible to donors and the public</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {publicVisibility.childrenSaved ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  <Label>Children Saved: {publicMetrics.childrenSaved.toLocaleString()}</Label>
                </div>
                <Switch
                  checked={publicVisibility.childrenSaved}
                  onCheckedChange={() => togglePublicVisibility('childrenSaved')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {publicVisibility.survivorPercentage ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  <Label>Survivor Success Rate: {publicMetrics.survivorPercentage}%</Label>
                </div>
                <Switch
                  checked={publicVisibility.survivorPercentage}
                  onCheckedChange={() => togglePublicVisibility('survivorPercentage')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {publicVisibility.countriesHelped ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  <Label>Countries Helped: {publicMetrics.countriesHelped}</Label>
                </div>
                <Switch
                  checked={publicVisibility.countriesHelped}
                  onCheckedChange={() => togglePublicVisibility('countriesHelped')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {publicVisibility.locationsAttended ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  <Label>Locations Attended: {publicMetrics.locationsAttended}</Label>
                </div>
                <Switch
                  checked={publicVisibility.locationsAttended}
                  onCheckedChange={() => togglePublicVisibility('locationsAttended')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {publicVisibility.successfulMissions ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  <Label>Successful Missions: {publicMetrics.successfulMissions}</Label>
                </div>
                <Switch
                  checked={publicVisibility.successfulMissions}
                  onCheckedChange={() => togglePublicVisibility('successfulMissions')}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MetricsDashboard;