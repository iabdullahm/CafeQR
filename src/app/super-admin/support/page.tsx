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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  SheetDescription,
  SheetTrigger
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  Filter, 
  Download,
  AlertCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Timer,
  MoreHorizontal,
  Eye,
  Reply,
  UserPlus,
  ArrowUpRight,
  ShieldAlert,
  Archive,
  Mail,
  Phone,
  Store,
  Paperclip,
  Send,
  History,
  Info,
  Calendar,
  User
} from "lucide-react";

const TICKETS: any[] = [];

export default function SupportPage() {
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Urgent': return <Badge variant="destructive" className="font-bold gap-1 bg-red-600 hover:bg-red-700 shadow-sm"><AlertCircle className="h-3 w-3" /> Urgent</Badge>;
      case 'High': return <Badge variant="destructive" className="font-bold gap-1 bg-orange-500 hover:bg-orange-600 shadow-sm"><AlertTriangle className="h-3 w-3" /> High</Badge>;
      case 'Medium': return <Badge variant="secondary" className="font-bold text-blue-700 bg-blue-100 shadow-sm">Medium</Badge>;
      case 'Low': return <Badge variant="outline" className="font-bold text-muted-foreground shadow-sm">Low</Badge>;
      default: return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Open': return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 border font-bold">Open</Badge>;
      case 'In Progress': return <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 border font-bold">In Progress</Badge>;
      case 'Escalated': return <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200 border font-bold">Escalated</Badge>;
      case 'Resolved': return <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 border font-bold">Resolved</Badge>;
      case 'Closed': return <Badge variant="outline" className="text-muted-foreground font-bold">Closed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const openTicketDetails = (ticket: any) => {
    setSelectedTicket(ticket);
    setIsSheetOpen(true);
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground tracking-tight">Support Hub</h1>
          <p className="text-muted-foreground mt-1">Manage customer queries, technical issues, and platform assistance.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2 bg-card">
            <Download className="h-4 w-4" /> Export Report
          </Button>
          <Button className="bg-primary hover:bg-primary/90 gap-2 shadow-md">
            <MessageSquare className="h-4 w-4" /> New Ticket
          </Button>
        </div>
      </div>

      {/* 2. Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[
          { title: "Open Tickets", value: "0", icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
          { title: "In Progress", value: "0", icon: Clock, color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
          { title: "Resolved Today", value: "0", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50 border-green-100" },
          { title: "High Priority", value: "0", icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50 border-orange-100" },
          { title: "Escalated", value: "0", icon: ShieldAlert, color: "text-red-600", bg: "bg-red-50 border-red-100" },
          { title: "Avg. Response", value: "--", icon: Timer, color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-100" },
        ].map((stat, i) => (
          <Card key={i} className={`border shadow-sm overflow-hidden bg-card ${stat.bg}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-white/60 shadow-sm ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.title}</p>
                <p className="text-xl font-black mt-0.5 text-foreground">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 3. Filters and Search */}
      <Card className="border shadow-sm bg-card">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by Ticket ID, Cafe Name, or Subject..." className="pl-10 h-11 bg-muted/20" />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select defaultValue="all">
                <SelectTrigger className="w-[140px] h-11">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              
              <Select defaultValue="all">
                <SelectTrigger className="w-[140px] h-11">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select defaultValue="all">
                <SelectTrigger className="w-[150px] h-11">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="integration">Integration</SelectItem>
                  <SelectItem value="general">General Inquiry</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="gap-2 h-11 border-dashed">
                <Filter className="h-4 w-4" /> More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Tickets Table */}
      <Card className="border shadow-sm bg-card overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40 border-b">
                  <TableHead className="font-bold px-6 h-12">Ticket</TableHead>
                  <TableHead className="font-bold">Subject & Category</TableHead>
                  <TableHead className="font-bold">Priority</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold">Activity</TableHead>
                  <TableHead className="font-bold">Assigned To</TableHead>
                  <TableHead className="font-bold text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {TICKETS.length === 0 ? (
                  <TableRow>
                     <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                           <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                           <p className="font-medium text-sm">No support tickets found</p>
                           <p className="text-xs">There are currently no active support requests.</p>
                        </div>
                     </TableCell>
                  </TableRow>
                ) : (
                  TICKETS.map((ticket) => (
                    <TableRow key={ticket.id} className="hover:bg-muted/20 transition-colors group cursor-pointer" onClick={() => openTicketDetails(ticket)}>
                      <TableCell className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-primary tracking-tight text-sm">{ticket.id}</span>
                          <span className="text-xs font-semibold text-foreground mt-1 flex items-center gap-1">
                            <Store className="h-3 w-3 text-muted-foreground" /> {ticket.cafeName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col max-w-[300px]">
                          <span className="font-semibold text-sm truncate" title={ticket.subject}>{ticket.subject}</span>
                          <span className="text-[11px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">{ticket.category}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(ticket.priority)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(ticket.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs space-y-1 text-muted-foreground">
                          <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> <span className="font-medium text-foreground">Updated:</span> {ticket.lastUpdated}</span>
                          <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> <span className="font-medium">Created:</span> {ticket.createdAt}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-[10px]">
                            {ticket.assignedTo.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                          <span className="text-sm font-medium">{ticket.assignedTo}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 font-medium shadow-xl rounded-xl">
                            <DropdownMenuLabel>Ticket Actions</DropdownMenuLabel>
                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => openTicketDetails(ticket)}>
                              <Eye className="h-4 w-4 text-muted-foreground" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 cursor-pointer">
                              <Reply className="h-4 w-4 text-muted-foreground" /> Quick Reply
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 cursor-pointer">
                              <UserPlus className="h-4 w-4 text-muted-foreground" /> Assign Agent
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
                              <DropdownMenuItem className="gap-2 cursor-pointer text-green-600 focus:text-green-600 focus:bg-green-50">
                                <CheckCircle2 className="h-4 w-4" /> Resolve Ticket
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="gap-2 cursor-pointer text-orange-600 focus:text-orange-600 focus:bg-orange-50">
                              <ArrowUpRight className="h-4 w-4" /> Escalate Issue
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="gap-2 cursor-pointer text-muted-foreground">
                              <Archive className="h-4 w-4" /> Close Ticket
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 5. Ticket Details Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px] md:w-[700px] sm:max-w-none p-0 flex flex-col h-full border-l shadow-2xl">
          {selectedTicket && (
            <>
              {/* Sheet Header */}
              <div className="p-6 border-b shrink-0 bg-muted/20">
                <SheetHeader className="text-left space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-mono bg-white">{selectedTicket.id}</Badge>
                      {getStatusBadge(selectedTicket.status)}
                      {getPriorityBadge(selectedTicket.priority)}
                    </div>
                    <div className="flex items-center gap-2">
                       <Button variant="outline" size="sm" className="h-8 gap-2"><ArrowUpRight className="h-3 w-3"/> Escalate</Button>
                       <Button size="sm" className="h-8 gap-2 bg-green-600 hover:bg-green-700 text-white"><CheckCircle2 className="h-3 w-3"/> Resolve</Button>
                    </div>
                  </div>
                  <div>
                    <SheetTitle className="text-xl font-bold leading-tight">{selectedTicket.subject}</SheetTitle>
                    <SheetDescription className="flex items-center gap-2 mt-2 font-medium">
                      <Store className="h-4 w-4 text-primary" /> {selectedTicket.cafeName} 
                      <span className="text-muted-foreground font-normal text-xs ml-1">({selectedTicket.cafeId})</span>
                    </SheetDescription>
                  </div>
                </SheetHeader>
              </div>

              {/* Sheet Body (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-6">
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="w-full h-12 p-1 bg-muted/40 grid grid-cols-4 mb-6 rounded-lg">
                    <TabsTrigger value="details" className="h-10 text-xs font-bold rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Details & Reply</TabsTrigger>
                    <TabsTrigger value="notes" className="h-10 text-xs font-bold rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Internal Notes</TabsTrigger>
                    <TabsTrigger value="timeline" className="h-10 text-xs font-bold rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Timeline</TabsTrigger>
                    <TabsTrigger value="cafe" className="h-10 text-xs font-bold rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Cafe Info</TabsTrigger>
                  </TabsList>
                  
                  {/* Details Tab */}
                  <TabsContent value="details" className="space-y-6 outline-none">
                     <Card className="shadow-sm border-blue-100 bg-blue-50/30">
                        <CardHeader className="p-4 pb-0">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                 <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                                    {selectedTicket.contact.name.split(' ').map((n: string) => n[0]).join('')}
                                 </div>
                                 <div>
                                    <p className="font-bold text-sm">{selectedTicket.contact.name}</p>
                                    <p className="text-[10px] text-muted-foreground">{selectedTicket.createdAt}</p>
                                 </div>
                              </div>
                              <Badge variant="outline" className="bg-white">Initial Request</Badge>
                           </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-3">
                           <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                              {selectedTicket.desc}
                           </p>
                           <div className="mt-4 flex gap-2">
                              <Badge variant="secondary" className="gap-1.5 text-xs bg-white cursor-pointer hover:bg-muted font-normal"><Paperclip className="h-3 w-3"/> screenshot_error.png</Badge>
                           </div>
                        </CardContent>
                     </Card>

                     {/* Reply Box */}
                     <div className="space-y-3 mt-6">
                        <p className="text-sm font-bold flex items-center gap-2"><Reply className="h-4 w-4 text-muted-foreground"/> Response Draft</p>
                        <Textarea 
                           placeholder="Type your reply to the customer here..." 
                           className="min-h-[120px] resize-none bg-muted/10 border-muted focus-visible:ring-1"
                        />
                        <div className="flex items-center justify-between">
                           <div className="flex gap-2">
                              <Button variant="outline" size="icon" className="h-9 w-9"><Paperclip className="h-4 w-4" /></Button>
                              <Button variant="outline" size="sm" className="h-9">Use Template</Button>
                           </div>
                           <Button className="h-9 gap-2 bg-primary">Send Reply <Send className="h-3 w-3" /></Button>
                        </div>
                     </div>
                  </TabsContent>

                  {/* Internal Notes Tab */}
                  <TabsContent value="notes" className="space-y-6 outline-none">
                     <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                        <div className="flex items-start gap-3">
                           <Info className="h-5 w-5 text-amber-600 mt-0.5" />
                           <div>
                              <p className="font-bold text-sm mb-1">Visible only to support staff</p>
                              <p className="text-xs opacity-90">Internal notes are never sent to the customer. Use this to document internal investigation processes.</p>
                           </div>
                        </div>
                     </div>
                     <Textarea 
                         placeholder="Add an internal note..." 
                         className="min-h-[100px] resize-none border-dashed bg-muted/20 focus-visible:ring-1"
                      />
                      <div className="flex justify-end">
                         <Button variant="secondary" size="sm">Add Note</Button>
                      </div>
                  </TabsContent>

                  {/* Timeline Tab */}
                  <TabsContent value="timeline" className="outline-none">
                     <div className="relative pl-6 border-l-2 border-muted space-y-8 mt-2 pb-4">
                        <div className="relative">
                           <div className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-blue-500 ring-4 ring-white" />
                           <p className="text-xs text-muted-foreground font-medium mb-1">{selectedTicket.lastUpdated}</p>
                           <p className="text-sm font-medium">Status changed to <span className="font-bold text-foreground">{selectedTicket.status}</span></p>
                           <p className="text-xs text-muted-foreground mt-0.5">by {selectedTicket.assignedTo}</p>
                        </div>
                        <div className="relative">
                           <div className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-muted-foreground ring-4 ring-white" />
                           <p className="text-xs text-muted-foreground font-medium mb-1">{selectedTicket.createdAt}</p>
                           <p className="text-sm font-medium">Ticket created</p>
                           <p className="text-xs text-muted-foreground mt-0.5">via Customer Portal</p>
                        </div>
                     </div>
                  </TabsContent>

                  {/* Cafe Info Tab */}
                  <TabsContent value="cafe" className="outline-none space-y-4">
                     <Card className="shadow-none border border-muted/60">
                        <CardHeader className="pb-3 border-b bg-muted/10">
                           <CardTitle className="text-sm">Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                           <div className="flex items-center gap-3 text-sm">
                              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0"><User className="h-4 w-4 text-muted-foreground" /></div>
                              <div><p className="text-xs text-muted-foreground">Admin Name</p><p className="font-medium">{selectedTicket.contact.name}</p></div>
                           </div>
                           <div className="flex items-center gap-3 text-sm">
                              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0"><Mail className="h-4 w-4 text-muted-foreground" /></div>
                              <div><p className="text-xs text-muted-foreground">Email Address</p><p className="font-medium">{selectedTicket.contact.email}</p></div>
                           </div>
                           <div className="flex items-center gap-3 text-sm">
                              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0"><Phone className="h-4 w-4 text-muted-foreground" /></div>
                              <div><p className="text-xs text-muted-foreground">Phone Number</p><p className="font-medium">{selectedTicket.contact.phone}</p></div>
                           </div>
                        </CardContent>
                     </Card>

                     <Card className="shadow-none border border-muted/60">
                        <CardHeader className="pb-3 border-b bg-muted/10">
                           <CardTitle className="text-sm">Subscription Details</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                           <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Current Plan</span>
                              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 shadow-none">Pro Plan</Badge>
                           </div>
                           <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Status</span>
                              <span className="font-medium text-green-600">Active</span>
                           </div>
                           <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Renewal Date</span>
                              <span className="font-medium">Nov 28, 2024</span>
                           </div>
                           <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Total Tickets</span>
                              <span className="font-medium text-primary underline cursor-pointer">4 tickets</span>
                           </div>
                        </CardContent>
                     </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
