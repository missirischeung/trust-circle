import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Users, FileText, BarChart3, Globe, Heart } from "lucide-react";
import Dashboard from "@/components/Dashboard";

type UserRole = "admin" | "partner" | "agent" | null;

const Index = () => {
  const [currentUser, setCurrentUser] = useState<{ role: UserRole; name: string } | null>(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "", role: "" });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login - in real app, this would authenticate with backend
    setCurrentUser({ 
      role: loginForm.role as UserRole, 
      name: loginForm.email.split('@')[0] 
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginForm({ email: "", password: "", role: "" });
  };

  if (currentUser) {
    return <Dashboard user={currentUser} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Heart className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-4xl font-bold text-foreground">SafeGuard</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Humanitarian Data Management Platform for Anti-Trafficking Operations
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center border-primary/20">
            <CardHeader>
              <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Secure Data Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Multi-level approval system ensures data accuracy and security
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-primary/20">
            <CardHeader>
              <Globe className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Multi-Language</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Support for Khmer, Nepali, English with real-time translation
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-primary/20">
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Real-Time Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Live tracking of humanitarian impact with approval controls
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Login Form */}
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Access Platform</CardTitle>
            <CardDescription>
              Select your role and sign in to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">User Role</Label>
                <Select value={loginForm.role} onValueChange={(value) => setLoginForm(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center">
                        <Shield className="h-4 w-4 mr-2" />
                        Administrator (Level A)
                      </div>
                    </SelectItem>
                    <SelectItem value="partner">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Local Partner (Level B)
                      </div>
                    </SelectItem>
                    <SelectItem value="agent">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        Field Agent (Level C)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={!loginForm.role}>
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>This platform requires Supabase integration for backend functionality.</p>
          <p>Offline mode available for field data collection.</p>
        </div>
      </div>
    </div>
  );
};

export default Index;