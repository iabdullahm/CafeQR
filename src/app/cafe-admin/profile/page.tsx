"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/dashboard/section-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Globe, Mail, Phone, MapPin, Save, Instagram, Facebook, Twitter, Loader2, AlertCircle, Smartphone } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useFirestore, useMemoFirebase, useDoc } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function CafeProfile() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "", description: "", email: "", phone: "", website: "", address: "", city: "", country: "", instagram: "", facebook: "", twitter: "", primaryColor: "#f59e0b", themeMode: "light"
  });

  const userProfileRef = useMemoFirebase(() => {
    return (db && user) ? doc(db, 'users', user.uid) : null;
  }, [db, user]);
  const { data: userProfile, isLoading: profileLoading } = useDoc(userProfileRef);

  const cafeId = userProfile?.cafeId;
  const cafeRef = useMemoFirebase(() => {
    return (db && cafeId) ? doc(db, 'cafes', cafeId) : null;
  }, [db, cafeId]);
  
  const { data: cafeData, isLoading: cafeLoading } = useDoc(cafeRef);

  const [pgFallback, setPgFallback] = useState<any>(null);

  useEffect(() => {
    const isLookupable =
      typeof cafeId === 'string' &&
      cafeId.length > 0 &&
      cafeId !== 'SUPER_ADMIN' &&
      /^[\w-]+$/.test(cafeId);
    if (isLookupable && !cafeData && !cafeLoading) {
      fetch(`/api/public/cafes/${cafeId}`).then(res => res.json()).then(json => {
         if (json.success) setPgFallback(json.data);
      }).catch(() => {});
    }
  }, [cafeId, cafeData, cafeLoading]);

  const activeCafe = cafeData || pgFallback || {};

  useEffect(() => {
    if (activeCafe && !formData.name) {
       setFormData({
         name: activeCafe.name || "",
         description: activeCafe.description || "",
         email: activeCafe.email || activeCafe.owner_email || "",
         phone: activeCafe.phone || "",
         website: activeCafe.website || "",
         address: activeCafe.address || "",
         city: activeCafe.city || "",
         country: activeCafe.country || "",
         instagram: activeCafe.social?.instagram || "",
         facebook: activeCafe.social?.facebook || "",
         twitter: activeCafe.social?.twitter || "",
         primaryColor: activeCafe.theme?.primaryColor || "#f59e0b",
         themeMode: activeCafe.theme?.mode || "light"
       });
    }
  }, [activeCafe]); // eslint-disable-line

  const configRef = useMemoFirebase(() => db && cafeId ? doc(db, 'cafes', cafeId, 'config', 'settings') : null, [db, cafeId]);
  const { data: configDoc } = useDoc(configRef);
  const isArabic = configDoc?.language === 'ar';
  const t = (en: string, ar: string) => isArabic ? ar : en;

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!cafeRef) return;
    
    setSaving(true);
    const updates = {
      name: formData.name,
      description: formData.description,
      email: formData.email,
      phone: formData.phone,
      website: formData.website,
      address: formData.address,
      city: formData.city,
      country: formData.country,
      social: {
        instagram: formData.instagram,
        facebook: formData.facebook,
        twitter: formData.twitter,
      },
      theme: {
        primaryColor: formData.primaryColor,
        mode: formData.themeMode,
      }
    };

    try {
      await setDoc(cafeRef, updates, { merge: true });
      toast({ 
        title: "✅ Profile saved successfully", 
        description: "Your cafe information has been updated for all visitors.",
      });
    } catch (err: any) {
      toast({ 
        title: "❌ Error saving profile", 
        description: err.message, 
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  if (isUserLoading || profileLoading || cafeLoading) {
    return <div className="p-8 text-center animate-pulse">{t("Loading profile data...", "جاري تحميل بيانات الملف الشخصي...")}</div>;
  }

  const profileStatus = (activeCafe?.name && activeCafe?.description && activeCafe?.logoUrl) ? 'Ready' : 'Incomplete';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto pb-10">
      <SectionHeader 
        title={t("Cafe Profile", "ملف المقهى")}
        description={t("Manage how your cafe appears to customers when they scan your QR code.", "تحكم في شكل الكافيه عند ظهور المنيو للزبائن عبر مسح الـ QR")}
        actions={
          <div className="flex flex-col sm:flex-row gap-3">
             <Button type="button" variant="outline" className="font-bold border-dashed shadow-sm" onClick={() => window.open(`/c/${cafeId}`, '_blank')}>
                <Smartphone className="h-4 w-4 mr-2" /> {t("Preview Customer Menu", "معاينة قائمة الطعام")}
             </Button>
             <Button type="button" onClick={handleSubmit} disabled={saving} className="bg-primary gap-2 font-bold shadow-md">
               {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} 
               {t("Save Profile", "حفظ الملف")}
             </Button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden bg-card">
            <CardHeader className="bg-muted/10 border-b">
               <CardTitle>{t("Branding & Details", "الهوية والتفاصيل")}</CardTitle>
               <CardDescription>{t("Logo, colors, and appearance details.", "شعار الكافيه، الألوان، وتفاصيل المظهر.")}</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <div className="flex flex-col md:flex-row items-start lg:items-center gap-8">
                <div className="relative shrink-0">
                  <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                    <AvatarImage src={activeCafe.logoUrl || "https://picsum.photos/seed/cafe-logo/200/200"} />
                    <AvatarFallback className="font-headline font-bold text-xl">{formData.name?.substring(0,2)?.toUpperCase() || 'CR'}</AvatarFallback>
                  </Avatar>
                  <Button type="button" variant="secondary" size="icon" className="h-8 w-8 rounded-full absolute bottom-0 right-0 border-2 border-background shadow-sm hover:scale-105 transition-transform">
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-bold text-lg">{t("Cafe Logo", "شعار الكافيه")}</h3>
                  <p className="text-sm text-muted-foreground w-full max-w-md leading-relaxed">{t("Upload a clear, high-resolution square image. This represents your brand across the entire menu experience.", "قم برفع صورة مربعة واضحة عالية الدقة. سيمثل هذا علامتك التجارية في كافة أنحاء القائمة.")}</p>
                </div>
              </div>

              <div className="border-t pt-8 grid sm:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <Label className="font-bold">{t("Primary Color", "اللون الأساسي")}</Label>
                    <div className="flex gap-2 items-center">
                       <Input type="color" className="w-14 h-11 p-1 rounded-lg cursor-pointer" value={formData.primaryColor || "#f59e0b"} onChange={e => handleChange('primaryColor', e.target.value)} />
                       <Input value={formData.primaryColor || "#f59e0b"} onChange={e => handleChange('primaryColor', e.target.value)} className="font-mono bg-muted/20 uppercase" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label className="font-bold">{t("Menu Theme", "مظهر القائمة")}</Label>
                    <Select value={formData.themeMode || "light"} onValueChange={v => handleChange('themeMode', v)}>
                      <SelectTrigger className="bg-muted/20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">{t("Light Mode (Clean & Bright)", "وضع فاتح (نظيف ومشرق)")}</SelectItem>
                        <SelectItem value="dark">{t("Dark Mode (Sleek & Modern)", "وضع داكن (أنيق وعصري)")}</SelectItem>
                      </SelectContent>
                    </Select>
                 </div>
              </div>

              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label className="font-bold">{t("Cafe Name", "اسم المقهى")}</Label>
                  <Input value={formData.name} onChange={e => handleChange('name', e.target.value)} className="bg-muted/20 text-lg font-semibold h-12" required />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold flex items-center justify-between">
                     {t("Description", "الوصف")}
                  </Label>
                  <Textarea 
                    value={formData.description}
                    onChange={e => handleChange('description', e.target.value)}
                    placeholder='Example: "Specialty coffee, fresh pastries, and fast service in Al Khoud"'
                    className="min-h-[120px] bg-muted/20 text-base leading-relaxed"
                  />
                  <p className="text-xs text-muted-foreground">{t("Keep it engaging. This is the first thing customers read.", "اجعله جذاباً. هذا أول ما يقرأه العملاء.")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm overflow-hidden bg-card">
            <CardHeader className="bg-muted/10 border-b">
               <CardTitle>{t("Contact & Location", "معلومات الاتصال والموقع")}</CardTitle>
               <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-2 rounded-lg mt-3 text-xs font-medium border border-amber-100 w-fit">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p>{t("This information may be shown to customers.", "قد يتم عرض هذه المعلومات للعملاء.")}</p>
               </div>
            </CardHeader>
            <CardContent className="p-6 grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> {t("Email Address", "البريد الإلكتروني")}</Label>
                  <Input value={formData.email} onChange={e => handleChange('email', e.target.value)} className="bg-muted/10" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> {t("Phone Number", "رقم الهاتف")}</Label>
                  <Input value={formData.phone} onChange={e => handleChange('phone', e.target.value)} className="bg-muted/10" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 text-muted-foreground" /> {t("Website", "الموقع الإلكتروني")}</Label>
                  <Input value={formData.website} onChange={e => handleChange('website', e.target.value)} placeholder="https://..." className="bg-muted/10" />
                </div>
              </div>
              <div className="space-y-4">
                 <div className="space-y-2">
                  <Label className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {t("Street Address", "عنوان الشارع")}</Label>
                  <Input value={formData.address} onChange={e => handleChange('address', e.target.value)} className="bg-muted/10" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("City", "المدينة")}</Label>
                    <Input value={formData.city} onChange={e => handleChange('city', e.target.value)} className="bg-muted/10" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("Country", "الدولة")}</Label>
                    <Input value={formData.country} onChange={e => handleChange('country', e.target.value)} className="bg-muted/10" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm overflow-hidden bg-card">
            <CardHeader className="bg-muted/10 border-b">
               <CardTitle>{t("Social Media Links", "روابط التواصل الاجتماعي")}</CardTitle>
               <CardDescription>{t("Connect your profiles to build loyalty.", "اربط حساباتك لبناء ولاء العملاء.")}</CardDescription>
            </CardHeader>
            <CardContent className="p-6 grid gap-6 md:grid-cols-3">
               <div className="space-y-2">
                  <Label className="flex items-center gap-2 font-bold"><Instagram className="h-4 w-4 text-pink-600" /> Instagram</Label>
                  <Input value={formData.instagram} onChange={e => handleChange('instagram', e.target.value)} placeholder="instagram.com/..." className="bg-muted/20" />
               </div>
               <div className="space-y-2">
                  <Label className="flex items-center gap-2 font-bold"><Facebook className="h-4 w-4 text-blue-600" /> Facebook</Label>
                  <Input value={formData.facebook} onChange={e => handleChange('facebook', e.target.value)} placeholder="facebook.com/..." className="bg-muted/20" />
               </div>
               <div className="space-y-2">
                  <Label className="flex items-center gap-2 font-bold"><Twitter className="h-4 w-4 text-black dark:text-white" /> Twitter / X</Label>
                  <Input value={formData.twitter} onChange={e => handleChange('twitter', e.target.value)} placeholder="x.com/..." className="bg-muted/20" />
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview Container */}
         <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-6">
             <div className="flex justify-between items-end mb-3 px-1">
                <span className="text-sm font-bold flex items-center gap-2 text-primary">
                  <Globe className="h-4 w-4" /> {t("Live Preview", "معاينة حية")}
                </span>
                <span className="text-xs text-muted-foreground">{t("Mobile View", "عرض الجوال")}</span>
             </div>
             
             {/* Fake Phone Frame */}
             <div className={`rounded-[2.5rem] border-[8px] border-slate-900 w-full mb-4 aspect-[9/19] shadow-2xl overflow-hidden relative flex flex-col ${formData.themeMode === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'} transition-colors duration-300`}>
                 {/* Top notch */}
                 <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 rounded-b-2xl w-36 mx-auto z-50 shadow-sm" />
                 
                 {/* Preview content */}
                 <div className="h-40 relative shrink-0 transition-colors duration-500" style={{ backgroundColor: formData.primaryColor }}>
                    <div className="absolute -bottom-10 left-6">
                       <Avatar className={`h-20 w-20 border-4 ${formData.themeMode === 'dark' ? 'border-slate-950' : 'border-slate-50'} shadow-md bg-card`}>
                         <AvatarImage src={activeCafe.logoUrl} className="object-cover" />
                         <AvatarFallback className="text-xl font-black text-slate-400">
                           {formData.name?.substring(0,2)?.toUpperCase() || 'CR'}
                         </AvatarFallback>
                       </Avatar>
                    </div>
                 </div>
                 
                 <div className="p-6 pt-14 flex-1 overflow-y-auto hide-scrollbar">
                    <h2 className="text-2xl font-headline font-black truncate">{formData.name || "Cafe Name"}</h2>
                    <p className={`text-sm mt-3 leading-relaxed opacity-80 ${!formData.description && 'italic'}`}>
                      {formData.description || "Your delicious description will appear right here when you type it..."}
                    </p>
                    
                    {/* Fake menu buttons to make it look realistic */}
                    <div className="mt-8 space-y-4">
                       <div className="flex gap-2">
                          <Badge style={{ backgroundColor: formData.primaryColor }} className="rounded-full shadow-sm">Menu</Badge>
                          <Badge variant="outline" className={formData.themeMode === 'dark' ? 'border-slate-700' : 'border-slate-300'}>Reviews</Badge>
                          <Badge variant="outline" className={formData.themeMode === 'dark' ? 'border-slate-700' : 'border-slate-300'}>Info</Badge>
                       </div>
                       
                       <div className="pt-2 grid grid-cols-2 gap-3">
                          <div className={`h-32 rounded-2xl ${formData.themeMode === 'dark' ? 'bg-slate-900' : 'bg-white shadow-sm'} p-3 border ${formData.themeMode === 'dark' ? 'border-slate-800' : 'border-slate-100'} flex flex-col justify-end`}>
                             <div className={`h-3 w-16 ${formData.themeMode === 'dark' ? 'bg-slate-800' : 'bg-slate-200'} rounded mb-1`} />
                             <div className={`h-3 w-10 ${formData.themeMode === 'dark' ? 'bg-slate-800' : 'bg-slate-200'} rounded`} />
                          </div>
                          <div className={`h-32 rounded-2xl ${formData.themeMode === 'dark' ? 'bg-slate-900' : 'bg-white shadow-sm'} p-3 border ${formData.themeMode === 'dark' ? 'border-slate-800' : 'border-slate-100'} flex flex-col justify-end`}>
                             <div className={`h-3 w-20 ${formData.themeMode === 'dark' ? 'bg-slate-800' : 'bg-slate-200'} rounded mb-1`} />
                             <div className={`h-3 w-8 ${formData.themeMode === 'dark' ? 'bg-slate-800' : 'bg-slate-200'} rounded`} />
                          </div>
