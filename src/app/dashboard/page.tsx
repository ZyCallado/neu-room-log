"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, limit, doc, serverTimestamp, getDoc } from "firebase/firestore";
import { addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LogOut, 
  Scan, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  History, 
  DoorOpen, 
  Loader2, 
  Clock,
  ArrowRight
} from "lucide-react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useToast } from "@/hooks/use-toast";
import { InstallPrompt } from "@/components/InstallPrompt";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function ProfessorDashboard() {
  const { user, signOut } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. Fetch Active Session
  const activeSessionQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(db, "users", user.uid, "logs"),
      where("time_out", "==", null),
      limit(1)
    );
  }, [db, user]);
  const { data: activeSessions, isLoading: isActiveLoading } = useCollection(activeSessionQuery);
  const activeSession = activeSessions?.[0] || null;

  // 2. Fetch Recent Logs
  const recentLogsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(db, "users", user.uid, "logs"),
      orderBy("time_in", "desc"),
      limit(10)
    );
  }, [db, user]);
  const { data: recentLogs, isLoading: isLogsLoading } = useCollection(recentLogsQuery);

  // 3. Fetch Available Rooms
  const roomsQuery = useMemoFirebase(() => collection(db, "rooms"), [db]);
  const { data: rooms, isLoading: isRoomsLoading } = useCollection(roomsQuery);

  const handleScan = async (result: any) => {
    if (!result || isProcessing || !user) return;
    const roomId = result[0]?.rawValue;
    if (!roomId) return;

    setIsProcessing(true);
    setIsScanning(false);

    try {
      const roomRef = doc(db, "rooms", roomId);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        toast({
          variant: "destructive",
          title: "Invalid QR Code",
          description: "This QR code does not correspond to a registered classroom.",
        });
        return;
      }

      const roomData = roomSnap.data();
      const logsRef = collection(db, "users", user.uid, "logs");

      addDocumentNonBlocking(logsRef, {
        professor_id: user.uid,
        professor_name: user.displayName,
        room_id: roomId,
        room_number: roomData.room_number,
        time_in: serverTimestamp(),
        time_out: null,
      });

      toast({
        title: "Check-in Successful",
        description: `You have started a session in ${roomData.room_number}.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not process check-in. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckOut = () => {
    if (!activeSession || !user) return;
    
    const logRef = doc(db, "users", user.uid, "logs", activeSession.id);
    updateDocumentNonBlocking(logRef, {
      time_out: serverTimestamp(),
    });

    toast({
      title: "Checked Out",
      description: `Session in ${activeSession.room_number} ended.`,
    });
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
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-10 border-b bg-card px-4 py-4 shadow-sm">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
              {user?.displayName?.charAt(0)}
            </div>
            <h1 className="text-lg font-headline font-bold text-primary">NEU Room Log</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={() => signOut()}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-lg p-4 space-y-6">
        {activeSession ? (
          <Card className="border-secondary bg-secondary/5 animate-in zoom-in-95 duration-200">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto h-16 w-16 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <CardTitle className="text-2xl">Active Session</CardTitle>
              <CardDescription>You are currently teaching in {activeSession.room_number}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="rounded-lg bg-card border p-4 flex flex-col gap-1">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <MapPin className="h-4 w-4" />
                  <span>{activeSession.room_number}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Started at {activeSession.time_in?.toDate ? format(activeSession.time_in.toDate(), "hh:mm a") : "Just now"}</span>
                </div>
              </div>
              <Button 
                variant="destructive" 
                className="w-full py-6 text-lg font-bold shadow-lg" 
                onClick={handleCheckOut}
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                END SESSION
              </Button>
            </CardContent>
          </Card>
        ) : isScanning ? (
          <div className="space-y-4 animate-in fade-in">
            <div className="overflow-hidden rounded-2xl border bg-black aspect-square relative shadow-xl">
              <Scanner 
                onScan={handleScan}
                onError={(err) => {
                  console.error(err);
                  setIsScanning(false);
                  toast({
                    variant: "destructive",
                    title: "Scanner Error",
                    description: "Could not access camera.",
                  });
                }}
              />
              <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
                <div className="w-full h-full border-2 border-primary rounded-lg"></div>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={() => setIsScanning(false)}>
              Cancel Scanning
            </Button>
          </div>
        ) : (
          <div className="space-y-8 py-4">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-headline font-bold">Ready to Start?</h3>
              <p className="text-muted-foreground">Scan the classroom QR code to log your usage.</p>
            </div>
            <Button 
              className="mx-auto flex h-44 w-44 flex-col items-center justify-center gap-4 rounded-full bg-primary text-primary-foreground shadow-2xl hover:scale-105 active:scale-95 transition-all"
              onClick={() => setIsScanning(true)}
              disabled={isProcessing}
            >
              <Scan className="h-12 w-12" />
              <span className="text-lg font-bold tracking-tight">SCAN QR</span>
            </Button>
          </div>
        )}

        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="activity" className="gap-2">
              <History className="h-4 w-4" /> Activity
            </TabsTrigger>
            <TabsTrigger value="rooms" className="gap-2">
              <DoorOpen className="h-4 w-4" /> Rooms
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="activity" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Your Recent Logs</h4>
            </div>
            <div className="space-y-3">
              {isLogsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : !recentLogs || recentLogs.length === 0 ? (
                <p className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg">No recent activity logs found.</p>
              ) : (
                recentLogs.map((log) => (
                  <Card key={log.id} className="shadow-sm">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <MapPin className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-sm leading-tight">{log.room_number}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {log.time_in?.toDate ? format(log.time_in.toDate(), "MMM dd, hh:mm a") : "---"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {log.time_out ? (
                          <Badge variant="secondary" className="text-[10px] py-0">Completed</Badge>
                        ) : (
                          <Badge className="text-[10px] py-0 animate-pulse bg-green-500">In Progress</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="rooms" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Classroom List</h4>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {isRoomsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : !rooms || rooms.length === 0 ? (
                <p className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg">No classrooms registered yet.</p>
              ) : (
                rooms.map((room) => (
                  <Card key={room.id} className="shadow-sm">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-secondary/10 p-2 rounded-full text-secondary">
                          <DoorOpen className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-sm">{room.room_number}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={() => setIsScanning(true)}>
                        Scan QR <ArrowRight className="h-3 w-3" />
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <InstallPrompt />
    </div>
  );
}
