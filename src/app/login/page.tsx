"use client";

import { useState, useEffect } from "react";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword 
} from "firebase/auth";
import { useAuth as useFirebaseAuth } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, ShieldCheck, Mail, Lock, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const auth = useFirebaseAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Admin Specific
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdminLoggingIn, setIsAdminLoggingIn] = useState(false);
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push(user.role === "admin" ? "/admin" : "/dashboard");
    }
  }, [user, loading, router]);

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Strict domain check immediately after login
      if (result.user.email && !result.user.email.endsWith("@neu.edu.ph")) {
        await auth.signOut();
        toast({
          variant: "destructive",
          title: "Access Restricted",
          description: "Please use your institutional @neu.edu.ph email address.",
        });
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      toast({
        variant: "destructive",
        title: "Login Error",
        description: error.message || "Failed to sign in with Google.",
      });
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adminEmail.endsWith("@neu.edu.ph")) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: "Administrator accounts must use the @neu.edu.ph domain.",
      });
      return;
    }

    setIsAdminLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      setIsAdminDialogOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: "Invalid admin credentials.",
      });
    } finally {
      setIsAdminLoggingIn(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground animate-pulse">Initializing NEU Room Log...</p>
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <LogIn className="h-8 w-8" />
          </div>
          <CardTitle className="text-3xl font-headline tracking-tight">NEU Room Log</CardTitle>
          <CardDescription>Access the classroom usage portal.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button 
            variant="outline"
            onClick={handleGoogleLogin} 
            className="w-full py-8 transition-all hover:scale-[1.01] flex flex-col items-center gap-2"
          >
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
              <span className="text-lg font-semibold">Continue with Google</span>
            </div>
            <span className="text-xs text-muted-foreground font-normal">Institutional login for NEU Professors</span>
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Admin Access</span>
            </div>
          </div>

          <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full text-xs gap-2 text-muted-foreground hover:text-primary"
              >
                <ShieldCheck className="h-3 w-3" />
                Administrator Portal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Admin Authentication
                </DialogTitle>
                <DialogDescription>
                  Enter administrator credentials to access the management portal.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAdminLogin} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="admin-email" 
                      type="email" 
                      placeholder="admin@neu.edu.ph"
                      className="pl-10"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="admin-password" 
                      type="password" 
                      className="pl-10"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required 
                    />
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full" disabled={isAdminLoggingIn}>
                    {isAdminLoggingIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Log In to Management"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
