"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp, onSnapshot, doc, getDocs } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Coffee, ShoppingBag, Plus, Minus, X, Info, 
  Utensils, Car, Globe, Bell, CheckCircle2, 
  ChevronRight, Star, Clock, MapPin, Heart, Gift, Search
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type Language = "en" | "ar";
type ViewState = "landing" | "car_setup" | "menu" | "product" | "cart" | "phone_capture" | "otp" | "status";

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2-lat1) * Math.PI/180;
  const dLon = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function CustomerMenuClient({ cafe, params }: { cafe: any, params: any }) {
  const db = useFirestore();
  const { toast } = useToast();
  const [lang, setLang] = useState<Language>("en");
  
  const isCarTable = params.tableId?.toLowerCase().includes("car");
  const [view, setView] = useState<ViewState>(isCarTable ? "car_setup" : "menu");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [carInfo, setCarInfo] = useState({
    plateNumber: "",
    parkingSpot: "",
    color: "",
    model: "",
    notes: ""
  });
  
  const [activeCategory, setActiveCategory] = useState(cafe.categories[0]?.id);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);
  
  // Product Customization State
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [itemNotes, setItemNotes] = useState("");
  const [itemQty, setItemQty] = useState(1);

  // Status State
  const [placedOrderInfo, setPlacedOrderInfo] = useState<{ id: string, orderNo: number } | null>(null);
  const [orderStatus, setOrderStatus] = useState<string>("pending");
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [customerPhone, setCustomerPhone] = useState("");
  const [useReward, setUseReward] = useState(false);
  const [loyaltyData, setLoyaltyData] = useState({ cupsCollected: 0, required: 8, rewardsEarned: 0, rewardsUsed: 0 });
  const [showLoyaltyPopup, setShowLoyaltyPopup] = useState(false);

  // Nearby Cafes State
  const [mainTab, setMainTab] = useState<"menu" | "nearby">("menu");
  const [nearbyCafes, setNearbyCafes] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);

  useEffect(() => {
    if (!db) return;
    const fetchCafes = async () => {
       try {
         const snap = await getDocs(collection(db, 'cafes'));
         const cafesList: any[] = [];
         snap.forEach(docSnap => {
            if (docSnap.id !== cafe.id) {
               const data = docSnap.data();
               if (data.isActive !== false) {
                   cafesList.push({ id: docSnap.id, ...data });
               }
            }
         });
         setNearbyCafes(cafesList);
       } catch (err) {}
    };
    fetchCafes();
  }, [db, cafe.id]);

  useEffect(() => {
    if (navigator.geolocation) {
       navigator.geolocation.getCurrentPosition((position) => {
          setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
       });
    }
  }, []);

  useEffect(() => {
    const savedPhone = localStorage.getItem("cafe_customer_phone");
    if (savedPhone) setCustomerPhone(savedPhone);
  }, []);

  // Sync browser back button
  useEffect(() => {
    window.history.replaceState({ view }, "");
    const handlePopState = (e: PopStateEvent) => {
      if (e.state?.view) {
         setView(e.state.view);
      } else {
         if (view === "cart" || view === "product") setView("menu");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [view]);

  const changeView = (newView: ViewState) => {
    window.history.pushState({ view: newView }, "");
    setView(newView);
  };

  // Listen to Loyalty Points and Config
  useEffect(() => {
    if (!db || !cafe.id || !customerPhone) return;
    
    // Fetch Config first
    const fetchConfig = async () => {
      let req = 5;
      try {
        const { getDoc } = await import("firebase/firestore");
        const configSnap = await getDoc(doc(db, "loyaltySettings", cafe.id));
        if (configSnap.exists() && configSnap.data().cupsRequired) {
          req = configSnap.data().cupsRequired;
        }
      } catch(e) {}
      
      const unsub = onSnapshot(doc(db, "customers", `${cafe.id}_${customerPhone}`), (snap) => {
          if (snap.exists()) {
              const data = snap.data();
              setLoyaltyData({ 
                cupsCollected: data.cups || 0, 
                required: req,
                rewardsEarned: data.rewardsEarned || 0,
                rewardsUsed: data.rewardsRedeemed || 0
              });
          } else {
              setLoyaltyData(prev => ({ ...prev, required: req }));
          }
      });
      return unsub;
    };
    
    let unsubscribe: any = null;
    fetchConfig().then(unsub => { unsubscribe = unsub; });
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [db, cafe.id, customerPhone]);

  // Listen to Order Status
  useEffect(() => {
    if (!db || !placedOrderInfo?.id || !cafe.id) return;
    const unsub = onSnapshot(doc(db, "cafes", cafe.id, "orders", placedOrderInfo.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setOrderStatus(data?.status || "pending");
        if (data?.earnedPoints) setEarnedPoints(data.earnedPoints);
      }
    });
    return () => unsub();
  }, [db, placedOrderInfo?.id, cafe.id]);

  const isAr = lang === "ar";
  const dir = isAr ? "rtl" : "ltr";

  const t = (en: string, ar: string) => isAr ? ar : en;

  // Derived
  const cartItemCount = cart.reduce((acc, item) => acc + item.qty, 0);
  const cartTotal = cart.reduce((acc, item) => acc + (item.totalPrice * item.qty), 0);
  
  let rewardDiscount = 0;
  if (useReward && cartTotal > 0) {
      const eligibleItems = cart.filter((item: any) => item.product.categoryId?.toLowerCase().includes('coffee') || true);
      if (eligibleItems.length > 0) {
          rewardDiscount = Math.min(...eligibleItems.map((i: any) => i.totalPrice));
      }
  }

  const taxRate = cafe.taxRate ?? 0; // dynamic from settings, default 0
  const taxableAmount = Math.max(0, cartTotal - rewardDiscount);
  const taxAmount = taxableAmount * taxRate;
  const grandTotal = taxableAmount + taxAmount;
  const taxPercentDisplay = Math.round(taxRate * 100);

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
    changeView("product");
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

    const toastMessage = isAr ? `تم إضافة ${selectedProduct.nameAr} للسلة ✅` : `Added ${selectedProduct.nameEn} to cart ✅`;
    toast({
      description: (
        <div className="flex items-center font-bold text-green-600 gap-2">
          <CheckCircle2 className="w-5 h-5" /> {toastMessage}
        </div>
      ),
      duration: 2000,
    });

    changeView("menu");
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

  const handlePlaceOrder = async () => {
    if (!db || cart.length === 0) return;
    setIsSubmitting(true);
    
    try {
      const isCarOrder = params.tableId?.toLowerCase().includes("car");

      if (customerPhone) {
        localStorage.setItem("cafe_customer_phone", customerPhone);
      }

      const orderPayload = {
        cafeId: cafe.id,
        branchId: params.branchId,
        tableId: params.tableId,
        type: isCarOrder ? "CAR_SERVICE" : (params.tableId === "takeaway" ? "TAKEAWAY" : "DINE_IN"),
        customerPhone: customerPhone || undefined,
        carNumber: isCarOrder ? carInfo.plateNumber : undefined,
        useReward,
        rewardDiscount,
        notes: isCarOrder ? `Spot: ${carInfo.parkingSpot}, Color: ${carInfo.color}, Model: ${carInfo.model}. ${carInfo.notes}` : undefined,
        items: cart.map(item => ({
          productId: item.product.id,
          categoryId: item.product.categoryId || '',
          productName: (isAr ? item.product.nameAr : item.product.nameEn) || item.product.nameEn,
          nameEn: item.product.nameEn,
          nameAr: item.product.nameAr,
          unitPrice: item.totalPrice,
          quantity: item.qty,
          options: item.options,
          notes: item.notes || ""
        }))
      };

      const res = await fetch('/api/orders/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to place order');
      }
      const orderRes = payload.data;

      setPlacedOrderInfo({ id: orderRes.id as string, orderNo: orderRes.orderNumber });
      
      setCart([]);
      changeView("status");
    } catch (err: any) {
      console.error("Failed to place order:", err);
      alert("Error: " + (err.message || "Failed to place order. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDERS ---

  const isCarOrderCheck = params.tableId?.toLowerCase().includes("car");
  const isTakeawayCheck = params.tableId === "takeaway";
  const isDineInCheck = !isCarOrderCheck && !isTakeawayCheck;

  if (view !== "status") {
    if (isCarOrderCheck && cafe.activeOrderTypes?.carService === false) {
      return (
        <div dir={dir} className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center">
           <X className="w-16 h-16 text-rose-500 mb-4 bg-rose-100 p-3 rounded-full" />
           <h1 className="text-2xl font-black text-zinc-900 mb-2">{t("Service Unavailable", "الخدمة غير متاحة")}</h1>
           <p className="text-zinc-500">{t("Car service is currently disabled by the cafe.", "خدمة السيارات غير متاحة حالياً.")}</p>
        </div>
      );
    }
    if (isTakeawayCheck && cafe.activeOrderTypes?.pickup === false) {
      return (
        <div dir={dir} className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center">
           <X className="w-16 h-16 text-rose-500 mb-4 bg-rose-100 p-3 rounded-full" />
           <h1 className="text-2xl font-black text-zinc-900 mb-2">{t("Service Unavailable", "الخدمة غير متاحة")}</h1>
           <p className="text-zinc-500">{t("Pickup service is currently disabled by the cafe.", "خدمة الاستلام الاستلام غير متاحة حالياً.")}</p>
        </div>
      );
    }
    if (isDineInCheck && cafe.activeOrderTypes?.dineIn === false) {
      return (
        <div dir={dir} className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center">
           <X className="w-16 h-16 text-rose-500 mb-4 bg-rose-100 p-3 rounded-full" />
           <h1 className="text-2xl font-black text-zinc-900 mb-2">{t("Service Unavailable", "الخدمة غير متاحة")}</h1>
           <p className="text-zinc-500">{t("Dine-in service is currently disabled by the cafe.", "الطلبات الداخلية غير متاحة حالياً.")}</p>
        </div>
      );
    }
  }

  if (view === "car_setup") {
    // Basic validation
    const isCarFormValid = carInfo.plateNumber.trim() !== "";
    
    return (
      <div dir={dir} className="min-h-screen bg-zinc-50 flex flex-col items-center">
        {/* Header Section */}
        <div className="w-full bg-white px-6 pt-8 pb-4 border-b border-zinc-100 flex flex-col items-center text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 p-1 flex items-center justify-center mb-2">
            <Coffee className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-xl font-black text-zinc-900">{cafe.name}</h1>
          <p className="text-sm font-medium text-amber-600 flex items-center gap-1">
             <MapPin className="w-3 h-3" /> {cafe.branch}
          </p>
          <p className="text-sm text-zinc-500 mt-1">{t("Order from your car easily", "اطلب من سيارتك بسهولة")}</p>
        </div>

        {/* Hero Section */}
        <div className="w-full max-w-sm px-6 py-6 text-center space-y-3">
          <div className="mx-auto w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-2">
             <Car className="w-10 h-10 text-amber-600" />
          </div>
          <h2 className="text-2xl font-black text-zinc-900">{t("Order From Your Car", "اطلب من سيارتك")}</h2>
          <p className="text-sm text-zinc-500 leading-relaxed">
            {t("Enter your vehicle details so we can deliver your order to you.", "أدخل تفاصيل مركبتك لنتمكن من توصيل طلبك إليك.")}
          </p>
          
          <Button 
              variant="outline"
              size="sm"
              onClick={() => setLang(isAr ? "en" : "ar")}
              className="mt-2 text-xs font-bold rounded-full border-zinc-200"
            >
              <Globe className="w-3 h-3 mr-2 rtl:ml-2 rtl:mr-0" />
              <Globe className="w-3 h-3 mr-2 rtl:ml-2 rtl:mr-0" />
              {isAr ? "English" : "العربية"}
          </Button>
        </div>

        {customerPhone && (
          <div className="w-full max-w-sm px-6 pb-4">
             <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 text-center space-y-2">
               <h3 className="font-bold text-amber-900">{t("Welcome back 👋", "مرحبًا بك 👋")}</h3>
               <p className="text-xs font-bold text-amber-700">{t("Would you like your usual order?", "هل ترغب بنفس طلبك السابق؟")}</p>
               <Button className="w-full bg-white border border-amber-300 text-amber-700 hover:bg-amber-100 shadow-sm" onClick={() => changeView("menu")}>
                  {t("Order Again", "إعادة الطلب")}
               </Button>
             </div>
          </div>
        )}

        {/* Input Form (Card Style) */}
        <div className="w-full max-w-sm px-6 pb-32">
          <Card className="rounded-[2rem] border-zinc-100 shadow-sm shadow-zinc-200/50 overflow-hidden bg-white">
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                 <Label className="text-sm font-bold text-zinc-800">{t("Car Plate Number *", "رقم اللوحة *")}</Label>
                 <Input 
                   autoFocus
                   placeholder={t("e.g. 45873", "مثال: 45873")} 
                   value={carInfo.plateNumber}
                   onChange={e => setCarInfo({...carInfo, plateNumber: e.target.value})}
                   className="h-12 bg-zinc-50 border-zinc-200 rounded-xl focus-visible:ring-amber-500" 
                 />
              </div>

              <div className="space-y-2">
                 <Label className="text-sm font-bold text-zinc-800">{t("Parking Spot Number (Optional)", "رقم الموقف (اختياري)")}</Label>
                 <Input 
                   placeholder={t("e.g. P3", "مثال: P3")} 
                   value={carInfo.parkingSpot}
                   onChange={e => setCarInfo({...carInfo, parkingSpot: e.target.value})}
                   className="h-12 bg-zinc-50 border-zinc-200 rounded-xl focus-visible:ring-amber-500" 
                 />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label className="text-xs font-bold text-zinc-700">{t("Car Color", "لون السيارة")}</Label>
                   <Input 
                     placeholder={t("White", "أبيض")} 
                     value={carInfo.color}
                     onChange={e => setCarInfo({...carInfo, color: e.target.value})}
                     className="bg-zinc-50 border-zinc-200 rounded-xl focus-visible:ring-amber-500" 
                   />
                </div>
                <div className="space-y-2">
                   <Label className="text-xs font-bold text-zinc-700">{t("Car Model", "طراز السيارة")}</Label>
                   <Input 
                     placeholder={t("e.g. Camry", "مثال: كامري")} 
                     value={carInfo.model}
                     onChange={e => setCarInfo({...carInfo, model: e.target.value})}
                     className="bg-zinc-50 border-zinc-200 rounded-xl focus-visible:ring-amber-500" 
                   />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                 <Label className="text-xs font-bold text-zinc-700">{t("Notes (Optional)", "ملاحظات (إختياري)")}</Label>
                 <Input 
                   placeholder={t("Any extra details", "تفاصيل إضافية")} 
                   value={carInfo.notes}
                   onChange={e => setCarInfo({...carInfo, notes: e.target.value})}
                   className="bg-zinc-50 border-zinc-200 rounded-xl focus-visible:ring-amber-500" 
                 />
              </div>

            </CardContent>
          </Card>
          
          <div className="mt-8 flex flex-col items-center justify-center gap-3 text-zinc-400">
             <p className="text-xs text-center font-medium px-4">{t("Your order will be delivered directly to your car", "سيتم توصيل طلبك مباشرة إلى سيارتك")}</p>
             <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
               <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {t("No Waiting", "بدون انتظار")}</span>
               <span className="flex items-center gap-1"><Car className="w-3 h-3" /> {t("Contactless", "بدون تلامس")}</span>
             </div>
          </div>
        </div>

        {/* Sticky CTA Button */}
        <div className="fixed bottom-0 inset-x-0 p-4 bg-gradient-to-t from-zinc-50 via-zinc-50 to-transparent z-20 pointer-events-none">
           <div className="max-w-sm mx-auto pointer-events-auto">
             <Button 
                disabled={!isCarFormValid}
                onClick={() => changeView("menu")}
                className="w-full h-14 text-lg font-bold rounded-2xl bg-amber-600 hover:bg-amber-700 text-white shadow-xl shadow-amber-600/20 transition-all hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {t("Continue to Menu", "المتابعة للقائمة")} <ChevronRight className="w-5 h-5 ml-2 rtl:hidden" /><ChevronRight className="w-5 h-5 mr-2 hidden rtl:block rotate-180" />
              </Button>
           </div>
        </div>
      </div>
    );
  }

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
              onClick={() => changeView("menu")}
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
            <Button variant="ghost" onClick={() => changeView("menu")} className="text-zinc-500">
               {t("Back to Menu", "العودة للقائمة")}
            </Button>
          </div>
          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-zinc-200/50 text-center space-y-6 border border-zinc-100">
            <div className="mx-auto w-24 h-24 rounded-full bg-amber-50 flex items-center justify-center relative">
               {['NEW', 'PENDING', 'CONFIRMED', 'PREPARING'].includes(orderStatus.toUpperCase()) ? (
                 <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
               ) : (
                 <CheckCircle2 className="w-12 h-12 text-green-500" />
               )}
               <Coffee className={cn("w-10 h-10", ['NEW', 'PENDING', 'CONFIRMED', 'PREPARING'].includes(orderStatus.toUpperCase()) ? "text-amber-500 animate-pulse" : "text-green-500")} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-zinc-900">
                {t(`Order #${placedOrderInfo?.orderNo || placedOrderInfo?.id?.slice(-6).toUpperCase() || '...'}`, `طلب رقم #${placedOrderInfo?.orderNo || placedOrderInfo?.id?.slice(-6).toUpperCase() || '...'}`)}
              </h2>
              <p className="text-lg font-medium mt-2 text-zinc-500">
                {orderStatus.toUpperCase() === 'NEW' || orderStatus.toUpperCase() === 'PENDING' ? t("Order received... 🟡", "تم استلام الطلب... 🟡") :
                 orderStatus.toUpperCase() === 'CONFIRMED' ? t("Order confirmed... 🟡", "تم تأكيد الطلب... 🟡") :
                 orderStatus.toUpperCase() === 'PREPARING' ? t("Preparing your order... 🟡", "جاري تحضير طلبك... 🟡") : 
                 orderStatus.toUpperCase() === 'READY' ? t("Ready for pickup! 🟢", "جاهز للاستلام! 🟢") :
                 orderStatus.toUpperCase() === 'COMPLETED' ? t("Order completed! 🟢", "اكتمل الطلب! 🟢") :
                 orderStatus.toUpperCase() === 'CANCELLED' ? t("Order cancelled 🔴", "تم إلغاء الطلب 🔴") :
                 t("Processing... 🟡", "جاري المعالجة... 🟡")}
              </p>
            </div>
            
            {orderStatus.toUpperCase() === 'READY' && (
              <div className="pt-4 border-t border-zinc-100">
                <p className="text-sm font-bold text-zinc-800 mb-4">{t("Rate your experience", "قيم تجربتك")}</p>
                <div className="flex justify-center gap-2">
                  {[1,2,3,4,5].map(star => (
                    <Star key={star} className="w-8 h-8 text-zinc-300 hover:text-amber-400 cursor-pointer transition-colors" />
                  ))}
                </div>
              </div>
            )}
            
            {customerPhone && earnedPoints > 0 && (
               <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl flex items-center justify-center gap-2 font-bold animate-in zoom-in">
                 <Gift className="w-5 h-5" />
                 {t(`+${earnedPoints} points added to your account`, `+${earnedPoints} نقاط تمت إضافتها لحسابك`)}
               </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view === "phone_capture") {
    return (
      <div dir={dir} className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-sm space-y-6">
           <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-amber-200">
             <Gift className="w-10 h-10 text-amber-600 animate-pulse" />
           </div>
           
           <h2 className="text-3xl font-black text-zinc-900">{t("Get Your Rewards 🎁", "احصل على مكافآتك 🎁")}</h2>
           <p className="text-zinc-500 font-medium">
             {t("Enter your number to collect points and track your order", "أدخل رقمك لتجميع النقاط وتتبع طلبك بسهولة")}
           </p>

           <div className="space-y-4 pt-4">
             <div className="relative">
               <div className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-zinc-400 select-none ltr:block rtl:hidden flex items-center" dir="ltr">+968 |</div>
               <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-zinc-400 select-none rtl:block ltr:hidden flex items-center" dir="ltr">| 968+</div>
               <Input 
                 type="tel"
                 placeholder="91234567"
                 value={customerPhone}
                 onChange={e => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0,8))}
                 className="h-14 text-center text-xl font-bold bg-white rounded-2xl border-zinc-200 focus-visible:ring-amber-500 ltr:pl-16 rtl:pr-16 tracking-widest"
               />
             </div>
             
             <Button 
               disabled={!customerPhone || customerPhone.length < 8}
               onClick={() => changeView("otp")}
               className="w-full h-14 text-lg font-bold rounded-2xl bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 transition-all active:scale-95"
             >
               {t("Continue", "متابعة")}
             </Button>

             <Button 
               variant="ghost"
               onClick={() => {
                 setCustomerPhone("");
                 handlePlaceOrder();
               }}
               className="w-full text-zinc-400 font-bold hover:text-zinc-600 underline-offset-4 hover:underline"
             >
               {t("Skip without registering", "إكمال بدون تسجيل")}
             </Button>
           </div>
        </div>
      </div>
    );
  }

  if (view === "otp") {
    return (
      <div dir={dir} className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-sm space-y-6">
           <div className="w-20 h-20 bg-[#25D366]/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-[#25D366]/20">
             <svg className="w-10 h-10 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
           </div>

           <h2 className="text-3xl font-black text-zinc-900">{t("Verify via WhatsApp", "تأكيد عبر واتساب")}</h2>
           <p className="text-zinc-500 font-medium">
             {t("Send a quick message to instantly verify your number.", "أرسل رسالة سريعة للتحقق من رقمك فوراً.")}
           </p>

           <div className="space-y-4 pt-4">
             <Button 
               onClick={() => {
                 window.open(`https://wa.me/968XXXXXXX?text=VERIFY_CAFEQR_${customerPhone}`, '_blank');
                 setTimeout(() => {
                   setShowLoyaltyPopup(true);
                   handlePlaceOrder();
                 }, 4000);
               }}
               className="w-full h-14 text-lg font-bold rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-lg shadow-[#25D366]/20 transition-all active:scale-95 flex items-center justify-center gap-2"
             >
               {t("Send WhatsApp Message", "إرسال رسالة واتساب")}
             </Button>

             <Button 
               variant="ghost"
               onClick={() => {
                 setShowLoyaltyPopup(true);
                 handlePlaceOrder();
               }}
               className="w-full text-zinc-400 font-bold hover:text-zinc-600 underline-offset-4 hover:underline"
             >
               {t("I already sent it", "لقد قمت بالإرسال")}
             </Button>
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
          <div className="flex items-center gap-3">
            {cafe.logo && cafe.logo !== "https://picsum.photos/seed/logo/150/150" && (
              <img src={cafe.logo} alt={cafe.name} className="w-10 h-10 rounded-full object-cover border border-zinc-200 shadow-sm bg-white shrink-0" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-xl md:text-2xl tracking-tight text-zinc-900 leading-tight">{cafe.name}</h1>
                <span className="text-xs bg-amber-100/50 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold border border-amber-200/50">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> 4.9
                </span>
              </div>
              <p className="text-xs font-bold text-amber-600 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" /> {cafe.branch} • {params.tableName || params.tableId}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="icon" variant="ghost" onClick={() => setLang(isAr ? "en" : "ar")} className="rounded-full bg-zinc-100 hover:bg-zinc-200 font-bold shrink-0">
              {isAr ? "EN" : "ع"}
            </Button>
          </div>
        </div>
        
        {/* Main Tabs */}
        <div className="flex bg-white px-4 pt-2 border-b border-zinc-100">
           <button 
             onClick={() => setMainTab('menu')}
             className={cn("flex-1 pb-3 text-sm font-black border-b-2 transition-all", mainTab === 'menu' ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-400")}
           >
             {t("Menu", "المنيو")}
           </button>
           <button 
             onClick={() => setMainTab('nearby')}
             className={cn("flex-1 pb-3 text-sm font-black border-b-2 transition-all", mainTab === 'nearby' ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-400")}
           >
             {t("Nearby Cafes", "كافيهات قريبة")}
           </button>
        </div>

        {/* Menu Controls (Only show if mainTab is menu) */}
        <div className={cn("transition-all duration-300", mainTab === 'menu' ? "block" : "hidden")}>
          {/* Search Bar */}
          <div className="px-4 pb-2 pt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input 
                placeholder={t("Search menu...", "ابحث في القائمة...")} 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-10 bg-zinc-100 border-transparent rounded-xl focus-visible:ring-amber-500 w-full"
              />
            </div>
          </div>

          {/* Categories Tab */}
          <div className="flex overflow-x-auto hide-scrollbar py-2 px-4 gap-2">
            {cafe.categories.map((cat: any) => (
               <button
                 key={cat.id}
                 onClick={() => {
                   setActiveCategory(cat.id);
                   const element = document.getElementById(`category-${cat.id}`);
                   if (element) {
                     element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                   }
                 }}
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
        </div>
      </header>

      {/* NEARBY CAFES TAB */}
      {mainTab === 'nearby' && (
        <main className="p-4 space-y-4 animate-in fade-in duration-500">
           <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-center mb-4">
              <p className="text-amber-800 font-bold text-sm">
                {t("Discover other cafes around you 👀", "اكتشف كافيهات أخرى قريبة منك 👀")}
              </p>
           </div>
           
           {nearbyCafes
             .map(c => {
                let distance = null;
                const loc = c.settings?.location || c.location || c;
                if (userLocation && loc.lat && loc.lng) {
                   distance = getDistance(userLocation.lat, userLocation.lng, loc.lat, loc.lng);
                }
                return { ...c, distance };
             })
             .sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999))
             .map(c => (
               <div key={c.id} className="bg-white rounded-3xl p-3 flex gap-4 shadow-sm border border-zinc-100 hover:shadow-md transition-all">
                 <div className="w-24 h-24 rounded-2xl bg-zinc-100 overflow-hidden shrink-0 border border-zinc-200/50">
                   {c.logo || c.coverImage ? (
                     <img src={c.logo || c.coverImage} className="w-full h-full object-cover" alt={c.name} />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center"><Coffee className="w-8 h-8 text-zinc-300" /></div>
                   )}
                 </div>
                 <div className="flex-1 flex flex-col justify-center">
                    <h3 className="font-bold text-lg text-zinc-900 leading-tight mb-1">{c.name}</h3>
                    {c.distance !== null && (
                      <p className="text-xs font-bold text-amber-600 flex items-center gap-1 mb-2">
                        <MapPin className="w-3 h-3" /> {c.distance.toFixed(1)} km
                      </p>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full rounded-xl font-bold border-zinc-200 hover:bg-zinc-50"
                      onClick={() => window.location.href = `/c/${c.id}`}
                    >
                      {t("View Menu", "عرض المنيو")}
                    </Button>
                 </div>
               </div>
             ))}
             {nearbyCafes.length === 0 && (
               <div className="text-center py-10 opacity-50 flex flex-col items-center">
                 <Globe className="w-12 h-12 mb-3 text-zinc-300" />
                 <p className="font-bold">{t("No cafes found nearby.", "لا توجد كافيهات قريبة.")}</p>
               </div>
             )}
        </main>
      )}

      <div className={cn("transition-all duration-300", mainTab === 'menu' ? "block" : "hidden")}>
      {/* LOYALTY WIDGET */}
      {/* SMART BANNER & MINI PROFILE */}
      {cafe.loyalty && (
        <div className="px-4 mt-4 space-y-3">
          {!customerPhone ? (
            <div 
              onClick={() => changeView("phone_capture")}
              className="bg-zinc-900 rounded-2xl p-4 text-white shadow-lg shadow-zinc-900/10 flex items-center justify-between cursor-pointer border border-zinc-800 transition-transform active:scale-95"
            >
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center shrink-0 shadow-inner">
                   <Gift className="w-5 h-5 text-amber-950 animate-pulse" />
                 </div>
                 <div>
                   <h3 className="font-bold text-sm text-amber-400">{t("Order & Collect Rewards", "اطلب وسجل رقمك لتحصل على مكافآت")}</h3>
                   <p className="text-xs text-zinc-400 font-medium">{t("Earn free coffee with every order ☕", "قهوة مجانية بانتظارك ☕")}</p>
                 </div>
               </div>
               <ChevronRight className="w-5 h-5 text-zinc-600 rtl:rotate-180" />
            </div>
          ) : (
            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex items-center justify-between shadow-sm">
               <div>
                 <h3 className="font-black text-amber-900 text-sm">
                   {t("Welcome back", "مرحباً بك 👋")}
                 </h3>
                 <p className="text-amber-700 text-xs font-bold mt-1">
                   {loyaltyData.cupsCollected} / {loyaltyData.required} {t("Points", "نقاط")}
                 </p>
               </div>
               <div className="w-32 bg-white rounded-full h-3 p-0.5 border border-amber-200">
                 <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min((loyaltyData.cupsCollected / loyaltyData.required) * 100, 100)}%` }} />
               </div>
            </div>
          )}
        </div>
      )}

      {/* MENU LISTING */}
      <main className="p-4 space-y-8 animate-in fade-in duration-500">
        {cafe.categories.map((category: any) => {
          let categoryItems = cafe.items.filter((item: any) => item.categoryId === category.id);
          
          if (searchQuery) {
            categoryItems = categoryItems.filter((item: any) => 
               item.nameEn?.toLowerCase().includes(searchQuery.toLowerCase()) || 
               item.nameAr?.includes(searchQuery)
            );
          }
          
          if (categoryItems.length === 0) return null;
          
          return (
            <div key={category.id} className="scroll-mt-32" id={`category-${category.id}`}>
              <h2 className="font-black text-2xl mb-4 py-2 border-b border-zinc-200 text-zinc-900">
                {isAr ? category.nameAr : category.nameEn}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {categoryItems.map((item: any) => (
                  <div 
                    key={item.id} 
                    className="w-full text-left bg-white rounded-3xl p-2.5 flex flex-col shadow-sm border border-zinc-100 hover:shadow-md transition-all group overflow-hidden"
                  >
                    <button onClick={() => handleOpenProduct(item)} className="w-full text-left flex flex-col flex-1">
                      <div className="w-full aspect-square rounded-2xl bg-zinc-100 overflow-hidden relative mb-3">
                         <img 
                           src={item.image || "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=400&h=400"} 
                           alt={item.nameEn} 
                           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                         />
                         {item.tags?.includes('popular') && (
                           <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-xl border-b-2 border-l-2 border-white">
                             {t("Popular 🔥", "شائع 🔥")}
                           </div>
                         )}
                      </div>
                      <div className="flex flex-col flex-1 px-1 pb-1">
                        <h3 className="font-bold text-[15px] leading-tight text-zinc-900 mb-1 line-clamp-1">
                          {isAr ? item.nameAr : item.nameEn}
                        </h3>
                        {item.descEn && item.descAr && (
                          <p className="text-[11px] text-zinc-500 line-clamp-2 mb-2 leading-snug">
                            {isAr ? item.descAr : item.descEn}
                          </p>
                        )}
                        <div className="mt-auto pt-2">
                          <span className="font-black text-[15px] text-amber-600">
                            {item.price.toFixed(3)} {cafe.currency}
                          </span>
                        </div>
                      </div>
                    </button>
                    <div className="px-1 mt-2">
                      <Button 
                        onClick={(e) => {
                           e.stopPropagation();
                           if (item.options && item.options.length > 0) {
                             handleOpenProduct(item);
                           } else {
                             // Quick Add
                             const cartItemId = `${item.id}-{}`;
                             setCart(prev => {
                               const existing = prev.find(i => i.cartItemId === cartItemId);
                               if (existing) {
                                 return prev.map(i => i.cartItemId === cartItemId ? { ...i, qty: i.qty + 1 } : i);
                               }
                               return [...prev, {
                                 cartItemId,
                                 product: item,
                                 qty: 1,
                                 options: {},
                                 totalPrice: item.price,
                                 notes: ""
                               }];
                             });
                             toast({
                               description: (
                                 <div className="flex items-center font-bold text-green-600 gap-2">
                                   <CheckCircle2 className="w-5 h-5" /> {isAr ? `تم إضافة ${item.nameAr} للسلة ✅` : `Added ${item.nameEn} to cart ✅`}
                                 </div>
                               ),
                               duration: 2000,
                             });
                           }
                        }}
                        className="w-full h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-sm flex items-center justify-center gap-1 transition-all active:scale-95 shadow-sm shadow-amber-500/20"
                      >
                        <Plus className="w-4 h-4" /> {t("Add to Cart", "إضافة")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {cafe.items.filter((item: any) => item.nameEn?.toLowerCase().includes(searchQuery.toLowerCase()) || item.nameAr?.includes(searchQuery)).length === 0 && (
           <div className="py-20 text-center flex flex-col items-center opacity-60">
             <Coffee className="w-16 h-16 text-zinc-300 mb-4" />
             <p className="text-lg font-bold text-zinc-500">{searchQuery ? t("No items matched your search.", "لا توجد نتائج بحث مطابقة.") : t("No items available yet ☕", "لا توجد منتجات متاحة بعد ☕")}</p>
           </div>
        )}
      </main>
      </div>

      {/* FLOATING CART BAR */}
      {view !== "cart" && cartItemCount > 0 && (
        <div className="fixed bottom-6 inset-x-4 z-40 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <Button 
            onClick={() => changeView("cart")}
            className="w-full h-16 rounded-2xl bg-zinc-900 border border-zinc-800 text-white shadow-2xl shadow-zinc-900/30 flex items-center justify-between px-6 transition-all active:scale-95"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-amber-500 text-amber-950 flex items-center justify-center font-black text-sm">
                {cartItemCount}
              </div>
              <span className="font-bold text-lg">{cartTotal.toFixed(3)} {cafe.currency}</span>
            </div>
            <span className="font-bold text-base flex items-center gap-2">
              {t("View Order", "عرض الطلب")} <ShoppingBag className="w-5 h-5" />
            </span>
          </Button>
        </div>
      )}

      {/* BOTTOM CART OR PRODUCT MODAL OVERLAYS */}
      
      {/* PRODUCT DETAILS FULL-SCREEN MODAL */}
      <Sheet open={view === "product"} onOpenChange={(o) => { if(!o) changeView("menu") }}>
        <SheetContent side="bottom" className="h-[95vh] rounded-t-[2.5rem] p-0 flex flex-col overflow-hidden bg-zinc-50 border-t-0" hideClose>
          <SheetTitle className="sr-only">Product Details</SheetTitle>
          {selectedProduct && (
            <>
              <div className="relative h-72 bg-zinc-200 flex-shrink-0 flex items-center justify-center">
                {selectedProduct.image ? (
                  <img src={selectedProduct.image} className="w-full h-full object-cover" alt="" />
                ) : (
                  <Coffee className="w-20 h-20 text-zinc-300" />
                )}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-zinc-50 to-transparent" />
                <Button 
                  onClick={() => changeView("menu")}
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



      {/* CART FULL-SCREEN SHEET */}
      <Sheet open={view === "cart"} onOpenChange={(o) => { if(!o) changeView("menu") }}>
         <SheetContent side="bottom" className="h-[95vh] rounded-t-[2.5rem] p-6 flex flex-col bg-zinc-50" hideClose>
            <SheetTitle className="sr-only">{t("Your Order", "طلبك")}</SheetTitle>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-black text-zinc-900">{t("Your Order", "طلبك")}</h2>
              <Button size="icon" variant="ghost" className="rounded-full bg-zinc-200" onClick={() => changeView("menu")}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              {cart.map(item => (
                <div key={item.cartItemId} className="flex gap-4 p-4 bg-white rounded-3xl border border-zinc-100 shadow-sm">
                   <div className="w-20 h-20 rounded-2xl bg-zinc-100 overflow-hidden shrink-0 flex items-center justify-center">
                     {item.product.image ? (
                       <img src={item.product.image} className="w-full h-full object-cover" alt="" />
                     ) : (
                       <Coffee className="w-6 h-6 text-zinc-300" />
                     )}
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
               
              {/* UPSELL SECTION */}
              {cart.length > 0 && cafe.items.filter((i: any) => !cart.find(c => c.product.id === i.id)).length > 0 && (
                <div className="pt-4 mt-6">
                  <h3 className="font-black text-lg text-zinc-900 mb-3">{t("You might also like", "قد يعجبك أيضاً")}</h3>
                  <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 -mx-2 px-2">
                    {cafe.items
                      .filter((i: any) => !cart.find(c => c.product.id === i.id))
                      .sort((a: any, b: any) => (b.tags?.includes('popular') ? 1 : 0) - (a.tags?.includes('popular') ? 1 : 0))
                      .slice(0, 4)
                      .map((item: any) => (
                      <button 
                        key={item.id}
                        onClick={() => handleOpenProduct(item)}
                        className="min-w-[130px] w-[130px] bg-white rounded-2xl p-2 border border-zinc-100 shadow-sm text-left flex flex-col group transition-transform active:scale-95"
                      >
                         <div className="w-full aspect-square rounded-xl bg-zinc-100 overflow-hidden mb-2 relative">
                           <img 
                             src={item.image || "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=400&h=400"} 
                             alt={item.nameEn} 
                             className="w-full h-full object-cover group-hover:scale-105 transition-all" 
                           />
                           <div className="absolute bottom-1 right-1 h-7 w-7 rounded-full bg-zinc-900/80 backdrop-blur-sm text-white flex items-center justify-center shadow-md">
                             <Plus className="w-4 h-4" />
                           </div>
                         </div>
                         <h4 className="font-bold text-[13px] text-zinc-900 line-clamp-1">{isAr ? item.nameAr : item.nameEn}</h4>
                         <span className="font-black text-[12px] text-amber-600 mt-auto pt-1">{item.price.toFixed(3)} {cafe.currency}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-3xl p-5 border border-zinc-100">
                <h3 className="font-bold text-zinc-900 mb-2">{t("Customer Details (Optional)", "بيانات العميل (اختياري)")}</h3>
                <Input 
                  placeholder={t("Phone Number...", "رقم الجوال...")} 
                  className="h-12 rounded-xl bg-zinc-50" 
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
                {(loyaltyData.rewardsEarned > loyaltyData.rewardsUsed) && cartItemCount > 0 && (
                   <div className="flex items-center justify-between mt-4 p-3 bg-green-50 text-green-900 rounded-xl border border-green-200">
                     <div className="flex items-center gap-2 font-bold text-sm">
                       <Gift className="w-5 h-5 text-green-600" />
                       {t("Use Free Drink Reward!", "استخدم مكافأة مشروب مجاني!")}
                     </div>
                     <Switch checked={useReward} onCheckedChange={setUseReward} />
                   </div>
                )}
              </div>
            </div>

            <div className="pt-6 mt-auto border-t border-zinc-200 space-y-4 pb-4">
               {!customerPhone && cartItemCount > 0 && (
                  <div className="text-center text-sm font-bold text-amber-700 bg-amber-50 py-2.5 px-4 rounded-xl border border-amber-200 animate-pulse">
                    {t("Complete order now to get your welcome points! 🎁", "أكمل طلبك الآن لتحصل على نقاط ترحيبية... لا تضيعها! 🎁")}
                  </div>
               )}
               <div className="flex justify-between items-center px-2">
                 <span className="text-zinc-500 font-bold">{t("Subtotal", "المجموع الفرعي")}</span>
                 <span className="font-bold">{cartTotal.toFixed(2)} {cafe.currency}</span>
               </div>
               {rewardDiscount > 0 && (
                 <div className="flex justify-between items-center px-2">
                   <span className="text-green-600 font-bold">{t("Reward Discount", "خصم المكافأة (مجاني)")}</span>
                   <span className="font-bold text-green-600">-{rewardDiscount.toFixed(2)} {cafe.currency}</span>
                 </div>
               )}
               {taxRate > 0 && (
               <div className="flex justify-between items-center px-2">
                 <span className="text-zinc-500 font-bold">{t(`Tax (${taxPercentDisplay}%)`, `الضريبة (${taxPercentDisplay}%)`)}</span>
                 <span className="font-bold">{taxAmount.toFixed(2)} {cafe.currency}</span>
               </div>
               )}
               <div className="flex justify-between items-center px-2 border-t border-zinc-200 pt-4">
                 <span className="text-xl font-black text-zinc-900">{t("Total", "الإجمالي")}</span>
                 <span className="text-2xl font-black text-amber-600">{grandTotal.toFixed(2)} {cafe.currency}</span>
               </div>
               <Button 
                onClick={() => {
                  if (customerPhone) handlePlaceOrder();
                  else changeView("phone_capture");
                }}
                disabled={isSubmitting}
                className="w-full h-[68px] text-xl font-black rounded-2xl bg-amber-500 hover:bg-amber-600 text-white mt-2 shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-transform"
               >
                 {isSubmitting ? t("Placing...", "جاري الإرسال...") : t("Place Order", "إتمام الطلب")}
               </Button>
            </div>
         </SheetContent>
      </Sheet>

      {/* LOYALTY POPUP (Screen 6) */}
      <Sheet open={showLoyaltyPopup} onOpenChange={setShowLoyaltyPopup}>
        <SheetContent side="bottom" className="h-[60vh] rounded-t-[3rem] p-8 flex flex-col items-center text-center bg-zinc-900 text-white border-zinc-800 shadow-2xl" hideClose>
           <SheetTitle className="sr-only">Loyalty Rewards</SheetTitle>
           <div className="w-24 h-24 bg-amber-500 rounded-full flex items-center justify-center mb-6 mt-8 shadow-[0_0_40px_rgba(245,158,11,0.4)]">
             <Gift className="w-12 h-12 text-amber-950" />
           </div>
           <h2 className="text-3xl font-black text-white mb-2">{t("Congratulations! 🎉", "مبروك! 🎉")}</h2>
           <p className="text-amber-400 font-bold text-xl mb-10">{t(`You have ${loyaltyData.cupsCollected} points`, `لديك ${loyaltyData.cupsCollected} نقاط`)}</p>
           
           <div className="w-full max-w-xs space-y-3 mb-auto">
             <div className="flex justify-between text-sm font-bold text-zinc-400 px-1">
               <span>{loyaltyData.cupsCollected} / {loyaltyData.required}</span>
               <span>{loyaltyData.required - loyaltyData.cupsCollected} {t("remaining to Free Coffee ☕", "متبقية لقهوة مجانية ☕")}</span>
             </div>
             <div className="h-4 w-full bg-zinc-800 rounded-full p-1 overflow-hidden border border-zinc-700">
               <div className="h-full bg-amber-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min((loyaltyData.cupsCollected / loyaltyData.required) * 100, 100)}%` }} />
             </div>
           </div>

           <Button 
             onClick={() => setShowLoyaltyPopup(false)}
             className="w-full max-w-xs h-16 text-xl font-black rounded-3xl bg-white hover:bg-zinc-200 text-zinc-900 shadow-lg"
           >
             {t("See Your Rewards", "شوف مكافآتك")}
           </Button>
        </SheetContent>
      </Sheet>

    </div>
  );
}
