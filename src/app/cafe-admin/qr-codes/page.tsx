"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/dashboard/section-header";
import { QrCode, Download, Printer, RefreshCw, Eye, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DataTableReusable } from "@/components/tables/data-table-reusable";

const QR_DATA = [
  { id: "1", name: "Table T-01", type: "table", branch: "Main Downtown", scans: 1450, lastScanned: "2m ago", status: "active" },
  { id: "2", name: "Car Order Car-01", type: "car", branch: "Main Downtown", scans: 840, lastScanned: "15m ago", status: "active" },
  { id: "3", name: "General Menu QR", type: "general", branch: "Manhattan North", scans: 2504, lastScanned: "Just now", status: "active" },
  { id: "4", name: "Outdoor O-01", type: "table", branch: "Main Downtown", scans: 320, lastScanned: "1h ago", status: "inactive" },
];

export default function QRManagement() {
  const columns = [
    {
      key: "name",
      label: "QR Name & Branch",
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold leading-tight">{row.name}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{row.branch}</p>
          </div>
        </div>
      )
    },
    {
      key: "type",
      label: "Type",
      render: (row: any) => (
        <Badge variant="secondary" className="capitalize text-[10px]">{row.type}</Badge>
      )
    },
    {
      key: "scans",
      label: "Total Scans",
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="font-bold">{row.scans.toLocaleString()}</span>
          <span className="text-[10px] text-muted-foreground">Last: {row.lastScanned}</span>
        </div>
      )
    },
    {
      key: "status",
      label: "Status",
      render: (row: any) => (
        <Badge className={row.status === 'active' ? 'bg-green-600' : 'bg-muted text-muted-foreground'}>
          {row.status}
        </Badge>
      )
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (row: any) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"><Printer className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"><RefreshCw className="h-4 w-4" /></Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <SectionHeader 
        title="QR Codes Command Center" 
        description="Generate, monitor, and print QR codes for your tables and branches."
        actions={
          <div className="flex gap-2">
             <Button variant="outline" className="gap-2"><Printer className="h-4 w-4" /> Bulk Print</Button>
             <Button className="bg-primary gap-2"><RefreshCw className="h-4 w-4" /> Regenerate All</Button>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-sm bg-card md:col-span-2">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>QR Inventory</CardTitle>
                <CardDescription>Track scan engagement across your locations.</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative w-48">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input placeholder="Search QR..." className="pl-7 h-8 text-xs" />
                </div>
                <Button variant="outline" size="sm" className="h-8"><Filter className="h-3 w-3" /></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
             <DataTableReusable columns={columns} data={QR_DATA} />
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-primary text-primary-foreground">
           <CardHeader>
             <CardTitle className="text-xl">Print Setup</CardTitle>
             <CardDescription className="text-primary-foreground/70">Recommended printing guidelines.</CardDescription>
           </CardHeader>
           <CardContent className="space-y-6">
              <div className="p-4 rounded-xl bg-white/10 border border-white/20 space-y-2">
                 <p className="text-sm font-bold">Standard Size</p>
                 <p className="text-xs opacity-80">Print at 5cm x 5cm for optimal scanning at table distance.</p>
              </div>
              <div className="p-4 rounded-xl bg-white/10 border border-white/20 space-y-2">
                 <p className="text-sm font-bold">Material Choice</p>
                 <p className="text-xs opacity-80">Use matte finish stickers or acrylic table-tents to prevent glare from cafe lighting.</p>
              </div>
              <div className="p-4 rounded-xl bg-white/10 border border-white/20 space-y-2">
                 <p className="text-sm font-bold">Dynamic Links</p>
                 <p className="text-xs opacity-80">All QR codes are dynamic. You can change table numbers or branches without re-printing.</p>
              </div>
              <Button variant="secondary" className="w-full font-bold">Download Print Kit (PDF)</Button>
           </CardContent>
        </Card>
      </div>
    </div>
  );
}
