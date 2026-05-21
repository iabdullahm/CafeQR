/**
 * /billing/test — manual Amwal Pay sandbox test page.
 *
 * Renders a single "ادفع 0.500 ر.ع" button. Use the UAT test card:
 *   4000 0000 0000 2701 | 06/29 | 587   (limit 1 OMR)
 *
 * After payment, the browser callbacks log to console; the authoritative
 * status update arrives at /api/payments/callback (Cloud Notification).
 */

"use client";

import { useEffect, useState } from "react";
import AmwalCheckoutButton from "@/components/amwal-checkout-button";

export default function BillingTestPage() {
  const [status, setStatus] = useState<string>("");
  // Generate reference on the client only to avoid SSR/CSR hydration mismatch
  // (Date.now() would differ between server render and client hydration).
  const [reference, setReference] = useState<string>("");
  useEffect(() => {
    setReference(`SUB-1-${Date.now()}`);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <header className="text-center space-y-2">
          <h1 className="text-2xl font-bold">اختبار دفع Amwal Pay</h1>
          <p className="text-sm text-neutral-500">
            UAT — بطاقة 4000 0000 0000 2701 / 06/29 / 587 (حد 1 ر.ع)
          </p>
        </header>

        <div className="rounded-xl bg-orange-50 border border-orange-200 p-4 text-sm text-orange-900">
          <p className="font-semibold mb-1">معلومات الدفع التجريبي</p>
          <ul className="space-y-1">
            <li>المبلغ: 0.500 ر.ع</li>
            <li suppressHydrationWarning>المرجع: {reference || "..."}</li>
            <li>التاجر: MID 197813 / TID 653329</li>
          </ul>
        </div>

        <AmwalCheckoutButton
          amount={0.5}
          reference={reference || undefined}
          items={[
            {
              name: "خطة Popular - شهر اختبار",
              price: 0.5,
              description: "اشتراك شهري CafeQR",
            },
          ]}
          language="ar"
          viewType={1}
          className="w-full py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 active:bg-orange-700 disabled:opacity-50 transition"
          onComplete={(data) => setStatus(`✅ تم: ${JSON.stringify(data).slice(0, 200)}`)}
          onError={(data) => setStatus(`❌ خطأ: ${JSON.stringify(data).slice(0, 200)}`)}
          onCancel={() => setStatus("⚠️ تم الإلغاء")}
        >
          ادفع 0.500 ر.ع
        </AmwalCheckoutButton>

        {status && (
          <pre className="text-xs bg-neutral-100 p-3 rounded-lg whitespace-pre-wrap break-all">
            {status}
          </pre>
        )}
      </div>
    </div>
  );
}
