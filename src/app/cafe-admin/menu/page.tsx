"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Wand2, Trash2, Coffee, Pizza, IceCream } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { generateMenuDescription } from "@/ai/flows/generate-menu-description";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { collection, query, doc, setDoc, deleteDoc } from "firebase/firestore";
import { callAiWithRetry, withAiCache } from "@/lib/ai-utils";

export default function MenuManagement() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", ingredients: "", description: "", price: "0", category: "Coffee" });
  const [searchTerm, setSearchTerm] = useState("");
  
  // Rate limiting ref
  const lastCallTimestamp = useRef(0);

  const cafeId = user?.email?.includes('urban') ? 'urban-brew-cafe' : 'coastal-cup';

  const productsQuery = useMemoFirebase(() => {
    if (!db || !cafeId) return null;
    return query(collection(db, 'cafes', cafeId, 'products'));
  }, [db, cafeId]);
  const { data: products, isLoading } = useCollection(productsQuery);

  const handleGenerateDescription = async () => {
    if (!newProduct.name || !newProduct.ingredients) {
      toast({ title: "Details Required", description: "Please provide a name and ingredients first.", variant: "destructive" });
      return;
    }

    // 1. Client-side Rate Limiting (Cooldown)
    const now = Date.now();
    if (now - lastCallTimestamp.current < 3000) {
      toast({ title: "Please wait", description: "Wait a few seconds before generating another description.", variant: "secondary" });
      return;
    }
    lastCallTimestamp.current = now;

    setIsGenerating(true);
    
    // Create a cache key based on inputs
    const cacheKey = `desc-${newProduct.name}-${newProduct.ingredients}`.toLowerCase().replace(/\s+/g, '-');

    try {
      // 2. Use Cache + Retry Logic
      const result = await withAiCache(cacheKey, () => 
        callAiWithRetry(() => generateMenuDescription({
          itemName: newProduct.name,
          ingredients: newProduct.ingredients,
          tasteProfile: "delicious and fresh",
        }))
      );

      setNewProduct(prev => ({ ...prev, description: result.description }));
      toast({ title: "Description Generated!", description: "AI has crafted an appetizing text for you." });
    } catch (e: any) {
      console.error(e);
      const isRateLimit = e.message?.includes('429') || e.status === 429 || e.message?.includes('exhausted');
      
      if (isRateLimit) {
        toast({ 
          title: "AI Service Busy", 
          description: "We tried several times, but the AI is currently at capacity. Please try again in a minute.", 
          variant: "destructive" 
        });
      } else {
        toast({ title: "Generation failed", description: "We couldn't reach the AI describer right now.", variant: "destructive" });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!db || !cafeId || !newProduct.name) return;
    
    const productId = newProduct.name.toLowerCase().replace(/\s+/g, '-');
    const productRef = doc(db, 'cafes', cafeId, 'products', productId);
    
    await setDoc(productRef, {
      ...newProduct,
      price: Number(newProduct.price),
      cafeId,
      isActive: true,
      createdAt: new Date().toISOString()
    });

    setNewProduct({ name: "", ingredients: "", description: "", price: "0", category: "Coffee" });
    toast({ title: "Product Created", description: `${newProduct.name} is now on your menu.` });
  };

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Menu Management</h1>
          <p className="text-muted-foreground">Manage your cafe's digital menu items and pricing.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              className="pl-10 w-[200px] md:w-[300px]" 
              placeholder="Search products..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="bg-card border mb-4 p-1 h-auto flex flex-wrap">
              <TabsTrigger value="all">All Items</TabsTrigger>
              <TabsTrigger value="Coffee" className="gap-2"><Coffee className="h-4 w-4" /> Coffee</TabsTrigger>
              <TabsTrigger value="Food" className="gap-2"><Pizza className="h-4 w-4" /> Food</TabsTrigger>
              <TabsTrigger value="Dessert" className="gap-2"><IceCream className="h-4 w-4" /> Dessert</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-0">
               {isLoading ? (
                 <div className="grid gap-4 sm:grid-cols-2">
                   {[1,2,3,4].map(i => <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />)}
                 </div>
               ) : (
                 <div className="grid gap-4 sm:grid-cols-2">
                   {filteredProducts?.map((p) => (
                     <Card key={p.id} className="overflow-hidden group border-none shadow-sm hover:shadow-md transition-all">
                        <div className="aspect-[16/9] bg-muted relative overflow-hidden">
                          <img 
                            src={`https://picsum.photos/seed/${p.id}/400/225`} 
                            alt={p.name}
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                          />
                          <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">
                             OMR {Number(p.price).toFixed(3)}
                          </Badge>
                        </div>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                             <div>
                                <h3 className="font-bold text-lg">{p.name}</h3>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{p.category}</p>
                             </div>
                             <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteDoc(doc(db!, 'cafes', cafeId!, 'products', p.id))}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                             </div>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 italic">{p.description}</p>
                        </CardContent>
                     </Card>
                   ))}
                   {filteredProducts?.length === 0 && (
                     <div className="col-span-full py-20 text-center border-2 border-dashed rounded-3xl text-muted-foreground">
                        No products found matching your search.
                     </div>
                   )}
                 </div>
               )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-4">
          <Card className="sticky top-24 border-none shadow-lg bg-card overflow-hidden">
            <div className="h-2 bg-primary" />
            <CardHeader>
              <CardTitle>Add New Product</CardTitle>
              <CardDescription>Fill in the details to expand your menu.</CardDescription>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price (OMR)</Label>
                  <Input 
                    type="number"
                    step="0.100"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input 
                    placeholder="e.g. Coffee"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                  />
                </div>
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
                  <Label>AI Description</Label>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="h-auto p-0 text-accent font-bold flex gap-1 items-center hover:no-underline"
                    onClick={handleGenerateDescription}
                    disabled={isGenerating}
                  >
                    <Wand2 className={`h-3.5 w-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                    {isGenerating ? "Crafting..." : "Generate with AI"}
                  </Button>
                </div>
                <Textarea 
                  className="min-h-[100px] bg-muted/20" 
                  placeholder="Appetizing description of your item..." 
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                />
              </div>
              <Button className="w-full bg-primary h-12 text-lg font-bold rounded-xl" onClick={handleCreateProduct}>
                Add to Menu
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
