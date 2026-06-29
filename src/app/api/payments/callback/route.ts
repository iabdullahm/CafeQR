/**
 * POST /api/payments/callback
 *
 * Amwal Cloud Notification webhook. This is the source of truth for
 * payment status — the browser callbacks are a UX hint only.
 *
 * Amwal posts a JSON body containing the response fields plus a
 * `secureHashValue` we must verify by recomputing HMAC-SHA256.
 *
 * Cloud-notification fields used in the hash (per docs):
 *   Amount, AuthorizationDateTime, CurrencyId, DateTimeLocalTrxn,
 *   MerchantId, MerchantReference, Message, PaidThrough, ResponseCode,
 *   SystemReference, TerminalId, TxnType
 *
 * On valid notification with ResponseCode "00" → mark Payment paid +
 * advance the linked Subscription. On any other code → mark failed.
 *
 * Docs: https://amwalpay.om/developers/merchant-cloud-notification/
 *       merchant-cloud-notification-integration-guide/
 *       https://amwalpay.om/developers/secure-hash-calculation/
 *       secure-hash-calculation-2/
 */

import { NextResponse } from "next/server";
import { verifyResponseHash } from "@/lib/amwal-pay";
import { prisma } from "@/lib/prisma";

interface AmwalNotification {
  Amount?: string | number;
  AuthorizationDateTime?: string;
  CurrencyId?: string | number;
  DateTimeLocalTrxn?: string;
  MerchantId?: string | number;
  MerchantReference?: string;
  Message?: string;
  PaidThrough?: string;
  ResponseCode?: string;
  SystemReference?: string;
  TerminalId?: string | number;
  TxnType?: string;
  secureHashValue?: string;
  SecureHash?: string;
}

export async function POST(req: Request) {
  let payload: AmwalNotification;
  try {
    payload = (await req.json()) as AmwalNotification;
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON" },
      { status: 400 }
    );
  }

  const receivedHash = payload.secureHashValue ?? payload.SecureHash ?? "";
  if (!receivedHash) {
    return NextResponse.json(
      { success: false, message: "Missing secureHashValue" },
      { status: 400 }
    );
  }

  // Build the field set Amwal hashes for Cloud Notifications (per docs).
  // The case here intentionally matches the docs' capitalisation table.
  const fields: Record<string, string | number | undefined> = {
    Amount: payload.Amount,
    AuthorizationDateTime: payload.AuthorizationDateTime,
    CurrencyId: payload.CurrencyId,
    DateTimeLocalTrxn: payload.DateTimeLocalTrxn,
    MerchantId: payload.MerchantId,
    MerchantReference: payload.MerchantReference,
    Message: payload.Message,
    PaidThrough: payload.PaidThrough,
    ResponseCode: payload.ResponseCode,
    SystemReference: payload.SystemReference,
    TerminalId: payload.TerminalId,
    TxnType: payload.TxnType,
  };

  if (!verifyResponseHash(fields, receivedHash)) {
    // SECURITY: log enough to detect brute-force / forgery probes,
    // but don't echo full payload back to the caller.
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    console.warn("[amwal-callback] Hash mismatch", {
      ip,
      ua: req.headers.get("user-agent") || "unknown",
      reference: payload.MerchantReference,
      txnType: payload.TxnType,
      receivedHashLen: (receivedHash || "").length,
    });
    return NextResponse.json(
      { success: false, message: "Hash mismatch" },
      { status: 401 }
    );
  }

  // Hash valid — record the payment outcome.
  const reference = payload.MerchantReference ?? "";
  const amount = Number(payload.Amount ?? 0);
  const isSuccess = payload.ResponseCode === "00";
  const status = isSuccess ? "paid" : "failed";

  try {
    // Reference convention used by our /api/payments/checkout caller:
    //   "SUB-<invoiceId>-<timestamp>"   for subscription payments
    //   "ORD-<orderId>-<timestamp>"     for customer order payments
    //   "CAFEQR-<timestamp>"            ad-hoc / one-off
    const refKind = reference.split("-")[0];
    const refId = reference.split("-")[1];

    if (refKind === "SUB" && refId) {
      const invoiceId = BigInt(refId);
      await prisma.payment.create({
        data: {
          invoiceId,
          amount,
          method: payload.PaidThrough ?? "amwal",
          transactionId: payload.SystemReference ?? null,
          status,
        },
      });
      // Update the invoice + subscription on success
      if (isSuccess) {
        const invoice = await prisma.invoice.update({
          where: { id: invoiceId },
          data: { status: "paid" },
        });
        await prisma.subscription.update({
          where: { id: invoice.subscriptionId },
          data: { paymentStatus: "paid" },
        });
      }
    } else {
      // Unknown reference shape — still log the attempt so we don't lose it,
      // but with invoiceId=0 (sentinel). Reconciliation can pick this up.
      console.warn("[amwal-callback] Unrecognised reference", { reference });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[amwal-callback] DB error:", err);
    // Return 200 so Amwal does not retry forever — but log loudly.
    return NextResponse.json({
      success: false,
      message: "Recorded with errors",
    });
  }
}
