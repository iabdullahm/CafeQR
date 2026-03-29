"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Wand2, Trash2, Coffee, Pizza, IceCream, Loader2, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { generateMenuDescription } from "@/ai/flows/generate-menu-description";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useMemoFirebase, useCollection, useDoc, useFirebaseApp } from "@/firebase";
import { collection, query, doc, setDoc, deleteDoc } from "firebase/firestore";
import { callAiWithRetry, withAiCache } from "@/lib/ai-utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const CATEGORIES = [
  { id: 'hot_drinks', en: 'Hot Drinks', ar: 'المشروبات الساخنة' },
  { id: 'cold_drinks', en: 'Cold Drinks', ar: 'المشروبات الباردة' },
  { id: 'cold_brew', en: 'Cold Brew', ar: 'كولد برو' },
  { id: 'iced_tea', en: 'Iced Tea', ar: 'الشاي المثلج' },
  { id: 'ice_cream', en: 'Ice Cream', ar: 'ايس كريم' },
  { id: 'specialty_tea', en: 'Specialty Tea', ar: 'الشاي المختص' },
  { id: 'hibiscus', en: 'Hibiscus', ar: 'الكركدية' },
  { id: 'sweets', en: 'Sweets', ar: 'السويتات' },
  { id: 'matcha', en: 'Matcha', ar: 'الماتشا' },
];

export default function MenuManagement() {
  const { user } = useUser();
  const db = useFirestore();
  const firebaseApp = useFirebaseApp();
  const { toast } = useToast();
  
  const [selectedTab, setSelectedTab] = useState("all");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({ name: "", ingredients: "", description: "", price: "0", category: "hot_drinks", imageUrl: "" });
  const [searchTerm, setSearchTerm] = useState("");
  
  // Rate limiting ref
  const lastCallTimestamp = useRef(0);

  const userProfileRef = useMemoFirebase(() => {
    return (db && user) ? doc(db, 'users', user.uid) : null;
  }, [db, user]);
  const { data: userProfile } = useDoc(userProfileRef);
  const cafeId = userProfile?.cafeId;

  const productsQuery = useMemoFirebase(() => {
    if (!db || !cafeId) return null;
    return query(collection(db, 'cafes', cafeId, 'products'));
  }, [db, cafeId]);
  const { data: products, isLoading } = useCollection(productsQuery);

  const configRef = useMemoFirebase(() => db && cafeId ? doc(db, 'cafes', cafeId, 'config', 'settings') : null, [db, cafeId]);
  const { data: configDoc } = useDoc(configRef);
  const isArabic = configDoc?.language === 'ar';

  const handleGenerateDescription = async () => {
    if (!newProduct.name || !newProduct.ingredients) {
      toast({ title: "Details Required", description: "Please provide a name and ingredients first.", variant: "destructive" });
      return;
    }

    // 1. Client-side Rate Limiting (Cooldown)
    const now = Date.now();
    if (now - lastCallTimestamp.current < 3000) {
      toast({ title: "Please wait", description: "Wait a few seconds before generating another description.", variant: "default" });
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
    if (!db || !cafeId || !newProduct.name || !firebaseApp) return;
    
    setIsUploading(true);
    let finalImageUrl = newProduct.imageUrl || `https://picsum.photos/seed/${newProduct.name.toLowerCase().replace(/\s+/g, '-')}/400/225`;

    if (imageFile) {
      try {
        const storage = getStorage(firebaseApp);
        const fileExt = imageFile.name.split('.').pop() || 'jpg';
        const fileName = `products/${cafeId}/${Date.now()}.${fileExt}`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(storageRef);
      } catch (error) {
        console.error("Image upload failed", error);
        toast({ title: "Upload Failed", description: "Could not upload image, using placeholder.", variant: "destructive" });
      }
    }

    const productId = editingProductId || newProduct.name.toLowerCase().replace(/\s+/g, '-');
    const productRef = doc(db, 'cafes', cafeId, 'products', productId);
    
    await setDoc(productRef, {
      ...newProduct,
      imageUrl: finalImageUrl,
      price: Number(newProduct.price),
      cafeId,
      isActive: true,
      updatedAt: new Date().toISOString(),
      ...(editingProductId ? {} : { createdAt: new Date().toISOString() })
    }, { merge: true });

    setNewProduct({ name: "", ingredients: "", description: "", price: "0", category: "hot_drinks", imageUrl: "" });
    setImageFile(null);
    setEditingProductId(null);
    setIsUploading(false);
    toast({ title: editingProductId ? "Product Updated" : "Product Created", description: `${newProduct.name} has been saved.` });
  };

  const handleCancelEdit = () => {
    setNewProduct({ name: "", ingredients: "", description: "", price: "0", category: "hot_drinks", imageUrl: "" });
    setEditingProductId(null);
    setImageFile(null);
  };

  const filteredProducts = products?.filter(p => {
    const catMatches = selectedTab === "all" || p.category === selectedTab || p.category === CATEGORIES.find(c => c.id === selectedTab)?.ar || p.category === CATEGORIES.find(c => c.id === selectedTab)?.en;
    const searchMatches = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase());
    return catMatches && searchMatches;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">{isArabic ? 'إدارة القائمة' : 'Menu Management'}</h1>
          <p className="text-muted-foreground">{isArabic ? 'إدارة عناصر القائمة الرقمية الخاصة بك' : 'Manage your cafe\'s digital menu items and pricing.'}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              className="ps-10 w-[200px] md:w-[300px]" 
              placeholder={isArabic ? 'بحث منتجات...' : 'Search products...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="bg-card border mb-4 p-1 h-auto flex flex-wrap justify-start gap-1">
              <TabsTrigger value="all">{isArabic ? 'الكل' : 'All'}</TabsTrigger>
              {CATEGORIES.map(c => (
                <TabsTrigger key={c.id} value={c.id}>{isArabic ? c.ar : c.en}</TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value={selectedTab} className="mt-0">
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
                            src={p.imageUrl || `https://picsum.photos/seed/${p.id}/400/225`} 
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
                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                                  {CATEGORIES.find(c => c.id === p.category || c.ar === p.category || c.en === p.category)?.[isArabic ? 'ar' : 'en'] || p.category}
                                </p>
                             </div>
                             <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => {
                                  setEditingProductId(p.id);
                                  setNewProduct({
                                    name: p.name || "",
                                    ingredients: p.ingredients || "",
                                    description: p.description || "",
                                    price: String(p.price || "0"),
                                    category: p.category || "hot_drinks",
                                    imageUrl: p.imageUrl || ""
                                  });
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}>
                                  <Edit className="h-4 w-4" />
                                </Button>
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
              <CardTitle>{editingProductId ? (isArabic ? 'تحديث المنتج' : 'Update Product') : (isArabic ? 'إضافة منتج جديد' : 'Add New Product')}</CardTitle>
              <CardDescription>{isArabic ? 'املأ تفاصيل المنتج.' : 'Fill in the details to expand your menu.'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{isArabic ? 'اسم المنتج' : 'Product Name'}</Label>
                <Input 
                  placeholder={isArabic ? 'مثال: فانيلا لاتيه' : 'e.g. Vanilla Bean Latte'} 
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isArabic ? 'السعر' : 'Price'} (OMR)</Label>
                  <Input 
                    type="number"
                    step="0.100"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isArabic ? 'الفئة' : 'Category'}</Label>
                  <Select 
                    value={newProduct.category} 
                    onValueChange={(val) => setNewProduct({...newProduct, category: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c.id} value={c.id}>{isArabic ? c.ar : c.en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? 'المكونات' : 'Key Ingredients'}</Label>
                <Input 
                  placeholder={isArabic ? 'إسبريسو، حليب...' : 'Espresso, vanilla, steamed milk'}
                  value={newProduct.ingredients}
                  onChange={(e) => setNewProduct({...newProduct, ingredients: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? 'صورة المنتج' : 'Product Image'}</Label>
                <Input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setImageFile(e.target.files[0]);
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{isArabic ? 'وصف الذكاء الاصطناعي' : 'AI Description'}</Label>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="h-auto p-0 text-accent font-bold flex gap-1 items-center hover:no-underline"
                    onClick={handleGenerateDescription}
                    disabled={isGenerating}
                  >
                    <Wand2 className={`h-3.5 w-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                    {isGenerating ? (isArabic ? 'جاري...' : 'Crafting...') : (isArabic ? 'توليد بالذكاء الاصطناعي' : 'Generate with AI')}
                  </Button>
                </div>
                <Textarea 
                  className="min-h-[100px] bg-muted/20" 
                  placeholder={isArabic ? 'وصف المنتج هنا...' : 'Appetizing description of your item...'} 
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                />
              </div>
              <div className="flex gap-2">
                {editingProductId && (
                  <Button 
                    variant="outline"
                    className="w-1/3 h-12 text-lg font-bold rounded-xl" 
                    onClick={handleCancelEdit}
                    disabled={isUploading || isGenerating}
                  >
                    {isArabic ? 'إلغاء' : 'Cancel'}
                  </Button>
                )}
                <Button 
                  className={`${editingProductId ? 'w-2/3' : 'w-full'} bg-primary h-12 text-lg font-bold rounded-xl`} 
                  onClick={handleCreateProduct}
                  disabled={isUploading || isGenerating}
                >
                  {isUploading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                  {editingProductId ? (isArabic ? 'تحديث' : 'Update') : (isArabic ? 'إضافة للقائمة' : 'Add to Menu')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
