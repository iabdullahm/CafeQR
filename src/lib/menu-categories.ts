/**
 * Default menu-category catalogue for CafeQR.
 *
 * Used as the dropdown source when an owner is creating a product. The
 * actual MenuCategory rows live in Postgres — when a product is saved
 * under a category slug that doesn't exist yet, /api/menu/categories
 * auto-creates the row, so this list is purely UI seeding.
 *
 * Two groups so the dropdown can show them under headers:
 *  - CAFE_CATEGORIES    — coffee shops, juice bars, dessert shops
 *  - RESTAURANT_CATEGORIES — full-service restaurants, fast food, bakeries
 *
 * Add a `group` field if you ever need to tag a tenant as "restaurant only"
 * and hide café categories from their dropdown.
 */

export interface MenuCategoryEntry {
  id: string;
  en: string;
  ar: string;
}

export const CAFE_CATEGORIES: MenuCategoryEntry[] = [
  { id: "hot_drinks",     en: "Hot Drinks",     ar: "المشروبات الساخنة" },
  { id: "cold_drinks",    en: "Cold Drinks",    ar: "المشروبات الباردة" },
  { id: "cold_brew",      en: "Cold Brew",      ar: "كولد برو" },
  { id: "iced_tea",       en: "Iced Tea",       ar: "الشاي المثلج" },
  { id: "specialty_tea",  en: "Specialty Tea",  ar: "الشاي المختص" },
  { id: "hibiscus",       en: "Hibiscus",       ar: "الكركدية" },
  { id: "matcha",         en: "Matcha",         ar: "الماتشا" },
  { id: "smoothies",      en: "Smoothies & Juices", ar: "العصائر والسموذي" },
  { id: "ice_cream",      en: "Ice Cream",      ar: "ايس كريم" },
  { id: "sweets",         en: "Sweets",         ar: "السويتات" },
  { id: "bakery",         en: "Bakery & Pastries", ar: "المخبوزات" },
];

export const RESTAURANT_CATEGORIES: MenuCategoryEntry[] = [
  { id: "breakfast",      en: "Breakfast",      ar: "الإفطار" },
  { id: "appetizers",     en: "Appetizers",     ar: "المقبلات" },
  { id: "soups",          en: "Soups",          ar: "الشوربات" },
  { id: "salads",         en: "Salads",         ar: "السلطات" },
  { id: "mains",          en: "Main Courses",   ar: "الأطباق الرئيسية" },
  { id: "grilled",        en: "Grilled",        ar: "المشاوي" },
  { id: "seafood",        en: "Seafood",        ar: "المأكولات البحرية" },
  { id: "pasta_rice",     en: "Pasta & Rice",   ar: "المعكرونة والأرز" },
  { id: "burgers",        en: "Burgers",        ar: "البرغر" },
  { id: "sandwiches",     en: "Sandwiches & Wraps", ar: "السندويشات والشاورما" },
  { id: "pizza",          en: "Pizza",          ar: "البيتزا" },
  { id: "shawarma",       en: "Shawarma",       ar: "الشاورما" },
  { id: "manakish",       en: "Manakish & Fatayer", ar: "المناقيش والفطاير" },
  { id: "sides",          en: "Sides",          ar: "الجوانب" },
  { id: "desserts",       en: "Desserts",       ar: "الحلويات" },
  { id: "kids_menu",      en: "Kids Menu",      ar: "قائمة الأطفال" },
  { id: "combos",         en: "Combos & Meals", ar: "وجبات وعروض" },
];

/**
 * Combined flat list — used as the dropdown source where we don't yet
 * group entries under section headers. Cafe entries come first because
 * the bulk of current tenants are coffee shops; new restaurant tenants
 * will still see all 17 restaurant entries below the divider.
 */
export const ALL_CATEGORIES: MenuCategoryEntry[] = [
  ...CAFE_CATEGORIES,
  ...RESTAURANT_CATEGORIES,
];

/**
 * Lookup helper — returns the bilingual entry for a slug, or null.
 * Useful when rendering category badges or labels.
 */
export function findCategory(id: string): MenuCategoryEntry | null {
  return ALL_CATEGORIES.find((c) => c.id === id) ?? null;
}
