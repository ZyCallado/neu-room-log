"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFirestore } from "@/firebase";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  getDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  limit
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Scanner } from "@yudiel/react-qr-scanner";
import { LogOut, Scan, MapPin, CheckCircle2, AlertTriangle } from "lucide-react";
import { InstallPrompt } from "@/components/InstallPrompt";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function ProfessorDashboard() {
  const { user, signOut } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedRoomId, setScannedRoomId] = useState<string | null>(null);
  const [roomDetails, setRoomDetails] = useState<any>(null);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const db = useFirestore();

  useEffect(() => {
    if (!user) return;

    // Fetch active session using collection group query for convenience, 
    // or direct subcollection query which is safer.
    const q = query(
      collection(db, "users", user.uid, "logs"),
      where("time_out", "==", null),
      orderBy("time_in", "desc"),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          setActiveSession({ id: docSnap.id, ...docSnap.data() });
        } else {
          setActiveSession(null);
        }
        setLoading(false);
      },
      async (error) => {
        const permissionError = new FirestorePermissionError({
          path: `users/${user.uid}/logs`,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, db]);

  const handleScan = async (result: string | null) => {
    if (result) {
      setIsScanning(false);
      setScannedRoomId(result);
      try {
        const roomDoc = await getDoc(doc(db, "rooms", result));
        if (roomDoc.exists()) {
          setRoomDetails({ id: roomDoc.id, ...roomDoc.data() });
        } else {
          alert("Invalid Room QR Code");
          setScannedRoomId(null);
        }
      } catch (err) {
        const permissionError = new FirestorePermissionError({
          path: `rooms/${result}`,
          operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        setScannedRoomId(null);
      }
    }
  };

  const handleCheckIn = () => {
    if (!user || !roomDetails) return;
    const logData = {
      professor_id: user.uid,
      professor_name: user.displayName,
      room_id: roomDetails.id,
      room_number: roomDetails.room_number,
      time_in: serverTimestamp(),
      time_out: null,
    };

    // Use specific subcollection for mutations to ensure path-based ownership rules trigger
    const logsRef = collection(db, "users", user.uid, "logs");
    addDoc(logsRef, logData)
      .then(() => {
        setScannedRoomId(null);
        setRoomDetails(null);
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: logsRef.path,
          operation: 'create',
          requestResourceData: logData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const handleCheckOut = () => {
    if (!activeSession || !user) return;
    const logRef = doc(db, "users", user.uid, "logs", activeSession.id);
    updateDoc(logRef, {
      time_out: serverTimestamp(),
    }).catch(async (error) => {
      const permissionError = new FirestorePermissionError({
        path: logRef.path,
        operation: 'update',
        requestResourceData: { time_out: 'serverTimestamp()' },
      });
      errorEmitter.emit('permission-error', permissionError);
    });
  };

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;

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
        <div className="flex items-center gap-4 py-2">
          <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold">
            {user?.displayName?.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-semibold leading-none">{user?.displayName}</h2>
            <p className="text-sm text-muted-foreground">Professor Dashboard</p>
          </div>
        </div>

        {activeSession ? (
          <Card className="border-secondary bg-secondary/5">
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
              <Button variant="destructive" className="w-full py-6 text-lg" onClick={handleCheckOut}>
                Check-out
              </Button>
            </CardContent>
          </Card>
        ) : scannedRoomId ? (
          <Card className="animate-in zoom-in-95 duration-200">
            <CardHeader className="text-center">
              <CardTitle>Room Scanned</CardTitle>
              <CardDescription>Confirm your location</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border bg-muted p-8 text-center">
                <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Room Number</p>
                <p className="text-4xl font-headline font-bold text-primary">{roomDetails?.room_number}</p>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                You are about to check into Room {roomDetails?.room_number}.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => setScannedRoomId(null)}>Cancel</Button>
                <Button onClick={handleCheckIn}>Confirm Check-in</Button>
              </div>
            </CardContent>
          </Card>
        ) : isScanning ? (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border bg-black aspect-square relative shadow-xl">
              <Scanner 
                onResult={(text) => handleScan(text)}
                onError={(error) => console.log(error?.message)}
              />
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