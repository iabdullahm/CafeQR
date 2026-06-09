"use client";

import { useEffect, useState, use } from "react";
import CustomerMenuClient from "./CustomerMenuClient";
import { useFirestore } from "@/firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { Loader2 } from "lucide-react";

/**
 * Customer-facing menu page.
 *
 * Data source priority (Phase 1 of the Firebase → Postgres migration):
 *   1. Postgres via /api/public/cafes/[id] + /api/public/menu/[cafeId].
 *      This is the new home of cafe + menu data.
 *   2. Firestore (legacy) — only used if the Postgres endpoints return
 *      nothing useful, e.g. for a tenant that has not been migrated yet.
 *
 * Both code paths produce the same cafeData shape that the existing
 * CustomerMenuClient component expects.
 */

const FALLBACK_CATEGORIES = [
  { id: "hot_drinks", en: "Hot Drinks", ar: "المشروبات الساخنة" },
  { id: "cold_drinks", en: "Cold Drinks", ar: "المشروبات الباردة" },
  { id: "cold_brew", en: "Cold Brew", ar: "كولد برو" },
  { id: "iced_tea", en: "Iced Tea", ar: "الشاي المثلج" },
  { id: "ice_cream", en: "Ice Cream", ar: "ايس كريم" },
  { id: "specialty_tea", en: "Specialty Tea", ar: "الشاي المختص" },
  { id: "hibiscus", en: "Hibiscus", ar: "الكركدية" },
  { id: "sweets", en: "Sweets", ar: "السويتات" },
  { id: "matcha", en: "Matcha", ar: "الماتشا" },
];

type RawProduct = {
  id?: string;
  category?: string;
  categoryId?: string;
  name?: string;
  nameEn?: string;
  nameAr?: string;
  description?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  ingredients?: string;
  price?: number | string;
  imageUrl?: string;
  image?: string;
  isPopular?: boolean;
  isFeatured?: boolean;
  options?: unknown[];
};

function normalizeOptions(rawOptions: unknown): any[] {
  if (!Array.isArray(rawOptions)) return [];
  return rawOptions.map((g: any) => {
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
    return {
      id: String(g.id ?? Math.random()),
      nameEn: g.nameEn || g.name || "",
      nameAr: g.nameAr || g.name || "",
      type: g.type === "multi" ? "multi" : "single",
      required: !!g.required,
      minSelect: g.required ? 1 : 0,
      maxSelect: g.type === "multi" ? 99 : 1,
      choices: Array.isArray(g.choices)
        ? g.choices.map((c: any) => ({
            valueId: c.valueId ?? "",
            nameEn: c.nameEn || c.name || "",
            nameAr: c.nameAr || c.name || "",
            price: Number(c.price ?? 0),
          }))
        : [],
    };
  });
}

function formatItem(p: RawProduct, defaultCategoryId = "hot_drinks") {
  const nameEn = p.nameEn || p.name || "Unnamed Item";
  const nameAr = p.nameAr || p.name || nameEn;
  const descEn = p.descriptionEn || p.description || p.ingredients || "";
  const descAr = p.descriptionAr || descEn;
  return {
    id: String(p.id ?? ""),
    categoryId: String(p.categoryId || p.category || defaultCategoryId),
    nameEn,
    nameAr,
    descEn,
    descAr,
    price: Number(p.price) || 0,
    image: p.imageUrl || p.image || "",
    tags: p.isPopular || p.isFeatured ? ["popular"] : [],
    options: normalizeOptions(p.options),
  };
}

interface PgCafe {
  id: string;
  name: string;
  nameAr?: string | null;
  logo: string;
  coverImage: string;
  currency: string;
  taxRate: number;
  settings?: { activeOrderTypes?: Record<string, boolean> } | null;
}
interface PgMenuResp {
  success: boolean;
  data?: {
    categories: Array<{ id: string; nameEn?: string; nameAr?: string; name?: string }>;
    products: RawProduct[];
  };
}

async function loadFromPostgres(cafeId: string): Promise<{
  cafe: PgCafe;
  categories: Array<{ id: string; nameEn: string; nameAr: string }>;
  items: ReturnType<typeof formatItem>[];
} | null> {
  try {
    const [cafeRes, menuRes] = await Promise.all([
      fetch(`/api/public/cafes/${encodeURIComponent(cafeId)}`, { cache: "no-store" }),
      fetch(`/api/public/menu/${encodeURIComponent(cafeId)}`, { cache: "no-store" }),
    ]);
    if (!cafeRes.ok) return null;
    const cafeJson = await cafeRes.json();
    if (!cafeJson.success || !cafeJson.data) return null;

    let menu: PgMenuResp["data"] | null = null;
    if (menuRes.ok) {
      const menuJson = (await menuRes.json()) as PgMenuResp;
      if (menuJson.success && menuJson.data) menu = menuJson.data;
    }

    const categories =
      menu && menu.categories.length > 0
        ? menu.categories.map((c) => ({
            id: c.id,
            nameEn: c.nameEn || c.name || "Category",
            nameAr: c.nameAr || c.nameEn || c.name || "فئة",
          }))
        : FALLBACK_CATEGORIES.map((c) => ({ id: c.id, nameEn: c.en, nameAr: c.ar }));

    const items = (menu?.products ?? []).map((p) => formatItem(p, categories[0]?.id ?? "hot_drinks"));

    return { cafe: cafeJson.data as PgCafe, categories, items };
  } catch {
    return null;
  }
}

export default function CustomerInterfacePage({
  params,
}: {
  params: Promise<{ cafeId: string; branchId: string; tableId: string }>;
}) {
  const resolvedParams = use(params);
  const db = useFirestore();
  const [cafeData, setCafeData] = useState<Record<string, unknown> | null>(null);
  const [paramsWithTableName, setParamsWithTableName] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        // --- 1. Try Postgres first ---
        const pg = await loadFromPostgres(resolvedParams.cafeId);

        if (pg && pg.items.length > 0) {
          setCafeData({
            id: resolvedParams.cafeId,
            name: pg.cafe.name || "Cafe",
            nameAr: pg.cafe.nameAr || pg.cafe.name,
            branch:
              resolvedParams.branchId === "default"
                ? "Takeaway"
                : resolvedParams.branchId,
            logo: pg.cafe.logo,
            coverImage: pg.cafe.coverImage,
            loyalty: { cups: 0, required: 8 },
            currency: pg.cafe.currency || "OMR",
            taxRate: Number(pg.cafe.taxRate ?? 0) / 100,
            activeOrderTypes:
              pg.cafe.settings?.activeOrderTypes || {
                dineIn: true,
                carService: true,
                pickup: true,
              },
            categories: pg.categories,
            items: pg.items,
          });
          setParamsWithTableName({ ...resolvedParams, tableName: resolvedParams.tableId });
          return; // success — skip Firestore fallback
        }

        // --- 2. Fallback to Firestore (legacy) ---
        if (!db) {
          setError("Could not load menu");
          return;
        }
        const cafeRef = doc(db, "cafes", resolvedParams.cafeId);
        const cafeSnap = await getDoc(cafeRef);
        let cafeDoc: Record<string, unknown> = {};
        if (cafeSnap.exists()) {
          cafeDoc = cafeSnap.data() as Record<string, unknown>;
        }

        const configRef = doc(db, "cafes", resolvedParams.cafeId, "config", "settings");
        const configSnap = await getDoc(configRef);
        const configData = configSnap.exists() ? (configSnap.data() as Record<string, unknown>) : null;

        const productsSnap = await getDocs(
          collection(db, "cafes", resolvedParams.cafeId, "products")
        );
        const productsData = productsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as RawProduct) }));

        const categories = FALLBACK_CATEGORIES.map((c) => ({
          id: c.id,
          nameEn: c.en,
          nameAr: c.ar,
        }));
        const items = productsData.map((p) => formatItem(p, "hot_drinks"));

        const vatRaw = (configData?.taxes as { vat?: string | number } | undefined)?.vat;
        const taxRate =
          vatRaw !== undefined && vatRaw !== null && vatRaw !== ""
            ? parseFloat(String(vatRaw)) / 100
            : 0;

        setCafeData({
          id: resolvedParams.cafeId,
          name: (cafeDoc.name as string) || "Urban Brew",
          branch:
            resolvedParams.branchId === "default"
              ? "Takeaway"
              : ((cafeDoc.branchName as string) || resolvedParams.branchId),
          logo: (cafeDoc.logo as string) || "https://picsum.photos/seed/logo/150/150",
          coverImage:
            (cafeDoc.coverImage as string) ||
            "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=800&fit=crop",
          loyalty: { cups: 0, required: 8 },
          currency: (cafeDoc.currency as string) || "OMR",
          taxRate,
          activeOrderTypes:
            (configData?.activeOrderTypes as Record<string, boolean>) || {
              dineIn: true,
              carService: true,
              pickup: true,
            },
          categories,
          items,
        });

        let tableName: string = resolvedParams.tableId;
        const tableRef = doc(db, "cafes", resolvedParams.cafeId, "tables", resolvedParams.tableId);
        const tableSnap = await getDoc(tableRef);
        if (tableSnap.exists()) {
          const tn = (tableSnap.data() as { name?: string }).name;
          if (tn) tableName = tn;
        }
        setParamsWithTableName({ ...resolvedParams, tableName });
      } catch (err) {
        console.error("Failed to load customer menu:", err);
        setError("Could not load menu");
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [db, resolvedParams.cafeId, resolvedParams.branchId, resolvedParams.tableId, resolvedParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-medium animate-pulse">Brewing your menu...</p>
      </div>
    );
  }
  if (error || !cafeData) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-destructive/10 p-6 rounded-3xl mb-4">
          <p className="text-destructive font-bold text-xl">{error || "Menu Unavailable"}</p>
        </div>
        <p className="text-muted-foreground">Please scan another QR code or contact the cafe staff.</p>
      </div>
    );
  }

  // paramsWithTableName starts as Record<string, unknown> for flexibility while
  // we attach tableName etc.; cast at the boundary back to whatever shape
  // CustomerMenuClient consumes.
  return (
    <CustomerMenuClient
      cafe={cafeData}
      params={(paramsWithTableName || resolvedParams) as unknown as typeof resolvedParams & { tableName?: string }}
    />
  );
}
