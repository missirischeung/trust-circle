import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Users, FileText, BarChart3, Globe, Heart, AlertCircle } from "lucide-react";
import Dashboard from "@/components/Dashboard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { User, Session } from "@supabase/supabase-js";

type UserRole = "admin" | "partner" | "agent" | null;

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<{ role: UserRole; full_name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "", role: "agent" });

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile
          setTimeout(async () => {
            try {
              const { data: profile, error } = await supabase
                .from('profiles')
                .select('role, full_name')
                .eq('user_id', session.user.id)
                .single();
              
              if (error) throw error;
              setUserProfile(profile);
            } catch (err) {
              console.error('Error fetching profile:', err);
              toast({
                title: "Error",
                description: "Failed to load user profile",
                variant: "destructive",
              });
            }
          }, 0);
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signUp({
        email: loginForm.email,
        password: loginForm.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            role: loginForm.role,
            full_name: loginForm.email.split('@')[0]
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Account created",
        description: "Please check your email to verify your account",
      });
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password,
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserProfile(null);
    setLoginForm({ email: "", password: "", role: "agent" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-8 w-8 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user && userProfile) {
    return <Dashboard 
      user={{ role: userProfile.role, name: userProfile.full_name || user.email?.split('@')[0] || 'User' }} 
      onLogout={handleLogout} 
    />;
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

        {/* Auth Form */}
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Access Platform</CardTitle>
            <CardDescription>
              Sign in or create account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Tabs value={isSignUp ? "signup" : "signin"} onValueChange={(value) => {
              setIsSignUp(value === "signup");
              setError("");
            }}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={authLoading}>
                    {authLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
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
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create password (min 6 characters)"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                      required
                      minLength={6}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={authLoading || !loginForm.role}>
                    {authLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>Connected to Supabase for secure authentication and data management.</p>
          <p>Your data is protected with enterprise-grade security.</p>
        </div>
      </div>
    </div>
  );
};

export default Index;