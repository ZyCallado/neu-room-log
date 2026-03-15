"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QRCodeSVG } from "qrcode.react";
import { Plus, Download, Trash2, DoorOpen, QrCode, Loader2, AlertTriangle, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, serverTimestamp, doc } from "firebase/firestore";
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function AdminRoomsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const roomsQuery = useMemoFirebase(() => collection(db, "rooms"), [db]);
  const { data: rooms, isLoading } = useCollection(roomsQuery);

  // Filter and Sort Rooms alphabetically by room_number
  const filteredSortedRooms = useMemo(() => {
    if (!rooms) return [];
    return rooms
      .filter(room => 
        room.room_number.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => 
        a.room_number.localeCompare(b.room_number, undefined, { numeric: true, sensitivity: 'base' })
      );
  }, [rooms, searchTerm]);

  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNumber.trim()) return;

    setIsAdding(true);
    const roomsRef = collection(db, "rooms");
    
    addDocumentNonBlocking(roomsRef, {
      room_number: newRoomNumber.trim(),
      created_at: serverTimestamp(),
      current_session: null
    })
    .then(() => {
      setNewRoomNumber("");
      setIsAdding(false);
      setIsDialogOpen(false);
      toast({
        title: "Room Created",
        description: `${newRoomNumber} has been added successfully.`,
      });
    })
    .catch(() => setIsAdding(false));
  };

  const handleDeleteRoom = (roomId: string, roomName: string) => {
    const roomRef = doc(db, "rooms", roomId);
    deleteDocumentNonBlocking(roomRef);
    toast({
      title: "Room Deleted",
      description: `${roomName} has been removed.`,
    });
  };

  const downloadQR = (roomId: string, roomName: string) => {
    const svg = document.getElementById(`qr-${roomId}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR-${roomName}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-primary">Classrooms</h2>
          <p className="text-muted-foreground">Manage school rooms and generate permanent QR codes for check-ins.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search rooms..." 
              className="pl-9 w-[200px] md:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg"><Plus className="h-5 w-5" /> Add Room</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Classroom</DialogTitle>
                <DialogDescription>Enter the room identifier (e.g., Room 101, Lab B).</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddRoom} className="space-y-4 pt-4">
                <Input 
                  placeholder="Room Number/Name" 
                  value={newRoomNumber} 
                  onChange={e => setNewRoomNumber(e.target.value)} 
                  required
                  disabled={isAdding}
                />
                <Button type="submit" className="w-full" disabled={isAdding}>
                  {isAdding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Room
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room Identifier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">ID (Permanent)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                </TableCell></TableRow>
              ) : filteredSortedRooms.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                  {searchTerm ? "No matching rooms found." : "No rooms found. Add one to get started."}
                </TableCell></TableRow>
              ) : filteredSortedRooms.map((room) => {
                const session = room.current_session;
                const isOccupied = session && new Date(session.end_time) > new Date();

                return (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <DoorOpen className="h-4 w-4 text-primary" />
                        {room.room_number}
                      </div>
                    </TableCell>
                    <TableCell>
                      {isOccupied ? (
                        <Badge variant="secondary" className="bg-secondary/10 text-secondary">Occupied</Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Available</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs font-mono text-muted-foreground">
                      {room.id}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                              <QrCode className="h-4 w-4" /> QR Code
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md text-center">
                            <DialogHeader>
                              <DialogTitle>Check-in QR Code</DialogTitle>
                              <DialogDescription>{room.room_number}</DialogDescription>
                            </DialogHeader>
                            <div className="flex flex-col items-center justify-center py-6 space-y-6">
                              <div className="bg-white p-4 rounded-xl border-4 border-primary shadow-xl">
                                <QRCodeSVG 
                                  id={`qr-${room.id}`}
                                  value={room.id} 
                                  size={256} 
                                  level="H"
                                  includeMargin={true}
                                />
                              </div>
                              <Button onClick={() => downloadQR(room.id, room.room_number)} className="gap-2">
                                <Download className="h-4 w-4" /> Download PNG
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                                Delete Classroom?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete <strong>{room.room_number}</strong>? This action cannot be undone and will prevent professors from using the existing QR code for this room.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteRoom(room.id, room.room_number)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete Room
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
