"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QRCodeSVG } from "qrcode.react";
import { Plus, Download, Trash2, DoorOpen, QrCode } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";

// Mock Data
const MOCK_ROOMS = [
  { id: "r1", room_number: "Room 101", created_at: { toDate: () => new Date() } },
  { id: "r2", room_number: "Room 102", created_at: { toDate: () => new Date() } },
  { id: "r3", room_number: "Lab A", created_at: { toDate: () => new Date() } },
  { id: "r4", room_number: "Auditorium", created_at: { toDate: () => new Date() } },
];

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<any[]>(MOCK_ROOMS);
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNumber) return;
    const newRoom = {
      id: Math.random().toString(36).substr(2, 9),
      room_number: newRoomNumber,
      created_at: { toDate: () => new Date() }
    };
    setRooms([...rooms, newRoom]);
    setNewRoomNumber("");
  };

  const handleDeleteRoom = (id: string) => {
    if (confirm("Are you sure you want to delete this room?")) {
      setRooms(rooms.filter(r => r.id !== id));
    }
  };

  const downloadQR = (roomId: string, roomName: string) => {
    // Demo version - just alert
    alert(`Downloading QR for ${roomName}`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-primary">Classrooms</h2>
          <p className="text-muted-foreground">Manage school rooms and generate QR codes for check-ins. (Mock Data)</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg"><Plus className="h-5 w-5" /> Add New Room</Button>
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
              />
              <Button type="submit" className="w-full">Create Room</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room Identifier</TableHead>
                <TableHead className="hidden md:table-cell">Created Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={3} className="text-center py-10">Loading rooms...</TableCell></TableRow>
              ) : rooms.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center py-10">No rooms found. Add one to get started.</TableCell></TableRow>
              ) : rooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <DoorOpen className="h-4 w-4 text-primary" />
                      {room.room_number}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {room.created_at.toDate().toLocaleDateString()}
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
                              <Download className="h-4 w-4" /> Download PNG (Demo)
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteRoom(room.id)} className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
