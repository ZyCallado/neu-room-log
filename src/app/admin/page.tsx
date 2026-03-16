"use client"

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Clock, MapPin, Search, Sparkles, BrainCircuit, Loader2, Calendar } from "lucide-react";
import { generateRoomUsageInsights } from "@/ai/flows/generate-room-usage-insights";
import { Button } from "@/components/ui/button";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { format, isSameDay, isSameWeek, isSameMonth, startOfDay } from "date-fns";

export default function AdminDashboard() {
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [generatingAi, setGeneratingAi] = useState(false);

  const logsQuery = useMemoFirebase(() => query(collection(db, "activity_logs"), orderBy("time_in", "desc")), [db]);
  const { data: logs, isLoading } = useCollection(logsQuery);

  const stats = useMemo(() => {
    if (!logs) return { activeNow: 0, daily: 0, weekly: 0, monthly: 0 };

    const now = new Date();
    const activeNow = logs.filter(l => !l.time_out).length;
    
    let daily = 0;
    let weekly = 0;
    let monthly = 0;

    logs.forEach(log => {
      const tIn = log.time_in?.toDate ? log.time_in.toDate() : new Date(log.time_in);
      if (isSameDay(tIn, now)) daily++;
      if (isSameWeek(tIn, now)) weekly++;
      if (isSameMonth(tIn, now)) monthly++;
    });

    return {
      activeNow,
      daily,
      weekly,
      monthly
    };
  }, [logs]);

  const getAiInsights = async () => {
    if (!logs) return;
    setGeneratingAi(true);
    try {
      const logDataForAi = logs.slice(0, 50).map(l => ({
        room_number: l.room_number,
        professor_name: l.professor_name,
        time_in: l.time_in?.toDate ? l.time_in.toDate().toISOString() : new Date(l.time_in).toISOString(),
        time_out: l.time_out ? (l.time_out.toDate ? l.time_out.toDate().toISOString() : new Date(l.time_out).toISOString()) : null
      }));
      const insight = await generateRoomUsageInsights({ logData: logDataForAi });
      setAiInsights(insight);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingAi(false);
    }
  };

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    return logs.filter(l => {
      const matchesSearch = l.professor_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            l.room_number?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [logs, searchTerm]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-primary">Admin Dashboard</h2>
          <p className="text-muted-foreground">Monitor real-time classroom utilization across campus.</p>
        </div>
        <Button 
          onClick={getAiInsights} 
          disabled={generatingAi || !logs || logs.length === 0}
          className="bg-primary/90 hover:bg-primary gap-2"
        >
          {generatingAi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-sm border-l-4 border-l-secondary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Now</CardTitle>
            <Users className="h-5 w-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-headline font-bold">{stats.activeNow}</div>
            <p className="text-xs text-muted-foreground mt-1">Professors currently in class</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Daily Uses</CardTitle>
            <Calendar className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-headline font-bold">{stats.daily}</div>
            <p className="text-xs text-muted-foreground mt-1">Total check-ins today</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-accent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Weekly Uses</CardTitle>
            <Clock className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-headline font-bold">{stats.weekly}</div>
            <p className="text-xs text-muted-foreground mt-1">Total check-ins this week</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Monthly Uses</CardTitle>
            <MapPin className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-headline font-bold">{stats.monthly}</div>
            <p className="text-xs text-muted-foreground mt-1">Total check-ins this month</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <CardTitle>Activity Logs</CardTitle>
              <CardDescription>Comprehensive history of all classroom check-ins.</CardDescription>
            </div>
            <div className="relative w-full md:w-[300px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search professor or room..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10">No logs found.</TableCell></TableRow>
              ) : filteredLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{log.professor_name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-primary" />
                      {log.room_number}
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.time_in?.toDate ? format(log.time_in.toDate(), "MMM dd, yyyy") : "---"}
                  </TableCell>
                  <TableCell>
                    {log.time_in?.toDate ? format(log.time_in.toDate(), "hh:mm a") : "---"}
                  </TableCell>
                  <TableCell>
                    {log.time_out ? (
                      log.time_out.toDate ? format(log.time_out.toDate(), "hh:mm a") : format(new Date(log.time_out), "hh:mm a")
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
