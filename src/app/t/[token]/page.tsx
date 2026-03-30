"use client";

import { useEffect, useState, use } from "react";
import CustomerMenuClient from "../../c/[cafeId]/[branchId]/[tableId]/CustomerMenuClient";
import { useFirestore } from "@/firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { Loader2 } from "lucide-react";

// ...CATEGORIES is already there
const CATEGORIES = [
  { id: 'hot_drinks', en: 'Hot Drinks', ar: 'المشروبات الساخنة' },
  { id: 'cold_drinks', en: 'Cold Drinks', ar: 'المشروبات الباردة' },
  { id: 'cold_brew', en: 'Cold Brew', ar: 'كولد برو' },
  { id: 'iced_tea', en: 'Iced Tea', ar: 'الشاي المثلج' },
  { id: 'ice_cream', en: 'Ice Cream', ar: 'ايس كريم' },
  { id: 'specialty_tea', en: 'Specialty Tea', ar: 'الشاي المختص' },
  { id: 'hibiscus', en: 'Hibiscus', ar: 'الكركدية' },
  { id: 'sweets', en: 'Sweets', ar: 'السويتات' },
  { id: 'matcha', en: 'Matcha', ar: 'الماتشا' },
];

export default function SecureCustomerTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParamsInput = use(params);
  const token = resolvedParamsInput.token;
  const db = useFirestore();
  const [cafeData, setCafeData] = useState<any>(null);
  const [resolvedParams, setResolvedParams] = useState<{ cafeId: string, branchId: string, tableId: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!db || !token) return;

    const resolveTokenAndFetch = async () => {
      try {
        // 1. Resolve Secure Token
        const tokenRef = doc(db, 'qr_tokens', token);
        const tokenSnap = await getDoc(tokenRef);

        if (!tokenSnap.exists()) {
          setError("Invalid or Expired QR Code");
          setLoading(false);
          return;
        }

        const tokenData = tokenSnap.data();
        const { cafeId, branchId, tableId } = tokenData;
        setResolvedParams({ cafeId, branchId, tableId });

        // 2. Fetch Cafe Details
        const cafeRef = doc(db, 'cafes', cafeId);
        const cafeSnap = await getDoc(cafeRef);
        
        if (!cafeSnap.exists()) {
          setError("Cafe not found");
          setLoading(false);
          return;
        }
        
        const cafeDoc = cafeSnap.data();

        // 3. Fetch Products
        const productsSnap = await getDocs(collection(db, 'cafes', cafeId, 'products'));
        const productsData = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // 4. Format Data for the CustomerMenuClient Map
        const formattedCategories = CATEGORIES.map(c => ({
          id: c.id,
          nameEn: c.en,
          nameAr: c.ar
        }));

        const formattedItems = productsData.map((p: any) => ({
          id: p.id,
          categoryId: p.category || 'hot_drinks',
          nameEn: p.name || 'Unnamed Item',
          nameAr: p.name || 'عنصر غير مسمى',
          descEn: p.description || p.ingredients || '',
          descAr: p.description || p.ingredients || '',
          price: Number(p.price) || 0,
          image: p.imageUrl || `https://picsum.photos/seed/${p.id}/400/400`,
          tags: p.isPopular ? ['popular'] : [],
          options: [] // To be implemented if products have options in firestore
        }));

        setCafeData({
          id: cafeId,
          name: cafeDoc.name || 'Urban Brew',
          branch: branchId === 'default' ? 'Takeaway' : (cafeDoc.branchName || branchId), // Need actual branch name later!
          logo: cafeDoc.logo || "https://picsum.photos/seed/logo/150/150",
          coverImage: cafeDoc.coverImage || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=800&fit=crop",
          loyalty: { cups: 0, required: 8 },
          currency: cafeDoc.currency || "OMR",
          categories: formattedCategories,
          items: formattedItems
        });

      } catch (err: any) {
        console.error("Failed to load customer menu via token:", err);
        setError("Could not load menu securely");
      } finally {
        setLoading(false);
      }
    };

    resolveTokenAndFetch();
  }, [db, token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-medium animate-pulse">Resolving secure connection...</p>
      </div>
    );
  }

  if (error || !cafeData || !resolvedParams) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-destructive/10 p-6 rounded-3xl mb-4">
          <p className="text-destructive font-bold text-xl">{error || 'Menu Unavailable'}</p>
        </div>
        <p className="text-muted-foreground">Please scan another QR code or contact the cafe staff.</p>
      </div>
    );
  }

  return <CustomerMenuClient cafe={cafeData} params={resolvedParams} />;
}
