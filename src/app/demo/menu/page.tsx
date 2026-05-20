"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Coffee, ShoppingBag, Plus, Minus, X, 
  MapPin, Globe, ChevronRight, CheckCircle2, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ViewState = "menu" | "product" | "cart" | "success_cta";

export default function DemoMenuPage() {
  const router = useRouter();
  const [lang, setLang] = useState<"en" | "ar">("ar");
  const [view, setView] = useState<ViewState>("menu");
  const [activeCategory, setActiveCategory] = useState("1");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [itemQty, setItemQty] = useState(1);

  const isAr = lang === "ar";
  const dir = isAr ? "rtl" : "ltr";
  const t = (en: string, ar: string) => isAr ? ar : en;

  // Fake Data
  const cafe = {
    name: "CafeHQ (Demo)",
    branch: "Main Branch",
    currency: "OMR",
    categories: [
      { id: "1", nameEn: "Coffee", nameAr: "قهوة" },
      { id: "2", nameEn: "Cold Drinks", nameAr: "مشروبات باردة" },
      { id: "3", nameEn: "Desserts", nameAr: "حلويات" }
    ],
    items: [
      { id: "p1", categoryId: "1", nameEn: "Spanish Latte", nameAr: "سبانيش لاتيه", descEn: "Rich espresso with sweet condensed milk", descAr: "إسبريسو غني بالحليب المكثف المحلى", price: 2.500, image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&q=80" },
      { id: "p2", categoryId: "1", nameEn: "V60 Drip Coffee", nameAr: "قهوة V60 مقطرة", descEn: "Single origin specialty beans", descAr: "قهوة مختصة مقطرة بعناية", price: 3.200, image: "https://images.unsplash.com/photo-1495474472205-1627370a8f8e?w=400&q=80" },
      { id: "p3", categoryId: "2", nameEn: "Iced Matcha", nameAr: "ماتشا مثلجة", descEn: "Premium Japanese matcha with milk", descAr: "ماتشا يابانية فاخرة مع حليب", price: 2.800, image: "https://images.unsplash.com/photo-1582787033504-f58c733362a7?w=400&q=80" },
      { id: "p4", categoryId: "3", nameEn: "San Sebastian Cheesecake", nameAr: "سان سباستيان تشيزكيك", descEn: "Burnt basque cheesecake", descAr: "تشيزكيك سان سباستيان المحروقة", price: 3.500, image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&q=80" }
    ]
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.product.price * item.qty), 0);
  const cartItemCount = cart.reduce((acc, item) => acc + item.qty, 0);

  const handleOpenProduct = (product: any) => {
    setSelectedProduct(product);
    setItemQty(1);
    setView("product");
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    setCart(prev => {
      const existing = prev.find(i => i.product.id === selectedProduct.id);
      if (existing) {
        return prev.map(i => i.product.id === selectedProduct.id ? { ...i, qty: i.qty + itemQty } : i);
      }
      return [...prev, { product: selectedProduct, qty: itemQty }];
    });
    setView("menu");
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.product.id === id) {
        const newQty = i.qty + delta;
        return newQty > 0 ? { ...i, qty: newQty } : i;
      }
      return i;
    }));
  };

  if (view === "success_cta") {
    return (
      <div dir={dir} className="min-h-screen bg-zinc-900 text-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
        <div className="w-full max-w-md space-y-8">
           <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-green-500/30">
             <CheckCircle2 className="w-12 h-12 text-green-500 animate-bounce" />
           </div>
           
           <h2 className="text-4xl font-black">{t("Order Received!", "تم استلام الطلب!")}</h2>
           
           <div className="bg-zinc-800 rounded-3xl p-6 border border-zinc-700 shadow-xl space-y-4">
             <div className="bg-amber-500/20 text-amber-400 font-bold px-4 py-2 rounded-full inline-block text-sm border border-amber-500/30 mb-2">
               {t("This is a Demo", "هذا مجرد ديمو تجريبي")}
             </div>
             <p className="text-xl font-bold leading-relaxed text-zinc-300">
               {t("This is exactly how easy it will be for your customers to order.", "بهذه السهولة سيتمكن عملائك من الطلب بدون انتظار أو زحمة.")}
             </p>
             <p className="text-zinc-500 font-medium">
               {t("Orders will appear instantly on your Kitchen Display Dashboard.", "الطلبات ستظهر فوراً في شاشة المطبخ (KDS) الخاصة بك.")}
             </p>
           </div>

           <div className="pt-8">
             <Button 
               onClick={() => router.push('/?action=register')}
               className="w-full h-16 text-xl font-black rounded-full bg-amber-500 hover:bg-amber-600 text-amber-950 shadow-xl shadow-amber-500/20 transition-all hover:scale-105"
             >
               {t("Start Using CafeQR Free 🚀", "ابدأ مجاناً الآن 🚀")}
             </Button>
             <Button 
               variant="ghost"
               onClick={() => setView("menu")}
               className="mt-4 text-zinc-400 hover:text-white"
             >
               {t("Back to Demo Menu", "العودة للقائمة التجريبية")}
             </Button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div dir={dir} className="max-w-md mx-auto min-h-screen bg-zinc-50 relative overflow-hidden font-sans">
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-zinc-100 shadow-sm">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
               <Coffee className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight text-zinc-900">{cafe.name}</h1>
              <p className="text-xs font-bold text-amber-600 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" /> {cafe.branch}
              </p>
            </div>
          </div>
          <Button size="icon" variant="ghost" onClick={() => setLang(isAr ? "en" : "ar")} className="rounded-full bg-zinc-100 hover:bg-zinc-200 font-bold shrink-0">
            {isAr ? "EN" : "ع"}
          </Button>
        </div>

        {view === "menu" && (
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
        )}
      </header>

      {/* TOP BANNER ADVERTISEMENT */}
      {view === "menu" && (
         <div className="px-4 mt-4 relative z-10">
            <div className="bg-amber-600 rounded-2xl p-4 text-white shadow-lg flex items-center justify-between cursor-pointer border border-amber-700/50">
               <div>
                  <h3 className="font-black text-sm">{t("This is a Customer Demo", "هذا عرض تجريبي للعميل")}</h3>
                  <p className="text-xs text-amber-200 font-bold">{t("Feel free to place an order", "تصفح واطلب لترى كيف يعمل النظام")}</p>
               </div>
               <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <ArrowRight className={cn("w-4 h-4", isAr && "rotate-180")} />
               </div>
            </div>
         </div>
      )}

      {/* MENU CONTENT */}
      {view === "menu" && (
        <main className="p-4 space-y-8 pb-32">
          {cafe.categories.filter(c => c.id === activeCategory).map((category: any) => {
            const categoryItems = cafe.items.filter((item: any) => item.categoryId === category.id);
            return (
              <div key={category.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="font-black text-2xl mb-4 text-zinc-900">
                  {isAr ? category.nameAr : category.nameEn}
                </h2>
                <div className="grid gap-4">
                  {categoryItems.map((item: any) => (
                    <button 
                      key={item.id} 
                      onClick={() => handleOpenProduct(item)}
                      className="w-full text-left bg-white rounded-3xl p-3 flex gap-4 shadow-sm border border-zinc-100 hover:shadow-md transition-all group active:scale-95"
                    >
                      <div className="w-28 h-28 rounded-2xl bg-zinc-100 overflow-hidden flex-shrink-0 relative">
                         <img src={item.image} alt={item.nameEn} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
                            {item.price.toFixed(3)} {cafe.currency}
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
      )}

      {/* PRODUCT MODAL OVERLAY */}
      {view === "product" && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom-full duration-300 max-w-md mx-auto shadow-2xl">
          <div className="relative h-[40vh] w-full bg-zinc-100">
            <img src={selectedProduct.image} alt="product" className="w-full h-full object-cover" />
            <button onClick={() => setView("menu")} className="absolute top-4 right-4 rtl:right-auto rtl:left-4 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-md">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 bg-white rounded-t-3xl -mt-6 relative z-10">
            <h2 className="text-3xl font-black text-zinc-900 mb-2">
              {isAr ? selectedProduct.nameAr : selectedProduct.nameEn}
            </h2>
            <p className="text-zinc-500 text-lg font-medium leading-relaxed mb-6">
              {isAr ? selectedProduct.descAr : selectedProduct.descEn}
            </p>
            <div className="flex items-center justify-between py-6 border-y border-zinc-100 mb-8">
              <span className="font-bold text-zinc-800">{t("Quantity", "الكمية")}</span>
              <div className="flex items-center gap-4 bg-zinc-50 rounded-full p-1 border border-zinc-200">
                <Button variant="ghost" size="icon" onClick={() => setItemQty(Math.max(1, itemQty - 1))} className="h-10 w-10 rounded-full text-zinc-500">
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-4 text-center font-black text-lg">{itemQty}</span>
                <Button variant="ghost" size="icon" onClick={() => setItemQty(itemQty + 1)} className="h-10 w-10 rounded-full bg-white shadow-sm text-amber-600 border border-zinc-100">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="p-4 bg-white border-t border-zinc-100">
             <Button onClick={handleAddToCart} className="w-full h-16 rounded-2xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-black text-lg shadow-xl shadow-amber-500/20 active:scale-95 transition-transform flex items-center justify-between px-6">
               <span>{t("Add to Cart", "إضافة للسلة")}</span>
               <span>{(selectedProduct.price * itemQty).toFixed(3)} {cafe.currency}</span>
             </Button>
          </div>
        </div>
      )}

      {/* CART MODAL OVERLAY */}
      {view === "cart" && (
        <div className="fixed inset-0 z-50 bg-zinc-50 flex flex-col animate-in slide-in-from-bottom-full duration-300 max-w-md mx-auto shadow-2xl">
          <div className="flex items-center justify-between p-4 bg-white border-b border-zinc-100">
            <h2 className="text-2xl font-black text-zinc-900">{t("Your Cart", "سلة الطلبات")}</h2>
            <button onClick={() => setView("menu")} className="w-10 h-10 bg-zinc-100 text-zinc-600 rounded-full flex items-center justify-center">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-zinc-400 space-y-4 opacity-50">
                 <ShoppingBag className="w-20 h-20" />
                 <p className="text-xl font-bold">{t("Cart is empty", "السلة فارغة")}</p>
               </div>
            ) : (
               cart.map((item, i) => (
                 <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 flex gap-4 items-center">
                   <div className="w-16 h-16 rounded-xl bg-zinc-100 overflow-hidden shrink-0">
                     <img src={item.product.image} className="w-full h-full object-cover" alt="" />
                   </div>
                   <div className="flex-1">
                     <h3 className="font-bold text-zinc-900">{isAr ? item.product.nameAr : item.product.nameEn}</h3>
                     <p className="text-amber-600 font-black text-sm mt-1">{item.product.price.toFixed(3)} OMR</p>
                   </div>
                   <div className="flex flex-col items-center gap-2 bg-zinc-50 rounded-xl p-1 border border-zinc-200">
                      <button onClick={() => updateCartQty(item.product.id, 1)} className="w-8 h-8 bg-white rounded-lg shadow-sm text-zinc-600 flex items-center justify-center"><Plus className="w-4 h-4" /></button>
                      <span className="font-black text-sm">{item.qty}</span>
                      <button onClick={() => updateCartQty(item.product.id, -1)} className="w-8 h-8 rounded-lg text-zinc-400 flex items-center justify-center"><Minus className="w-4 h-4" /></button>
                   </div>
                 </div>
               ))
            )}
          </div>
          
          {cart.length > 0 && (
             <div className="bg-white p-6 border-t border-zinc-200 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
               <div className="flex justify-between items-center mb-6 text-lg font-bold">
                 <span className="text-zinc-500">{t("Total", "الإجمالي")}</span>
                 <span className="text-3xl font-black text-zinc-900">{cartTotal.toFixed(3)} <span className="text-sm text-zinc-400">{cafe.currency}</span></span>
               </div>
               <Button onClick={() => setView("success_cta")} className="w-full h-16 rounded-2xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-black text-xl shadow-xl shadow-amber-500/20 active:scale-95 transition-transform flex items-center justify-center gap-2">
                 {t("Place Order", "تأكيد الطلب")} <CheckCircle2 className="w-6 h-6" />
               </Button>
             </div>
          )}
        </div>
      )}

      {/* FLOATING CART FAB */}
      {view === "menu" && (
        <div className="fixed bottom-6 right-4 rtl:left-4 rtl:right-auto z-40">
          <Button 
            onClick={() => setView("cart")}
            className="group h-16 w-16 rounded-full bg-zinc-900 border-[3px] border-white text-white shadow-2xl shadow-zinc-900/30 hover:scale-105 transition-all flex items-center justify-center relative overflow-visible"
          >
            <ShoppingBag className="w-6 h-6 group-hover:-rotate-12 transition-transform" />
            <div className={cn("absolute -top-2 -right-2 h-7 w-7 rounded-full flex items-center justify-center text-sm font-black border-2 border-white shadow-sm transition-all animate-in zoom-in", cartItemCount > 0 ? "bg-amber-500 text-amber-950 block" : "bg-zinc-200 text-zinc-500 block opacity-50")}>
              {cartItemCount}
            </div>
          </Button>
        </div>
      )}
    </div>
  );
}
