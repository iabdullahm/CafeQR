"use client";

import { useState } from "react";
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
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Bell, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Filter, 
  CalendarDays,
  Eye,
  RefreshCcw,
  Trash2,
  FileText,
  Users,
  Store,
  CreditCard,
  Settings
} from "lucide-react";

// Mock Data
const MOCK_STATS = [
  { title: "Total Notifications", value: "0", trend: "--", isUp: true, icon: Bell, color: "text-blue-600", bg: "bg-blue-50" },
  { title: "Delivered", value: "0", trend: "--", isUp: true, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
  { title: "Pending", value: "0", trend: "--", isUp: false, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  { title: "Failed", value: "0", trend: "--", isUp: false, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
];

const MOCK_NOTIFICATIONS: any[] = [];

export default function NotificationsCenterPage() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // Create Modal States
  const [targetType, setTargetType] = useState("all");
  const [scheduleType, setScheduleType] = useState("now");

  // Badges Context
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered': return <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 border font-bold shadow-sm">Delivered</Badge>;
      case 'Pending': return <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 border font-bold shadow-sm">Pending</Badge>;
      case 'Failed': return <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200 border font-bold shadow-sm">Failed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'System': return <Badge variant="outline" className="bg-gray-100/50 text-gray-700 shadow-sm"><Settings className="w-3 h-3 mr-1" /> System</Badge>;
      case 'Billing': return <Badge variant="outline" className="bg-blue-50 text-blue-700 shadow-sm border-blue-100"><CreditCard className="w-3 h-3 mr-1" /> Billing</Badge>;
      case 'Feature Update': return <Badge variant="outline" className="bg-purple-50 text-purple-700 shadow-sm border-purple-100"><TrendingUp className="w-3 h-3 mr-1" /> Feature</Badge>;
      case 'Announcement': return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 shadow-sm border-indigo-100"><Users className="w-3 h-3 mr-1" /> Announcement</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  const openDetails = (notif: any) => {
    setSelectedNotification(notif);
    setIsDetailsOpen(true);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotifications(notifications.filter(n => n.id !== id));
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* 1) Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground tracking-tight">Notifications Center</h1>
          <p className="text-muted-foreground mt-1.5 text-base">Manage and send system notifications to your cafes.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="h-11 w-11 bg-white shadow-sm rounded-xl">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="gap-2 h-11 bg-white shadow-sm rounded-xl hidden sm:flex">
            <FileText className="h-4 w-4" /> Manage Templates
          </Button>
          
          {/* Send Notification Modal */}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 h-11 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md rounded-xl px-6">
                <Send className="h-4 w-4" /> Send Notification
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-2xl">
              <div className="bg-blue-50/50 p-6 border-b">
                 <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                   <Bell className="h-6 w-6 text-primary" /> New Notification
                 </DialogTitle>
                 <DialogDescription className="mt-1.5 text-base">Craft a message to be pushed directly to cafe dashboards.</DialogDescription>
              </div>
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title" className="font-bold">Notification Title</Label>
                    <Input id="title" placeholder="e.g. Server Maintenance Alert" className="h-11 rounded-xl bg-muted/20 focus-visible:ring-1" />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label className="font-bold">Message Type</Label>
                    <Select defaultValue="announcement">
                      <SelectTrigger className="h-11 rounded-xl bg-muted/20">
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="system">System Notification</SelectItem>
                        <SelectItem value="announcement">General Announcement</SelectItem>
                        <SelectItem value="billing">Billing Alert</SelectItem>
                        <SelectItem value="feature">Feature Update</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="message" className="font-bold">Message Layout</Label>
                    <Textarea 
                      id="message" 
                      placeholder="Write your detailed announcement here..." 
                      className="min-h-[120px] resize-none rounded-xl bg-muted/20 focus-visible:ring-1" 
                    />
                  </div>
                </div>

                {/* Target Audience */}
                <div className="space-y-3 pt-4 border-t">
                  <Label className="font-bold text-base">Target Audience</Label>
                  <RadioGroup defaultValue="all" value={targetType} onValueChange={setTargetType} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className={`flex items-start space-x-3 border p-4 rounded-xl cursor-pointer hover:bg-muted/30 transition-colors ${targetType === 'all' ? 'border-primary bg-primary/5' : 'border-muted'}`} onClick={() => setTargetType('all')}>
                      <RadioGroupItem value="all" id="target-all" className="mt-0.5" />
                      <div className="leading-none">
                        <Label htmlFor="target-all" className="font-bold cursor-pointer">All Cafes</Label>
                      </div>
                    </div>
                    <div className={`flex items-start space-x-3 border p-4 rounded-xl cursor-pointer hover:bg-muted/30 transition-colors ${targetType === 'specific' ? 'border-primary bg-primary/5' : 'border-muted'}`} onClick={() => setTargetType('specific')}>
                      <RadioGroupItem value="specific" id="target-specific" className="mt-0.5" />
                      <div className="leading-none">
                        <Label htmlFor="target-specific" className="font-bold cursor-pointer">Specific Cafe</Label>
                      </div>
                    </div>
                    <div className={`flex items-start space-x-3 border p-4 rounded-xl cursor-pointer hover:bg-muted/30 transition-colors ${targetType === 'plan' ? 'border-primary bg-primary/5' : 'border-muted'}`} onClick={() => setTargetType('plan')}>
                      <RadioGroupItem value="plan" id="target-plan" className="mt-0.5" />
                      <div className="leading-none">
                        <Label htmlFor="target-plan" className="font-bold cursor-pointer">Subscription</Label>
                      </div>
                    </div>
                  </RadioGroup>
                  
                  {/* Conditional Target Inputs */}
                  <div className="mt-3">
                     {targetType === 'specific' && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                           <Input placeholder="Search and select cafe..." className="h-11 rounded-xl bg-muted/20" />
                        </div>
                     )}
                     {targetType === 'plan' && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                           <Select>
                             <SelectTrigger className="h-11 rounded-xl bg-muted/20">
                               <SelectValue placeholder="Select Target Plan" />
                             </SelectTrigger>
                             <SelectContent className="rounded-xl">
                               <SelectItem value="basic">Basic Plan</SelectItem>
                               <SelectItem value="pro">Pro Plan</SelectItem>
                               <SelectItem value="premium">Premium Plan</SelectItem>
                             </SelectContent>
                           </Select>
                        </div>
                     )}
                  </div>
                </div>

                {/* Scheduling */}
                <div className="space-y-3 pt-4 border-t">
                  <Label className="font-bold text-base">Delivery Schedule</Label>
                  <RadioGroup defaultValue="now" value={scheduleType} onValueChange={setScheduleType} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className={`flex items-start space-x-3 border p-4 rounded-xl cursor-pointer hover:bg-muted/30 transition-colors ${scheduleType === 'now' ? 'border-primary bg-primary/5' : 'border-muted'}`} onClick={() => setScheduleType('now')}>
                      <RadioGroupItem value="now" id="schedule-now" className="mt-0.5" />
                      <div className="leading-none">
                        <Label htmlFor="schedule-now" className="font-bold cursor-pointer flex items-center gap-2"><Send className="h-4 w-4" /> Send Now</Label>
                      </div>
                    </div>
                    <div className={`flex items-start space-x-3 border p-4 rounded-xl cursor-pointer hover:bg-muted/30 transition-colors ${scheduleType === 'later' ? 'border-primary bg-primary/5' : 'border-muted'}`} onClick={() => setScheduleType('later')}>
                      <RadioGroupItem value="later" id="schedule-later" className="mt-0.5" />
                      <div className="leading-none">
                        <Label htmlFor="schedule-later" className="font-bold cursor-pointer flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Schedule</Label>
                      </div>
                    </div>
                  </RadioGroup>
                  {scheduleType === 'later' && (
                     <div className="animate-in fade-in slide-in-from-top-2 duration-300 mt-3 flex gap-3">
                        <Input type="date" className="h-11 rounded-xl bg-muted/20 flex-1" />
                        <Input type="time" className="h-11 rounded-xl bg-muted/20 w-32" />
                     </div>
                  )}
                </div>
              </div>
              <DialogFooter className="p-6 border-t bg-muted/10 gap-2 sm:gap-0">
                <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="rounded-xl h-11 px-6">Cancel</Button>
                <Button type="submit" className="rounded-xl h-11 px-8 shadow-md">
                   {scheduleType === 'now' ? 'Send Notification' : 'Schedule Notification'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 2) Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MOCK_STATS.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm rounded-2xl overflow-hidden group hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <div className="flex items-end gap-2 mt-1">
                  <h3 className="text-2xl font-bold font-headline">{stat.value}</h3>
                  <span className={`text-xs font-bold flex items-center mb-1 ${stat.isUp ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.isUp ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                    {stat.trend}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 3) Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-4 bg-white p-2 rounded-2xl shadow-sm border border-muted/50">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search notifications..." className="pl-11 h-12 border-none bg-transparent shadow-none focus-visible:ring-0 text-base" />
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t lg:border-t-0 lg:border-l pt-3 lg:pt-0 lg:pl-3 p-1">
          <Select defaultValue="all-status">
            <SelectTrigger className="w-[140px] h-10 border-none bg-muted/40 rounded-xl font-medium">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all-status">All Statuses</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all-types">
            <SelectTrigger className="w-[140px] h-10 border-none bg-muted/40 rounded-xl font-medium">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all-types">All Types</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="billing">Billing</SelectItem>
              <SelectItem value="feature">Feature</SelectItem>
            </SelectContent>
          </Select>
          <div className="hidden sm:flex items-center gap-2 bg-muted/40 rounded-xl px-3 h-10 border-none text-sm font-medium text-muted-foreground cursor-pointer hover:bg-muted/60 transition-colors">
             <CalendarDays className="h-4 w-4" /> Date Range
          </div>
        </div>
      </div>

      {/* 4) Notifications Table */}
      <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-card">
        {notifications.length === 0 ? (
           <CardContent className="py-20 flex flex-col items-center justify-center text-center">
              <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                 <Bell className="h-10 w-10 text-primary/40" />
              </div>
              <h3 className="text-xl font-bold mb-2">No notifications found</h3>
              <p className="text-muted-foreground mb-6 max-w-[300px]">It looks like there's no broadcast history matching your filters.</p>
           </CardContent>
        ) : (
          <div className="overflow-x-auto">
             <Table>
               <TableHeader>
                 <TableRow className="bg-muted/10 hover:bg-muted/10 border-b">
                   <TableHead className="font-bold px-6 h-12 text-muted-foreground">Notification</TableHead>
                   <TableHead className="font-bold text-muted-foreground">Type</TableHead>
                   <TableHead className="font-bold text-muted-foreground">Target</TableHead>
                   <TableHead className="font-bold text-muted-foreground">Status</TableHead>
                   <TableHead className="font-bold text-muted-foreground">Sent Date</TableHead>
                   <TableHead className="font-bold text-right pr-6 text-muted-foreground">Actions</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {notifications.map((notif) => (
                   <TableRow 
                     key={notif.id} 
                     className="hover:bg-muted/30 transition-colors cursor-pointer group"
                     onClick={() => openDetails(notif)}
                   >
                     <TableCell className="px-6 py-4">
                       <div className="flex flex-col max-w-[300px]">
                         <span className="font-bold text-foreground text-sm tracking-tight mb-1 truncate">{notif.title}</span>
                         <span className="text-xs font-medium text-muted-foreground truncate">{notif.message}</span>
                       </div>
                     </TableCell>
                     <TableCell>{getTypeBadge(notif.type)}</TableCell>
                     <TableCell>
                        <div className="flex items-center gap-1.5 text-sm font-medium">
                           {notif.target === 'All Cafes' ? <Users className="h-3.5 w-3.5 text-primary" /> : <Store className="h-3.5 w-3.5 text-indigo-500" />}
                           {notif.target}
                        </div>
                     </TableCell>
                     <TableCell>{getStatusBadge(notif.status)}</TableCell>
                     <TableCell>
                       <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 line-clamp-1">
                         <Clock className="h-3.5 w-3.5" /> {notif.sentDate}
                       </span>
                     </TableCell>
                     <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <Button variant="ghost" size="icon" onClick={() => openDetails(notif)} className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700">
                             <Eye className="h-4 w-4" />
                           </Button>
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:bg-amber-50 hover:text-amber-700">
                             <RefreshCcw className="h-4 w-4" />
                           </Button>
                           <Button variant="ghost" size="icon" onClick={(e) => handleDelete(e, notif.id)} className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700">
                             <Trash2 className="h-4 w-4" />
                           </Button>
                        </div>
                        {/* Fallback for touch devices where hover is missing */}
                        <Button variant="ghost" size="icon" className="xl:hidden h-8 w-8 text-muted-foreground">
                           <Eye className="h-4 w-4" />
                        </Button>
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
          </div>
        )}
      </Card>

      {/* Details Drawer (Sheet) */}
      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent side="right" className="w-[100vw] sm:w-[450px] p-0 flex flex-col h-full border-l shadow-2xl bg-white sm:max-w-none">
          {selectedNotification && (
            <>
              <div className="p-6 border-b shrink-0 bg-blue-50/30">
                <SheetHeader className="text-left">
                  <div className="flex items-center justify-between mb-4">
                    {getTypeBadge(selectedNotification.type)}
                    <Badge variant="outline" className="font-mono text-xs bg-white shadow-sm border-dashed">
                       {selectedNotification.id}
                    </Badge>
                  </div>
                  <SheetTitle className="text-2xl font-bold leading-tight text-foreground">{selectedNotification.title}</SheetTitle>
                  <SheetDescription className="mt-2 text-base flex items-center gap-2">
                     <Clock className="h-4 w-4" /> {selectedNotification.sentDate}
                  </SheetDescription>
                </SheetHeader>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                 {/* Status & Delivery Block */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border bg-muted/10 shadow-sm">
                       <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Current Status</p>
                       <div className="flex items-center gap-2">
                          {getStatusBadge(selectedNotification.status)}
                       </div>
                    </div>
                    <div className="p-4 rounded-xl border bg-muted/10 shadow-sm">
                       <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Target Audience</p>
                       <div className="flex items-center gap-2 font-medium text-sm">
                          {selectedNotification.target === 'All Cafes' ? <Users className="h-4 w-4 text-primary" /> : <Store className="h-4 w-4 text-indigo-500" />} 
                          {selectedNotification.target}
                       </div>
                    </div>
                 </div>

                 {/* Message Content */}
                 <div className="space-y-3">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider border-b pb-2">Message Content</h3>
                    <div className="p-5 rounded-2xl bg-muted/30 border border-muted/50 text-base leading-relaxed text-foreground shadow-inner">
                       {selectedNotification.message}
                    </div>
                 </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t bg-muted/10 shrink-0 flex gap-3">
                 <Button variant="outline" className="flex-1 rounded-xl shadow-sm h-11 bg-white hover:bg-muted/50 transition-colors">
                    <Trash2 className="h-4 w-4 text-red-600 mr-2" /> Delete
                 </Button>
                 <Button className="flex-1 rounded-xl shadow-md h-11 bg-primary text-primary-foreground gap-2">
                    <RefreshCcw className="h-4 w-4" /> Resend
                 </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
