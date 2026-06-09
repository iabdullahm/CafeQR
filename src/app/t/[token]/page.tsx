"use client";

import { useEffect, useState, use } from "react";
import CustomerMenuClient from "../../c/[cafeId]/[branchId]/[tableId]/CustomerMenuClient";
import { Loader2 } from "lucide-react";

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
  const [cafeData, setCafeData] = useState<any>(null);
  const [resolvedParams, setResolvedParams] = useState<{
    cafeId: string;
    branchId: string;
    tableId: string;
    tableName?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    const resolveTokenAndFetch = async () => {
      try {
        // 1. Resolve the QR token → cafe/branch/table tuple (Postgres).
        const qrRes = await fetch(`/api/public/qr-resolve/${token}`, { cache: "no-store" });
        if (!qrRes.ok) {
          if (qrRes.status === 404) {
            setError("Invalid or Expired QR Code");
          } else {
            setError("Could not resolve QR code");
          }
          setLoading(false);
          return;
        }
        const qrJson = await qrRes.json();
        if (!qrJson.success || !qrJson.data) {
          setError("Invalid QR code response");
          setLoading(false);
          return;
        }

        const { cafeId, branchId, tableId, tableName, cafe } = qrJson.data;
        setResolvedParams({ cafeId, branchId, tableId, tableName });

        // 2. Fetch the menu (categories + items) from Postgres.
        const menuRes = await fetch(`/api/public/menu/${cafeId}`, { cache: "no-store" });
        let categories: any[] = CATEGORIES.map((c) => ({ id: c.id, nameEn: c.en, nameAr: c.ar }));
        let items: any[] = [];
        if (menuRes.ok) {
          const menuJson = await menuRes.json();
          if (menuJson.success && menuJson.data) {
            const cats = Array.isArray(menuJson.data.categories) ? menuJson.data.categories : [];
            if (cats.length > 0) {
              categories = cats.map((c: any) => ({
                id: String(c.id),
                nameEn: c.nameEn || c.name,
                nameAr: c.nameAr || c.name,
              }));
            }
            const products = Array.isArray(menuJson.data.products) ? menuJson.data.products : [];
            const normOpts = (raw: unknown): any[] => {
              if (!Array.isArray(raw)) return [];
              return raw.map((g: any) => {
                if (Array.isArray(g?.values)) {
                  return {
                    id: String(g.id ?? ""),
                    nameEn: g.name || g.nameEn || "",
                    nameAr: g.nameAr || g.name || "",
                    type: g.type === "multi" ? "multi" : "single",
                    required: !!g.isRequired,
                    minSelect: Number(g.minSelect ?? 0),
                    maxSelect: Number(g.maxSelect ?? 1),
                    choices: (g.values || []).map((v: any) => ({
                      valueId: String(v.id ?? ""),
                      nameEn: v.valueName || v.nameEn || "",
                      nameAr: v.valueName || v.nameAr || v.nameEn || "",
                      price: Number(v.extraPrice ?? 0),
                    })),
                  };
                }
                return { id: String(g?.id ?? Math.random()), nameEn: g?.name || "", nameAr: g?.name || "", type: "single", required: false, minSelect: 0, maxSelect: 1, choices: [] };
              });
            };
            items = products.map((p: any) => ({
              id: p.id,
              categoryId: p.categoryId || categories[0]?.id || "hot_drinks",
              nameEn: p.nameEn || p.name || "Unnamed Item",
              nameAr: p.nameAr || p.name || "عنصر غير مسمى",
              descEn: p.descriptionEn || p.description || "",
              descAr: p.descriptionAr || p.description || "",
              price: Number(p.price) || 0,
              image: p.imageUrl || p.image || `https://picsum.photos/seed/${p.id}/400/400`,
              tags: p.isFeatured ? ["popular"] : [],
              options: normOpts(p.options),
            }));
          }
        }

        // 3. Assemble cafeData for CustomerMenuClient.
        setCafeData({
          id: cafeId,
          name: cafe?.name || "Cafe",
          branch: branchId === "default" ? "Takeaway" : branchId,
          logo: cafe?.logo || "https://picsum.photos/seed/logo/150/150",
          coverImage: cafe?.coverImage || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=800&fit=crop",
          loyalty: { cups: 0, required: 8 },
          currency: cafe?.currency || "OMR",
          categories,
          items,
        });
      } catch (err) {
        console.error("Failed to load customer menu via token:", err);
        setError("Could not load menu securely");
      } finally {
        setLoading(false);
      }
    };

    void resolveTokenAndFetch();
  }, [token]);

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
          <p className="text-destructive font-bold text-xl">{error || "Menu Unavailable"}</p>
        </div>
        <p className="text-muted-foreground">Please scan another QR code or contact the cafe staff.</p>
      </div>
    );
  }

  return <CustomerMenuClient cafe={cafeData} params={resolvedParams as any} />;
}
