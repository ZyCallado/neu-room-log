"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LogOut, Scan, MapPin, CheckCircle2, AlertTriangle, Eye } from "lucide-react";
import { InstallPrompt } from "@/components/InstallPrompt";

export default function ProfessorDashboard() {
  const { user, signOut } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);

  // Mock toggle for UI preview
  const toggleDemoSession = () => {
    if (activeSession) {
      setActiveSession(null);
    } else {
      setActiveSession({
        id: "demo-id",
        room_number: "Room 101",
        time_in: new Date()
      });
    }
  };

  if (user?.is_blocked) {
    return (
      <div className="flex h-screen items-center justify-center p-6 bg-background">
        <Card className="max-w-md border-destructive">
          <CardHeader className="text-center text-destructive">
            <AlertTriangle className="mx-auto h-12 w-12 mb-2" />
            <CardTitle>Account Restricted</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p>Your account has been restricted. Please contact the administrator for more information.</p>
            <Button variant="outline" className="mt-4" onClick={() => signOut()}>Logout</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 border-b bg-card px-4 py-4 shadow-sm">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <h1 className="text-xl font-headline font-bold text-primary">NEU Room Log</h1>
          <Button variant="ghost" size="icon" onClick={() => signOut()}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-lg p-4 space-y-6">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold">
              {user?.displayName?.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-semibold leading-none">{user?.displayName}</h2>
              <p className="text-sm text-muted-foreground">Professor Dashboard (UI Demo)</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={toggleDemoSession} className="gap-2">
            <Eye className="h-4 w-4" /> Preview Active
          </Button>
        </div>

        {activeSession ? (
          <Card className="border-secondary bg-secondary/5 animate-in zoom-in-95 duration-200">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto h-16 w-16 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <CardTitle className="text-2xl">Active Session</CardTitle>
              <CardDescription>You are currently in {activeSession.room_number}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="rounded-lg bg-card border p-4 flex items-center gap-3">
                <MapPin className="text-primary h-5 w-5" />
                <span className="font-medium">{activeSession.room_number}</span>
              </div>
              <p className="text-center text-sm text-muted-foreground italic">
                Thank you for using this room. Remember to check out when you leave.
              </p>
              <Button variant="destructive" className="w-full py-6 text-lg" onClick={() => setActiveSession(null)}>
                Check-out
              </Button>
            </CardContent>
          </Card>
        ) : isScanning ? (
          <div className="space-y-4 animate-in fade-in">
            <div className="overflow-hidden rounded-2xl border bg-black aspect-square relative shadow-xl flex items-center justify-center">
              <p className="text-white text-center px-6">QR Scanner Component would appear here. <br/> <span className="text-xs opacity-60">(Disabled for UI Inspection)</span></p>
              <div className="absolute inset-0 border-2 border-primary/50 pointer-events-none rounded-2xl"></div>
            </div>
            <Button variant="outline" className="w-full" onClick={() => setIsScanning(false)}>
              Cancel Scanning
            </Button>
          </div>
        ) : (
          <div className="space-y-8 py-8">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-headline font-bold">Ready to Start?</h3>
              <p className="text-muted-foreground">Scan the classroom QR code to log your usage.</p>
            </div>
            <Button 
              className="mx-auto flex h-48 w-48 flex-col items-center justify-center gap-4 rounded-full bg-primary text-primary-foreground shadow-2xl hover:scale-105 active:scale-95 transition-all"
              onClick={() => setIsScanning(true)}
            >
              <Scan className="h-16 w-16" />
              <span className="text-xl font-bold tracking-tight">SCAN QR</span>
            </Button>
          </div>
        )}
      </main>
      <InstallPrompt />
    </div>
  );
}
