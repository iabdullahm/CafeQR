"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";
import { SectionHeader } from "@/components/dashboard/section-header";
import { DataTableReusable } from "@/components/tables/data-table-reusable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  Filter, 
  RefreshCw, 
  Download, 
  ChevronRight,
  MoreHorizontal,
  User,
  Mail,
  MapPin,
  Clock
} from "lucide-react";
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
  SelectValue 
} from "@/components/ui/select";
import Link from "next/link";

export default function CafeManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: cafesData, isLoading, refetch } = useQuery({
    queryKey: ["cafes", searchTerm, statusFilter],
    queryFn: async () => {
      const res = await api.get('/cafes', {
        params: {
          search: searchTerm,
          status: statusFilter === 'all' ? undefined : statusFilter,
          page: 1,
          limit: 10
        }
      });
      return res.data.data;
    }
  });

  const columns = [
    {
      key: "name",
      label: "Cafe",
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
            {row.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-bold">{row.name}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-mono">{row.cafe_code}</span>
          </div>
        </div>
      )
    },
    {
      key: "owner",
      label: "Owner & Contact",
      render: (row: any) => (
        <div className="flex flex-col text-sm">
          <span className="font-medium flex items-center gap-1.5"><User className="h-3 w-3" /> {row.owner_name}</span>
          <span className="text-muted-foreground text-xs flex items-center gap-1.5 mt-0.5"><Mail className="h-3 w-3" /> {row.email}</span>
        </div>
      )
    },
    {
      key: "city",
      label: "City",
      render: (row: any) => (
        <span className="text-sm font-medium flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {row.city}
        </span>
      )
    },
    {
      key: "plan",
      label: "Plan",
      render: (row: any) => (
        <Badge variant="outline" className="border-primary/30 text-primary">{row.plan_name}</Badge>
      )
    },
    {
      key: "status",
      label: "Status",
      render: (row: any) => {
        const variants: Record<string, string> = {
          active: "bg-green-600 font-bold",
          suspended: "bg-destructive font-bold",
          trial: "border-blue-500 text-blue-500 font-bold",
          expired: "bg-secondary font-bold"
        };
        return <Badge className={variants[row.status] || ""}>{row.status}</Badge>;
      }
    },
    {
      key: "actions",
      label: "",
      className: "text-right pr-6",
      render: (row: any) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href={`/super-admin/cafes/${row.id}`}>
              <ChevronRight className="h-5 w-5" />
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/super-admin/cafes/${row.id}`}>View Details</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>Login as Admin</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive font-bold">Suspend Account</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <SectionHeader 
        title="Cafe Management" 
        description="Directly manage all registered tenants and platform access."
        actions={
          <>
            <Button variant="outline" className="gap-2 bg-card" onClick={() => refetch()}>
              <RefreshCw className={isLoading ? "animate-spin" : ""} /> Refresh
            </Button>
            <Button variant="outline" className="gap-2 bg-card">
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button className="bg-primary hover:bg-primary/90 gap-2">
              <Plus className="h-4 w-4" /> Add New Cafe
            </Button>
          </>
        }
      />

      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, owner, email, city..." 
            className="pl-10 h-11"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-11">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="trial">Trial</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-11 gap-2 bg-card">
            <Filter className="h-4 w-4" /> Filters
          </Button>
        </div>
      </div>

      <DataTableReusable 
        columns={columns} 
        data={cafesData?.items || []} 
        isLoading={isLoading}
      />
    </div>
  );
}
