"use client";

import { useState, useEffect } from "react";
import { useFirestore } from "@/firebase";
import { collectionGroup, getDocs, query, orderBy } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Clock, MapPin, Search, Sparkles, BrainCircuit } from "lucide-react";
import { generateRoomUsageInsights } from "@/ai/flows/generate-room-usage-insights";
import { Button } from "@/components/ui/button";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function AdminDashboard() {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({ activeNow: 0, mostUsed: "N/A", totalHours: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [generatingAi, setGeneratingAi] = useState(false);
  const db = useFirestore();

  useEffect(() => {
    fetchLogs();
  }, [db]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Using collectionGroup to correctly fetch all logs from nested subcollections
      const q = query(collectionGroup(db, "logs"), orderBy("time_in", "desc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setLogs(data);

      // Calculate Stats
      const active = data.filter(l => !l.time_out).length;
      
      const roomCounts: Record<string, number> = {};
      let totalMs = 0;
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

      data.forEach(l => {
        roomCounts[l.room_number] = (roomCounts[l.room_number] || 0) + 1;
        const timeIn = l.time_in?.toDate();
        if (timeIn && timeIn >= startOfWeek) {
          const timeOut = l.time_out?.toDate() || new Date();
          totalMs += timeOut.getTime() - timeIn.getTime();
        }
      });

      const mostUsed = Object.entries(roomCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
      const totalHours = Math.round(totalMs / (1000 * 60 * 60));

      setStats({ activeNow: active, mostUsed, totalHours });
    } catch (err: any) {
      const permissionError = new FirestorePermissionError({
        path: 'logs',
        operation: 'list',
      });
      errorEmitter.emit('permission-error', permissionError);
    } finally {
      setLoading(false);
    }
  };

  const getAiInsights = async () => {
    setGeneratingAi(true);
    try {
      const logDataForAi = logs.slice(0, 50).map(l => ({
        room_number: l.room_number,
        professor_name: l.professor_name,
        time_in: l.time_in?.toDate().toISOString(),
        time_out: l.time_out?.toDate().toISOString() || null
      }));
      const insight = await generateRoomUsageInsights({ logData: logDataForAi });
      setAiInsights(insight);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingAi(false);
    }
  };

  const filteredLogs = logs.filter(l => {
    const matchesSearch = l.professor_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          l.room_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (dateFilter === "all") return matchesSearch;
    
    const timeIn = l.time_in?.toDate();
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if (dateFilter === "today") return matchesSearch && timeIn >= today;
    
    return matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-primary">Admin Dashboard</h2>
          <p className="text-muted-foreground">Monitor classroom utilization and logging activities.</p>
        </div>
        <Button 
          onClick={getAiInsights} 
          disabled={generatingAi || logs.length === 0}
          className="bg-primary/90 hover:bg-primary gap-2"
        >
          {generatingAi ? <Clock className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generate AI Insights
        </Button>
      </div>

      {aiInsights && (
        <Card className="bg-primary/5 border-primary/20 shadow-lg animate-in slide-in-from-top-4">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <BrainCircuit className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">AI-Powered Usage Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground italic">
              {aiInsights}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border-l-4 border-l-secondary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Now</CardTitle>
            <Users className="h-5 w-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-headline font-bold">{stats.activeNow}</div>
            <p className="text-xs text-muted-foreground mt-1">Professors in classrooms</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Most Used Room</CardTitle>
            <MapPin className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-headline font-bold truncate">{stats.mostUsed}</div>
            <p className="text-xs text-muted-foreground mt-1">Highest frequency room</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-accent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Weekly Usage</CardTitle>
            <Clock className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-headline font-bold">{stats.totalHours}h</div>
            <p className="text-xs text-muted-foreground mt-1">Total duration this week</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <CardTitle>Usage Logs</CardTitle>
              <CardDescription>Comprehensive history of all classroom check-ins.</CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search professor or room..." 
                  className="pl-9 w-full md:w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Professor</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time In</TableHead>
                <TableHead>Time Out</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10">Loading logs...</TableCell></TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10">No matching logs found.</TableCell></TableRow>
              ) : filteredLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{log.professor_name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-primary" />
                      {log.room_number}
                    </div>
                  </TableCell>
                  <TableCell>{log.time_in?.toDate().toLocaleDateString()}</TableCell>
                  <TableCell>{log.time_in?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                  <TableCell>
                    {log.time_out ? (
                      log.time_out.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary/10 text-secondary animate-pulse">
                        Active Now
                      </span>
                    )}
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
