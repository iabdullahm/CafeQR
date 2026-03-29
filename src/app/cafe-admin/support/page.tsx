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
import { 
  Search, 
  Filter, 
  Plus, 
  CreditCard, 
  ShoppingBag, 
  QrCode, 
  Store, 
  Gift, 
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  ArrowRight,
  ExternalLink,
  Send,
  Paperclip,
  CheckCheck,
  FileText
} from "lucide-react";

// Mock Data for Design Purposes
const MOCK_TICKETS = [
  {
    id: "TCK-1049",
    subject: "Menu sync failing with POS",
    category: "Technical Issues",
    priority: "High",
    status: "Open",
    lastUpdate: "Today, 10:15 AM",
    messages: [
      { sender: "cafe", text: "Our menu changes on the CafeQR dashboard are not reflecting on the POS system since the latest update. Please advise.", time: "Today, 09:42 AM" },
      { sender: "support", text: "Hi there. We are currently looking into the POS sync delay issue affecting some users. Our engineers are on it.", time: "Today, 10:15 AM" }
    ]
  },
  {
    id: "TCK-1048",
    subject: "Missing payout for last week",
    category: "Billing",
    priority: "Urgent",
    status: "In Progress",
    lastUpdate: "Yesterday, 04:20 PM",
    messages: [
      { sender: "cafe", text: "We have not received the weekly payout for the period ending on Friday. Can you please check the transfer status?", time: "Yesterday, 09:00 AM" },
      { sender: "support", text: "Hello! Checking with our finance gateway. Withdrawals usually delay by 1 business day during holidays. Let me track the exact TXN.", time: "Yesterday, 04:20 PM" }
    ]
  },
  {
    id: "TCK-1047",
    subject: "How to add multiple branches?",
    category: "General",
    priority: "Low",
    status: "Resolved",
    lastUpdate: "Oct 24, 02:15 PM",
    messages: [
      { sender: "cafe", text: "We are opening a new branch next month. What is the process to add it under our current Pro plan?", time: "Oct 24, 11:00 AM" },
      { sender: "support", text: "Congratulations on the expansion! You can easily add a new branch by going to Settings -> Branches -> Add New. Since you are on the Pro plan, branch additions are already included at no extra cost.", time: "Oct 24, 02:15 PM" }
    ]
  },
];

const QUICK_HELP_TOPICS = [
  { title: "Billing & Subscriptions", desc: "Invoices, plans, and payouts.", icon: CreditCard, color: "text-blue-600", bg: "bg-blue-50" },
  { title: "Orders & Payments", desc: "Order statuses, refunds.", icon: ShoppingBag, color: "text-green-600", bg: "bg-green-50" },
  { title: "QR Code Issues", desc: "Linking tables, resetting.", icon: QrCode, color: "text-indigo-600", bg: "bg-indigo-50" },
  { title: "Menu Management", desc: "Items, categories, pricing.", icon: Store, color: "text-amber-600", bg: "bg-amber-50" },
  { title: "Loyalty Program", desc: "Setting up points & stamps.", icon: Gift, color: "text-purple-600", bg: "bg-purple-50" },
  { title: "Technical Issues", desc: "POS Sync, bug reports.", icon: Wrench, color: "text-red-600", bg: "bg-red-50" },
];

export default function SupportCenterPage() {
  const [tickets, setTickets] = useState(MOCK_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Status and Priority Badges
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Urgent': return <Badge variant="destructive" className="font-bold gap-1 bg-red-600"><AlertTriangle className="h-3 w-3" /> Urgent</Badge>;
      case 'High': return <Badge variant="destructive" className="font-bold gap-1 bg-orange-500 hover:bg-orange-600"><AlertTriangle className="h-3 w-3" /> High</Badge>;
      case 'Medium': return <Badge variant="secondary" className="font-bold text-blue-700 bg-blue-100">Medium</Badge>;
      case 'Low': return <Badge variant="outline" className="font-bold text-muted-foreground">Low</Badge>;
      default: return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Open': return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 border font-bold shadow-sm">Open</Badge>;
      case 'In Progress': return <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 border font-bold shadow-sm">In Progress</Badge>;
      case 'Waiting for You': return <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200 border font-bold shadow-sm">Waiting for You</Badge>;
      case 'Resolved': return <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 border font-bold shadow-sm">Resolved</Badge>;
      case 'Closed': return <Badge variant="outline" className="text-muted-foreground font-bold shadow-sm">Closed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const openChat = (ticket: any) => {
    setSelectedTicket(ticket);
    setIsChatOpen(true);
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* 1) Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground tracking-tight">Support Center</h1>
          <p className="text-muted-foreground mt-1.5 text-base">Get help, report issues, and track your requests.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 h-11 bg-white shadow-sm rounded-xl hidden sm:flex">
            <ExternalLink className="h-4 w-4" /> View Help Articles
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 h-11 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md rounded-xl px-6">
                <Plus className="h-4 w-4" /> Create Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden rounded-2xl">
              <div className="bg-muted/30 p-6 border-b">
                 <DialogTitle className="text-2xl font-bold">New Support Ticket</DialogTitle>
                 <DialogDescription className="mt-1.5">Please describe the issue in detail to help us assist you faster.</DialogDescription>
              </div>
              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="subject" className="font-bold">Subject</Label>
                  <Input id="subject" placeholder="e.g., POS menu not syncing properly" className="h-11 rounded-xl bg-muted/20 focus-visible:ring-1" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold">Category</Label>
                    <Select>
                      <SelectTrigger className="h-11 rounded-xl bg-muted/20">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Technical Issue</SelectItem>
                        <SelectItem value="billing">Billing & Payment</SelectItem>
                        <SelectItem value="account">Account Settings</SelectItem>
                        <SelectItem value="general">General Inquiry</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Priority</Label>
                    <Select defaultValue="medium">
                      <SelectTrigger className="h-11 rounded-xl bg-muted/20">
                        <SelectValue placeholder="Select Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low - General Question</SelectItem>
                        <SelectItem value="medium">Medium - Core Feature Not Working</SelectItem>
                        <SelectItem value="high">High - Business Impacted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="font-bold">Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Provide as much detail as possible..." 
                    className="min-h-[140px] resize-none rounded-xl bg-muted/20 focus-visible:ring-1" 
                  />
                </div>
                <div className="pt-2 border-t border-dashed mt-4">
                  <Label className="font-bold block mb-2">Attachments (Optional)</Label>
                  <div className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/30 transition-colors bg-muted/10">
                     <FileText className="h-8 w-8 text-muted-foreground/50 mb-2" />
                     <p className="text-sm font-medium">Click to upload or drag & drop</p>
                     <p className="text-xs text-muted-foreground mt-1">PNG, JPG, PDF up to 10MB</p>
                  </div>
                </div>
              </div>
              <DialogFooter className="p-6 border-t bg-muted/10 gap-2 sm:gap-0">
                <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="rounded-xl h-11">Cancel</Button>
                <Button type="submit" className="rounded-xl h-11 px-8 shadow-md">Submit Ticket</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 2) Quick Help Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground px-1">Quick Help & Knowledge Base</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_HELP_TOPICS.map((topic, i) => (
            <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer rounded-2xl overflow-hidden group">
              <CardContent className="p-5 flex items-start gap-4 h-full">
                <div className={`p-3 rounded-xl ${topic.bg} ${topic.color} shrink-0`}>
                  <topic.icon className="h-6 w-6" />
                </div>
                <div className="flex flex-col h-full justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-foreground text-base tracking-tight">{topic.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-1">{topic.desc}</p>
                  </div>
                  <span className="text-sm font-semibold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                    Learn More <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 3) Support Tickets Area */}
      <div className="space-y-6 pt-4">
        <h2 className="text-lg font-bold text-foreground px-1">Your Support Tickets</h2>
        
        {/* Filters Bar */}
        <div className="flex flex-col lg:flex-row gap-4 bg-card p-2 rounded-2xl border shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search ticket ID or subject..." className="pl-11 h-12 border-none bg-transparent shadow-none focus-visible:ring-0 text-base" />
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t lg:border-t-0 lg:border-l pt-3 lg:pt-0 lg:pl-3 p-1">
            <Select defaultValue="all">
              <SelectTrigger className="w-[140px] h-10 border-none bg-muted/40 rounded-xl font-medium">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-[130px] h-10 border-none bg-muted/40 rounded-xl font-medium">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-muted/40 text-muted-foreground hover:text-primary">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tickets Table / Cards */}
        <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-card">
           {tickets.length === 0 ? (
             <CardContent className="py-20 flex flex-col items-center justify-center text-center">
                <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                   <MessageSquare className="h-10 w-10 text-primary/40" />
                </div>
                <h3 className="text-xl font-bold mb-2">No support tickets yet</h3>
                <p className="text-muted-foreground mb-6 max-w-[300px]">Have a question or facing an issue? We're here to help you succeed.</p>
                <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl shadow-md h-11 px-6">
                   <Plus className="h-4 w-4 mr-2" /> Create Your First Ticket
                </Button>
             </CardContent>
           ) : (
             <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20 hover:bg-muted/20 border-b">
                      <TableHead className="font-bold px-6 h-12 text-muted-foreground">Ticket</TableHead>
                      <TableHead className="font-bold text-muted-foreground">Category</TableHead>
                      <TableHead className="font-bold text-muted-foreground">Priority</TableHead>
                      <TableHead className="font-bold text-muted-foreground">Status</TableHead>
                      <TableHead className="font-bold text-muted-foreground">Last Update</TableHead>
                      <TableHead className="font-bold text-right pr-6 text-muted-foreground">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((ticket) => (
                      <TableRow key={ticket.id} className="hover:bg-muted/30 transition-colors cursor-pointer group" onClick={() => openChat(ticket)}>
                        <TableCell className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground text-sm tracking-tight mb-1">{ticket.subject}</span>
                            <span className="text-[11px] font-mono font-medium text-muted-foreground bg-muted w-fit px-1.5 py-0.5 rounded">{ticket.id}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                           <Badge variant="outline" className="bg-white text-xs py-0.5 font-medium shadow-sm">{ticket.category}</Badge>
                        </TableCell>
                        <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                        <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                        <TableCell>
                          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            <Clock className="h-3 w-3" /> {ticket.lastUpdate}
                          </span>
                        </TableCell>
                        <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                           <Button onClick={() => openChat(ticket)} variant="outline" size="sm" className="rounded-lg bg-white h-8 shadow-sm group-hover:border-primary/50 group-hover:text-primary transition-colors">
                              View Ticket <ArrowRight className="h-3 w-3 ml-2" />
                           </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
             </div>
           )}
        </Card>
      </div>

      {/* Ticket Details Chat View (Sheet) */}
      <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
        <SheetContent side="right" className="w-[100vw] sm:w-[500px] md:w-[600px] p-0 flex flex-col h-full border-l shadow-2xl bg-[#F8FAFC] sm:max-w-none">
          {selectedTicket && (
            <>
              {/* Header */}
              <div className="p-6 border-b shrink-0 bg-white z-10 shadow-sm">
                <SheetHeader className="text-left">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant="outline" className="font-mono bg-muted/50 border-dashed">{selectedTicket.id}</Badge>
                    {getStatusBadge(selectedTicket.status)}
                    {getPriorityBadge(selectedTicket.priority)}
                  </div>
                  <SheetTitle className="text-xl font-bold leading-tight">{selectedTicket.subject}</SheetTitle>
                  <SheetDescription className="mt-1 text-sm">{selectedTicket.category}</SheetDescription>
                </SheetHeader>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                 {selectedTicket.messages.map((msg: any, idx: number) => {
                    const isCafe = msg.sender === 'cafe';
                    return (
                       <div key={idx} className={`flex flex-col gap-1 w-full max-w-[85%] ${isCafe ? 'ml-auto' : 'mr-auto'}`}>
                          <div className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider ${isCafe ? 'justify-end text-primary' : 'text-muted-foreground'}`}>
                             {isCafe ? 'You (Cafe Owner)' : 'CafeQR Support'}
                          </div>
                          <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed relative ${isCafe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-white border text-foreground rounded-tl-sm'}`}>
                             {msg.text}
                          </div>
                          <div className={`text-[10px] text-muted-foreground font-medium ${isCafe ? 'text-right' : 'text-left'}`}>
                             {msg.time} {isCafe && <CheckCheck className="h-3 w-3 inline ml-1 text-primary/60" />}
                          </div>
                       </div>
                    )
                 })}
              </div>

              {/* Input Area */}
              <div className="p-5 border-t shrink-0 bg-white shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
                 {selectedTicket.status === 'Resolved' || selectedTicket.status === 'Closed' ? (
                    <div className="text-center p-4 bg-muted/30 rounded-xl border border-dashed">
                       <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto mb-2" />
                       <p className="font-bold text-sm">This ticket has been resolved.</p>
                       <p className="text-xs text-muted-foreground mt-1">If you need further assistance, please open a new ticket.</p>
                    </div>
                 ) : (
                    <div className="space-y-4">
                       <Textarea 
                          placeholder="Type your reply here..." 
                          className="min-h-[100px] resize-none rounded-xl bg-muted/10 border-muted focus-visible:ring-1 text-sm p-4"
                       />
                       <div className="flex items-center justify-between">
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-muted-foreground hover:bg-muted/50 hover:text-primary">
                             <Paperclip className="h-5 w-5" />
                          </Button>
                          <div className="flex gap-2">
                             <Button variant="outline" className="h-10 rounded-xl font-bold bg-white shadow-sm border-dashed text-green-700 border-green-200">
                                Mark as Resolved
                             </Button>
                             <Button className="h-10 px-6 rounded-xl font-bold shadow-md gap-2 bg-primary">
                                Send Reply <Send className="h-4 w-4" />
                             </Button>
                          </div>
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
