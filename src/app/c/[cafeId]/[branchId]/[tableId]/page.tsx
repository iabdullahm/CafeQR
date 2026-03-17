"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Coffee, ShoppingBag, Plus, Minus, X, Info, Utensils, Car } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const MENU_ITEMS = [
  { id: "1", name: "House Blend Coffee", price: 4.5, category: "Hot Drinks", img: "https://picsum.photos/seed/coffee1/200/200" },
  { id: "2", name: "Caramel Macchiato", price: 5.5, category: "Hot Drinks", img: "https://picsum.photos/seed/coffee2/200/200" },
  { id: "3", name: "Avocado Toast", price: 12.0, category: "Food", img: "https://picsum.photos/seed/food1/200/200" },
  { id: "4", name: "Berry Muffin", price: 3.5, category: "Snacks", img: "https://picsum.photos/seed/snack1/200/200" },
];

export default function CustomerInterface({ params }: { params: { cafeId: string, branchId: string, tableId: string } }) {
  const [cart, setCart] = useState<{ id: string, name: string, price: number, qty: number }[]>([]);
  const [orderType, setOrderType] = useState<"dine-in" | "car-order">("dine-in");
  const [carNumber, setCarNumber] = useState("");

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0));
  };

  const cartCount = cart.reduce((acc, i) => acc + i.qty, 0);
  const cartTotal = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-card border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              <Coffee className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-headline font-bold text-lg leading-tight">Cafe Roasted</h1>
              <p className="text-xs text-muted-foreground">Branch: {params.branchId} • Table: {params.tableId}</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary">Open</Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
           <Button 
            variant={orderType === 'dine-in' ? 'default' : 'outline'} 
            className="gap-2"
            onClick={() => setOrderType('dine-in')}
           >
              <Utensils className="h-4 w-4" /> Dine-in
           </Button>
           <Button 
            variant={orderType === 'car-order' ? 'default' : 'outline'} 
            className="gap-2"
            onClick={() => setOrderType('car-order')}
           >
              <Car className="h-4 w-4" /> Car Order
           </Button>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {orderType === 'car-order' && (
           <Card className="bg-accent/10 border-accent/20">
              <CardContent className="p-4 space-y-2">
                 <Label className="text-accent font-bold">Car Number</Label>
                 <Input 
                   placeholder="Enter plate number..." 
                   value={carNumber}
                   onChange={e => setCarNumber(e.target.value)}
                   className="border-accent/30 bg-background"
                 />
              </CardContent>
           </Card>
        )}

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline font-bold text-xl">Popular Now</h2>
            <Button variant="link" size="sm" className="text-primary font-bold">See All</Button>
          </div>
          <div className="grid gap-4">
            {MENU_ITEMS.map((item) => (
              <Card key={item.id} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-0 flex h-28">
                  <div className="w-28 bg-muted">
                     <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 p-3 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold">{item.name}</h3>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary">${item.price.toFixed(2)}</span>
                      <Button 
                        size="sm" 
                        className="h-8 w-8 p-0 rounded-full bg-primary hover:bg-primary/90"
                        onClick={() => addToCart(item)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 max-w-md mx-auto">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="lg" className="w-full bg-primary h-14 rounded-full shadow-lg justify-between px-6">
                <div className="flex items-center gap-3">
                   <div className="h-8 w-8 rounded-full bg-primary-foreground text-primary flex items-center justify-center font-bold">
                     {cartCount}
                   </div>
                   <span className="font-bold">View Cart</span>
                </div>
                <span className="font-bold">${cartTotal.toFixed(2)}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-[2rem] h-[80vh] px-6">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-2xl font-headline font-bold text-primary">Your Order</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 overflow-y-auto max-h-[50vh] pr-2">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-3 bg-secondary rounded-full p-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-full"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="font-bold min-w-[20px] text-center">{item.qty}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-full"
                        onClick={() => addToCart(item)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <SheetFooter className="mt-8">
                <div className="w-full space-y-4">
                  <div className="flex items-center justify-between text-lg font-bold">
                     <span>Total</span>
                     <span className="text-primary">${cartTotal.toFixed(2)}</span>
                  </div>
                  <Button className="w-full bg-primary h-14 text-xl font-bold rounded-2xl">
                    Submit Order
                  </Button>
                </div>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      )}
    </div>
  );
}
