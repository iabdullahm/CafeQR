"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/dashboard/section-header";
import { QrCode, Download, Printer, ExternalLink, Link2, Search, Filter, Store, Utensils, Car, MousePointerClick, Activity } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DataTableReusable } from "@/components/tables/data-table-reusable";
import { useUser, useFirestore, useMemoFirebase, useDoc, useCollection } from "@/firebase";
import { collection, query, doc } from "firebase/firestore";

export default function QRManagement() {
  const { user } = useUser();
  const db = useFirestore();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // JWT migration: role + cafeId come from useUser() directly; no Firestore profile lookup.
  const userProfileRef = useMemoFirebase(() => null, []);
  const { data: userProfile } = useDoc(userProfileRef);
  const cafeId = userProfile?.cafeId;

  const configRef = useMemoFirebase(() => db && cafeId ? doc(db, 'cafes', cafeId, 'config', 'settings') : null, [db, cafeId]);
  const { data: configDoc } = useDoc(configRef);
  const isArabic = configDoc?.language === 'ar';
  const t = (en: string, ar: string) => isArabic ? ar : en;

  const [tables, setTables] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const refetchTables = async () => {
    if (!cafeId) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    try {
      const res = await fetch(`/api/cafes/${cafeId}/tables`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: 'no-store',
      });
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) setTables(json.data);
    } catch { /* ignore */ }
    finally { setIsLoading(false); }
  };
  useEffect(() => {
    void refetchTables();
    const iv = setInterval(refetchTables, 15000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cafeId])

  const qrData = useMemo(() => {
    if (!tables) return [];
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');

    // General Menu QR
    const generalQr = {
      id: "general",
      name: t("General Menu / Takeaway", "القائمة العامة / سفري"),
      description: t("Menu only (no table). Used for takeaway, browsing, or pre-ordering.", "القائمة فقط (بدون طاولة). للطلبات الخارجية وتصفح المنيو."),
      type: "GENERAL",
      branch: t("All Branches", "كل الفروع"),
      scans: 120, // Mock stats
      orders: 45,
      conversion: "37%",
      lastScanned: t("2 hours ago", "منذ ساعتين"),
      status: "Active",
      link: cafeId ? `${baseUrl}/c/${cafeId}/default/takeaway` : "#"
    };

    const tableQrs = tables.map((tItem: any) => {
      // Logic for status based on activity
      let status = tItem.isActive ? "Active" : "Disabled";
      if (tItem.isActive && !tItem.lastOrderAt) status = "No activity";
      
      const type = tItem.type?.toUpperCase() || "DINE_IN";
      const scans = Math.floor(Math.random() * 50);
      const orders = Math.floor(scans * (Math.random() * 0.8));
      const conversion = scans > 0 ? `${Math.round((orders / scans) * 100)}%` : "0%";

      return {
        id: tItem.id,
        name: tItem.name,
        description: type === "DINE_IN" ? t("Linked to table. Orders will be assigned to this table.", "مرتبط بالطاولة. الطلب سيسجل باسم هذه الطاولة.") : t("Customer enters car details before ordering.", "يُدخل الزبون بيانات سيارته قبل الطلب."),
        type: type,
        branch: tItem.branchName || t("Main Branch", "الفرع الرئيسي"),
        scans: scans,
        orders: orders,
        conversion: conversion,
        lastScanned: scans > 0 ? t("Today", "اليوم") : t("Never", "أبداً"),
        status: status,
        link: tItem.qrToken ? `${baseUrl}/t/${tItem.qrToken}` : (cafeId ? `${baseUrl}/c/${cafeId}/${tItem.branchId || 'default'}/${tItem.id}` : "#")
      };
    });

    return [generalQr, ...tableQrs];
  }, [tables, cafeId]);

  const handlePrint = (link: string, name: string) => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(link)}`;
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head><title>Print QR</title></head>
          <body style="text-align:center; margin-top:10%; font-family: sans-serif;">
            <p style="font-size: 24px; font-weight: bold; margin-bottom: 20px;">Scan to Order</p>
            <img src="${qrUrl}" width="300" height="300" style="margin-bottom: 20px;" />
            <p style="font-size: 32px; font-weight: bold; margin-bottom: 5px;">${name}</p>
            <p style="font-size: 16px; color: #555;">Point your camera at the QR code to view the menu</p>
            <script>
              window.onload = function() { window.print(); window.setTimeout(window.close, 500); }
            </script>
          </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  const handleCopy = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const columns = [
    {
      key: "name",
      label: t("QR Name & Purpose", "اسم و غرض الQR"),
      render: (row: any) => (
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-1">
            <QrCode className="h-5 w-5" />
          </div>
          <div className="max-w-[250px]">
            <p className="font-bold text-foreground text-sm flex items-center gap-2">
              {row.name}
              {row.type === 'GENERAL' && <Store className="h-3 w-3 text-blue-500" />}
              {row.type === 'DINE_IN' && <Utensils className="h-3 w-3 text-emerald-500" />}
              {row.type === 'CAR' && <Car className="h-3 w-3 text-purple-500" />}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{row.description}</p>
            <p className="text-[10px] uppercase font-bold text-primary mt-1">{row.branch}</p>
          </div>
        </div>
      )
    },
    {
      key: "performance",
      label: t("Scan Analytics (Funnel)", "إحصائيات المسح"),
      render: (row: any) => (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5 w-16">
               <MousePointerClick className="h-3.5 w-3.5 text-muted-foreground" />
               <span className="font-bold">{row.scans}</span>
            </div>
            <span className="text-muted-foreground text-xs">→</span >
            <div className="flex items-center gap-1.5 w-16">
               <Activity className="h-3.5 w-3.5 text-emerald-500" />
               <span className="font-bold">{row.orders}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <Badge variant="outline" className="text-[10px] bg-muted/30">CVR: {row.conversion}</Badge>
             <span className="text-[10px] text-muted-foreground">Last: {row.lastScanned}</span>
          </div>
        </div>
      )
    },
    {
      key: "status",
      label: t("QR Status", "حالة الQR"),
      render: (row: any) => {
        let badgeColor = "bg-muted text-muted-foreground";
        let statusAr = t("Unknown", "غير معروف");
        
        if (row.status === "Active") { badgeColor = "bg-green-100 text-green-800 border-green-200"; statusAr = t("Active", "نشط"); }
        if (row.status === "Disabled") { badgeColor = "bg-red-100 text-red-800 border-red-200"; statusAr = t("Disabled", "معطل"); }
        if (row.status === "No activity") { badgeColor = "bg-amber-100 text-amber-800 border-amber-200"; statusAr = t("No activity", "لا يوجد نشاط"); }
        if (row.status === "Broken") { badgeColor = "bg-red-500 text-white"; statusAr = t("Broken", "تالف"); }

        return (
          <Badge variant="outline" className={badgeColor}>
            {statusAr}
          </Badge>
        );
      }
    },
    {
      key: "actions",
      label: t("Developer & Preview", "خيارات العرض والمطور"),
      className: "text-right",
      render: (row: any) => (
        <div className="flex flex-col sm:flex-row items-end justify-end gap-2">
          {/* Debug Button - Open QR Link directly to see the customer view */}
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
            onClick={() => window.open(row.link, '_blank')}
            title={t("Open Customer Experience in new tab", "افتح تجربة العميل في نافذة جديدة")}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">{t("Preview Experience", "عرض التجربة")}</span>
          </Button>
          
          <div className="flex items-center gap-2">
             <Button 
               variant="ghost" 
               size="icon" 
               className="h-8 w-8" 
               onClick={() => handleCopy(row.link, row.id)} 
               title={t("Copy Dynamic Link", "نسخ الرابط")}
             >
               <Link2 className={`h-4 w-4 ${copiedId === row.id ? 'text-green-500' : ''}`} />
             </Button>
             <Button 
               variant="default" 
               size="sm" 
               className="h-8 gap-2" 
               onClick={() => handlePrint(row.link, row.name)} 
               title={t("Print QR Code Sticker", "طباعة الملصق")}
             >
               <Printer className="h-3.5 w-3.5" /> {t("View QR", "عرض QR")}
             </Button>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <SectionHeader 
        title="QR Codes Command Center" 
        description="Monitor scan conversions, manage dynamic tokens, and print unified table stickers."
        actions={
          <div className="flex gap-2">
             <Button variant="outline" className="gap-2"><Download className="h-4 w-4" /> Download All QR (ZIP)</Button>
             <Button className="bg-primary gap-2"><Printer className="h-4 w-4" /> Bulk Print Labels</Button>
          </div>
        }
      />

      {typeof window !== 'undefined' && window.location.hostname === 'localhost' && !process.env.NEXT_PUBLIC_APP_URL && (
        <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-200 flex items-start gap-3">
          <div className="mt-0.5">⚠️</div>
          <div>
            <p className="font-bold">{t("Local Debug Mode", "وضع التطوير المحلي")}</p>
            <p className="text-sm mt-1">
              {t("QR codes generated automatically use your localhost address. To test the real scanning experience on a mobile phone, open the Customer Preview link on your phone using your computer's local IP (e.g., ", "الروابط تم إنشاؤها عبر localhost. لتجربة مسح الملف عبر هاتفك، افتح رابط عرض العميل باستخدام عنوان الـ IP الداخلي لحاسوبك (مثال: ")} <strong>http://192.168.X.X:9002</strong>).
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="border-none shadow-sm bg-card lg:col-span-9">
          <CardHeader className="bg-muted/10 border-b">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>{t("Dynamic QRs & Links", "رموز وروابط الـ QR الديناميكية")}</CardTitle>
                <CardDescription>{t("Links are permanent. If a table moves, you modify the table settings, not the QR sticker.", "الروابط دائمة، في حال نقلت الطاولة، فقط غير الإعدادات وليس الملصق.")}</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative w-48">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder={t("Search table or branch...", "بحث... ")} className="ps-8 h-9 text-xs bg-white" />
                </div>
                <Button variant="outline" size="sm" className="h-9 bg-white"><Filter className="h-3.5 w-3.5 mr-2" /> {t("Filters", "تصفية")}</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
             <DataTableReusable columns={columns} data={qrData} isLoading={isLoading} />
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-6">
           <Card className="border-none shadow-sm bg-primary text-primary-foreground">
              <CardHeader>
                <CardTitle className="text-xl">{t("Print Kit Specs", "مواصفات الطباعة")}</CardTitle>
                <CardDescription className="text-primary-foreground/70">{t("Ensure customers scan smoothly.", "تأكد من تجربة مسح ضوئي سلسة")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="p-3 rounded-xl bg-white/10 border border-white/20">
                    <p className="text-sm font-bold flex items-center gap-2"><Printer className="h-3.5 w-3.5"/> {t("Sticker Sizes", "حجم الملصقات")}</p>
                    <ul className="text-xs opacity-90 mt-2 space-y-1.5 list-disc list-inside">
                       <li>{t("5x5 cm (Recommended standard)", "5x5 سم (موصى به)")}</li>
                       <li>{t("8x8 cm (Drive-in / Car ordering)", "8x8 سم (للطلبات من السيارة)")}</li>
                       <li>{t("3x3 cm (Small coffee tables)", "3x3 سم (لطاولات القهوة الصغيرة)")}</li>
                    </ul>
                 </div>
                 <div className="p-3 rounded-xl bg-white/10 border border-white/20">
                    <p className="text-sm font-bold flex items-center gap-2"><QrCode className="h-3.5 w-3.5" /> {t("Essential Labels", "الملصقات الضرورية")}</p>
                    <p className="text-xs opacity-90 mt-2 leading-relaxed">
                       {t("Always include:", "دائما اضف:")} <strong>&quot;{t("Scan to Order", "أمسح للطلب")}&quot;</strong><br />
                       {t("Table QRs must definitively print the table name (e.g. ", "ملصقات الطاولات يجب أن تحتوي بشكل واضح على اسمها (مثال: ")} <strong>{t("Table 5", "طاولة 5")}</strong>).
                    </p>
                 </div>
              </CardContent>
           </Card>

           <Card className="border-none shadow-sm bg-card">
              <CardHeader>
                 <CardTitle className="text-lg">{t("Scan Conversion", "عمليات التحويل للمسح")}</CardTitle>
                 <CardDescription>{t("Overall QR efficiency", "كفاءة الممسوحات الاجمالية")}</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="space-y-4">
                    <div className="flex justify-between items-end border-b pb-2">
                       <span className="text-sm font-medium text-muted-foreground">{t("Total Scans", "اجمالي المسح")}</span>
                       <span className="text-xl font-black">
                          {qrData.reduce((acc, curr) => acc + curr.scans, 0)}
                       </span>
                    </div>
                    <div className="flex justify-between items-end border-b pb-2">
                       <span className="text-sm font-medium text-muted-foreground">{t("Orders Generated", "الطلبات الواردة")}</span>
                       <span className="text-xl font-black text-emerald-600">
                          {qrData.reduce((acc, curr) => acc + curr.orders, 0)}
                       </span>
                    </div>
                    <div className="flex justify-between items-end">
                       <span className="text-sm font-medium text-muted-foreground">{t("Avg Conversion", "تحويل تقريبي")}</span>
                       <span className="text-xl font-black text-primary">
                          {qrData.length > 0 && qrData.reduce((acc, curr) => acc + curr.scans, 0) > 0 
                             ? `${Math.round((qrData.reduce((acc, curr) => acc + curr.orders, 0) / qrData.reduce((acc, curr) => acc + curr.scans, 0)) * 100)}%` 
                             : '0%'}
                       </span>
                    </div>
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}

