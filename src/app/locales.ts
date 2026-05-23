export const translations = {
  en: {
    nav: { works: "How It Works", features: "Features", pricing: "Pricing", login: "Owner Login", start: "Get Started" },
    hero: {
      badge: "Trusted by 50+ cafes in Oman",
      title1: "Your cafe loses 200 OMR a week",
      title2: " — and you don't see it",
      desc: "Customers leave before ordering, staff make mistakes, and you have no idea which item sells. CafeQR fixes all three in 5 minutes.",
      bullets: [
        "3× faster orders — without hiring more staff",
        "Live data: who ordered what, when, and from where",
        "Loyalty system that brings the customer back 5×",
        "Drive-thru ordering — no extra hardware"
      ],
      cta: "Start Free in 5 Minutes →",
      noCard: "No card • Cancel anytime • Arabic 24/7 support",
      demo: "Watch 90s Demo"
    },
    trusted: "Trusted by 50+ cafes in Oman",
    noAppNeeded: "Works on any phone — no app needed",
    pain: {
      title: "What's costing your cafe money right now?",
      list: [
        "Customers waiting → leaving",
        "Staff taking wrong orders",
        "No data about best-selling items",
        "No repeat customers tracking"
      ],
      transition: "CafeQR fixes all of this automatically."
    },
    works: {
      title: "From Scan to Serve — Fully Automated",
      desc: "It's an end-to-end system, not just a digital menu. Watch how it works from the table to the kitchen.",
      steps: [
        { title: "1. Scan", desc: "Customer scans QR from table or car" },
        { title: "2. Order", desc: "Browse menu, customize, place order" },
        { title: "3. Pay", desc: "Online or cash on delivery" },
        { title: "4. Kitchen", desc: "Order appears instantly in kitchen dashboard" },
        { title: "5. Serve", desc: "Customer gets live status updates" }
      ]
    },
    setup: {
      title: "Launch in 5 Minutes",
      steps: [
        "Create account",
        "Upload menu",
        "Print QR",
        "Start receiving orders"
      ]
    },
    roi: {
      title: "Your ROI with CafeQR",
      subtitle: "How much extra can you make?",
      list: [
        { stat: "+25%", text: "more orders during peak hours" },
        { stat: "-40%", text: "order mistakes" },
        { stat: "2x", text: "Faster table turnover" }
      ]
    },
    caseStudies: {
      title: "Three cafe profiles — and how much they earn extra",
      subtitle: "30-day projections based on industry averages and CafeQR pilot data",
      disclaimer: "* Figures are projections based on industry averages and early pilot data, not the actual results of a specific customer. Your numbers will vary by location, menu price, and traffic.",
      labels: {
        before: "Before",
        after: "After 30 days",
        ordersDay: "orders / day",
        revenueDay: "OMR / day",
        errorRate: "error rate",
        extraMonthly: "Extra income / month",
        size: "Size",
        bestFor: "Best for"
      },
      list: [
        {
          tag: "Small",
          name: "Solo / Specialty Café",
          size: "8 tables • 3 staff",
          bestFor: "Owner-operators",
          color: "from-amber-400 to-orange-500",
          before: { orders: 35, revenue: 130, errors: "8%" },
          after:  { orders: 52, revenue: 195, errors: "1%" },
          extraMonthly: "+1,950 OMR",
          highlight: "Recovers a Popular plan in 6 days"
        },
        {
          tag: "Mid",
          name: "Neighbourhood Café",
          size: "12 tables • 5 staff",
          bestFor: "Mid-size cafés",
          color: "from-emerald-500 to-teal-600",
          before: { orders: 60, revenue: 230, errors: "9%" },
          after:  { orders: 88, revenue: 340, errors: "2%" },
          extraMonthly: "+3,300 OMR",
          highlight: "Most cafés in our pilot fit this profile"
        },
        {
          tag: "Drive-thru",
          name: "Drive-thru + Dine-in",
          size: "15 tables + drive-thru lane",
          bestFor: "Cafés with parking + dine-in",
          color: "from-blue-500 to-indigo-600",
          before: { orders: 70, revenue: 280, errors: "11%" },
          after:  { orders: 105, revenue: 420, errors: "2%" },
          extraMonthly: "+4,200 OMR",
          highlight: "Adds drive-thru without buying hardware"
        }
      ]
    },
    usecases: {
      title: "Let Customers Order From Their Cars",
      subtitle: "No Waiting, No Parking Stress",
      list: [
         "Customer scans QR from parking",
         "Enters car number",
         "Orders instantly",
         "Staff delivers to car"
      ]
    },
    features: {
      title: "Everything You Need to Run a Smarter Cafe",
      desc: "Built specifically to boost revenue, speed up service, and slash operational costs.",
      list: [
        { title: "⚡ Instant Ordering", desc: "Customers order without waiting for staff" },
        { title: "📈 Smart Upselling", desc: "Increase order value with combos & suggestions" },
        { title: "🍽 Kitchen Dashboard", desc: "Real-time orders with status control" },
        { title: "🪑 Table Management", desc: "Track active tables and orders live" },
        { title: "🎯 Loyalty System", desc: "Reward repeat customers automatically" },
        { title: "🌍 Multi-Branch Ready", desc: "Manage all branches from one dashboard" }
      ]
    },
    dashboard: {
      title: "Your Cafe. Fully Under Control.",
      desc: "Monitor everything in real-time — from one simple dashboard",
      alertTitle: "New Order Received!",
      alertDesc: "Table 4 • 12.50 OMR"
    },
    priceAnchor: {
      lossLabel: "What you're losing daily",
      lossValue: "28 OMR",
      lossDesc: "from slow orders, mistakes, and missed customers (industry average)",
      planLabel: "What Popular plan costs",
      planValue: "0.30 OMR / day",
      planDesc: "less than a single espresso shot",
      verdictLabel: "Net result",
      verdictValue: "Stop a 28 OMR daily leak — for 0.30 OMR",
      verdictDesc: "approx 93x return on your subscription"
    },
    pricing: {
      preTitle: "How much are you losing without a smart system?",
      preDesc: "Cafes like yours increased orders by 30% while reducing operational costs.",
      title: "Plans that fit every Cafe ☕",
      desc: "No contracts • No complexity • Cancel anytime",
      cards: [
        { name: "Free", planId: "free", desc: "Basic digital menu", price: "0 OMR", priceSub: "Free forever", features: ["QR Menu", "Up to 20 items", "No loyalty", "No analytics"], btn: "Start Free" },
        { name: "Basic", planId: "starter", desc: "For solid beginnings", price: "5 OMR", priceSub: "Less than 0.16 OMR/day", features: ["Full Menu", "QR Ordering", "Order Management"], btn: "Start Now" },
        { name: "Popular ⭐", planId: "growth", tag: "⭐ Most Popular", desc: "For growing cafes", price: "9 OMR", priceSub: "Less than 0.3 OMR/day", features: ["Everything in Basic", "Loyalty System 🎁", "Offers & Discounts", "Basic Analytics", "Notifications"], btn: "Grow Your Cafe" },
        { name: "Business", planId: "pro", desc: "For professional chains", price: "15 OMR", priceSub: "Less than 0.5 OMR/day", features: ["Multi-branch", "Advanced Analytics", "Priority Support", "Custom Branding"], btn: "Start Pro" }
      ],
      offerTitle: "🎉 Launch Offer",
      offerDesc: "🔥 Only 50 Cafes in Oman Get Lifetime 50% Discount",
      offerExample: "Popular Plan: 9 OMR → 4.5 OMR only",
      offerBtn: "Claim Your Spot Now",
      spotsLeft: "17 spots left",
      compareTitle: "Feature Comparison",
      compareHeaders: ["Feature", "Free", "Basic", "Popular ⭐", "Business"],
      compareRows: [
        { name: "QR Menu", values: ["✅", "✅", "✅", "✅"] },
        { name: "Loyalty System", values: ["❌", "❌", "✅", "✅"] },
        { name: "Analytics", values: ["❌", "❌", "✅", "✅"] },
        { name: "Multi-branch", values: ["❌", "❌", "❌", "✅"] }
      ],
      microcopy1: "No credit card required",
      microcopy2: "Instant access",
      footerNote: "Every plan is designed to build your customer base and increase visits ☕"
    },
    reviews: {
      title: "Loved by Cafe Owners",
      list: [
        { name: 'Ahmed', city: 'Brew House', quote: 'We reduced order time by 40%', img: "https://i.pravatar.cc/150?u=awefd" },
        { name: 'Khalid', city: 'Urban Cafe', quote: 'Customers love ordering from their cars', img: "https://i.pravatar.cc/150?u=ssdf" },
      ]
    },
    finalCta: {
      title: "Launch Your QR Menu in 5 Minutes",
      desc: "No setup. No complexity. Just scan and go.",
      btn: "🚀 Start Getting Orders Today"
    },
    bonus: {
      title: "Built for the Way Cafes Actually Work",
      list: [
        "Dine-in QR ordering",
        "Car ordering",
        "Takeaway",
        "No app needed",
        "Arabic & English support"
      ]
    },
    footer: {
      copy: "© 2024 CafeQR. Crafted for modern hospitality.",
      links: ["Terms", "Privacy", "Contact"],
      devLogin: "Developer Login"
    }
  },
  ar: {
    nav: { works: "كيف نعمل", features: "المميزات", pricing: "الأسعار", login: "تسجيل دخول الكافيه", start: "ابدأ الآن" },
    hero: {
      badge: "موثوق من +50 مقهى في عمان",
      title1: "كافيهك يخسر 200 ر.ع كل أسبوع",
      title2: " — وأنت لا تراها",
      desc: "زبائن يغادرون قبل الطلب، أخطاء في الكاشير، ولا تعرف أي منتج يبيع. CafeQR يحل الثلاثة في 5 دقائق إعداد.",
      bullets: [
        "طلبات أسرع 3× — بدون موظف إضافي",
        "بيانات لحظية: من طلب، متى، وماذا",
        "نظام ولاء يُعيد الزبون 5 مرات",
        "طلب من السيارة بدون أجهزة إضافية"
      ],
      cta: "🚀 ابدأ مجاناً في 5 دقائق ←",
      noCard: "بدون بطاقة • إلغاء في ثانية • دعم عربي 24/7",
      demo: "🎬 شاهد الديمو (90 ثانية)"
    },
    trusted: "يعمل مع +50 مقهى في عمان",
    noAppNeeded: "يعمل على أي هاتف — بدون الحاجة لتحميل تطبيق",
    pain: {
      title: "ما الذي يكلف مقهاك أموالاً ضائعة الآن؟",
      list: [
        "زبائن ينتظرون → يغادرون",
        "أخطاء الموظفين في أخذ الطلبات",
        "لا توجد بيانات عن المنتجات الأكثر مبيعاً",
        "لا يوجد تتبع للزبائن المخلصين"
      ],
      transition: "نظام CafeQR يحل كل هذه المشاكل تلقائياً."
    },
    works: {
      title: "من مسح QR إلى التقديم — تجربة سلسة لزبائنك",
      desc: "نظام تشغيلي متكامل يختصر الوقت ويرفع المبيعات.",
      steps: [
        { title: "يمسح QR", desc: "يشوف المنيو فوراً — بدون تحميل تطبيق" },
        { title: "يطلب", desc: "يختار الإضافات ويدفع — بدون انتظار" },
        { title: "للمطبخ مباشرة", desc: "الطلب يوصل للمطبخ — بدون أخطاء" },
        { title: "تجهيز أسرع", desc: "تنظيم تلقائي للطلبات — شاشة للمطبخ" },
        { title: "الاستلام", desc: "الزبون يستلم الطلب — بدون زحمة عند الكاشير" }
      ]
    },
    setup: {
      title: "ابدأ في 5 دقائق",
      steps: [
        "أنشئ حسابك",
        "ارفع المنيو",
        "اطبع كود QR",
        "ابدأ باستقبال الطلبات"
      ]
    },
    roi: {
      title: "عائد الاستثمار مع CafeQR",
      subtitle: "كم يمكنك أن تكسب إضافياً؟",
      list: [
        { stat: "+25%", text: "طلبات أكثر في أوقات الذروة" },
        { stat: "-40%", text: "أخطاء أقل في الطلبات" },
        { stat: "2x", text: "دوران أسرع للطاولات" }
      ]
    },
    caseStudies: {
      title: "ثلاثة أنماط من المقاهي — وكم يكسبون إضافياً",
      subtitle: "توقعات 30 يوم مبنية على متوسطات الصناعة وبيانات المرحلة التجريبية لـ CafeQR",
      disclaimer: "* الأرقام توقعات مبنية على متوسطات الصناعة وبيانات تجريبية، وليست نتائج عميل بعينه. الأرقام الفعلية تختلف حسب الموقع والأسعار وعدد الزبائن.",
      labels: {
        before: "قبل",
        after: "بعد 30 يوماً",
        ordersDay: "طلب/يوم",
        revenueDay: "ر.ع/يوم",
        errorRate: "نسبة الأخطاء",
        extraMonthly: "دخل إضافي/شهر",
        size: "الحجم",
        bestFor: "مناسب لـ"
      },
      list: [
        {
          tag: "صغير",
          name: "مقهى Specialty / مالك واحد",
          size: "8 طاولات • 3 موظفين",
          bestFor: "أصحاب المقاهي الصغيرة",
          color: "from-amber-400 to-orange-500",
          before: { orders: 35, revenue: 130, errors: "8%" },
          after:  { orders: 52, revenue: 195, errors: "1%" },
          extraMonthly: "+1,950 ر.ع",
          highlight: "يسترد تكلفة باقة Popular في 6 أيام"
        },
        {
          tag: "متوسط",
          name: "مقهى الحي",
          size: "12 طاولة • 5 موظفين",
          bestFor: "المقاهي متوسطة الحجم",
          color: "from-emerald-500 to-teal-600",
          before: { orders: 60, revenue: 230, errors: "9%" },
          after:  { orders: 88, revenue: 340, errors: "2%" },
          extraMonthly: "+3,300 ر.ع",
          highlight: "أغلب مقاهي المرحلة التجريبية بهذا الحجم"
        },
        {
          tag: "Drive-thru",
          name: "مقهى مع طلب من السيارة",
          size: "15 طاولة + ممر سيارات",
          bestFor: "المقاهي ذات المواقف + الجلوس",
          color: "from-blue-500 to-indigo-600",
          before: { orders: 70, revenue: 280, errors: "11%" },
          after:  { orders: 105, revenue: 420, errors: "2%" },
          extraMonthly: "+4,200 ر.ع",
          highlight: "يضيف Drive-thru بدون شراء أجهزة"
        }
      ]
    },
    usecases: {
      title: "دع عملائك يطلبون من سياراتهم",
      subtitle: "بدون انتظار، بدون إزعاج المواقف",
      list: [
         "العميل يمسح الـ QR من المواقف",
         "يدخل رقم سيارته",
         "يطلب فوراً",
         "الموظف يوصل الطلب للسيارة"
      ]
    },
    features: {
      title: "كل ما تحتاجه لإدارة مقهى أسرع وأكثر كفاءة",
      desc: "مصمم خصيصاً لزيادة أرباحك وتقليل تكاليف التشغيل.",
      list: [
        { title: "تحكم كامل في الطلبات", desc: "إدارة الطلبات بسلاسة بدون أخطاء وبدون زحمة." },
        { title: "اعرف أكثر المنتجات مبيعًا", desc: "تقارير ذكية تساعدك تضاعف أرباحك." },
        { title: "تجربة أسرع لعملائك", desc: "لا انتظار بعد اليوم، المطبخ يرى الطلبات فوراً." },
        { title: "تنظيم ممتاز للطاولات", desc: "تابع كل طاولة وقدم خدمة مميزة لكل ضيف." },
        { title: "إدارة الفروع بسهولة", desc: "تابع أداء كل فروعك من شاشة واحدة فقط." }
      ]
    },
    dashboard: {
      title: "مقهىك تحت السيطرة بالكامل",
      desc: "تابع الطلبات، الإيرادات، وحالة الطاولات لحظياً من لوحة تحكم بسيطة وسريعة.",
      alertTitle: "تم استلام طلب جديد!",
      alertDesc: "طاولة 4 • 12.50 ر.ع"
    },
    priceAnchor: {
      lossLabel: "ما تخسره يومياً",
      lossValue: "28 ر.ع",
      lossDesc: "من بطء الطلبات، الأخطاء، وزبائن غادروا (متوسط الصناعة)",
      planLabel: "ما تدفعه لخطة Popular",
      planValue: "0.30 ر.ع / يوم",
      planDesc: "أقل من كوب إسبريسو واحد",
      verdictLabel: "النتيجة",
      verdictValue: "أوقف خسارة 28 ر.ع يومياً — بـ 0.30 ر.ع فقط",
      verdictDesc: "حوالي 93× عائد على اشتراكك"
    },
    pricing: {
      preTitle: "كم تخسر يوميًا بدون نظام ذكي؟",
      preDesc: "كافيهات مثل كافيهك زادت طلباتها 30% مع تقليل التكاليف التشغيلية.",
      title: "خطط تناسب كل كافيه ☕",
      desc: "بدون عقود • بدون تعقيد • إلغاء في أي وقت",
      cards: [
        { name: "Free", planId: "free", desc: "باقة مجانية", price: "0 ر.ع", priceSub: "مجاني للأبد", features: ["QR Menu", "حتى 20 منتج", "بدون ولاء", "بدون تقارير"], btn: "ابدأ مجانًا" },
        { name: "Basic", planId: "starter", desc: "لبداية قوية", price: "5 ر.ع", priceSub: "أقل من 0.16 ر.ع يوميًا", features: ["منيو كامل", "طلبات QR", "إدارة طلبات"], btn: "ابدأ الآن" },
        { name: "Popular ⭐", planId: "growth", tag: "⭐ الأكثر استخدامًا", desc: "للمقاهي النامية", price: "9 ر.ع", priceSub: "أقل من 0.3 ر.ع يوميًا", features: ["كل شيء في Basic", "نظام الولاء 🎁", "عروض وخصومات", "تقارير أساسية", "إشعارات"], btn: "ابدأ وطور كافيهك" },
        { name: "Business", planId: "pro", desc: "احترافي / سلاسل", price: "15 ر.ع", priceSub: "أقل من 0.5 ر.ع يوميًا", features: ["فروع متعددة", "تقارير متقدمة", "دعم سريع", "Branding مخصص"], btn: "ابدأ برو" }
      ],
      offerTitle: "🎉 عرض الإطلاق",
      offerDesc: "🔥 أول 50 كافيه في عمان يحصلون على خصم 50% مدى الحياة",
      offerExample: "خطة Popular بسعر 4.5 ر.ع فقط (بدل 9 ر.ع)",
      offerBtn: "احجز مكانك الآن",
      spotsLeft: "متبقي 17 مقعداً",
      compareTitle: "مقارنة بسيطة وواضحة",
      compareHeaders: ["الميزة", "Free", "Basic", "Popular ⭐", "Business"],
      compareRows: [
        { name: "QR Menu", values: ["✅", "✅", "✅", "✅"] },
        { name: "برنامج الولاء", values: ["❌", "❌", "✅", "✅"] },
        { name: "التقارير الذكية", values: ["❌", "❌", "✅", "✅"] },
        { name: "فروع متعددة", values: ["❌", "❌", "❌", "✅"] }
      ],
      microcopy1: "بدون بطاقة بنكية",
      microcopy2: "تجربة فورية",
      footerNote: "كل خطة مصممة لتساعدك في بناء قاعدة عملاء وزيادة زياراتهم ☕"
    },
    reviews: {
      title: "أراء حقيقية لأصحاب المقاهي",
      list: [
        { name: 'أحمد - مؤسس', city: 'Brew House', quote: 'قللنا وقت الانتظار 40%، وارتفعت مبيعاتنا بشكل ملحوظ', img: "https://i.pravatar.cc/150?u=awefd" },
        { name: 'خالد - مالك', city: 'Urban Cafe', quote: 'ميزة الطلب من السيارة زادت طلبات التيك أواي 50%', img: "https://i.pravatar.cc/150?u=ssdf" }
      ]
    },
    finalCta: {
      title: "أطلق المنيو الخاص بك في 5 دقائق",
      desc: "بدون تعقيد، بدون بطاقة بنكية — فقط امسح وابدأ",
      btn: "🚀 ابدأ باستقبال الطلبات اليوم"
    },
    bonus: {
      title: "مصمم للطريقة التي تعمل بها المقاهي بالفعل",
      list: [
        "طلب بالـ QR من الطاولة",
        "طلب من السيارة",
        "طلبات السفري والتيك أواي",
        "بدون تحميل تطبيقات",
        "دعم كامل للعربية والإنجليزية"
      ]
    },
    footer: {
      copy: "© 2024 نظام تشغيل مقاهي حديث .CafeQR SaaS",
      links: ["الشروط", "الخصوصية", "اتصل بنا"],
      devLogin: "دخول المطور"
    }
  }
};
