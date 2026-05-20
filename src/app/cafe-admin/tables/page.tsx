"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/dashboard/section-header";
import { Plus, Search, Filter, QrCode, Utensils, Car, MoreVertical, Edit, Trash2, ArrowUpRight, ReceiptText, Clock, PowerOff, Download, ScanLine } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { useUser, useFirestore, useMemoFirebase, useCollection, useDoc } from "@/firebase";
import { collection, query, doc, setDoc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useCafe } from "@/hooks/use-cafe";
import { QRCodeCanvas } from "qrcode.react";

export default function TablesManagement() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [qrTable, setQrTable] = useState<any>(null);
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [newTableData, setNewTableData] = useState({ name: "", type: "DINE_IN", branchId: "" });
  
  const { cafeId } = useCafe();
  const configRef = useMemoFirebase(() => db && cafeId ? doc(db, 'cafes', cafeId, 'config', 'settings') : null, [db, cafeId]);
  const { data: configDoc } = useDoc(configRef);
  const isArabic = configDoc?.language === 'ar';
  const t = (en: string, ar: string) => isArabic ? ar : en;

  const tablesQuery = useMemoFirebase(() => {
    if (!db || !cafeId) return null;
    return query(collection(db, 'cafes', cafeId, 'tables'));
  }, [db, cafeId]);
  const { data: tables, isLoading } = useCollection(tablesQuery);

  const branchesQuery = useMemoFirebase(() => {
    if (!db || !cafeId) return null;
    return query(collection(db, 'cafes', cafeId, 'branches'));
  }, [db, cafeId]);
  const { data: branches } = useCollection(branchesQuery);

  const confirmAddTable = async () => {
    if (!db || !cafeId) return;
    if (!newTableData.name || !newTableData.branchId) {
       toast({ title: t("Validation Error", "خطأ في التحقق"), description: t("Name and Branch are required.", "تحديد الاسم والفرع مطلوب."), variant: "destructive" });
       return;
    }
    
    const selectedBranch = branches?.find((b: any) => b.id === newTableData.branchId);
    if (!selectedBranch) return;

    const tableId = `T-${Date.now()}`;
    const tableRef = doc(db, 'cafes', cafeId, 'tables', tableId);
    const token = Math.random().toString(36).substring(2, 8) + Date.now().toString(36);

    await setDoc(tableRef, {
      number: Date.now(), // Fallback unique number
      name: newTableData.name,
      type: newTableData.type,
      status: "AVAILABLE",
      branchId: selectedBranch.id,
      branchName: selectedBranch.name,
      cafeId,
      isActive: true,
      qrToken: token,
      createdAt: new Date().toISOString()
    });

    const tokenRef = doc(db, 'qr_tokens', token);
    await setDoc(tokenRef, {
      cafeId,
      branchId: selectedBranch.id,
      tableId,
      createdAt: new Date().toISOString()
    });

    toast({ title: t("Unit Added", "تم إضافة الوحدة"), description: `${newTableData.name} ` + t(`is now active at ${selectedBranch.name}.`, `مُفعّلة الآن في ${selectedBranch.name}.`) });
    setIsAddTableOpen(false);
    setNewTableData({ name: "", type: "DINE_IN", branchId: selectedBranch.id });
  };

  const handleGenerateLegacyToken = async (table: any) => {
    if (!db || !cafeId) return;
    const token = Math.random().toString(36).substring(2, 8) + Date.now().toString(36);
    
    const tableRef = doc(db, 'cafes', cafeId, 'tables', table.id);
    await setDoc(tableRef, { qrToken: token }, { merge: true });

    const tokenRef = doc(db, 'qr_tokens', token);
    await setDoc(tokenRef, {
      cafeId,
      branchId: table.branchId || 'default',
      tableId: table.id,
      createdAt: new Date().toISOString()
    });

    toast({ title: t("Token Generated", "تم إنشاء رمز جديد"), description: t("Successfully upgraded table QR token.", "تم تحديث رمز الطاولة بنجاح.") });
    setQrTable({ ...table, qrToken: token });
  };

  const getTableMetrics = (table: any) => {
     const isCar = table.type === 'CAR_SERVICE';
     
     if (table.status === 'OUT_OF_SERVICE') {
        return { state: t('Out of Service', 'خارج الخدمة'), stateColor: 'text-slate-500 bg-slate-100 border-slate-200', dot: 'bg-slate-400', orders: 0, lastOrder: 'N/A', carNum: null };
     }
     
     if (table.status === 'ORDERING') {
        return { state: t('Ordering', 'يطلب الآن'), stateColor: 'text-blue-700 bg-blue-50 border-blue-200', dot: 'bg-blue-500 animate-pulse', orders: table.activeOrdersCount || 0, lastOrder: t('Active', 'نشط'), carNum: isCar ? (table.carNumber || t('Waiting...', 'في الانتظار...')) : null };
     } else if (table.status === 'OCCUPIED') {
        return { state: t('Occupied', 'مشغول'), stateColor: 'text-orange-700 bg-orange-50 border-orange-200', dot: 'bg-orange-500', orders: table.activeOrdersCount || 0, lastOrder: t('Active', 'نشط'), carNum: isCar ? (table.carNumber || t('Parked', 'بالانتظار')) : null };
     } else if (table.status === 'NEEDS_PAYMENT') {
        return { state: t('Waiting Payment', 'بانتظار الدفع'), text: t('Waiting Payment', 'بانتظار الدفع'), stateColor: 'text-purple-700 bg-purple-50 border-purple-200', dot: 'bg-purple-500', orders: 0, lastOrder: '-', carNum: isCar ? table.carNumber : null };
     } else if (table.status === 'READY') {
        return { state: t('Order Ready', 'الطلب جاهز'), stateColor: 'text-green-700 bg-green-50 border-green-200', dot: 'bg-green-500 animate-pulse', orders: table.activeOrdersCount || 0, lastOrder: t('Just Now', 'الآن'), carNum: isCar ? table.carNumber : null };
     }
     
     return { state: t('Available', 'متاح'), stateColor: 'text-emerald-700 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', orders: 0, lastOrder: '-', carNum: null };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-10" dir={isArabic ? 'rtl' : 'ltr'}>
      <SectionHeader 
        title={t("Live Units Management", "إدارة الوحدات المباشرة")} 
        description={t("Monitor dine-in tables and car service spots in real time, and manage their static QR codes.", "مراقبة وإدارة طاولات المقهى ومواقف السيارات، وإدارة الـ QR التابع لهم.")}
        actions={
          <Button className="bg-primary gap-2 font-bold shadow-md" onClick={() => setIsAddTableOpen(true)}>
            <Plus className="h-4 w-4" /> {t("Add Unit", "وحدة جديدة")}
          </Button>
        }
      />

      {typeof window !== 'undefined' && window.location.hostname === 'localhost' && !process.env.NEXT_PUBLIC_APP_URL && (
        <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-200 flex items-start gap-3">
          <div className="mt-0.5">⚠️</div>
          <div>
            <p className="font-bold">{t("Localhost Detected", "تم اكتشاف مسار محلي لك")}</p>
            <p className="text-sm mt-1 leading-relaxed">
              {t("QR codes generated on ", "لا تعمل الروابط المحلية على الاجهزة المختلفة، قم باستخدام الـ IP لتجربة حية. ")}<strong>localhost</strong> {t("will not work on mobile devices. To scan and test codes, open this dashboard using your computer's local IP address (e.g., ", " ")}<strong>http://192.168.X.X:9002</strong>).
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("Search units by name or branch...", "البحث عن طريق الاسم أو الفرع...")} className="ps-10 h-11 bg-card rounded-xl shadow-sm border-slate-200" />
        </div>
        <div className="flex gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px] h-11 bg-card rounded-xl shadow-sm border-slate-200">
              <SelectValue placeholder={t("All Branches", "كل الفروع")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("All Branches", "كل الفروع")}</SelectItem>
              {branches?.map((b: any) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2 h-11 rounded-xl shadow-sm bg-card"><Filter className="h-4 w-4" /> {t("Filters", "تصفية")}</Button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          [1,2,3,4,5,6].map(i => <div key={i} className="h-64 rounded-3xl bg-muted/60 animate-pulse" />)
        ) : (
          tables?.map((table: any) => {
            const metrics = getTableMetrics(table);
            const isCar = table.type === 'CAR_SERVICE';

            return (
              <Card key={table.id} className="border-none shadow-sm overflow-hidden group bg-card transition-shadow hover:shadow-md">
                <CardHeader className="pb-2 relative pt-5">
                  <div className="absolute top-4 right-4 z-10 flex gap-2 items-center">
                     <div className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold tracking-wide uppercase flex items-center gap-1.5 ${metrics.stateColor}`}>
                         <span className={`h-1.5 w-1.5 rounded-full ${metrics.dot}`}></span>
                         {metrics.state}
                     </div>
                     
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 font-medium">
                          <DropdownMenuLabel>{t("Unit Settings", "إعدادات الوحدة")}</DropdownMenuLabel>
                          <DropdownMenuItem className="gap-2 focus:bg-muted"><Edit className="h-4 w-4 text-muted-foreground" /> {t("Edit Unit", "تعديل الوحدة")}</DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 focus:bg-muted" onClick={() => setQrTable(table)}><QrCode className="h-4 w-4 text-muted-foreground" /> {t("View QR Code", "عرض الـ QR")}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 focus:bg-muted"><PowerOff className="h-4 w-4 text-muted-foreground" /> {t("Mark Out of Service", "تعيين كخارج الخدمة")}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive gap-2 focus:bg-destructive/10 focus:text-destructive"
                            onClick={() => deleteDoc(doc(db!, 'cafes', cafeId!, 'tables', table.id))}
                          >
                            <Trash2 className="h-4 w-4" /> {t("Delete Unit", "حذف الوحدة")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                     </DropdownMenu>
                  </div>
                  
                  <div className="flex gap-4">
                     <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${isCar ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400' : 'bg-primary/10 text-primary'}`}>
                         {isCar ? <Car className="h-6 w-6"/> : <Utensils className="h-6 w-6" />}
                     </div>
                     <div className="pt-1">
                        <CardTitle className="text-xl font-black">{table.name}</CardTitle>
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1 flex items-center gap-1">
                           {isCar ? t('Car Service', 'خدمة السيارات') : t('Dine In', 'طاولة داخلية')} <span className="opacity-50">•</span> {table.branchName || t('Unknown', 'غير معروف')}
                        </div>
                     </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-4 pb-4">
                  {isCar && metrics.carNum && (
                     <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-2.5 mb-4 text-center border-b-4 border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-300">
                        <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest mb-0.5">{t("Current Car Number", "رقم اللوحة الحالي")}</p>
                        <p className="font-mono text-xl text-slate-800 dark:text-slate-100 font-black tracking-widest">{metrics.carNum}</p>
                     </div>
                  )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50/50 dark:bg-slate-900/50 border rounded-xl p-3 flex flex-col justify-center">
                         <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                           <ReceiptText className="h-3.5 w-3.5" /> {t("Live Orders", "طلبات حية")}
                         </span>
                         <span className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-none">{metrics.orders}</span>
                      </div>
                      <div className="bg-slate-50/50 dark:bg-slate-900/50 border rounded-xl p-3 flex flex-col justify-center">
                         <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                           <Clock className="h-3.5 w-3.5" /> {t("Last Order", "آخر طلب")}
                         </span>
                         <span className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight mt-1">{metrics.lastOrder}</span>
                      </div>
                   </div>
                </CardContent>

                <CardFooter className="pt-3 pb-3 border-t bg-slate-50/50 dark:bg-slate-900/50 flex gap-2">
                   <Button className="flex-1 gap-2 font-bold rounded-xl h-10 shadow-sm transition-transform hover:scale-[1.02]" onClick={() => window.location.href = `/cafe-admin/orders?table=${table.id}`}>
                      <ArrowUpRight className="h-4 w-4" /> {t("Open Live Orders", "فتح الطلبات المباشرة")}
                   </Button>
                   <Button variant="outline" className="px-3 rounded-xl h-10 shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold" onClick={() => setQrTable(table)}>
                      <ScanLine className="h-4 w-4" />
                   </Button>
                </CardFooter>
              </Card>
            )
          })
        )}
        
        {!isLoading && (
          <button 
            onClick={() => setIsAddTableOpen(true)}
            className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/50 flex flex-col items-center justify-center p-8 text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-primary/40 hover:text-primary transition-all group min-h-[250px]"
          >
             <div className="h-14 w-14 rounded-full bg-white dark:bg-slate-800 shadow-sm border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Plus className="h-6 w-6" />
             </div>
             <span className="font-bold text-lg text-slate-800 dark:text-slate-100 group-hover:text-primary">{t("Add New Unit", "إضافة وحدة جديدة")}</span>
             <p className="text-xs mt-2 text-center max-w-[200px] leading-relaxed opacity-80">
               {t("Register a new Dine-in table or Car Spot to start taking orders.", "قم بتسجيل طاولة جديدة أو موقع سيارة للبدء في تلقي الطلبات.")}
             </p>
          </button>
        )}
      </div>

      <Dialog open={isAddTableOpen} onOpenChange={setIsAddTableOpen}>
        <DialogContent className="sm:max-w-md border-none shadow-2xl rounded-[2rem] overflow-hidden p-0">
          <div className="p-6 border-b bg-muted/10">
            <DialogHeader>
              <DialogTitle className="text-xl font-black">{t("Add New Unit", "إضافة وحدة جديدة")}</DialogTitle>
              <DialogDescription>{t("Register a new table or car spot for QR ordering.", "قم بتسجيل طاولة جديدة أو موقف سيارة للطلب عبر QR.")}</DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6 space-y-5">
            <div className="space-y-2">
               <Label className="font-bold">{t("Unit Identifier", "معرف الوحدة")}</Label>
               <Input 
                 placeholder={t("e.g. Table 5, Spot A, VIP Room", "مثال: طاولة 5، موقف ب، الغرفة الخاصة")} 
                 value={newTableData.name} 
                 onChange={e => setNewTableData(prev => ({...prev, name: e.target.value}))}
                 className="bg-muted/30 h-12 text-lg font-medium"
               />
            </div>
            
            <div className="space-y-2">
               <Label className="font-bold">{t("Unit Type", "نوع الوحدة")}</Label>
               <Select value={newTableData.type} onValueChange={v => setNewTableData(prev => ({...prev, type: v}))}>
                 <SelectTrigger className="bg-muted/30 h-12">
                   <SelectValue placeholder={t("Select type", "اختر النوع")} />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="DINE_IN"><div className="flex items-center gap-2 font-medium"><Utensils className="h-4 w-4 text-primary"/> {t("Dine In Table", "طاولة داخلية")}</div></SelectItem>
                   <SelectItem value="CAR_SERVICE"><div className="flex items-center gap-2 font-medium"><Car className="h-4 w-4 text-orange-600"/> {t("Car Service Spot", "طلب من السيارة")}</div></SelectItem>
                 </SelectContent>
               </Select>
            </div>

            <div className="space-y-2">
               <Label className="font-bold">{t("Branch", "الفرع")}</Label>
               <Select value={newTableData.branchId} onValueChange={v => setNewTableData(prev => ({...prev, branchId: v}))}>
                 <SelectTrigger className="bg-muted/30 h-12">
                   <SelectValue placeholder={t("Select branch", "اختر الفرع")} />
                 </SelectTrigger>
                 <SelectContent>
                   {branches?.map((b: any) => (
                     <SelectItem key={b.id} value={b.id} className="font-medium">{b.name}</SelectItem>
                   ))}
                   {!branches?.length && <SelectItem value="disabled" disabled>{t("Loading branches...", "جاري تحميل الفروع...")}</SelectItem>}
                 </SelectContent>
               </Select>
            </div>
          </div>
          <div className="p-6 pt-4 border-t bg-muted/5 flex gap-3">
            <Button variant="outline" className="flex-1 font-bold rounded-xl h-11" onClick={() => setIsAddTableOpen(false)}>{t("Cancel", "إلغاء")}</Button>
            <Button className="flex-1 font-bold rounded-xl h-11 shadow-sm" onClick={confirmAddTable}>{t("Create Unit", "إنشاء الوحدة")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!qrTable} onOpenChange={(open) => !open && setQrTable(null)}>
        <DialogContent className="sm:max-w-md border-none shadow-2xl rounded-[2rem] overflow-hidden p-0">
          <div className="bg-slate-900 text-white p-6 pb-5 text-center">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-center text-white">{t("Fixed QR Code", "رمز الاستجابة السريعة (QR) دائم")}</DialogTitle>
              <DialogDescription className="font-medium text-slate-300 text-center">
                {t("This QR code is permanently assigned to ", "هذا الرمز مخصص بشكل دائم لـ ")}{qrTable?.name}. 
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex flex-col items-center justify-center p-8 bg-card">
              <div className="p-4 bg-white rounded-3xl shadow-xl border border-slate-100 mb-6 relative flex items-center justify-center">
               {qrTable && cafeId && qrTable.qrToken ? (
                 <QRCodeCanvas
                   id="qr-code-canvas"
                   value={`${process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/t/${qrTable.qrToken}`}
                   size={220}
                   level="H"
                   includeMargin={false}
                   imageSettings={configDoc?.logo ? {
                     src: configDoc.logo,
                     height: 60,
                     width: 60,
                     excavate: true,
                   } : undefined}
                   className="block mx-auto"
                 />
               ) : (
                 <div className="w-[220px] h-[220px] flex flex-col gap-4 items-center justify-center text-center text-muted-foreground p-4 bg-slate-50 rounded-2xl">
                   <p className="text-sm font-bold">{t("Legacy Table Detected", "تم اكتشاف طاولة قديمة")}</p>
                   <Button onClick={() => handleGenerateLegacyToken(qrTable)} size="sm" className="font-bold rounded-xl shadow-sm">
                     {t("Generate Secure QR", "إنشاء رمز QR آمن")}
                   </Button>
                 </div>
               )}
             </div>
             
             <Badge variant="outline" className={`mb-3 uppercase tracking-widest text-[10px] font-bold ${qrTable?.type === 'CAR_SERVICE' ? 'border-orange-200 text-orange-600 bg-orange-50' : 'border-primary/20 text-primary bg-primary/5'}`}>
               {qrTable?.type === 'CAR_SERVICE' ? t('Car Service Mode', 'وضع استلام من السيارة') : t('Dine In Mode', 'وضع طلب داخلي')}
             </Badge>
             <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{qrTable?.name}</p>
             <p className="text-sm font-medium text-muted-foreground mt-2 px-6 text-center leading-relaxed">
               {t("Print this QR and place it so customers can scan it to open the menu and place live orders.", "اطبع هذا الـ QR، وضعه في مكان يمكن للعملاء مسحه لفتح القائمة، وتقديم الطلب.")}
             </p>
          </div>
          <div className="p-5 bg-muted/20 border-t flex gap-3">
             <Button variant="outline" className="flex-1 font-bold rounded-xl h-12 shadow-sm bg-white hover:bg-slate-50" onClick={() => {
                const canvas = document.getElementById("qr-code-canvas") as HTMLCanvasElement;
                if (canvas) {
                  const url = canvas.toDataURL("image/png");
                  const a = document.createElement('a');
                  a.style.display = 'none';
                  a.href = url;
                  a.download = `${qrTable?.name}-QRCode.png`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }
             }}>
                <Download className="h-4 w-4 mr-2" /> {t("Download image", "تنزيل الصورة")}
             </Button>
             <Button className="flex-1 gap-2 font-bold rounded-xl h-12 shadow-md" onClick={() => window.print()}>
               <QrCode className="h-4 w-4" /> {t("Print Marker", "طباعة الرمز")}
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
