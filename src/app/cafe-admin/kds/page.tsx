"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock, Car, Utensils, Timer, PackageOpen, CheckCircle, Printer
} from "lucide-react";
import { useUser, useFirestore, useMemoFirebase, useCollection, useDoc } from "@/firebase";
import { collection, query, doc, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { SectionHeader } from "@/components/dashboard/section-header";
import { useCafe } from "@/hooks/use-cafe";

export default function KDSManagement() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // Audio reference for new orders
  const audioContextRef = useRef<AudioContext | null>(null);

  const { cafeId } = useCafe();

  const configRef = useMemoFirebase(() => db && cafeId ? doc(db, 'cafes', cafeId, 'config', 'settings') : null, [db, cafeId]);
  const { data: configDoc } = useDoc(configRef);
  const isArabic = configDoc?.language === 'ar';
  const t = (en: string, ar: string) => isArabic ? ar : en;

  // Retrieve matching cafe orders automatically 
  const ordersQuery = useMemoFirebase(() => {
    if (!db || !cafeId) return null;
    return query(collection(db, 'cafes', cafeId, 'orders'), orderBy('createdAt', 'desc'));
  }, [db, cafeId]);
  const { data: orders, isLoading } = useCollection(ordersQuery);

  const knownOrderIds = useRef<Set<string>>(new Set());

  // Sound notifications for new orders
  useEffect(() => {
    if (!orders) return;
    
    // Check for new pending/confirmed orders for the kitchen
    const activeKitchenOrders = orders.filter(o => {
        const s = o.status?.toLowerCase();
        return !s || s === 'pending' || s === 'confirmed';
    });
    
    if (knownOrderIds.current.size > 0) {
        const newOrders = activeKitchenOrders.filter(o => !knownOrderIds.current.has(o.id));
        
        if (newOrders.length > 0) {
            playSound();
            
            newOrders.forEach(newOrder => {
                const tableStr = newOrder.tableId ? `${t('Table', 'طاولة')} ${newOrder.tableId}` : newOrder.carPlateNumber ? `${t('Car', 'سيارة')} ${newOrder.carPlateNumber}` : t('Takeaway', 'سفري');
                toast({ 
                    title: `🔔 ${t("New Ticket!", "تذكرة جديدة!")} - ${tableStr}`, 
                    description: t("Kitchen needs to prepare this order.", "المطبخ بحاجة لتحضير هذا الطلب."),
                    duration: 10000,
                });
            });
        }
    }

    orders.forEach(o => knownOrderIds.current.add(o.id));
  }, [orders, toast]);

  const playSound = () => {
    try {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') ctx.resume();
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.8);
    } catch (e) {
        console.error("Audio play failed:", e);
    }
  }

  const getOrderTypeInfo = (order: any) => {
    if (order.serviceType === 'CAR' || order.type === 'CAR_SERVICE' || (order.tableId || '').toLowerCase().includes('car')) {
        return { label: t('Car', 'سيارة'), icon: Car, color: 'text-amber-800 bg-amber-100 border-amber-300' };
    }
    if (order.serviceType === 'TAKEAWAY' || order.type === 'TAKEAWAY' || order.tableId === 'takeaway') {
        return { label: t('Pickup', 'استلام'), icon: PackageOpen, color: 'text-purple-800 bg-purple-100 border-purple-300' };
    }
    return { label: t('Dine-in', 'محلي'), icon: Utensils, color: 'text-blue-800 bg-blue-100 border-blue-300' };
  };

  const getTimeElapsed = (timestamp?: any) => {
    if (!timestamp) return "0m";
    const dateValue = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
    const minDiff = Math.floor((Date.now() - dateValue.getTime()) / 60000);
    
    if (minDiff < 1) return t("Just now", "الآن");
    return `${minDiff}m`;
  };

  const handleStatusChange = async (order: any, newStatus: string) => {
    if (!db || !cafeId) return;
    try {
       setUpdatingId(order.id);
       const res = await fetch(`/api/orders/${order.id}/status`, {
         method: 'PATCH',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ cafeId, status: newStatus })
       });
       const payload = await res.json();
       if (!res.ok || !payload.success) {
         throw new Error(payload.message || 'Failed to update order status');
       }
    } catch (e: any) {
       toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
       setUpdatingId(null);
    }
  };

  const handlePrintTicket = (order: any) => {
    const typeInfo = getOrderTypeInfo(order);
    const dateStr = new Date(order.createdAt?.toDate ? order.createdAt.toDate() : order.createdAt || Date.now()).toLocaleString(isArabic ? 'ar-EG' : 'en-US');
    const orderNumber = order.orderNo || order.orderNumber || order.id.slice(-4).toUpperCase();
    const isAr = isArabic;
    
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    let html = `
      <html dir="${isAr ? 'rtl' : 'ltr'}">
        <head>
          <title>Print Ticket</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; width: 100%; max-width: 300px; margin: 0 auto; padding: 10px; color: #000; }
            h1, h2, h3, h4, p { margin: 0; padding: 0; }
            .header { text-align: center; margin-bottom: 15px; border-bottom: 2px dashed #000; padding-bottom: 10px; }
            .order-no { font-size: 28px; font-weight: bold; margin-bottom: 5px; }
            .type { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
            .date { font-size: 14px; }
            .item { display: flex; flex-direction: column; margin-bottom: 10px; border-bottom: 1px dashed #ccc; padding-bottom: 8px; }
            .item-row { display: flex; justify-content: space-between; align-items: flex-start; }
            .item-qty { font-weight: bold; margin-${isAr ? 'left' : 'right'}: 10px; font-size: 18px; }
            .item-name { flex: 1; font-size: 18px; font-weight: bold; line-height: 1.2; }
            .item-notes { font-size: 16px; margin-top: 6px; border: 2px solid #000; padding: 4px; display: inline-block; font-weight: bold; }
            .footer { margin-top: 15px; border-top: 2px dashed #000; padding-top: 10px; text-align: center; font-size: 14px; font-weight: bold; }
            @media print {
               @page { margin: 0; }
               body { margin: 0; padding: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="order-no">${isAr ? 'طلب' : 'Order'} #${orderNumber}</div>
            <div class="type">${typeInfo.label}</div>
            <div class="type">${typeInfo.label === (isAr ? 'سيارة' : 'Car') ? `${order.carPlateNumber || ''}` : typeInfo.label === (isAr ? 'استلام' : 'Pickup') ? (isAr ? 'سفري' : 'Takeaway') : `${isAr ? 'طاولة' : 'Table'} ${order.table || order.tableId}`}</div>
            <p class="date">${dateStr}</p>
          </div>
          <div class="items">
    `;

    order.items?.forEach((item: any) => {
      html += `
            <div class="item">
              <div class="item-row">
                <span class="item-qty">${item.quantity || item.qty}x</span>
                <span class="item-name">${isAr ? (item.nameAr || item.nameEn || item.name) : (item.nameEn || item.name)}</span>
              </div>
              ${item.notes ? `<div class="item-notes">${isAr ? 'ملاحظة' : 'Note'}: ${item.notes}</div>` : ''}
            </div>
      `;
    });

    if (order.carNotes) {
      html += `<div style="margin-top: 10px; font-size: 16px; font-weight: bold; border: 2px dashed #000; padding: 8px;">${isAr ? 'تفاصيل السيارة' : 'Car Details'}: ${order.carNotes}</div>`;
    }
    
    html += `
          </div>
          <div class="footer">
            ${isAr ? 'طبع من المطبخ' : 'Printed from KDS'}
          </div>
        </body>
      </html>
    `;

    const docRef = iframe.contentWindow?.document;
    if (docRef) {
      docRef.open();
      docRef.write(html);
      docRef.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 500);
      }, 250);
    }
  };

  // Filter only active orders for the KDS
  const activeTickets = useMemo(() => {
    if (!orders) return [];
    return orders.filter(o => {
        const stat = o.status?.toLowerCase() || 'pending';
        return stat === 'pending' || stat === 'confirmed' || stat === 'preparing';
    }).sort((a, b) => {
        const dateA = a.createdAt ? (typeof a.createdAt.toDate === 'function' ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime()) : 0;
        const dateB = b.createdAt ? (typeof b.createdAt.toDate === 'function' ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime()) : 0;
        return dateA - dateB; // Oldest first
    });
  }, [orders]);

  const renderTicketCard = (order: any) => {
    const typeInfo = getOrderTypeInfo(order);
    const stat = order.status?.toLowerCase() || 'pending';
    const isPreparing = stat === 'preparing';
    const isUpdating = updatingId === order.id;

    // Time calculations
    const timestamp = order.createdAt;
    const dateValue = timestamp ? (typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp)) : new Date();
    const minDiff = Math.floor((Date.now() - dateValue.getTime()) / 60000);
    const isLate = minDiff > 15; // Mark red if older than 15 mins

    return (
      <Card id={`ticket-${order.id}`} key={order.id} className={`overflow-hidden transition-all shadow-md flex flex-col ${isLate ? 'border-red-500 ring-2 ring-red-500 ring-offset-2' : isPreparing ? 'border-orange-400 border-2' : 'border-2'}`}>
        <CardContent className="p-0 flex flex-col h-full">
           {/* Ticket Header */}
           <div className={`p-4 border-b flex flex-col gap-2 ${typeInfo.color} ${isLate && !isPreparing ? 'bg-red-100 border-red-300 text-red-900' : ''}`}>
              <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2 font-black text-xl uppercase tracking-wide">
                    <typeInfo.icon className="h-6 w-6" />
                    #{order.orderNo || order.orderNumber || order.id.slice(-4).toUpperCase()}
                 </div>
                 <div className={`text-lg font-black flex items-center gap-1 px-3 py-1 rounded-full ${isLate ? 'bg-red-200 text-red-900 animate-pulse' : 'bg-white/50'}`}>
                    <Clock className="w-5 h-5" /> {getTimeElapsed(order.createdAt)}
                 </div>
              </div>
              <div className="font-bold text-lg">
                  {typeInfo.label === t('Car', 'سيارة') ? `${t('Car', 'سيارة')}: ${order.carPlateNumber} (${t('Spot', 'موقف')} ${order.parkingSpot})` : typeInfo.label === t('Pickup', 'استلام') ? t('Takeaway', 'سفري') : `${t('Table', 'طاولة')} ${order.table || order.tableId}`}
              </div>
           </div>

           {/* Ticket Items */}
           <div className="p-5 bg-card flex-1">
              <div className="space-y-4">
                 {order.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex flex-col border-b border-border/50 pb-3 last:border-0 last:pb-0">
                       <div className="flex gap-3 text-lg font-black">
                          <span className="text-primary bg-primary/10 px-2 py-0.5 rounded">{item.quantity || item.qty}x</span>
                          <span className="leading-tight">{item.nameEn || item.name}</span>
                       </div>
                       {item.notes && <div className="text-base font-bold text-red-600 bg-red-50 p-2 rounded mt-2">{t("Note", "ملاحظة")}: {item.notes}</div>}
                    </div>
                 ))}
                 {order.carNotes && (
                   <div className="text-sm font-bold text-amber-800 bg-amber-100 p-3 rounded mt-4">
                     {t("Car Details", "تفاصيل السيارة")}: {order.carNotes}
                   </div>
                 )}
              </div>
           </div>

           {/* Ticket Actions */}
           <div className="p-3 border-t bg-muted/30 flex gap-2">
               <Button 
                 variant="outline"
                 className="h-16 w-16 flex-shrink-0 bg-white hover:bg-slate-100 border-2"
                 onClick={() => handlePrintTicket(order)}
                 title={t("Print Ticket", "طباعة الطلب")}
               >
                 <Printer className="w-6 h-6 text-slate-700" />
               </Button>
               <div className="flex-1">
                 {!isPreparing ? (
                   <Button 
                     className="w-full h-16 text-xl bg-orange-500 hover:bg-orange-600 font-black shadow-sm text-white" 
                     onClick={() => handleStatusChange(order, 'preparing')} 
                     disabled={isUpdating}
                   >
                     <Timer className="w-6 h-6 mr-2" /> {t("Start Preparing", "بدء التجهيز")}
                   </Button>
                 ) : (
                   <Button 
                     className="w-full h-16 text-xl bg-green-500 hover:bg-green-600 font-black shadow-sm text-white" 
                     onClick={() => handleStatusChange(order, 'ready')} 
                     disabled={isUpdating}
                   >
                     <CheckCircle className="w-6 h-6 mr-2" /> {t("Mark Ready", "جاهز للتقديم")}
                   </Button>
                 )}
               </div>
           </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in mx-auto max-w-[1800px] h-screen flex flex-col pt-2 pb-6" dir={isArabic ? 'rtl' : 'ltr'}>
      
      <SectionHeader 
        title={t("Kitchen Display System (KDS)", "شاشة المطبخ (KDS)")}
        description={t("Manage active orders and preparation times.", "إدارة الطلبات النشطة وأوقات التحضير.")}
        actions={
          <div className="flex gap-2">
             <div className="px-5 py-2 bg-slate-900 text-slate-100 rounded-lg text-lg font-black flex items-center gap-3">
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                </span>
                {t("KITCHEN ONLINE", "المطبخ متصل")}
             </div>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto">
         {activeTickets.length === 0 && !isLoading && (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 border-4 border-dashed border-muted-foreground/20 rounded-3xl p-8 text-center min-h-[400px]">
               <Utensils className="h-24 w-24 mb-6 opacity-20" />
               <h2 className="font-black text-3xl mb-2">{t("No Active Tickets", "لا توجد طلبات نشطة")}</h2>
               <p className="text-xl">{t("Waiting for new orders...", "في انتظار طلبات جديدة...")}</p>
            </div>
         )}
         
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
            {activeTickets.map(o => renderTicketCard(o))}
         </div>
      </div>
    </div>
  );
}
