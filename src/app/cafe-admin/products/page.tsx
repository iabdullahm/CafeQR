"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionHeader } from "@/components/dashboard/section-header";
import { Plus, Search, Filter, Coffee, Image as ImageIcon, MoreHorizontal, Edit, Trash2, SwitchCamera } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DataTableReusable } from "@/components/tables/data-table-reusable";

const PRODUCTS_DATA = [
  { id: "1", name: "House Blend Coffee", category: "Hot Drinks", price: "$4.50", stock: "In Stock", status: "active", img: "https://picsum.photos/seed/p1/50/50" },
  { id: "2", name: "Caramel Macchiato", category: "Hot Drinks", price: "$5.50", stock: "Low Stock", status: "active", img: "https://picsum.photos/seed/p2/50/50" },
  { id: "3", name: "Avocado Toast", category: "Food", price: "$12.00", stock: "In Stock", status: "active", img: "https://picsum.photos/seed/p3/50/50" },
  { id: "4", name: "Berry Muffin", category: "Snacks", price: "$3.50", stock: "Out of Stock", status: "inactive", img: "https://picsum.photos/seed/p4/50/50" },
];

export default function ProductsManagement() {
  const [view, setView] = useState<"grid" | "list">("grid");

  const columns = [
    {
      key: "name",
      label: "Product",
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <img src={row.img} alt={row.name} className="h-10 w-10 rounded-lg object-cover" />
          <div className="flex flex-col">
            <span className="font-bold">{row.name}</span>
            <span className="text-[10px] text-muted-foreground uppercase">{row.category}</span>
          </div>
        </div>
      )
    },
    { key: "price", label: "Price" },
    { 
      key: "stock", 
      label: "Stock Status",
      render: (row: any) => (
        <span className={`text-xs font-medium ${row.stock === 'Out of Stock' ? 'text-destructive' : row.stock === 'Low Stock' ? 'text-orange-600' : 'text-green-600'}`}>
          {row.stock}
        </span>
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
      label: "",
      className: "text-right pr-6",
      render: (row: any) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <SectionHeader 
        title="Products Management" 
        description="Manage your individual products, prices, and stock availability."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setView(view === 'grid' ? 'list' : 'grid')} className="gap-2">
              <SwitchCamera className="h-4 w-4" /> {view === 'grid' ? 'List View' : 'Grid View'}
            </Button>
            <Button size="sm" className="bg-primary gap-2"><Plus className="h-4 w-4" /> Add Product</Button>
          </div>
        }
      />

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products by name, SKU or category..." className="pl-10" />
        </div>
        <Button variant="outline" className="gap-2"><Filter className="h-4 w-4" /> Filters</Button>
      </div>

      {view === 'grid' ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {PRODUCTS_DATA.map((product) => (
            <Card key={product.id} className="border-none shadow-sm overflow-hidden group">
               <div className="aspect-square bg-muted relative overflow-hidden">
                  <img src={product.img.replace('50/50', '400/400')} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                     <Badge className="bg-background/80 backdrop-blur-sm text-foreground">{product.price}</Badge>
                     <Badge className={product.status === 'active' ? 'bg-green-600' : 'bg-muted text-muted-foreground'}>{product.status}</Badge>
                  </div>
               </div>
               <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-lg leading-tight">{product.name}</h3>
                      <p className="text-xs text-muted-foreground uppercase">{product.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className={`text-[10px] font-bold uppercase ${product.stock === 'Out of Stock' ? 'text-destructive' : 'text-muted-foreground'}`}>{product.stock}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
               </CardContent>
            </Card>
          ))}
          <button className="border-2 border-dashed border-muted rounded-xl flex flex-col items-center justify-center p-12 text-muted-foreground hover:bg-muted/10 hover:border-primary/50 transition-all min-h-[300px]">
             <Plus className="h-8 w-8 mb-2" />
             <p className="font-bold">Add New Product</p>
          </button>
        </div>
      ) : (
        <DataTableReusable columns={columns} data={PRODUCTS_DATA} />
      )}
    </div>
  );
}
