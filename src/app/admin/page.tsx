"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Clock, MapPin, Search, Sparkles, BrainCircuit } from "lucide-react";
import { generateRoomUsageInsights } from "@/ai/flows/generate-room-usage-insights";
import { Button } from "@/components/ui/button";

// Mock Data for UI Inspection
const MOCK_LOGS = [
  { id: "1", professor_name: "Dr. Alice Smith", room_number: "Room 101", time_in: { toDate: () => new Date(Date.now() - 3600000) }, time_out: null },
  { id: "2", professor_name: "Prof. Bob Johnson", room_number: "Lab B", time_in: { toDate: () => new Date(Date.now() - 7200000) }, time_out: { toDate: () => new Date(Date.now() - 3600000) } },
  { id: "3", professor_name: "Dr. Catherine Lee", room_number: "Room 204", time_in: { toDate: () => new Date(Date.now() - 86400000) }, time_out: { toDate: () => new Date(Date.now() - 82800000) } },
  { id: "4", professor_name: "Prof. David Miller", room_number: "Room 101", time_in: { toDate: () => new Date(Date.now() - 172800000) }, time_out: { toDate: () => new Date(Date.now() - 169200000) } },
];

export default function AdminDashboard() {
  const [logs, setLogs] = useState<any[]>(MOCK_LOGS);
  const [stats, setStats] = useState({ activeNow: 1, mostUsed: "Room 101", totalHours: 12 });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [generatingAi, setGeneratingAi] = useState(false);

  const getAiInsights = async () => {
    setGeneratingAi(true);
    try {
      const logDataForAi = logs.slice(0, 50).map(l => ({
        room_number: l.room_number,
        professor_name: l.professor_name,
        time_in: l.time_in.toDate().toISOString(),
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
    return matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-primary">Admin Dashboard</h2>
          <p className="text-muted-foreground">Monitor classroom utilization and logging activities. (Mock Data)</p>
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
                  <TableCell>{log.time_in.toDate().toLocaleDateString()}</TableCell>
                  <TableCell>{log.time_in.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
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
