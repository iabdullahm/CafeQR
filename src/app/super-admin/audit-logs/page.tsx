"use client";

import { useState } from "react";
import { format } from "date-fns";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from "@/components/ui/sheet";
import { 
  Search, 
  Filter, 
  Download,
  CalendarDays,
  Activity,
  User,
  Shield,
  MonitorSmartphone,
  Copy,
  CheckCircle2,
  XCircle,
  Database,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  X
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Type definitions for production readiness
interface AuditLog {
  id: string;
  timestamp: string;
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  role: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  status: 'success' | 'failed' | 'warning';
  ipAddress: string;
  userAgent: string;
  beforeData?: any;
  afterData?: any;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{key: keyof AuditLog | '', direction: 'asc' | 'desc'}>({
    key: 'timestamp',
    direction: 'desc'
  });

  const handleSort = (key: keyof AuditLog) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof AuditLog) => {
    if (sortConfig.key !== key) return <Activity className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': 
        return <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 border font-bold shadow-sm"><CheckCircle2 className="h-3 w-3 mr-1" /> Success</Badge>;
      case 'failed': 
        return <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200 border font-bold shadow-sm"><XCircle className="h-3 w-3 mr-1" /> Failed</Badge>;
      case 'warning': 
        return <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 border font-bold shadow-sm"><Activity className="h-3 w-3 mr-1" /> Warning</Badge>;
      default: 
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role.toLowerCase()) {
      case 'super admin':
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm font-semibold">Super Admin</Badge>;
      case 'cafe admin':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 shadow-sm font-semibold">Cafe Admin</Badge>;
      case 'system':
        return <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 shadow-sm font-semibold">System</Badge>;
      default:
        return <Badge variant="outline" className="shadow-sm font-semibold">{role}</Badge>;
    }
  };

  const openDrawer = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDrawerOpen(true);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      {/* 1) Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground mt-1.5 text-base">Track all system activities, permission changes, and data mutations.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 h-11 bg-white shadow-sm rounded-xl px-4 border-dashed hover:border-primary hover:text-primary transition-colors">
            <X className="h-4 w-4" /> Clear Filters
          </Button>
          <Button className="gap-2 h-11 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md rounded-xl px-6 font-semibold">
            <Download className="h-4 w-4" /> Export Logs
          </Button>
        </div>
      </div>

      {/* 2) Filters Bar */}
      <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-card">
        <div className="p-2">
          <div className="flex flex-col xl:flex-row gap-4">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search logs by email, action, ID, or IP..." className="pl-11 h-12 border-none bg-muted/20 hover:bg-muted/30 transition-colors shadow-none focus-visible:ring-1 rounded-xl text-sm" />
            </div>
            
            <div className="flex flex-wrap items-center gap-2 xl:border-l xl:pl-4">
              <div className="relative">
                 <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input type="date" className="pl-9 h-10 w-[160px] border-none bg-muted/40 hover:bg-muted/60 rounded-xl font-medium text-xs shadow-none cursor-pointer" />
              </div>
              
              <Select>
                <SelectTrigger className="w-[140px] h-10 border-none bg-muted/40 hover:bg-muted/60 rounded-xl font-medium text-xs shadow-none transition-colors">
                  <SelectValue placeholder="Action Type" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger className="w-[130px] h-10 border-none bg-muted/40 hover:bg-muted/60 rounded-xl font-medium text-xs shadow-none transition-colors">
                  <SelectValue placeholder="Entity Type" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Entities</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="settings">Settings</SelectItem>
                  <SelectItem value="cafe">Cafe</SelectItem>
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger className="w-[130px] h-10 border-none bg-muted/40 hover:bg-muted/60 rounded-xl font-medium text-xs shadow-none transition-colors">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="ghost" size="icon" className="h-10 w-10 border-none bg-muted/40 hover:bg-muted/60 rounded-xl font-medium text-xs shadow-none transition-colors">
                 <Filter className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>

        {/* 3) Table Area */}
        {logs.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center bg-white border-t">
             <div className="h-20 w-20 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-5 shadow-sm">
                <Shield className="h-10 w-10 text-slate-300" />
             </div>
             <h3 className="text-xl font-bold mb-2 text-foreground">No audit logs found</h3>
             <p className="text-muted-foreground max-w-[400px] mb-6 text-sm">There are no records matching your current filter criteria, or the system has not recorded any recent actions.</p>
             <Button variant="outline" className="rounded-xl shadow-sm h-11 px-6 border-dashed">
                <X className="h-4 w-4 mr-2" /> Clear All Filters
             </Button>
          </div>
        ) : (
          <div className="overflow-x-auto border-t">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b">
                  <TableHead className="font-bold px-6 h-12 text-slate-500 cursor-pointer group" onClick={() => handleSort('timestamp')}>
                    <div className="flex items-center gap-2">Timestamp {getSortIcon('timestamp')}</div>
                  </TableHead>
                  <TableHead className="font-bold text-slate-500 cursor-pointer group" onClick={() => handleSort('user')}>
                    <div className="flex items-center gap-2">User {getSortIcon('user')}</div>
                  </TableHead>
                  <TableHead className="font-bold text-slate-500 cursor-pointer group" onClick={() => handleSort('role')}>
                    <div className="flex items-center gap-2">Role {getSortIcon('role')}</div>
                  </TableHead>
                  <TableHead className="font-bold text-slate-500 cursor-pointer group" onClick={() => handleSort('action')}>
                    <div className="flex items-center gap-2">Action {getSortIcon('action')}</div>
                  </TableHead>
                  <TableHead className="font-bold text-slate-500 cursor-pointer group" onClick={() => handleSort('entityType')}>
                    <div className="flex items-center gap-2">Entity {getSortIcon('entityType')}</div>
                  </TableHead>
                  <TableHead className="font-bold text-slate-500 max-w-[200px]">Details</TableHead>
                  <TableHead className="font-bold text-slate-500 cursor-pointer group" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-2">Status {getSortIcon('status')}</div>
                  </TableHead>
                  <TableHead className="font-bold text-slate-500 max-w-[150px]">IP Address</TableHead>
                  <TableHead className="font-bold text-right pr-6 text-slate-500">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-slate-50/80 transition-colors cursor-pointer group h-16" onClick={() => openDrawer(log)}>
                    <TableCell className="px-6 py-4">
                      <span className="text-[13px] font-medium text-slate-600 font-mono tracking-tight">{log.timestamp}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 rounded-lg shadow-sm border border-slate-100">
                          {log.user.avatar ? <AvatarImage src={log.user.avatar} /> : <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs rounded-lg">{log.user.name.charAt(0)}</AvatarFallback>}
                        </Avatar>
                        <div className="flex flex-col max-w-[150px] truncate">
                          <span className="font-semibold text-sm truncate">{log.user.name}</span>
                          <span className="text-xs text-muted-foreground truncate">{log.user.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(log.role)}</TableCell>
                    <TableCell>
                      <span className="text-[13px] font-semibold tracking-tight">{log.action}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-medium text-slate-700 capitalize">{log.entityType}</span>
                        <span className="text-[10px] text-muted-foreground font-mono bg-slate-100 w-fit px-1 rounded truncate max-w-[120px]" title={log.entityId}>{log.entityId}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      <span className="text-[13px] text-slate-600 truncate" title={log.details}>{log.details}</span>
                    </TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell className="max-w-[150px] truncate">
                       <span className="text-[12px] font-mono text-slate-500">{log.ipAddress}</span>
                    </TableCell>
                    <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                       <Button onClick={() => openDrawer(log)} variant="outline" size="sm" className="rounded-lg bg-white h-8 shadow-sm opacity-0 group-hover:opacity-100 group-hover:border-primary/50 group-hover:text-primary transition-all">
                          View <ArrowRight className="h-3 w-3 ml-2" />
                       </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* 4) Log Details Drawer (Right Side Panel) */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent side="right" className="w-[100vw] sm:w-[500px] md:w-[650px] p-0 flex flex-col h-full border-l shadow-2xl bg-slate-50 sm:max-w-none">
          {selectedLog && (
            <>
              {/* Header */}
              <div className="p-6 border-b shrink-0 bg-white z-10 shadow-sm relative">
                <SheetHeader className="text-left space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusBadge(selectedLog.status)}
                      <Badge variant="outline" className="font-mono bg-slate-50 text-[10px] text-slate-500">{selectedLog.id}</Badge>
                    </div>
                  </div>
                  <div>
                    <SheetTitle className="text-2xl font-bold tracking-tight text-slate-900">{selectedLog.action}</SheetTitle>
                    <SheetDescription className="text-sm mt-1 flex items-center gap-2 text-slate-500">
                      <CalendarDays className="h-4 w-4" /> {selectedLog.timestamp}
                    </SheetDescription>
                  </div>
                </SheetHeader>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* User & Action Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="shadow-sm border-slate-200">
                    <CardHeader className="bg-slate-50 border-b py-3 px-4">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <User className="h-3.5 w-3.5" /> Actor
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3 bg-white">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-slate-100">
                           {selectedLog.user.avatar ? <AvatarImage src={selectedLog.user.avatar} /> : <AvatarFallback className="bg-slate-100 font-bold">{selectedLog.user.name.charAt(0)}</AvatarFallback>}
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-slate-900">{selectedLog.user.name}</span>
                          <span className="text-xs text-slate-500">{selectedLog.user.email}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t pt-3">
                        <span className="text-xs font-medium text-slate-500">Role</span>
                        {getRoleBadge(selectedLog.role)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm border-slate-200">
                    <CardHeader className="bg-slate-50 border-b py-3 px-4">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <MonitorSmartphone className="h-3.5 w-3.5" /> Context
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3 bg-white">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">IP Address</span>
                        <span className="text-[13px] font-mono text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">{selectedLog.ipAddress}</span>
                      </div>
                      <div className="flex items-start justify-between border-t pt-3 gap-4">
                        <span className="text-xs font-medium text-slate-500 shrink-0">Device</span>
                        <span className="text-xs font-medium text-slate-700 text-right leading-tight">{selectedLog.userAgent}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Entity Details */}
                <Card className="shadow-sm border-slate-200 overflow-hidden">
                  <CardHeader className="bg-slate-50 border-b py-3 px-4">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <Database className="h-3.5 w-3.5" /> Entity Focus
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 bg-white">
                     <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100">
                        <div className="p-4 space-y-1">
                           <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Entity Type</span>
                           <span className="font-semibold text-sm capitalize">{selectedLog.entityType}</span>
                        </div>
                        <div className="p-4 space-y-1">
                           <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Target ID</span>
                           <span className="font-mono text-xs text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded inline-block truncate max-w-full">{selectedLog.entityId}</span>
                        </div>
                     </div>
                     <div className="p-4 bg-slate-50/50">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Details</span>
                        <p className="text-sm text-slate-700 leading-relaxed font-medium">{selectedLog.details}</p>
                     </div>
                  </CardContent>
                </Card>

                {/* JSON Payload Comparison */}
                {/* Shows only if data exists - usually in an empty state this won't strictly render unless mapped, but handled here just in case mock data is passed */}
                {(selectedLog.beforeData || selectedLog.afterData) && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">Data Payload Mutated</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Before Data */}
                      {selectedLog.beforeData && (
                        <div className="rounded-xl border border-red-200 bg-red-50/30 overflow-hidden shadow-sm">
                          <div className="flex items-center justify-between px-4 py-2 bg-red-50 border-b border-red-100">
                            <span className="text-xs font-bold text-red-800 tracking-wide uppercase">Previous State</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 px-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-md"
                              onClick={() => copyToClipboard(JSON.stringify(selectedLog.beforeData, null, 2), 'before')}
                            >
                              {copied === 'before' ? <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
                              <span className="text-[10px] font-bold">COPY JSON</span>
                            </Button>
                          </div>
                          <div className="p-4 overflow-x-auto text-[13px] font-mono leading-relaxed text-red-900">
                            <pre><code>{JSON.stringify(selectedLog.beforeData, null, 2)}</code></pre>
                          </div>
                        </div>
                      )}

                      {/* After Data */}
                      {selectedLog.afterData && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 overflow-hidden shadow-sm">
                          <div className="flex items-center justify-between px-4 py-2 bg-emerald-50 border-b border-emerald-100">
                            <span className="text-xs font-bold text-emerald-800 tracking-wide uppercase">New State</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 px-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 rounded-md"
                              onClick={() => copyToClipboard(JSON.stringify(selectedLog.afterData, null, 2), 'after')}
                            >
                              {copied === 'after' ? <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
                              <span className="text-[10px] font-bold">COPY JSON</span>
                            </Button>
                          </div>
                          <div className="p-4 overflow-x-auto text-[13px] font-mono leading-relaxed text-emerald-900">
                            <pre><code>{JSON.stringify(selectedLog.afterData, null, 2)}</code></pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
