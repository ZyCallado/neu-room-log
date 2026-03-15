
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ShieldAlert, ShieldCheck, User, Loader2, Search } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Input } from "@/components/ui/input";

export default function AdminUsersPage() {
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");

  const usersQuery = useMemoFirebase(() => collection(db, "users"), [db]);
  const { data: users, isLoading } = useCollection(usersQuery);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(u => 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const toggleBlock = (userId: string, currentStatus: boolean) => {
    const userRef = doc(db, "users", userId);
    updateDocumentNonBlocking(userRef, { is_blocked: !currentStatus });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-primary">User Management</h2>
          <p className="text-muted-foreground">Manage access for professors and instructional staff.</p>
        </div>
        <div className="relative w-full md:w-[300px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search name or email..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Accounts</CardTitle>
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
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-10">No accounts found.</TableCell></TableRow>
              ) : filteredUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold uppercase">
                        {u.name?.charAt(0) || <User className="h-4 w-4" />}
                      </div>
                      <span className="font-medium">{u.name}</span>
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
