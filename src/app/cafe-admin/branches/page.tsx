"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/dashboard/section-header";
import { MapPin, Plus, MoreVertical, Edit, Trash2, LayoutGrid, ToggleLeft, ArrowUpRight, ReceiptText, Signal, Info, Activity } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser, useFirestore, useMemoFirebase, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useCafe } from "@/hooks/use-cafe";

export default function BranchesManagement() {
  const db = useFirestore();
  const { toast } = useToast();
  
  const { cafeId } = useCafe();
  const configRef = useMemoFirebase(() => db && cafeId ? doc(db, 'cafes', cafeId, 'config', 'settings') : null, [db, cafeId]);
  const { data: configDoc } = useDoc(configRef);
  const isArabic = configDoc?.language === 'ar';
  const t = (en: string, ar: string) => isArabic ? ar : en;

  const [branches, setBranches] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const refetchBranches = async () => {
    if (!cafeId) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    try {
      const res = await fetch(`/api/cafes/${cafeId}/branches`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: 'no-store',
      });
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) setBranches(json.data);
    } catch { /* ignore */ }
    finally { setIsLoading(false); }
  };
  useEffect(() => {
    void refetchBranches();
    const iv = setInterval(refetchBranches, 15000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cafeId])

  const handleAddBranch = async () => {
    if (!cafeId) return;
    const name = prompt(t("Enter Branch Name:", "أدخل اسم الفرع:"));
    if (!name) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const res = await fetch(`/api/cafes/${cafeId}/branches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ name, city: 'Muscat', address: 'Sultan Qaboos St' }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      toast({ title: 'Failed', description: json.message || `HTTP ${res.status}`, variant: 'destructive' });
      return;
    }
    toast({ title: t("Branch Added", "تم إضافة الفرع"), description: t(`${name} location has been registered.`, `تم تسجيل موقع ${name}.`) });
    void refetchBranches();
  };

  const getBranchMetrics = (branch: any) => {
     if (branch.status === 'CLOSED') {
        return { status: t('Closed', 'مغلق'), color: 'bg-slate-50 text-slate-600 border-slate-200', dot: 'bg-slate-400', orders: branch.totalOrders || 0, revenue: branch.totalRevenue || 0, health: 100 };
     }
     return { status: t('Active', 'نشط'), color: 'bg-emerald-50 text-emerald-600 border-emerald-100', dot: 'bg-emerald-500', orders: branch.totalOrders || 0, revenue: branch.totalRevenue || 0, health: 100 };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-10" dir={isArabic ? 'rtl' : 'ltr'}>
      <SectionHeader 
        title={t("Branch Management", "إدارة الفروع")} 
        description={t("Manage your cafe locations and monitor live regional performance. Each branch has its own tables, QR codes, and designated live orders.", "قم بإدارة فروع المقهى وراقب الأداء الحي لكل فرع. كل فرع له طاولاته وأكواد الاستجابة السريعة الخاصة به.")}
        actions={<Button className="bg-primary gap-2 font-bold shadow-sm" onClick={handleAddBranch}><Plus className="h-4 w-4" /> {t("Add Branch", "إضافة فرع")}</Button>}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          [1,2,3].map(i => <div key={i} className="h-64 rounded-3xl bg-muted animate-pulse" />)
        ) : (
          branches?.map((branch) => {
            const metrics = getBranchMetrics(branch);
            const hasOrders = metrics.orders > 0;
            const borderColor = metrics.dot.includes('bg-red') ? '#ef4444' : metrics.dot.includes('bg-amber') ? '#f59e0b' : metrics.dot.includes('bg-emerald') ? '#10b981' : '#cbd5e1';

            return (
              <Card key={branch.id} className="border-none shadow-sm flex flex-col group overflow-hidden bg-card border-t-4 hover:shadow-md transition-all pt-1" style={{ borderTopColor: borderColor }}>
                <CardHeader className="pb-3 relative space-y-0">
                  <div className="absolute top-4 right-4 z-10 flex gap-2 items-center">
                    <div className={`px-2 py-0.5 rounded-full border text-[10px] font-bold tracking-wide uppercase flex items-center gap-1.5 ${metrics.color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${metrics.dot}`}></span>
                        {metrics.status}
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 font-medium">
                        <DropdownMenuLabel>{t("Branch Actions", "إجراءات الفرع")}</DropdownMenuLabel>
                        <DropdownMenuItem className="gap-2 focus:bg-muted"><Edit className="h-4 w-4 text-muted-foreground" /> {t("Edit Branch Details", "تعديل بيانات الفرع")}</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 focus:bg-muted" onClick={() => window.location.href = '/cafe-admin/tables'}><LayoutGrid className="h-4 w-4 text-muted-foreground" /> {t("Assign Tables & QR", "تعيين الطاولات والـ QR")}</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 focus:bg-muted"><ToggleLeft className="h-4 w-4 text-muted-foreground" /> {t("Disable Branch", "تعطيل الفرع")}</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive gap-2 focus:bg-destructive/10 focus:text-destructive"
                          onClick={async () => {
                            // Post-Phase 4d: db is null shim. Route through Postgres DELETE.
                            if (!confirm(t("Delete this branch? This cannot be undone.", "هل أنت متأكد من حذف الفرع؟"))) return;
                            try {
                              const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
                              const res = await fetch(`/api/cafes/${cafeId}/branches/${branch.id}`, {
                                method: "DELETE",
                                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                              });
                              const j = await res.json().catch(() => ({}));
                              if (!res.ok || j?.success === false) throw new Error(j?.message || `HTTP ${res.status}`);
                              await refetchBranches();
                            } catch (err: any) {
                              alert(`${t("Delete failed", "فشل الحذف")}: ${err?.message || "unknown"}`);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" /> {t("Delete Branch", "حذف الفرع")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <Badge variant="outline" className="text-[10px] font-mono tracking-tighter uppercase w-fit bg-muted/30 mb-2 border-transparent">
                    {branch.code || branch.id.substring(0,4)}
                  </Badge>
                  <CardTitle className="text-xl font-black truncate pr-28">{branch.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1.5 text-xs mt-1 truncate">
                    <MapPin className="h-3.5 w-3.5 shrink-0" /> {branch.city}, {branch.address}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 space-y-4 pt-1 pb-4">
                  {/* Quick Insights Dashboard */}
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="bg-slate-50/50 dark:bg-slate-900/50 border rounded-xl p-3 flex flex-col justify-center">
                        <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <ReceiptText className="h-3 w-3" /> {t("Orders Today", "الطلبات اليوم")}
                        </span>
                        <span className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-none">{metrics.orders}</span>
                    </div>
                    <div className="bg-slate-50/50 dark:bg-slate-900/50 border rounded-xl p-3 flex flex-col justify-center">
                        <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <Signal className="h-3 w-3" /> {t("Revenue", "الأرباح")}
                        </span>
                        <span className="text-2xl font-black text-emerald-600 leading-none block truncate">
                          {metrics.revenue} <span className="text-xs font-bold text-emerald-600/50 border-l border-emerald-200 pl-1 ml-0.5">OMR</span>
                        </span>
                    </div>
                  </div>
                  
                  {/* Context workflow string */}
                  {!hasOrders && (
                    <div className="bg-blue-50 text-blue-700 text-xs p-3 rounded-lg border border-blue-100 flex items-start gap-2.5 mt-2">
                        <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
                        <p className="font-medium leading-snug">{t("Next Step: Add tables to this branch to generate QRs and start receiving orders.", "الخطوة التالية: إضافة طاولات لهذا الفرع لإنشاء QR وبدء تلقي الطلبات.")}</p>
                    </div>
                  )}
                  {hasOrders && (
                    <div className="flex items-center justify-between text-xs font-medium text-muted-foreground bg-slate-50 dark:bg-slate-900 border px-3 py-2 rounded-lg mt-2">
                      <span className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" /> {t("Branch Health Score", "حالة الفرع")}</span>
                      <span className="text-foreground font-black text-sm">{metrics.health}%</span>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-3 pb-3 border-t bg-slate-50/50 dark:bg-slate-900/50 flex flex-col gap-2">
                  <Button className="w-full font-bold rounded-xl gap-2 h-11 bg-primary hover:bg-primary/90 shadow-md transition-transform hover:scale-[1.01]" onClick={() => window.location.href = `/cafe-admin/orders?branch=${branch.id}`}>
                    <ArrowUpRight className="h-5 w-5" /> {t("Open Live Orders", "عرض الطلبات المباشرة")}
                  </Button>
                  <Button variant="secondary" size="sm" className="w-full font-bold rounded-xl text-xs h-9 bg-white dark:bg-slate-800 border shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => window.location.href = `/cafe-admin/tables?branch=${branch.id}`}>
                    {t("Manage Tables & QR", "إدارة الطاولات و QR")}
                  </Button>
                </CardFooter>
              </Card>
            );
          })
        )}

        <button 
          onClick={handleAddBranch}
          className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[1.5rem] bg-slate-50/50 dark:bg-slate-900/50 flex flex-col items-center justify-center p-12 text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-primary/40 hover:text-primary transition-all group min-h-[300px]"
        >
           <div className="h-16 w-16 rounded-full bg-white dark:bg-slate-800 shadow-sm border flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
              <Plus className="h-7 w-7" />
           </div>
           <p className="font-bold text-lg text-slate-800 dark:text-slate-100 group-hover:text-primary">{t("Add New Branch", "إضافة فرع جديد")}</p>
           <p className="text-xs mt-2 text-center max-w-[200px] leading-relaxed opacity-80">
             {t("Create a branch to assign tables, generate QR codes, and take live orders.", "للبدء بإنشاء طاولاتك، QR، وإستقبال الطلبات.")}
           </p>
        </button>
      </div>
    </div>
  );
}
