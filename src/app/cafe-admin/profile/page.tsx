"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/dashboard/section-header";
import { Camera, Globe, Mail, Phone, MapPin, Save, Instagram, Facebook, Twitter, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useFirestore, useMemoFirebase, useDoc } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function CafeProfile() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const userProfileRef = useMemoFirebase(() => {
    return (db && user) ? doc(db, 'users', user.uid) : null;
  }, [db, user]);
  const { data: userProfile, isLoading: profileLoading } = useDoc(userProfileRef);

  const cafeId = userProfile?.cafeId;
  const cafeRef = useMemoFirebase(() => {
    return (db && cafeId) ? doc(db, 'cafes', cafeId) : null;
  }, [db, cafeId]);
  
  const { data: cafeData, isLoading: cafeLoading } = useDoc(cafeRef);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!cafeRef) return;
    
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const updates = {
      name: fd.get("name") as string,
      description: fd.get("description") as string,
      email: fd.get("email") as string,
      phone: fd.get("phone") as string,
      website: fd.get("website") as string,
      address: fd.get("address") as string,
      city: fd.get("city") as string,
      country: fd.get("country") as string,
      social: {
        instagram: fd.get("instagram") as string,
        facebook: fd.get("facebook") as string,
        twitter: fd.get("twitter") as string,
      }
    };

    try {
      await updateDoc(cafeRef, updates);
      toast({ title: "Profile Saved", description: "Cafe information has been updated successfully." });
    } catch (err: any) {
      toast({ title: "Save Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isUserLoading || profileLoading || cafeLoading) {
    return <div className="p-8 text-center animate-pulse">Loading profile data...</div>;
  }

  if (!cafeData) {
    return <div className="p-8 text-center">Cafe profile not found.</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto pb-10">
      <SectionHeader 
        title="Cafe Profile" 
        description="Manage your cafe's public identity and contact information."
        actions={
          <Button type="submit" disabled={saving} className="bg-primary gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} 
            Save Profile
          </Button>
        }
      />

      <div className="grid gap-6">
        <Card className="border-none shadow-sm overflow-hidden bg-card">
          <CardHeader className="bg-muted/30">
             <CardTitle>Branding</CardTitle>
             <CardDescription>Logo and appearance details.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                  <AvatarImage src={cafeData.logoUrl || "https://picsum.photos/seed/cafe-logo/200/200"} />
                  <AvatarFallback>{cafeData.name?.substring(0,2)?.toUpperCase() || 'CR'}</AvatarFallback>
                </Avatar>
                <Button type="button" variant="secondary" size="icon" className="h-8 w-8 rounded-full absolute bottom-0 right-0 border-2 border-background">
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="font-bold text-lg">Cafe Logo</h3>
                <p className="text-sm text-muted-foreground">Upload a square image (400x400px recommended). This will appear on your digital menu and QR codes.</p>
                <Button type="button" variant="outline" size="sm" className="mt-2">Change Image</Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Cafe Name</Label>
                <Input name="name" defaultValue={cafeData.name || ""} className="bg-muted/20" required />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  name="description"
                  placeholder="Tell your customers about your cafe..." 
                  defaultValue={cafeData.description || ""}
                  className="min-h-[100px] bg-muted/20"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm overflow-hidden bg-card">
          <CardHeader className="bg-muted/30">
             <CardTitle>Contact & Location</CardTitle>
             <CardDescription>How customers can reach you.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Mail className="h-3 w-3" /> Email Address</Label>
                <Input name="email" defaultValue={cafeData.email || cafeData.owner_email || ""} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Phone className="h-3 w-3" /> Phone Number</Label>
                <Input name="phone" defaultValue={cafeData.phone || ""} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Globe className="h-3 w-3" /> Website</Label>
                <Input name="website" defaultValue={cafeData.website || ""} />
              </div>
            </div>
            <div className="space-y-4">
               <div className="space-y-2">
                <Label className="flex items-center gap-2"><MapPin className="h-3 w-3" /> Street Address</Label>
                <Input name="address" defaultValue={cafeData.address || ""} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input name="city" defaultValue={cafeData.city || ""} />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input name="country" defaultValue={cafeData.country || ""} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm overflow-hidden bg-card">
          <CardHeader className="bg-muted/30">
             <CardTitle>Social Media</CardTitle>
             <CardDescription>Connect your profiles.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 grid gap-4 md:grid-cols-3">
             <div className="space-y-2">
                <Label className="flex items-center gap-2 text-pink-600"><Instagram className="h-3 w-3" /> Instagram</Label>
                <Input name="instagram" placeholder="@username" defaultValue={cafeData.social?.instagram || ""} />
             </div>
             <div className="space-y-2">
                <Label className="flex items-center gap-2 text-blue-700"><Facebook className="h-3 w-3" /> Facebook</Label>
                <Input name="facebook" placeholder="facebook.com/..." defaultValue={cafeData.social?.facebook || ""} />
             </div>
             <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sky-500"><Twitter className="h-3 w-3" /> Twitter / X</Label>
                <Input name="twitter" placeholder="@username" defaultValue={cafeData.social?.twitter || ""} />
             </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
