"use client";

/**
 * <AmwalCheckoutButton>
 *
 * Drop-in button that opens the Amwal SmartBox checkout popup.
 *
 * Flow:
 *   1. User clicks the button.
 *   2. Component POSTs to /api/payments/checkout with the order amount
 *      and a unique reference. Server returns { scriptUrl, configure }.
 *   3. Component injects SmartBox.js (once, idempotently).
 *   4. Component calls `SmartBox.Checkout.configure = configure` and
 *      `SmartBox.Checkout.showSmartBox()`.
 *   5. Amwal fires completeCallback / errorCallback / cancelCallback —
 *      these are *UX hints only*. The authoritative status update comes
 *      via the server-to-server Cloud Notification webhook
 *      (/api/payments/callback).
 *
 * Usage:
 *   <AmwalCheckoutButton
 *     amount={0.500}
 *     reference={`SUB-${invoiceId}-${Date.now()}`}
 *     items={[{ name: "خطة Popular - شهر", price: 0.500 }]}
 *     onComplete={(data) => router.push("/billing/success")}
 *     onError={(data) => toast.error("فشل الدفع")}
 *     onCancel={() => toast.info("تم إلغاء الدفع")}
 *   >
 *     ادفع 0.500 ر.ع
 *   </AmwalCheckoutButton>
 */

import { useCallback, useState } from "react";

declare global {
  interface Window {
    SmartBox?: {
      Checkout: {
        configure: Record<string, unknown>;
        showSmartBox: () => void;
      };
    };
  }
}

interface CheckoutItem {
  name: string;
  price: number;
  qty?: number;
  description?: string;
}

interface AmwalCheckoutButtonProps {
  amount: number;
  reference?: string;
  items?: CheckoutItem[];
  language?: "ar" | "en";
  viewType?: 1 | 2;
  className?: string;
  disabled?: boolean;
  children: React.ReactNode;
  onComplete?: (data: unknown) => void;
  onError?: (data: unknown) => void;
  onCancel?: () => void;
}

function loadScriptOnce(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Not in browser"));
      return;
    }
    if (window.SmartBox) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-amwal-smartbox="1"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Script failed to load")));
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.dataset.amwalSmartbox = "1";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Script failed to load"));
    document.head.appendChild(s);
  });
}

export default function AmwalCheckoutButton({
  amount,
  reference,
  items,
  language = "ar",
  viewType = 1,
  className,
  disabled,
  children,
  onComplete,
  onError,
  onCancel,
}: AmwalCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    if (loading || disabled) return;
    setLoading(true);
    try {
      // 1. Ask backend for config + secureHash
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, reference, items, language, viewType }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        scriptUrl?: string;
        configure?: Record<string, unknown>;
        message?: string;
      };
      if (!res.ok || !json.success || !json.scriptUrl || !json.configure) {
        throw new Error(json.message || "Failed to create checkout");
      }

      // 2. Load SmartBox.js
      await loadScriptOnce(json.scriptUrl);

      if (!window.SmartBox) {
        throw new Error("SmartBox not available after script load");
      }

      // 3. Wire callbacks then show
      window.SmartBox.Checkout.configure = {
        ...json.configure,
        completeCallback: (data: unknown) => {
          // eslint-disable-next-line no-console
          console.log("[amwal] completeCallback", data);
          onComplete?.(data);
        },
        errorCallback: (data: unknown) => {
          // eslint-disable-next-line no-console
          console.log("[amwal] errorCallback", data);
          onError?.(data);
        },
        cancelCallback: () => {
          // eslint-disable-next-line no-console
          console.log("[amwal] cancelCallback");
          onCancel?.();
        },
      };

      window.SmartBox.Checkout.showSmartBox();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[amwal] checkout init failed", err);
      onError?.(err);
    } finally {
      setLoading(false);
    }
  }, [amount, reference, items, language, viewType, loading, disabled, onComplete, onError, onCancel]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      className={className}
      aria-busy={loading}
    >
      {loading ? "جاري التحضير..." : children}
    </button>
  );
}
