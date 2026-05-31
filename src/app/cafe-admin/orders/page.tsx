"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock, Car, Utensils, CheckCircle, Timer, PackageOpen,
  CheckCircle2, Ban, Receipt, Check, Printer
} from "lucide-react";
import { useUser, useFirestore, useMemoFirebase, useCollection, useDoc } from "@/firebase";
import { collection, query, doc, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { SectionHeader } from "@/components/dashboard/section-header";
import { useCafe } from "@/hooks/use-cafe";
import { ToastAction } from "@/components/ui/toast";
import { ManualOrderModal } from "@/components/orders/manual-order-modal";

export default function OrderManagement() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // Audio reference for new orders
  const audioContextRef = useRef<AudioContext | null>(null);
  const previousPendingCount = useRef<number>(0);
  const previousReadyCount = useRef<number>(0);

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

  // Sound notifications for new orders & ready orders
  useEffect(() => {
    if (!orders) return;
    
    // Check for new pending orders
    const pendingOrders = orders.filter(o => o.status === 'pending');
    
    if (knownOrderIds.current.size > 0) {
        const newOrders = pendingOrders.filter(o => !knownOrderIds.current.has(o.id));
        
        if (newOrders.length > 0) {
            playSound('new');
            
            newOrders.forEach(newOrder => {
                const tableStr = newOrder.tableId ? `${t('Table', 'طاولة')} ${newOrder.tableId}` : newOrder.carPlateNumber ? `${t('Car', 'سيارة')} ${newOrder.carPlateNumber}` : t('Takeaway', 'سفري');
                const itemsCount = newOrder.items?.reduce((acc: number, item: any) => acc + (item.quantity || item.qty || 1), 0) || 0;
                
                toast({ 
                    title: `🔔 ${t("New Order!", "طلب جديد!")} - ${tableStr}`, 
                    description: `${t("Items:", "المنتجات:")} ${itemsCount} | ${t("Total:", "المجموع:")} ${(newOrder.total || 0).toFixed(3)} OMR`,
                    action: <ToastAction altText="View" onClick={() => {
                       const el = document.getElementById(`order-card-${newOrder.id}`);
                       if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}>{t("View", "عرض")}</ToastAction>,
                    duration: 10000,
                });
            });
        }
    }

    // Check for new ready orders
    const readyCount = orders.filter(o => o.status === 'ready').length;
    if (orders.length > 0 && readyCount > previousReadyCount.current) {
        playSound('ready');
    }
    previousReadyCount.current = readyCount;
    
    orders.forEach(o => knownOrderIds.current.add(o.id));
  }, [orders, toast]);

  const playSound = (type: 'new' | 'ready') => {
    try {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') ctx.resume();
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        if (type === 'new') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.3);
            
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 1.5);
            
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(1600, ctx.currentTime);
            
            gain2.gain.setValueAtTime(0, ctx.currentTime);
            gain2.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.02);
            gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
            
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(ctx.currentTime);
            osc2.stop(ctx.currentTime + 1.5);
            return;
        } else {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
        }
        
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
        console.error("Audio play failed:", e);
    }
  }

  const getOrderTypeInfo = (order: any) => {
    if (order.serviceType === 'CAR' || order.type === 'CAR_SERVICE' || (order.tableId || '').toLowerCase().includes('car')) {
        return { label: t('Car', 'سيارة'), icon: Car, color: 'text-amber-700 bg-amber-100 border-amber-300' };
    }
    if (order.serviceType === 'TAKEAWAY' || order.type === 'TAKEAWAY' || order.tableId === 'takeaway') {
        return { label: t('Pickup', 'استلام'), icon: PackageOpen, color: 'text-purple-700 bg-purple-100 border-purple-300' };
    }
    return { label: t('Dine-in', 'محلي'), icon: Utensils, color: 'text-blue-700 bg-blue-100 border-blue-300' };
  };

  const getTimeAgo = (timestamp?: any) => {
    if (!timestamp) return t("Just now", "الآن");
    const dateValue = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
    const minDiff = Math.floor((Date.now() - dateValue.getTime()) / 60000);
    
    if (minDiff < 1) return t("Just now", "الآن");
    if (minDiff < 60) return isArabic ? `منذ ${minDiff} دقيقة` : `${minDiff}m ago`;
    const hrs = Math.floor(minDiff/60);
    const mins = minDiff % 60;
    return isArabic ? `${hrs} س ${mins} د` : `${hrs}h ${mins}m`;
  };

  const handleStatusChange = async (order: any, newStatus: string) => {
    if (!db || !cafeId) return;
    try {
       setUpdatingId(order.id);
       const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
       const res = await fetch(`/api/orders/${order.id}/status-pg`, {
         method: 'PATCH',
         headers: {
           'Content-Type': 'application/json',
           ...(token ? { Authorization: `Bearer ${token}` } : {})
         },
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

  const printReceipt = (order: any) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const cafeName = configDoc?.name || "CafeQR";
    const orderDate = order.createdAt ? (typeof order.createdAt.toDate === 'function' ? order.createdAt.toDate() : new Date(order.createdAt)) : new Date();
    const dateStr = orderDate.toLocaleDateString();
    const timeStr = orderDate.toLocaleTimeString();

    const typeInfo = getOrderTypeInfo(order);
    const locationStr = typeInfo.label === t('Car', 'سيارة') ? `${t('Car', 'سيارة')}: ${order.carPlateNumber} (${t('Spot', 'موقف')} ${order.parkingSpot})` : typeInfo.label === t('Pickup', 'استلام') ? t('Takeaway', 'سفري') : `${t('Table', 'طاولة')} ${order.table || order.tableId}`;

    const itemsHtml = (order.items || []).map((item: any) => `
      <tr>
        <td style="padding: 2px 0;">${item.quantity || item.qty}x</td>
        <td style="padding: 2px 0;">${item.nameEn || item.name}</td>
        <td style="text-align: right; padding: 2px 0;">${((item.price || item.unitPrice || item.totalPrice / (item.quantity || item.qty) || 0) * (item.quantity || item.qty)).toFixed(3)}</td>
      </tr>
      ${item.notes ? `<tr><td></td><td colspan="2" style="font-size: 10px; color: #555;">Note: ${item.notes}</td></tr>` : ''}
    `).join('');

    const html = `
      <html dir="${isArabic ? 'rtl' : 'ltr'}">
        <head>
          <style>
            @media print {
              @page { margin: 0; }
              body { margin: 0.5cm; }
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              width: 80mm;
              margin: 0 auto;
              font-size: 12px;
              color: #000;
            }
            .text-center { text-align: center; }
            .text-right { text-align: ${isArabic ? 'left' : 'right'}; }
            .font-bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .header { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
            table { width: 100%; border-collapse: collapse; }
          </style>
        </head>
        <body>
          <div class="text-center header">${cafeName}</div>
          <div class="text-center">${t('Receipt', 'فاتورة')}</div>
          <div class="divider"></div>
          <div>${t('Order', 'طلب')} #${order.orderNo || order.orderNumber || order.id.slice(-5).toUpperCase()}</div>
          <div>${t('Date', 'التاريخ')}: ${dateStr} ${timeStr}</div>
          <div>${t('Type', 'النوع')}: ${locationStr}</div>
          <div class="divider"></div>
          <table>
            ${itemsHtml}
          </table>
          <div class="divider"></div>
          <table>
            <tr>
              <td>${t('Subtotal', 'المجموع الفرعي')}</td>
              <td class="text-right">${(order.subtotal || order.total || order.totalAmount).toFixed(3)} OMR</td>
            </tr>
            <tr>
              <td>${t('Tax', 'الضريبة')}</td>
              <td class="text-right">${(order.taxAmount || 0).toFixed(3)} OMR</td>
            </tr>
            <tr class="font-bold">
              <td>${t('Total', 'الإجمالي')}</td>
              <td class="text-right">${(order.total || order.totalAmount).toFixed(3)} OMR</td>
            </tr>
          </table>
          <div class="divider"></div>
          <div class="text-center" style="font-size: 10px;">
            ${t('Thank you for your visit!', 'شكراً لزيارتكم!')}<br>
            Powered by CafeQR
          </div>
        </body>
      </html>
    `;

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 500);
      }, 250);
    }
  };

  // Grouping orders for Kanban
  const kanbanColumns = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cols = {
      new: [] as any[],
      preparing: [] as any[],
      ready: [] as any[],
      completed: [] as any[] // only today's
    };

    if (orders) {
      orders.forEach(o => {
        const stat = o.status?.toLowerCase() || 'pending';
        const oDate = o.createdAt ? (typeof o.createdAt.toDate === 'function' ? o.createdAt.toDate() : new Date(o.createdAt)) : new Date();
        const isToday = oDate >= today;

        if (stat === 'pending' || stat === 'confirmed') cols.new.push(o);
        else if (stat === 'preparing') cols.preparing.push(o);
        else if (stat === 'ready') cols.ready.push(o);
        else if (stat === 'completed' && isToday) cols.completed.push(o);
      });
    }

    return cols;
  }, [orders]);

  const renderOrderCard = (order: any, colType: string) => {
    const typeInfo = getOrderTypeInfo(order);
    const isNew = order.status === 'pending' || !order.status;
    const isUpdating = updatingId === order.id;

    return (
      <Card id={`order-card-${order.id}`} key={order.id} className={`overflow-hidden transition-all shadow-sm ${isNew ? 'ring-2 ring-green-500 ring-offset-2 animate-in fade-in zoom-in-95 bg-green-50/50' : 'border'}`}>
        <CardContent className="p-0">
           {/* Card Header (Table / Type Info) */}
           <div className={`p-3 border-b flex justify-between items-center ${typeInfo.color}`}>
              <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wide">
                 <typeInfo.icon className="h-4 w-4" />
                 {typeInfo.label === t('Car', 'سيارة') ? `${t('Car', 'سيارة')}: ${order.carPlateNumber} (${t('Spot', 'موقف')} ${order.parkingSpot})` : typeInfo.label === t('Pickup', 'استلام') ? t('Takeaway', 'سفري') : `${t('Table', 'طاولة')} ${order.table || order.tableId}`}
              </div>
              <div className="text-xs font-bold opacity-80 flex items-center gap-1">
                 <Clock className="w-3 h-3" /> {getTimeAgo(order.createdAt)}
              </div>
           </div>

           {/* Order Items */}
           <div className="p-3 bg-card min-h-[80px]">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex justify-between">
                <span>#{order.orderNo || order.orderNumber || order.id.slice(-5).toUpperCase()}</span>
                <span className="text-primary">{(order.total || 0).toFixed(3)} OMR</span>
              </div>
              
              <div className="space-y-2">
                 {order.items?.map((item: any, idx: number) => (
                    <div key={idx} className="text-sm font-bold flex flex-col leading-tight">
                       <div className="flex gap-2">
                          <span className="text-primary">{item.quantity || item.qty}x</span>
                          <span>{item.nameEn || item.name}</span>
                       </div>
                       {item.notes && <span className="text-xs text-red-500 ml-6 italic">{t("Note", "ملاحظة")}: {item.notes}</span>}
                    </div>
                 ))}
                 {order.carNotes && (
                   <div className="text-xs text-amber-700 bg-amber-50 p-1.5 rounded mt-2 italic font-medium">
                     {t("Car Note", "ملاحظة السيارة")}: {order.carNotes}
                   </div>
                 )}
              </div>
           </div>

           {/* Card Actions */}
           <div className="p-2 border-t flex flex-wrap gap-2 bg-muted/20">
              <Button variant="ghost" className="px-3 border hover:bg-muted" onClick={() => printReceipt(order)}>
                 <Printer className="w-4 h-4 text-muted-foreground" />
              </Button>
              {colType === 'new' && (
                 <>
                   {isNew ? (
                     <Button 
                       className="flex-1 bg-primary font-bold text-primary-foreground shadow-sm" 
                       onClick={() => handleStatusChange(order, 'confirmed')} 
                       disabled={isUpdating}
                     >
                       <CheckCircle2 className="w-4 h-4 mr-1.5" /> {t("Accept", "قبول")}
                     </Button>
                   ) : (
                     <Button 
                       className="flex-1 bg-orange-500 hover:bg-orange-600 font-bold shadow-sm text-white" 
                       onClick={() => handleStatusChange(order, 'preparing')} 
                       disabled={isUpdating}
                     >
                       <Timer className="w-4 h-4 mr-1.5" /> {t("Prepare", "تجهيز")}
                     </Button>
                   )}
                   <Button variant="ghost" className="px-2 text-destructive hover:bg-destructive/10" onClick={() => handleStatusChange(order, 'cancelled')} disabled={isUpdating}>
                     <Ban className="w-4 h-4" />
                   </Button>
                 </>
              )}

              {colType === 'preparing' && (
                 <Button 
                   className="flex-1 bg-green-500 hover:bg-green-600 font-bold shadow-sm text-white" 
                   onClick={() => handleStatusChange(order, 'ready')} 
                   disabled={isUpdating}
                 >
                   <CheckCircle className="w-4 h-4 mr-1.5" /> {t("Mark Ready", "جاهز للتقديم")}
                 </Button>
              )}

              {colType === 'ready' && (
                 <Button 
                   className="flex-1 border-emerald-500 text-emerald-700 hover:bg-emerald-50 font-bold shadow-sm" 
                   variant="outline"
                   onClick={() => handleStatusChange(order, 'completed')} 
                   disabled={isUpdating}
                 >
                   <Check className="w-4 h-4 mr-1.5" /> {t("Complete", "إنهاء")}
                 </Button>
              )}

              {colType === 'completed' && (
                <div className="flex-1 text-center py-1.5 text-xs font-bold text-emerald-700 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> {t("Order Completed", "مكتمل")}
                </div>
              )}
           </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in mx-auto max-w-[1600px] h-screen flex flex-col pt-2 pb-6" dir={isArabic ? 'rtl' : 'ltr'}>
      
      <SectionHeader 
        title={t("Live Operations", "العمليات الحية")}
        description={t("Real-time kitchen display and operational workflow.", "شاشة العرض وتدفق العمل المباشر.")}
        actions={
          <div className="flex gap-2">
             <ManualOrderModal />
             <div className="px-4 py-2 bg-blue-50 text-blue-800 rounded-lg text-sm font-bold border border-blue-200 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
                LIVE SYNC
             </div>
          </div>
        }
      />

      {/* Kanban Board Layout */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 min-h-0 overflow-hidden">
         
         {/* Column: NEW */}
         <div className="flex flex-col h-full bg-muted/30 rounded-2xl border p-4 shadow-inner">
            <div className="mb-4 flex justify-between items-center px-1">
               <h3 className="font-black text-lg text-amber-600 flex items-center gap-2">
                  {t("New & Pending", "جديد ومعلق")}
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-none">{kanbanColumns.new.length}</Badge>
               </h3>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-10">
               {kanbanColumns.new.length === 0 && !isLoading && (
                 <div className="h-40 flex flex-col items-center justify-center text-muted-foreground/50 border-2 border-dashed border-muted-foreground/20 rounded-xl p-4 text-center">
                    <Receipt className="h-8 w-8 mb-2" />
                    <p className="font-bold text-sm">{t("No new orders", "لا يوجد طلبات جديدة")}</p>
                    <p className="text-xs">{t("Incoming orders will blink here automatically.", "ستظهر الطلبات الجديدة هنا تلقائياً.")}</p>
                 </div>
               )}
               {kanbanColumns.new.map(o => renderOrderCard(o, 'new'))}
            </div>
         </div>

         {/* Column: PREPARING */}
         <div className="flex flex-col h-full bg-muted/30 rounded-2xl border p-4 shadow-inner">
            <div className="mb-4 flex justify-between items-center px-1">
               <h3 className="font-black text-lg text-orange-600 flex items-center gap-2">
                  {t("Preparing", "قيد التجهيز")}
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-none">{kanbanColumns.preparing.length}</Badge>
               </h3>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-10">
               {kanbanColumns.preparing.length === 0 && !isLoading && (
                 <div className="h-40 flex flex-col items-center justify-center text-muted-foreground/50 border-2 border-dashed border-muted-foreground/20 rounded-xl p-4 text-center">
                    <Timer className="h-8 w-8 mb-2 opacity-50" />
                    <p className="font-bold text-sm">{t("Empty station", "المحطة فارغة")}</p>
                 </div>
               )}
               {kanbanColumns.preparing.map(o => renderOrderCard(o, 'preparing'))}
            </div>
         </div>

         {/* Column: READY */}
         <div className="flex flex-col h-full bg-muted/30 rounded-2xl border p-4 shadow-inner">
            <div className="mb-4 flex justify-between items-center px-1">
               <h3 className="font-black text-lg text-green-600 flex items-center gap-2">
                  {t("Ready to Serve", "جاهز للتقديم")}
                  <Badge variant="secondary" className="bg-green-100 text-green-800 border-none">{kanbanColumns.ready.length}</Badge>
               </h3>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-10">
               {kanbanColumns.ready.length === 0 && !isLoading && (
                 <div className="h-40 flex flex-col items-center justify-center text-muted-foreground/50 border-2 border-dashed border-muted-foreground/20 rounded-xl p-4 text-center">
                    <CheckCircle className="h-8 w-8 mb-2 opacity-50" />
                    <p className="font-bold text-sm">{t("No pending serves", "لا يوجد طلبات للتقديم")}</p>
                 </div>
               )}
               {kanbanColumns.ready.map(o => renderOrderCard(o, 'ready'))}
            </div>
         </div>

         {/* Column: COMPLETED (Today) */}
         <div className="flex flex-col h-full bg-muted/10 rounded-2xl border p-4 shadow-inner opacity-80">
            <div className="mb-4 flex justify-between items-center px-1">
               <h3 className="font-black text-lg text-emerald-800 flex items-center gap-2">
                  {t("Completed (Today)", "المكتملة (اليوم)")}
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-none">{kanbanColumns.completed.length}</Badge>
               </h3>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-10">
               {kanbanColumns.completed.length === 0 && !isLoading && (
                 <div className="h-40 flex flex-col items-center justify-center text-muted-foreground/50 border-2 border-dashed border-muted-foreground/20 rounded-xl p-4 text-center">
                    <CheckCircle2 className="h-8 w-8 mb-2 opacity-50" />
                    <p className="font-bold text-sm">{t("No completed orders yet", "لا توجد طلبات مكتملة")}</p>
                 </div>
               )}
               {kanbanColumns.completed.map(o => renderOrderCard(o, 'completed'))}
            </div>
         </div>

      </div>

    </div>
  );
}
