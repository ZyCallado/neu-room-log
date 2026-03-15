"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ShieldAlert, ShieldCheck, User } from "lucide-react";

// Mock Data
const MOCK_USERS = [
  { id: "u1", displayName: "Dr. Alice Smith", email: "alice.smith@neu.edu.ph", is_blocked: false },
  { id: "u2", displayName: "Prof. Bob Johnson", email: "bob.johnson@neu.edu.ph", is_blocked: true },
  { id: "u3", displayName: "Dr. Catherine Lee", email: "cat.lee@neu.edu.ph", is_blocked: false },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>(MOCK_USERS);
  const [loading, setLoading] = useState(false);

  const toggleBlock = (userId: string, currentStatus: boolean) => {
    setUsers(users.map(u => u.id === userId ? { ...u, is_blocked: !currentStatus } : u));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-3xl font-headline font-bold text-primary">User Management</h2>
        <p className="text-muted-foreground">Manage access for professors and instructional staff. (Mock Data)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Professors</CardTitle>
          <CardDescription>Control system access by blocking or unblocking specific accounts.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Professor</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Restrict Access</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-10">Loading users...</TableCell></TableRow>
              ) : users.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-10">No professor accounts registered yet.</TableCell></TableRow>
              ) : users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold uppercase">
                        {u.displayName?.charAt(0) || <User className="h-4 w-4" />}
                      </div>
                      <span className="font-medium">{u.displayName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    {u.is_blocked ? (
                      <Badge variant="destructive" className="gap-1"><ShieldAlert className="h-3 w-3" /> Blocked</Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700 hover:bg-green-100 border-green-200"><ShieldCheck className="h-3 w-3" /> Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                      <Label htmlFor={`block-${u.id}`} className="sr-only">Toggle Block</Label>
                      <Switch 
                        id={`block-${u.id}`} 
                        checked={u.is_blocked} 
                        onCheckedChange={() => toggleBlock(u.id, u.is_blocked)} 
                      />
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
