"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Wand2, Trash2, Loader2, Edit, ExternalLink, Image as ImageIcon, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SectionHeader } from "@/components/dashboard/section-header";
import { generateMenuDescription } from "@/ai/flows/generate-menu-description";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useMemoFirebase, useCollection, useDoc, useFirebaseApp } from "@/firebase";
import { collection, query, doc, setDoc, deleteDoc } from "firebase/firestore";
import { useCafe } from "@/hooks/use-cafe";
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
  
  const [selectedTab, setSelectedTab] = useState("hot_drinks"); // Default to first category to prevent overload
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [newProduct, setNewProduct] = useState({ 
    name: "", 
    ingredients: "", 
    description: "", 
    price: "0", 
    category: "hot_drinks", 
    imageUrl: "",
    isActive: true
  });
  
  const [variants, setVariants] = useState<{name: string, price: string}[]>([]);

  const lastCallTimestamp = useRef(0);

  const { cafeId } = useCafe();
  const productsQuery = useMemoFirebase(() => {
    if (!db || !cafeId) return null;
    return query(collection(db, 'cafes', cafeId, 'products'));
  }, [db, cafeId]);
  const { data: products, isLoading } = useCollection(productsQuery);

  const configRef = useMemoFirebase(() => db && cafeId ? doc(db, 'cafes', cafeId, 'config', 'settings') : null, [db, cafeId]);
  const { data: configDoc } = useDoc(configRef);
  const isArabic = configDoc?.language === 'ar';
  const t = (en: string, ar: string) => isArabic ? ar : en;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');

  const openModalForNew = () => {
    setEditingProductId(null);
    setNewProduct({ name: "", ingredients: "", description: "", price: "0", category: selectedTab === 'all' ? 'hot_drinks' : selectedTab, imageUrl: "", isActive: true });
    setVariants([]);
    setImageFile(null);
    setIsModalOpen(true);
  };

  const openModalForEdit = (p: any) => {
    setEditingProductId(p.id);
    setNewProduct({
      name: p.name || "",
      ingredients: p.ingredients || "",
      description: p.description || "",
      price: String(p.price || "0"),
      category: p.category || "hot_drinks",
      imageUrl: p.imageUrl || "",
      isActive: p.isActive !== false
    });
    setVariants(p.variants || []);
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleGenerateDescription = async () => {
    if (!newProduct.name || !newProduct.ingredients) {
      toast({ title: "Details Required", description: "Please provide a name and ingredients first.", variant: "destructive" });
      return;
    }

    const now = Date.now();
    if (now - lastCallTimestamp.current < 3000) {
      toast({ title: "Please wait", description: "Wait a few seconds before generating another description.", variant: "default" });
      return;
    }
    lastCallTimestamp.current = now;

    setIsGenerating(true);
    const cacheKey = `desc-${newProduct.name}-${newProduct.ingredients}`.toLowerCase().replace(/\s+/g, '-');

    try {
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
      toast({ title: "Generation failed", description: "We couldn't reach the AI describer right now.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!db || !cafeId || !newProduct.name || !firebaseApp) return;
    
    setIsUploading(true);
    let finalImageUrl = newProduct.imageUrl || "";

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

    const productId = editingProductId || newProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const productRef = doc(db, 'cafes', cafeId, 'products', productId);
    
    await setDoc(productRef, {
      ...newProduct,
      imageUrl: finalImageUrl,
      price: Number(newProduct.price),
      variants: variants.map(v => ({ name: v.name, price: Number(v.price) })).filter(v => v.name && v.price),
      cafeId,
      updatedAt: new Date().toISOString(),
      ...(editingProductId ? {} : { createdAt: new Date().toISOString() })
    }, { merge: true });

    setIsUploading(false);
    setIsModalOpen(false);
    toast({ title: editingProductId ? "Product Updated" : "Product Created", description: `${newProduct.name} has been saved.` });
  };

  const toggleAvailability = async (p: any, checked: boolean) => {
    if (!db || !cafeId) return;
    const productRef = doc(db, 'cafes', cafeId, 'products', p.id);
    await setDoc(productRef, { isActive: checked }, { merge: true });
    toast({ title: checked ? "Marked Available" : "Marked Out of Stock" });
  };

  const addVariant = () => setVariants([...variants, { name: "", price: "" }]);
  const updateVariant = (index: number, key: 'name' | 'price', value: string) => {
    const updated = [...variants];
    updated[index][key] = value;
    setVariants(updated);
  };
  const removeVariant = (index: number) => {
    const updated = [...variants];
    updated.splice(index, 1);
    setVariants(updated);
  };

  const filteredProducts = products?.filter(p => {
    const searchMatch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (searchTerm) return searchMatch; // Search ignores tabs
    
    if (selectedTab === "all") return true;
    return p.category === selectedTab || p.category === CATEGORIES.find(c => c.id === selectedTab)?.ar || p.category === CATEGORIES.find(c => c.id === selectedTab)?.en;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <SectionHeader 
        title={isArabic ? 'إدارة القائمة المتقدمة' : 'Advanced Menu Management'}
        description={isArabic ? 'إدارة المنتجات، الأصناف، التوفر الفوري، والإضافات.' : 'Manage products, variants, availability toggles, and categories.'}
        actions={
          <div className="flex gap-2">
             <Button 
                variant="outline" 
                className="gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                onClick={() => window.open(cafeId ? `${baseUrl}/c/${cafeId}/default/takeaway` : "#", '_blank')}
             >
                <ExternalLink className="h-4 w-4" /> 
                {isArabic ? 'التجربة الحية للزبون' : 'Preview Customer Menu'}
             </Button>
             <Button className="bg-primary gap-2" onClick={openModalForNew}>
                <Plus className="h-4 w-4" /> 
                {isArabic ? 'إضافة منتج' : 'Add Product'}
             </Button>
          </div>
        }
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full md:w-auto">
          <TabsList className="bg-muted p-1 h-auto flex flex-wrap justify-start gap-1">
            <TabsTrigger value="all">{isArabic ? 'الكل' : 'All'}</TabsTrigger>
            {CATEGORIES.map(c => (
              <TabsTrigger key={c.id} value={c.id}>{isArabic ? c.ar : c.en}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative w-full md:w-64">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            className="ps-10 bg-white" 
            placeholder={isArabic ? 'ابحث عن اسم المنتج...' : 'Search by product name...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-72 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {filteredProducts?.map((p) => {
            const isActive = p.isActive !== false;
            return (
              <Card key={p.id} className={`overflow-hidden group border-none shadow-sm transition-all ${!isActive ? 'opacity-70 grayscale-[50%]' : 'hover:shadow-md'}`}>
                <div className="aspect-[4/3] bg-muted relative overflow-hidden flex items-center justify-center">
                  {p.imageUrl ? (
                    <img 
                      src={p.imageUrl} 
                      alt={p.name}
                      loading="lazy"
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                  )}
                  
                  {/* Absolute Top Elements */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <Badge variant="secondary" className="bg-black/60 text-white border-none backdrop-blur-md">
                       {CATEGORIES.find(c => c.id === p.category || c.ar === p.category || c.en === p.category)?.[isArabic ? 'ar' : 'en'] || p.category}
                    </Badge>
                  </div>
                  
                  <div className="absolute top-2 right-2 flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full px-2 py-1">
                     <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                       {isActive ? t('Available', 'متاح') : t('Sold Out', 'نفذ')}
                     </span>
                     <Switch 
                        checked={isActive} 
                        onCheckedChange={(checked) => toggleAvailability(p, checked)} 
                        className="data-[state=checked]:bg-green-500"
                     />
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2 gap-4">
                    <h3 className="font-bold text-lg leading-tight truncate">{p.name}</h3>
                    <p className="font-black text-primary shrink-0">
                       {Number(p.price).toFixed(3)} <span className="text-xs uppercase">OMR</span>
                    </p>
                  </div>
                  
                  {p.variants && p.variants.length > 0 && (
                    <div className="mb-3 space-y-1">
                      {p.variants.map((v: any, idx: number) => (
                         <div key={idx} className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{v.name}</span>
                            <span className="font-medium">+{Number(v.price).toFixed(3)} OMR</span>
                         </div>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">{p.description}</p>
                  
                  <div className="mt-4 pt-4 border-t flex gap-2">
                    <Button variant="outline" size="sm" className="w-full font-bold" onClick={() => openModalForEdit(p)}>
                      <Edit className="h-3.5 w-3.5 mr-2" /> {t('Edit Details', 'تعديل')}
                    </Button>
                    <Button variant="outline" size="icon" className="shrink-0 text-destructive border-red-100 hover:bg-red-50 hover:text-red-700" onClick={() => deleteDoc(doc(db!, 'cafes', cafeId!, 'products', p.id))}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filteredProducts?.length === 0 && (
            <div className="col-span-full py-24 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl text-muted-foreground bg-muted/20">
               <ImageIcon className="h-12 w-12 opacity-20 mb-4" />
               <h3 className="text-lg font-bold text-foreground">{t("No products found", "لا يوجد منتجات")}</h3>
               <p className="text-sm">{t("Add items or change filters to see your menu.", "اضف منتج او قم بتغيير الفلاتر لترى القائمة.")}</p>
               <Button className="mt-4" onClick={openModalForNew}>
                 <Plus className="h-4 w-4 mr-2" /> {t("Create First Product", "إضافة أول منتج")}
               </Button>
            </div>
          )}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProductId ? (isArabic ? 'تحديث المنتج' : 'Update Product') : (isArabic ? 'إضافة منتج جديد' : 'New Product')}</DialogTitle>
            <DialogDescription>Configure details, pricing, variants, and image.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>{isArabic ? 'اسم المنتج' : 'Product Name'} <span className="text-red-500">*</span></Label>
                <Input 
                  placeholder={isArabic ? 'مثال: فانيلا لاتيه' : 'e.g. Vanilla Bean Latte'} 
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label>{isArabic ? 'السعر الأساسي' : 'Base Price'} (OMR) <span className="text-red-500">*</span></Label>
                <Input 
                  type="number"
                  step="0.100"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label>{isArabic ? 'الفئة' : 'Category'} <span className="text-red-500">*</span></Label>
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

            <div className="space-y-3 bg-muted/30 p-4 rounded-xl border">
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t("Sizes / Variants", "الأحجام / الأنواع")}</Label>
                  <p className="text-[10px] text-muted-foreground">{t("Add options like Small, Medium, Large", "أضف خيارات مثل صغير، وسط، كبير")}</p>
                </div>
                <Button variant="outline" size="sm" onClick={addVariant}>
                   <Plus className="h-3 w-3 mr-1" /> {t("Add", "إضافة")}
                </Button>
              </div>
              
              {variants.length > 0 ? (
                <div className="space-y-2">
                  {variants.map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                       <Input placeholder={t("e.g. Medium", "مثال: وسط")} value={v.name} onChange={(e) => updateVariant(i, 'name', e.target.value)} className="h-8 text-sm" />
                       <Input placeholder={t("Price", "السعر")} type="number" step="0.100" value={v.price} onChange={(e) => updateVariant(i, 'price', e.target.value)} className="h-8 text-sm w-32" />
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => removeVariant(i)}>
                         <X className="h-4 w-4" />
                       </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic text-center py-2">{t("No variants added. Base price acts as the only price.", "السعر الأساسي هو المعتمد بسبب عدم وجود إضافات.")}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>{isArabic ? 'المكونات' : 'Key Ingredients'}</Label>
              <Input 
                placeholder={isArabic ? 'إسبريسو، حليب...' : 'Espresso, vanilla, steamed milk'}
                value={newProduct.ingredients}
                onChange={(e) => setNewProduct({...newProduct, ingredients: e.target.value})}
              />
            </div>
            
            <div className="space-y-2 relative">
              <div className="flex items-center justify-between">
                <Label>{isArabic ? 'وصف الذكاء الاصطناعي' : 'Description'}</Label>
                <Button 
                   variant="secondary" 
                   size="sm" 
                   className="h-7 text-xs font-bold flex gap-1"
                   onClick={handleGenerateDescription}
                   disabled={isGenerating}
                >
                  <Wand2 className={`h-3 w-3 ${isGenerating ? 'animate-spin' : 'text-purple-600'}`} />
                  {t("AI Magic", "ذكاء اصطناعي")}
                </Button>
              </div>
              <Textarea 
                className="min-h-[100px] bg-muted/20 text-sm" 
                placeholder={t("Delicious and freshly prepared...", "لذيذ ومحضر خصيصاً لك")} 
                value={newProduct.description}
                onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
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
              {newProduct.imageUrl && !imageFile && (
                <div className="h-24 w-24 rounded-lg bg-muted overflow-hidden mt-2 border">
                   <img src={newProduct.imageUrl} alt="preview" className="object-cover w-full h-full" />
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border">
               <div>
                 <Label className="font-bold">{t("Initial Availability", "متوفر حالياً")}</Label>
                 <p className="text-xs text-muted-foreground mt-0.5">{t("Will this be available to order immediately?", "هل سيكون المنتج جاهزاً للطلب حالاً؟")}</p>
               </div>
               <Switch 
                  checked={newProduct.isActive} 
                  onCheckedChange={(checked) => setNewProduct({...newProduct, isActive: checked})} 
                  className="data-[state=checked]:bg-green-500"
               />
            </div>

          </div>
          
          <div className="flex gap-3 justify-end mt-6 pt-4 border-t">
            <Button variant="outline" className="h-10 px-6 font-bold" onClick={() => setIsModalOpen(false)}>
               {t("Cancel", "إلغاء")}
            </Button>
            <Button className="bg-primary h-10 px-8 font-bold" onClick={handleSaveProduct} disabled={isUploading || isGenerating}>
               {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               {t("Save Product", "حفظ المنتج")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
