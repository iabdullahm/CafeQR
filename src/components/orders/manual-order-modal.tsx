"use client";

import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFirestore, useMemoFirebase, useCollection, useUser, useDoc } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus, X, Coffee, ShoppingBag, Utensils, Car } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCafe } from "@/hooks/use-cafe";

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

interface ManualOrderModalProps {
  customTrigger?: React.ReactNode;
}

export function ManualOrderModal({ customTrigger }: ManualOrderModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();
  const { cafeId } = useCafe();

  // Branch info
  const userProfileRef = useMemoFirebase(() => db && user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: userProfile } = useDoc(userProfileRef);
  const currentBranchId = userProfile?.branchId || "main";

  // Menu Data
  const productsQuery = useMemoFirebase(() => db && cafeId ? query(collection(db, 'cafes', cafeId, 'products')) : null, [db, cafeId]);
  const categories = CATEGORIES;
  const { data: products } = useCollection(productsQuery);

  const configRef = useMemoFirebase(() => db && cafeId ? doc(db, 'cafes', cafeId, 'config', 'settings') : null, [db, cafeId]);
  const { data: configDoc } = useDoc(configRef);
  const isArabic = configDoc?.language === 'ar';
  const t = (en: string, ar: string) => isArabic ? ar : en;

  const tablesQuery = useMemoFirebase(() => db && cafeId ? query(collection(db, 'cafes', cafeId, 'tables')) : null, [db, cafeId]);
  const { data: tables } = useCollection(tablesQuery);

  // Order State
  const [activeCategory, setActiveCategory] = useState<string | null>(CATEGORIES[0].id);
  const [cart, setCart] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderType, setOrderType] = useState("DINE_IN");
  const [selectedTable, setSelectedTable] = useState("unassigned");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentStatus, setPaymentStatus] = useState("paid");


  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, {
        productId: product.id,
        categoryId: product.category,
        productName: product.nameEn || product.name,
        nameEn: product.nameEn,
        nameAr: product.nameAr,
        unitPrice: product.price,
        quantity: 1,
        notes: ""
      }];
    });
  };

  const updateCartQty = (idx: number, delta: number) => {
    setCart(prev => {
      const newCart = [...prev];
      newCart[idx].quantity += delta;
      if (newCart[idx].quantity <= 0) {
        newCart.splice(idx, 1);
      }
      return newCart;
    });
  };

  const updateCartNotes = (idx: number, notes: string) => {
    setCart(prev => {
      const newCart = [...prev];
      newCart[idx].notes = notes;
      return newCart;
    });
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cafeId || !user) return;
    if (cart.length === 0) {
      toast({ title: t("Error", "خطأ"), description: t("Cart is empty", "السلة فارغة"), variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/orders/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cafeId,
          branchId: currentBranchId,
          tableId: orderType === 'TAKEAWAY' ? 'takeaway' : (orderType === 'CAR_SERVICE' ? 'car' : (selectedTable !== 'unassigned' ? selectedTable : null)),
          type: orderType,
          customerName: customerName.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          items: cart,
          source: "cashier_manual",
          createdBy: user.uid,
          paymentMethod,
          paymentStatus,
          loyaltyEligible: !!customerPhone.trim()
        })
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to create order');
      }

      toast({ title: t("Success", "نجاح"), description: t("Manual order created", "تم إنشاء الطلب بنجاح") });
      setOpen(false);
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setOrderType("DINE_IN");
      setSelectedTable("unassigned");
      setPaymentMethod("cash");
    } catch (error: any) {
      toast({ title: t("Error", "خطأ"), description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const scrollToCategory = (id: string) => {
    setActiveCategory(id);
    const element = document.getElementById(`manual-cat-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {customTrigger ? customTrigger : (
          <Button className="bg-primary hover:bg-primary/90 font-bold shadow-md">
            <Plus className="w-4 h-4 mr-2" /> {t("Manual Order", "طلب يدوي")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[85vh] p-0 overflow-hidden flex flex-col" dir={isArabic ? 'rtl' : 'ltr'}>
        <div className="bg-muted p-4 border-b flex justify-between items-center">
          <div>
            <DialogTitle className="text-xl font-black">{t("Create Manual Order", "إنشاء طلب يدوي")}</DialogTitle>
            <DialogDescription>{t("Process counter or phone orders directly.", "معالجة طلبات الكاشير والهاتف مباشرة.")}</DialogDescription>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* LEFT: Menu Selection */}
          <div className="flex-1 border-r flex flex-col overflow-hidden bg-background">
            <div className="p-3 border-b flex gap-2 overflow-x-auto hide-scrollbar sticky top-0 bg-background z-10 shadow-sm">
              {categories.map((cat: any) => (
                <Badge
                  key={cat.id}
                  variant={activeCategory === cat.id ? "default" : "outline"}
                  className={`px-4 py-2 cursor-pointer whitespace-nowrap text-sm ${activeCategory === cat.id ? 'bg-primary' : 'hover:bg-muted'}`}
                  onClick={() => scrollToCategory(cat.id)}
                >
                  {isArabic ? cat.ar : cat.en}
                </Badge>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-8 pb-20">
              {categories.map((cat: any) => {
                const catProducts = products?.filter((p: any) => p.category === cat.id) || [];
                if (catProducts.length === 0) return null;
                return (
                  <div key={cat.id} id={`manual-cat-${cat.id}`} className="scroll-mt-20">
                    <h3 className="font-bold text-lg mb-3 pb-2 border-b flex items-center text-muted-foreground">
                       {isArabic ? cat.ar : cat.en}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {catProducts.map((p: any) => (
                        <div 
                          key={p.id} 
                          className="border rounded-xl p-3 flex flex-col justify-between cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                          onClick={() => addToCart(p)}
                        >
                          <div>
                            <h4 className="font-bold text-sm leading-tight">{isArabic ? p.nameAr || p.name : p.nameEn || p.name}</h4>
                          </div>
                          <div className="mt-3 font-black text-primary text-sm flex justify-between items-center">
                            {(p.price || 0).toFixed(3)} OMR
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                               <Plus className="h-3 w-3" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Cart & Checkout */}
          <div className="w-[380px] flex flex-col bg-muted/10">
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              
              {/* Order Info */}
              <div className="bg-card border rounded-xl p-3 space-y-3 shadow-sm">
                <h3 className="font-bold text-sm border-b pb-2">{t("Order Details", "تفاصيل الطلب")}</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">{t("Order Type", "نوع الطلب")}</Label>
                    <Select value={orderType} onValueChange={setOrderType}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DINE_IN"><span className="flex items-center gap-2"><Utensils className="h-3 w-3"/> {t("Dine-in", "محلي")}</span></SelectItem>
                        <SelectItem value="TAKEAWAY"><span className="flex items-center gap-2"><ShoppingBag className="h-3 w-3"/> {t("Takeaway", "سفري")}</span></SelectItem>
                        <SelectItem value="CAR_SERVICE"><span className="flex items-center gap-2"><Car className="h-3 w-3"/> {t("Car Pickup", "سيارة")}</span></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {orderType === "DINE_IN" && (
                    <div className="space-y-1 col-span-2 md:col-span-1">
                      <Label className="text-xs">{t("Table (Optional)", "الطاولة (اختياري)")}</Label>
                      <Select value={selectedTable} onValueChange={setSelectedTable}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={t("Select Table", "اختر الطاولة")} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">{t("No Table", "بدون طاولة")}</SelectItem>
                          {tables?.map((table: any) => (
                            <SelectItem key={table.id} value={table.id}>
                              {table.name || table.tableNumber || t("Table", "طاولة")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className={`space-y-1 ${orderType === "DINE_IN" ? "col-span-2" : "col-span-1"}`}>
                    <Label className="text-xs">{t("Payment", "الدفع")}</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">{t("Cash", "نقدي")}</SelectItem>
                        <SelectItem value="card">{t("Card (POS)", "بطاقة")}</SelectItem>
                        <SelectItem value="online">{t("Online Link", "رابط إلكتروني")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-card border rounded-xl p-3 space-y-3 shadow-sm">
                <h3 className="font-bold text-sm border-b pb-2 flex justify-between items-center">
                  {t("Customer", "العميل")} 
                  <span className="text-[10px] text-muted-foreground font-normal bg-muted px-1.5 py-0.5 rounded">{t("Optional", "اختياري")}</span>
                </h3>
                <div className="space-y-2">
                  <Input 
                    placeholder={t("Phone Number (for Loyalty)", "رقم الهاتف (لبرنامج الولاء)")} 
                    className="h-8 text-sm" 
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                  <Input 
                    placeholder={t("Customer Name", "اسم العميل")} 
                    className="h-8 text-sm" 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
              </div>

              {/* Cart Items */}
              <div className="bg-card border rounded-xl p-3 shadow-sm flex-1 flex flex-col min-h-[200px]">
                <h3 className="font-bold text-sm border-b pb-2 mb-2 flex justify-between">
                  {t("Items", "العناصر")}
                  <Badge variant="secondary" className="px-1.5 h-5">{cart.reduce((a,b)=>a+b.quantity, 0)}</Badge>
                </h3>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {cart.length === 0 && (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-xs italic">
                      {t("Cart is empty", "السلة فارغة")}
                    </div>
                  )}
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-1 border-b border-dashed pb-2 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-sm leading-tight flex-1 pr-2">{item.productName}</span>
                        <span className="font-bold text-primary text-sm whitespace-nowrap">{(item.unitPrice * item.quantity).toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <Input 
                          placeholder={t("Note", "ملاحظة")} 
                          className="h-6 text-[10px] px-2 w-[120px]" 
                          value={item.notes}
                          onChange={(e) => updateCartNotes(idx, e.target.value)}
                        />
                        <div className="flex items-center gap-2 bg-muted rounded-full px-1">
                          <button type="button" onClick={() => updateCartQty(idx, -1)} className="p-1 hover:text-primary"><Minus className="h-3 w-3" /></button>
                          <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <button type="button" onClick={() => updateCartQty(idx, 1)} className="p-1 hover:text-primary"><Plus className="h-3 w-3" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer / Submit */}
            <div className="bg-card border-t p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-10">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-muted-foreground">{t("Total", "الإجمالي")}</span>
                <span className="font-black text-2xl text-primary">{subtotal.toFixed(3)} <span className="text-sm font-bold">OMR</span></span>
              </div>
              <Button 
                className="w-full h-12 text-lg font-black shadow-md" 
                onClick={handleSubmit} 
                disabled={loading || cart.length === 0}
              >
                {loading ? t("Processing...", "جاري المعالجة...") : t("Place Order", "تأكيد الطلب")}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
