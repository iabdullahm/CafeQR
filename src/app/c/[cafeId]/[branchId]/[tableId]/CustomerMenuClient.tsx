"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Coffee, ShoppingBag, Plus, Minus, X, Info, 
  Utensils, Car, Globe, Bell, CheckCircle2, 
  ChevronRight, Star, Clock, MapPin, Heart
} from "lucide-react";
import { cn } from "@/lib/utils";

type Language = "en" | "ar";
type ViewState = "landing" | "menu" | "product" | "cart" | "status";

export default function CustomerMenuClient({ cafe, params }: { cafe: any, params: any }) {
  const [lang, setLang] = useState<Language>("en");
  const [view, setView] = useState<ViewState>("landing");
  
  const [activeCategory, setActiveCategory] = useState(cafe.categories[0]?.id);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);
  
  // Product Customization State
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [itemNotes, setItemNotes] = useState("");
  const [itemQty, setItemQty] = useState(1);

  // Status State
  const [orderStatus, setOrderStatus] = useState<"preparing" | "ready">("preparing");

  const isAr = lang === "ar";
  const dir = isAr ? "rtl" : "ltr";

  const t = (en: string, ar: string) => isAr ? ar : en;

  // Derived
  const cartItemCount = cart.reduce((acc, item) => acc + item.qty, 0);
  const cartTotal = cart.reduce((acc, item) => acc + (item.totalPrice * item.qty), 0);

  const handleOpenProduct = (product: any) => {
    setSelectedProduct(product);
    setItemQty(1);
    setItemNotes("");
    // Pre-select first choice for required single options
    const defaultOpts: Record<string, string[]> = {};
    product.options?.forEach((opt: any) => {
      if (opt.required && opt.type === 'single' && opt.choices.length > 0) {
        defaultOpts[opt.id] = [opt.choices[0].nameEn];
      } else {
        defaultOpts[opt.id] = [];
      }
    });
    setSelectedOptions(defaultOpts);
    setView("product");
  };

  const calculateItemPrice = () => {
    if (!selectedProduct) return 0;
    let base = selectedProduct.price;
    selectedProduct.options?.forEach((opt: any) => {
      const selected = selectedOptions[opt.id] || [];
      opt.choices.forEach((choice: any) => {
        if (selected.includes(choice.nameEn)) {
          base += choice.price;
        }
      });
    });
    return base;
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    const itemPrice = calculateItemPrice();
    
    // Create a unique cart item ID based on options
    const cartItemId = `${selectedProduct.id}-${JSON.stringify(selectedOptions)}`;
    
    setCart(prev => {
      const existing = prev.find(i => i.cartItemId === cartItemId);
      if (existing) {
        return prev.map(i => i.cartItemId === cartItemId ? { ...i, qty: i.qty + itemQty, notes: itemNotes } : i);
      }
      return [...prev, {
        cartItemId,
        product: selectedProduct,
        qty: itemQty,
        options: selectedOptions,
        totalPrice: itemPrice,
        notes: itemNotes
      }];
    });
    
    setView("menu");
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(i => i.cartItemId !== cartItemId));
  };

  const updateCartQty = (cartItemId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.cartItemId === cartItemId) {
        const newQty = i.qty + delta;
        return newQty > 0 ? { ...i, qty: newQty } : i;
      }
      return i;
    }));
  };

  // --- RENDERS ---

  if (view === "landing") {
    return (
      <div dir={dir} className="min-h-screen bg-black text-white relative flex flex-col items-center justify-center p-6 overflow-hidden">
        {/* Background Image/Blur */}
        <div className="absolute inset-0 opacity-40">
          <img src={cafe.coverImage} className="w-full h-full object-cover" alt="Cafe Cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
        </div>
        
        <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-md p-1 shadow-2xl border border-white/20 flex items-center justify-center">
             <Coffee className="w-12 h-12 text-amber-500" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight">{cafe.name}</h1>
            <p className="text-zinc-400 flex items-center justify-center gap-2">
              <MapPin className="w-4 h-4" /> {cafe.branch}
            </p>
          </div>

          {params.tableId && params.tableId !== 'takeaway' && (
            <div className="bg-amber-500/20 text-amber-500 px-6 py-2 rounded-full border border-amber-500/30 font-medium">
              {t("You're at Table", "أنت في طاولة")} {params.tableId}
            </div>
          )}

          <div className="w-full space-y-4 pt-8">
            <Button 
              onClick={() => setView("menu")}
              className="w-full h-14 text-lg font-bold rounded-2xl bg-amber-500 hover:bg-amber-600 text-black transition-all hover:scale-[1.02]"
            >
              {t("View Menu", "عرض القائمة")}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => setLang(isAr ? "en" : "ar")}
              className="w-full h-14 text-lg font-medium rounded-2xl border-white/20 hover:bg-white/10 text-white transition-all"
            >
              <Globe className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" />
              {isAr ? "English" : "العربية"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "status") {
    return (
      <div dir={dir} className="min-h-screen bg-zinc-50 pt-12 p-6 flex flex-col items-center">
        <div className="w-full max-w-sm space-y-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="flex justify-between items-center w-full">
            <Button variant="ghost" onClick={() => setView("menu")} className="text-zinc-500">
               {t("Back to Menu", "العودة للقائمة")}
            </Button>
          </div>
          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-zinc-200/50 text-center space-y-6 border border-zinc-100">
            <div className="mx-auto w-24 h-24 rounded-full bg-amber-50 flex items-center justify-center relative">
               {orderStatus === 'preparing' ? (
                 <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
               ) : (
                 <CheckCircle2 className="w-12 h-12 text-green-500" />
               )}
               <Coffee className={cn("w-10 h-10", orderStatus === 'preparing' ? "text-amber-500 animate-pulse" : "text-green-500")} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-zinc-900">
                {t("Order #1023", "طلب رقم #1023")}
              </h2>
              <p className="text-lg font-medium mt-2 text-zinc-500">
                {orderStatus === 'preparing' ? t("Preparing your order... 🟡", "جاري تحضير طلبك... 🟡") : t("Ready for pickup! 🟢", "جاهز للاستلام! 🟢")}
              </p>
            </div>
            
            {orderStatus === 'ready' && (
              <div className="pt-4 border-t border-zinc-100">
                <p className="text-sm font-bold text-zinc-800 mb-4">{t("Rate your experience", "قيم تجربتك")}</p>
                <div className="flex justify-center gap-2">
                  {[1,2,3,4,5].map(star => (
                    <Star key={star} className="w-8 h-8 text-zinc-300 hover:text-amber-400 cursor-pointer transition-colors" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div dir={dir} className="max-w-md mx-auto min-h-screen bg-zinc-50 pb-32">
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-zinc-100 shadow-sm">
        <div className="p-4 flex items-center justify-between">
          <div>
            <h1 className="font-black text-2xl tracking-tight text-zinc-900">{cafe.name}</h1>
            <p className="text-xs font-bold text-amber-600 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {cafe.branch} • {t("Table", "طاولة")} {params.tableId}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="icon" variant="ghost" className="rounded-full bg-zinc-100 hover:bg-zinc-200">
              <Bell className="w-5 h-5 text-zinc-700" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setLang(isAr ? "en" : "ar")} className="rounded-full bg-zinc-100 hover:bg-zinc-200 font-bold">
              {isAr ? "EN" : "ع"}
            </Button>
          </div>
        </div>

        {/* Categories Tab */}
        <div className="flex overflow-x-auto hide-scrollbar py-2 px-4 gap-2">
          {cafe.categories.map((cat: any) => (
             <button
               key={cat.id}
               onClick={() => setActiveCategory(cat.id)}
               className={cn(
                 "whitespace-nowrap px-5 py-2.5 rounded-2xl font-bold text-sm transition-all duration-300",
                 activeCategory === cat.id 
                  ? "bg-zinc-900 text-white shadow-md" 
                  : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100"
               )}
             >
               {isAr ? cat.nameAr : cat.nameEn}
             </button>
          ))}
        </div>
      </header>

      {/* LOYALTY WIDGET */}
      {cafe.loyalty && (
        <div className="px-4 mt-4">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-3xl p-4 text-white shadow-lg shadow-amber-500/20 flex items-center justify-between overflow-hidden relative">
             <div className="absolute -right-4 -top-4 opacity-20">
               <Coffee className="w-24 h-24" />
             </div>
             <div className="relative z-10 w-full">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <h3 className="font-black text-lg">{t("Loyalty Rewards", "مكافآت الولاء")}</h3>
                    <p className="text-amber-100 text-sm font-medium">
                      {t(`Buy ${cafe.loyalty.required} coffees → Get 1 free`, `اشتري ${cafe.loyalty.required} قهوة → احصل على 1 مجاناً`)}
                    </p>
                  </div>
                  <div className="text-2xl font-black">{cafe.loyalty.cups}/{cafe.loyalty.required}</div>
                </div>
                <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${(cafe.loyalty.cups / cafe.loyalty.required) * 100}%` }} />
                </div>
             </div>
          </div>
        </div>
      )}

      {/* MENU LISTING */}
      <main className="p-4 space-y-8 animate-in fade-in duration-500">
        {cafe.categories.map((category: any) => {
          const categoryItems = cafe.items.filter((item: any) => item.categoryId === category.id);
          if (categoryItems.length === 0) return null;
          
          return (
            <div key={category.id} className="scroll-mt-32" id={`category-${category.id}`}>
              <h2 className="font-black text-2xl mb-4 py-2 border-b border-zinc-200 text-zinc-900">
                {isAr ? category.nameAr : category.nameEn}
              </h2>
              <div className="grid gap-4">
                {categoryItems.map((item: any) => (
                  <button 
                    key={item.id} 
                    onClick={() => handleOpenProduct(item)}
                    className="w-full text-left bg-white rounded-3xl p-3 flex gap-4 shadow-sm border border-zinc-100 hover:shadow-md transition-all group"
                  >
                    <div className="w-28 h-28 rounded-2xl bg-zinc-100 overflow-hidden flex-shrink-0 relative">
                       <img src={item.image} alt={item.nameEn} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                       {item.tags?.includes('popular') && (
                         <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-xl border-b-2 border-l-2 border-white">
                           {t("Popular 🔥", "شائع 🔥")}
                         </div>
                       )}
                    </div>
                    <div className="flex-1 flex flex-col py-1">
                      <h3 className="font-bold text-lg leading-tight text-zinc-900 mb-1">
                        {isAr ? item.nameAr : item.nameEn}
                      </h3>
                      <p className="text-sm text-zinc-500 line-clamp-2 mb-auto leading-snug">
                        {isAr ? item.descAr : item.descEn}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-black text-lg text-amber-600">
                          {item.price.toFixed(2)} {cafe.currency}
                        </span>
                        <div className="w-8 h-8 rounded-full border-2 border-zinc-200 flex items-center justify-center text-zinc-400 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500 transition-colors">
                          <Plus className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </main>

      {/* CALL WAITER FAB */}
      <div className="fixed bottom-28 right-4 z-40">
        <Button className="h-14 w-14 rounded-full bg-zinc-900 text-white shadow-xl shadow-zinc-900/30 hover:scale-105 transition-transform">
          <Bell className="w-6 h-6" />
        </Button>
      </div>

      {/* BOTTOM CART OR PRODUCT MODAL OVERLAYS */}
      
      {/* PRODUCT DETAILS FULL-SCREEN MODAL */}
      <Sheet open={view === "product"} onOpenChange={(o) => { if(!o) setView("menu") }}>
        <SheetContent side="bottom" className="h-[95vh] rounded-t-[2.5rem] p-0 flex flex-col overflow-hidden bg-zinc-50 border-t-0" hideClose>
          {selectedProduct && (
            <>
              <div className="relative h-72 bg-zinc-200 flex-shrink-0">
                <img src={selectedProduct.image} className="w-full h-full object-cover" alt="" />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-zinc-50 to-transparent" />
                <Button 
                  onClick={() => setView("menu")}
                  variant="secondary" 
                  size="icon" 
                  className="absolute top-4 right-4 rounded-full bg-white/50 backdrop-blur-md shadow-sm hover:bg-white/80"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto px-6 pb-32 -mt-6 z-10 space-y-6">
                <div>
                  <h2 className="text-3xl font-black text-zinc-900">
                    {isAr ? selectedProduct.nameAr : selectedProduct.nameEn}
                  </h2>
                  <p className="text-amber-600 font-black text-2xl mt-1">
                    {calculateItemPrice().toFixed(2)} {cafe.currency}
                  </p>
                  <p className="text-zinc-500 mt-3 leading-relaxed">
                    {isAr ? selectedProduct.descAr : selectedProduct.descEn}
                  </p>
                </div>

                {selectedProduct.options?.map((opt: any) => (
                  <div key={opt.id} className="pt-4 border-t border-zinc-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-lg text-zinc-900">
                        {isAr ? opt.nameAr : opt.nameEn}
                        {opt.required && <span className="text-red-500 ml-1">*</span>}
                      </h3>
                      <span className="text-xs font-bold px-2 py-1 bg-zinc-200 text-zinc-600 rounded-md">
                        {opt.required ? t("Required", "مطلوب") : t("Optional", "اختياري")}
                      </span>
                    </div>

                    {opt.type === 'single' ? (
                      <RadioGroup 
                        value={selectedOptions[opt.id]?.[0]} 
                        onValueChange={(val) => setSelectedOptions(prev => ({ ...prev, [opt.id]: [val] }))}
                        className="space-y-3"
                      >
                        {opt.choices.map((choice: any) => (
                          <div key={choice.nameEn} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 space-x-reverse">
                              <RadioGroupItem value={choice.nameEn} id={choice.nameEn} className="w-5 h-5" />
                              <Label htmlFor={choice.nameEn} className="font-medium text-base cursor-pointer">
                                {isAr ? choice.nameAr : choice.nameEn}
                              </Label>
                            </div>
                            {choice.price > 0 && <span className="text-zinc-500 font-bold">+{choice.price.toFixed(2)}</span>}
                          </div>
                        ))}
                      </RadioGroup>
                    ) : (
                      <div className="space-y-3">
                         {opt.choices.map((choice: any) => {
                           const isChecked = selectedOptions[opt.id]?.includes(choice.nameEn);
                           return (
                             <div key={choice.nameEn} className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 space-x-reverse">
                                <Checkbox 
                                  id={choice.nameEn} className="w-5 h-5 rounded-md"
                                  checked={isChecked}
                                  onCheckedChange={(c) => {
                                    setSelectedOptions(prev => {
                                      const current = prev[opt.id] || [];
                                      if (c) return { ...prev, [opt.id]: [...current, choice.nameEn] };
                                      return { ...prev, [opt.id]: current.filter(x => x !== choice.nameEn) };
                                    });
                                  }}
                                />
                                <Label htmlFor={choice.nameEn} className="font-medium text-base cursor-pointer">
                                  {isAr ? choice.nameAr : choice.nameEn}
                                </Label>
                              </div>
                              {choice.price > 0 && <span className="text-zinc-500 font-bold">+{choice.price.toFixed(2)}</span>}
                            </div>
                           )
                         })}
                      </div>
                    )}
                  </div>
                ))}
                
                <div className="pt-4 border-t border-zinc-200">
                  <h3 className="font-bold text-lg text-zinc-900 mb-3">{t("Special Instructions", "ملاحظات خاصة")}</h3>
                  <Input 
                    placeholder={t("e.g., No sugar, extra hot...", "مثال: بدون سكر، حار جداً...")} 
                    value={itemNotes}
                    onChange={e => setItemNotes(e.target.value)}
                    className="h-12 bg-white rounded-xl border-zinc-200"
                  />
                </div>

                <div className="h-10"></div>
              </div>

              {/* ACTION BAR */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-zinc-200 flex items-center gap-4 z-20">
                <div className="flex items-center bg-zinc-100 rounded-2xl h-14 p-1">
                  <Button variant="ghost" size="icon" onClick={() => setItemQty(Math.max(1, itemQty - 1))} className="h-12 w-12 rounded-xl text-zinc-600">
                    <Minus className="w-5 h-5" />
                  </Button>
                  <span className="w-8 text-center font-black text-lg">{itemQty}</span>
                  <Button variant="ghost" size="icon" onClick={() => setItemQty(itemQty + 1)} className="h-12 w-12 rounded-xl text-zinc-600">
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
                <Button onClick={handleAddToCart} className="flex-1 h-14 text-lg font-bold rounded-2xl bg-amber-500 hover:bg-amber-600 text-black shadow-lg shadow-amber-500/20">
                  {t("Add to Order", "أضف للطلب")} • {(calculateItemPrice() * itemQty).toFixed(2)}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* FLOATING VIEW CART BUTTON */}
      {!["product", "cart", "status", "landing"].includes(view) && cartItemCount > 0 && (
        <div className="fixed bottom-6 left-0 right-0 p-4 z-30 animate-in slide-in-from-bottom-8">
           <Button 
             onClick={() => setView("cart")}
             className="w-full h-[68px] bg-zinc-900 hover:bg-black text-white rounded-3xl shadow-2xl flex items-center justify-between px-6 transition-transform hover:scale-[1.01]"
           >
             <div className="flex items-center gap-3">
               <div className="h-10 w-10 bg-amber-500 text-black font-black flex items-center justify-center rounded-2xl text-lg">
                 {cartItemCount}
               </div>
               <span className="font-bold text-lg">{t("View Cart", "عرض السلة")}</span>
             </div>
             <span className="font-black text-xl">{cartTotal.toFixed(2)} {cafe.currency}</span>
           </Button>
        </div>
      )}

      {/* CART FULL-SCREEN SHEET */}
      <Sheet open={view === "cart"} onOpenChange={(o) => { if(!o) setView("menu") }}>
         <SheetContent side="bottom" className="h-[95vh] rounded-t-[2.5rem] p-6 flex flex-col bg-zinc-50" hideClose>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-black text-zinc-900">{t("Your Order", "طلبك")}</h2>
              <Button size="icon" variant="ghost" className="rounded-full bg-zinc-200" onClick={() => setView("menu")}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              {cart.map(item => (
                <div key={item.cartItemId} className="flex gap-4 p-4 bg-white rounded-3xl border border-zinc-100 shadow-sm">
                   <div className="w-20 h-20 rounded-2xl bg-zinc-100 overflow-hidden shrink-0">
                     <img src={item.product.image} className="w-full h-full object-cover" alt="" />
                   </div>
                   <div className="flex-1 flex flex-col">
                     <div className="flex justify-between items-start">
                       <h4 className="font-bold text-lg leading-tight text-zinc-900 shrink">
                         {isAr ? item.product.nameAr : item.product.nameEn}
                       </h4>
                       <span className="font-black text-amber-600 ml-2 whitespace-nowrap">
                         {(item.totalPrice * item.qty).toFixed(2)}
                       </span>
                     </div>
                     <div className="text-xs text-zinc-500 mt-1 line-clamp-2">
                       {Object.entries(item.options).map(([k, v]: any) => v.join(', ')).filter(Boolean).join(' • ')}
                     </div>
                     {item.notes && (
                       <div className="text-xs text-amber-600 mt-1 font-medium bg-amber-50 rounded-md px-2 py-1 w-fit">
                         {t("Note:", "ملاحظة:")} {item.notes}
                       </div>
                     )}
                     <div className="flex items-center justify-between mt-auto pt-3">
                       <button onClick={() => removeFromCart(item.cartItemId)} className="text-sm font-bold text-red-500">
                         {t("Remove", "حذف")}
                       </button>
                       <div className="flex items-center bg-zinc-100 rounded-xl p-1 h-9">
                          <Button variant="ghost" size="icon" onClick={() => updateCartQty(item.cartItemId, -1)} className="h-7 w-7 rounded-lg">
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-6 text-center font-black text-sm">{item.qty}</span>
                          <Button variant="ghost" size="icon" onClick={() => updateCartQty(item.cartItemId, 1)} className="h-7 w-7 rounded-lg">
                            <Plus className="w-3 h-3" />
                          </Button>
                       </div>
                     </div>
                   </div>
                </div>
              ))}

              <div className="bg-white rounded-3xl p-5 border border-zinc-100">
                <h3 className="font-bold text-zinc-900 mb-2">{t("Customer Details (Optional)", "بيانات العميل (اختياري)")}</h3>
                <Input placeholder={t("Phone Number...", "رقم الجوال...")} className="h-12 rounded-xl bg-zinc-50" />
              </div>
            </div>

            <div className="pt-6 mt-auto border-t border-zinc-200 space-y-4 pb-4">
               <div className="flex justify-between items-center px-2">
                 <span className="text-zinc-500 font-bold">{t("Subtotal", "المجموع الفرعي")}</span>
                 <span className="font-bold">{cartTotal.toFixed(2)} {cafe.currency}</span>
               </div>
               <div className="flex justify-between items-center px-2">
                 <span className="text-zinc-500 font-bold">{t("Tax (15%)", "الضريبة (15%)")}</span>
                 <span className="font-bold">{(cartTotal * 0.15).toFixed(2)} {cafe.currency}</span>
               </div>
               <div className="flex justify-between items-center px-2 border-t border-zinc-200 pt-4">
                 <span className="text-xl font-black text-zinc-900">{t("Total", "الإجمالي")}</span>
                 <span className="text-2xl font-black text-amber-600">{(cartTotal * 1.15).toFixed(2)} {cafe.currency}</span>
               </div>
               <Button 
                onClick={() => setView("status")}
                className="w-full h-[68px] text-xl font-black rounded-3xl bg-amber-500 hover:bg-amber-600 text-black mt-2 shadow-xl shadow-amber-500/20"
               >
                 {t("Place Order", "إرسال الطلب")}
               </Button>
            </div>
         </SheetContent>
      </Sheet>

    </div>
  );
}
