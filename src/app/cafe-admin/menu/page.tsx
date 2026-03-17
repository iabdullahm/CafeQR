"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Wand2, Edit, Trash2, SwitchCamera, Coffee, Pizza, IceCream } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { generateMenuDescription } from "@/ai/flows/generate-menu-description";
import { useToast } from "@/hooks/use-toast";

const INITIAL_PRODUCTS = [
  { id: "1", name: "Classic Espresso", price: 4.50, category: "Coffee", active: true, description: "Pure shot of dark roasted beans." },
  { id: "2", name: "Cappuccino", price: 5.50, category: "Coffee", active: true, description: "Balanced espresso with micro-foam." },
  { id: "3", name: "Croissant", price: 3.50, category: "Pastry", active: true, description: "Flaky buttery perfection." },
];

export default function MenuManagement() {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", ingredients: "", description: "" });
  const { toast } = useToast();

  const handleGenerateDescription = async () => {
    if (!newProduct.name || !newProduct.ingredients) {
      toast({ title: "Error", description: "Provide name and ingredients first." });
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generateMenuDescription({
        itemName: newProduct.name,
        ingredients: newProduct.ingredients,
        tasteProfile: "delicious and fresh",
      });
      setNewProduct(prev => ({ ...prev, description: result.description }));
    } catch (e) {
      toast({ title: "Generation failed", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Menu Management</h1>
          <p className="text-muted-foreground">Manage your categories and products.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-10 w-[200px] md:w-[300px]" placeholder="Search products..." />
          </div>
          <Button className="bg-primary">
            <Plus className="h-4 w-4 mr-2" /> Add Item
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="bg-card border mb-4 p-1 h-auto flex flex-wrap">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="coffee" className="gap-2"><Coffee className="h-4 w-4" /> Coffee</TabsTrigger>
              <TabsTrigger value="pastry" className="gap-2"><Pizza className="h-4 w-4" /> Pastry</TabsTrigger>
              <TabsTrigger value="dessert" className="gap-2"><IceCream className="h-4 w-4" /> Dessert</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-0">
               <div className="grid gap-4 sm:grid-cols-2">
                 {products.map((p) => (
                   <Card key={p.id} className="overflow-hidden group">
                      <div className="aspect-[16/9] bg-muted relative overflow-hidden">
                        <img 
                          src={`https://picsum.photos/seed/${p.id}/400/225`} 
                          alt={p.name}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                        />
                        <Badge className="absolute top-2 right-2 bg-background/80 text-foreground backdrop-blur-sm">
                           ${p.price.toFixed(2)}
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                           <div>
                              <h3 className="font-bold text-lg">{p.name}</h3>
                              <p className="text-xs text-muted-foreground">{p.category}</p>
                           </div>
                           <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                           </div>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                      </CardContent>
                   </Card>
                 ))}
               </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-4">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Quick Add Product</CardTitle>
              <CardDescription>Use AI to generate descriptions instantly.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Product Name</Label>
                <Input 
                  placeholder="e.g. Vanilla Bean Latte" 
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Key Ingredients</Label>
                <Input 
                  placeholder="Espresso, vanilla, steamed milk" 
                  value={newProduct.ingredients}
                  onChange={(e) => setNewProduct({...newProduct, ingredients: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Description</Label>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="h-auto p-0 text-accent font-bold flex gap-1 items-center"
                    onClick={handleGenerateDescription}
                    disabled={isGenerating}
                  >
                    <Wand2 className="h-3 w-3" />
                    {isGenerating ? "Generating..." : "Generate AI"}
                  </Button>
                </div>
                <Textarea 
                  className="min-h-[100px]" 
                  placeholder="Appetizing description of your item..." 
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                />
              </div>
              <Button className="w-full bg-primary">Create Product</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
