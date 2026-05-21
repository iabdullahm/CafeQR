/**
 * POST /api/payments/checkout
 *
 * Builds the SmartBox checkout config server-side and returns it to the
 * browser. The browser then loads SmartBox.js (Amwal CDN) and calls
 * SmartBox.Checkout.showSmartBox() with the returned `configure` object.
 *
 * Body:
 *   {
 *     amount: number,            // OMR, e.g. 0.500
 *     reference: string,         // unique per attempt (e.g. "SUB-42-1716173400")
 *     items?: [{ name, price, qty? }],
 *     language?: "ar" | "en",
 *     viewType?: 1 | 2,          // 1=popup, 2=full screen
 *   }
 *
 * Response:
 *   { scriptUrl: string, configure: {...} }
 */

import { NextResponse } from "next/server";
import {
  buildCheckoutConfig,
  formatTrxDateTime,
} from "@/lib/amwal-pay";

interface CheckoutItem {
  name: string;
  price: number;        // OMR
  qty?: number;
  description?: string;
}

interface CheckoutBody {
  amount: number;
  reference?: string;
  items?: CheckoutItem[];
  language?: "ar" | "en";
  viewType?: 1 | 2;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CheckoutBody;

    if (!body || typeof body.amount !== "number" || body.amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid amount" },
        { status: 400 }
      );
    }

    // Amwal expects amount as a string with 3 decimal places (OMR baisas).
    const amountTrxn = body.amount.toFixed(3);

    // If reference is not supplied, mint a default one. In production the
    // caller should always supply a stable reference tied to a domain row
    // (e.g. subscription invoice ID) so we can reconcile in the webhook.
    const merchantReference =
      body.reference?.trim() || `CAFEQR-${Date.now()}`;

    // Format order items if provided
    const orderItems = (body.items ?? []).map((it) => ({
      Name: it.name,
      DescriptionOne: it.description ?? "",
      DescriptionTwo: `Quantity: ${it.qty ?? 1}`,
      Price: `OMR ${(it.price * (it.qty ?? 1)).toFixed(3)}`,
    }));

    const config = buildCheckoutConfig({
      amountTrxn,
      merchantReference,
      trxDateTime: formatTrxDateTime(),
      languageId: body.language ?? "ar",
      paymentViewType: body.viewType ?? 1,
      orderItems: orderItems.length > 0 ? orderItems : undefined,
    });

    // Dev-only diagnostics — logs the exact params + hash so we can compare
    // against what Amwal sees in their portal logs.
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[amwal-checkout] config built:", {
        mid: (config.configure as { MID?: string }).MID,
        tid: (config.configure as { TID?: string }).TID,
        amountTrxn: (config.configure as { AmountTrxn?: string }).AmountTrxn,
        reference: (config.configure as { MerchantReference?: string }).MerchantReference,
        trxDateTime: (config.configure as { TrxDateTime?: string }).TrxDateTime,
        secureHash: (config.configure as { SecureHash?: string }).SecureHash,
      });
    }

    return NextResponse.json({ success: true, ...config });
  } catch (err) {
    console.error("[/api/payments/checkout] error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
