import CustomerMenuClient from "./CustomerMenuClient";

const DUMMY_CAFE = {
  id: "cafe-1",
  name: "Urban Brew",
  branch: "Downtown",
  logo: "https://picsum.photos/seed/logo/150/150",
  coverImage: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=800&fit=crop",
  loyalty: { cups: 4, required: 8 },
  currency: "OMR",
  categories: [
    { id: 'c1', nameEn: 'Hot Coffee', nameAr: 'قهوة ساخنة' },
    { id: 'c2', nameEn: 'Cold Drinks', nameAr: 'مشروبات باردة' },
    { id: 'c3', nameEn: 'Desserts', nameAr: 'حلويات' }
  ],
  items: [
    { 
      id: 'i1', categoryId: 'c1', 
      nameEn: 'Spanish Latte', nameAr: 'سبانش لاتيه',
      descEn: 'Rich espresso with sweetened condensed milk and textured milk.', descAr: 'اسبريسو غني مع حليب مكثف محلى وحليب مبخر.',
      price: 2.2, image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=400&fit=crop', tags: ['popular'],
      options: [
        { id: 'o1', nameEn: 'Size', nameAr: 'الحجم', required: true, type: 'single', choices: [
          { nameEn: 'Small', nameAr: 'صغير', price: 0 },
          { nameEn: 'Medium', nameAr: 'وسط', price: 0.3 },
          { nameEn: 'Large', nameAr: 'كبير', price: 0.5 }
        ]},
        { id: 'o2', nameEn: 'Milk', nameAr: 'الحليب', required: true, type: 'single', choices: [
          { nameEn: 'Full Fat', nameAr: 'كامل الدسم', price: 0 },
          { nameEn: 'Low Fat', nameAr: 'قليل الدسم', price: 0 },
          { nameEn: 'Oat Milk', nameAr: 'حليب الشوفان', price: 0.4 }
        ]},
        { id: 'o3', nameEn: 'Add-ons', nameAr: 'إضافات', required: false, type: 'multiple', choices: [
          { nameEn: 'Extra Shot', nameAr: 'شوت إضافي', price: 0.5 },
          { nameEn: 'Caramel Syrup', nameAr: 'سيرب كراميل', price: 0.2 },
          { nameEn: 'Vanilla Syrup', nameAr: 'سيرب فانيلا', price: 0.2 }
        ]}
      ]
    },
    { 
      id: 'i2', categoryId: 'c1', 
      nameEn: 'Flat White', nameAr: 'فلات وايت',
      descEn: 'Double shot of espresso with micro-foamed milk.', descAr: 'شوت مزدوج من الإسبريسو مع طبقة رقيقة من رغوة الحليب.',
      price: 1.8, image: 'https://images.unsplash.com/photo-1582046422703-a1a67dd0ab17?q=80&w=400&fit=crop', tags: [],
      options: [
        { id: 'o1', nameEn: 'Milk', nameAr: 'الحليب', required: true, type: 'single', choices: [
          { nameEn: 'Full Fat', nameAr: 'كامل الدسم', price: 0 },
          { nameEn: 'Low Fat', nameAr: 'قليل الدسم', price: 0 },
          { nameEn: 'Oat Milk', nameAr: 'حليب الشوفان', price: 0.4 }
        ]}
      ]
    },
    { 
      id: 'i3', categoryId: 'c2', 
      nameEn: 'Iced Matcha Latte', nameAr: 'آيس ماتشا لاتيه',
      descEn: 'Premium Japanese matcha green tea blended with milk and ice.', descAr: 'شاي الماتشا الياباني الفاخر ممزوج مع الحليب والثلج.',
      price: 2.5, image: 'https://images.unsplash.com/photo-1536281478144-8d9bafc692a4?q=80&w=400&fit=crop', tags: ['new', 'popular'],
      options: [
        { id: 'o1', nameEn: 'Size', nameAr: 'الحجم', required: true, type: 'single', choices: [
          { nameEn: 'Medium', nameAr: 'وسط', price: 0 },
          { nameEn: 'Large', nameAr: 'كبير', price: 0.4 }
        ]},
        { id: 'o2', nameEn: 'Sweetness', nameAr: 'نسبة الحلاوة', required: true, type: 'single', choices: [
          { nameEn: 'Normal', nameAr: 'طبيعي', price: 0 },
          { nameEn: 'Less Sweet', nameAr: 'حلاوة أقل', price: 0 },
          { nameEn: 'No Sugar', nameAr: 'بدون سكر', price: 0 }
        ]}
      ]
    },
    { 
      id: 'i4', categoryId: 'c3', 
      nameEn: 'Saffron Milk Cake', nameAr: 'كيكة الحليب بالزعفران',
      descEn: 'Ultra-soft sponge cake soaked in saffron-infused milk sauce.', descAr: 'كيكة إسفنجية ناعمة جداً مغموسة بصلصة الحليب بالزعفران الفاخر.',
      price: 3.0, image: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?q=80&w=400&fit=crop', tags: ['popular'],
      options: []
    }
  ]
};

export default function CustomerInterfacePage({ params }: { params: { cafeId: string, branchId: string, tableId: string } }) {
  // Pass mocked dynamic data into the massive highly-designed Client component
  return <CustomerMenuClient cafe={DUMMY_CAFE} params={params} />;
}
