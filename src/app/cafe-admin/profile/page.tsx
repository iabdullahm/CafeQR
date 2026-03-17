"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/dashboard/section-header";
import { Camera, Globe, Mail, Phone, MapPin, Save, Instagram, Facebook, Twitter } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function CafeProfile() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <SectionHeader 
        title="Cafe Profile" 
        description="Manage your cafe's public identity and contact information."
        actions={<Button className="bg-primary gap-2"><Save className="h-4 w-4" /> Save Profile</Button>}
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
                  <AvatarImage src="https://picsum.photos/seed/cafe-logo/200/200" />
                  <AvatarFallback>CR</AvatarFallback>
                </Avatar>
                <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full absolute bottom-0 right-0 border-2 border-background">
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="font-bold text-lg">Cafe Logo</h3>
                <p className="text-sm text-muted-foreground">Upload a square image (400x400px recommended). This will appear on your digital menu and QR codes.</p>
                <Button variant="outline" size="sm" className="mt-2">Change Image</Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Cafe Name</Label>
                <Input defaultValue="The Roast Coffee" className="bg-muted/20" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  placeholder="Tell your customers about your cafe..." 
                  defaultValue="Artisanal coffee house specializing in single-origin beans and freshly baked pastries. A cozy space for coffee lovers."
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
                <Input defaultValue="contact@roastcoffee.com" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Phone className="h-3 w-3" /> Phone Number</Label>
                <Input defaultValue="+1 (555) 123-4567" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Globe className="h-3 w-3" /> Website</Label>
                <Input defaultValue="www.roastcoffee.com" />
              </div>
            </div>
            <div className="space-y-4">
               <div className="space-y-2">
                <Label className="flex items-center gap-2"><MapPin className="h-3 w-3" /> Street Address</Label>
                <Input defaultValue="123 Coffee Avenue, Suite 4B" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input defaultValue="New York" />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input defaultValue="United States" />
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
                <Input placeholder="@username" defaultValue="roast.coffee" />
             </div>
             <div className="space-y-2">
                <Label className="flex items-center gap-2 text-blue-700"><Facebook className="h-3 w-3" /> Facebook</Label>
                <Input placeholder="facebook.com/..." defaultValue="theroastcoffee" />
             </div>
             <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sky-500"><Twitter className="h-3 w-3" /> Twitter / X</Label>
                <Input placeholder="@username" />
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
