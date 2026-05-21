/**
 * Amwal Pay SmartBox integration helpers.
 *
 * SmartBox is Amwal's hosted JS checkout widget. The flow is:
 *   1. Backend builds checkout params + computes secureHash (HMAC-SHA256
 *      with merchant secret key as a HEX-decoded buffer).
 *   2. Backend sends config to the browser.
 *   3. Browser loads SmartBox.js, calls SmartBox.Checkout.showSmartBox().
 *   4. User completes payment in popup; Amwal fires completeCallback /
 *      errorCallback / cancelCallback.
 *   5. Amwal also fires a server-to-server Cloud Notification webhook
 *      whose body we verify with a *response* secureHash.
 *
 * Docs: https://amwalpay.om/developers/smartbox/implementation/
 *       https://amwalpay.om/developers/secure-hash-calculation/secure-hash-calculation-2/
 *
 * SECURITY: secureHash MUST be computed server-side. Never expose
 * AMWAL_SECRET_KEY to the browser.
 */

import crypto from "node:crypto";

export type AmwalEnv = "uat" | "production";

export interface AmwalConfig {
  env: AmwalEnv;
  mid: string;
  tid: string;
  secretKey: string;   // hex string
  currencyId: number;  // 512 for OMR
}

export function getAmwalConfig(): AmwalConfig {
  const env = (process.env.AMWAL_ENV ?? "uat") as AmwalEnv;
  const mid = process.env.AMWAL_MID;
  const tid = process.env.AMWAL_TID;
  const secretKey = process.env.AMWAL_SECRET_KEY;
  const currencyId = Number(process.env.AMWAL_CURRENCY_ID ?? 512);

  if (!mid || !tid || !secretKey) {
    throw new Error(
      "Amwal Pay env vars missing. Set AMWAL_MID, AMWAL_TID, AMWAL_SECRET_KEY."
    );
  }
  return { env, mid, tid, secretKey, currencyId };
}

/**
 * Browser script URL — UAT vs production.
 */
export function getSmartBoxScriptUrl(env: AmwalEnv): string {
  return env === "production"
    ? "https://checkout.amwalpg.com/js/SmartBox.js?v=1.1"
    : "https://test.amwalpg.com:7443/js/SmartBox.js?v=1.1";
}

/**
 * Compute HMAC-SHA256 over the canonical key=value&… string, using the
 * merchant secret key as a HEX-decoded byte buffer. Returns UPPERCASE hex.
 *
 * Mirrors the Node example from Amwal's docs.
 */
export function generateSecureHash(
  params: Record<string, string | number | undefined | null>,
  hexKey: string
): string {
  // 1. Sort keys A→Z, skip undefined/null, coerce values to string
  const sortedKeys = Object.keys(params).sort();
  const dataString = sortedKeys
    .filter((k) => params[k] !== undefined && params[k] !== null)
    .map((k) => `${k}=${params[k]}`)
    .join("&");

  // 2. HMAC-SHA256(hexKey-as-bytes, dataString-utf8) → upper hex
  const keyBytes = Buffer.from(hexKey, "hex");
  return crypto
    .createHmac("sha256", keyBytes)
    .update(dataString, "utf8")
    .digest("hex")
    .toUpperCase();
}

/**
 * Build the SmartBox.Checkout.configure object that the browser will use.
 *
 * The hash input intentionally uses *capitalised* keys matching what the
 * SmartBox widget will send back in the request — this mirrors the docs'
 * "Amount=…&CurrencyId=…&MerchantId=…&…" example.
 */
export interface BuildCheckoutInput {
  amountTrxn: string;          // e.g. "1.025" — must equal sum of OrderItems
  merchantReference: string;   // unique per attempt, e.g. "SUB-42-1716173400"
  trxDateTime: string;         // "YYYY-MM-DD HH:mm:ss" local time
  languageId?: "en" | "ar";
  paymentViewType?: 1 | 2;     // 1=popup, 2=full screen
  contactInfoType?: 1 | 2 | 3 | 4;
  sessionToken?: string;       // optional, recurring only
  orderItems?: Array<{
    Name: string;
    DescriptionOne?: string;
    DescriptionTwo?: string;
    Price: string;             // "OMR 0.500"
  }>;
  primaryColor?: string;       // e.g. "#F97316" to match CafeQR brand
}

export interface SmartBoxClientConfig {
  scriptUrl: string;
  configure: Record<string, unknown>;
}

export function buildCheckoutConfig(
  input: BuildCheckoutInput
): SmartBoxClientConfig {
  const cfg = getAmwalConfig();

  // The hash uses the canonical capitalised request keys. This set matches
  // the docs' "Request Hash Example":
  //   Amount, CurrencyId, MerchantId, MerchantReference,
  //   RequestDateTime, SessionToken, TerminalId
  const hashParams: Record<string, string | number> = {
    Amount: input.amountTrxn,
    CurrencyId: cfg.currencyId,
    MerchantId: cfg.mid,
    MerchantReference: input.merchantReference,
    RequestDateTime: input.trxDateTime,
    SessionToken: input.sessionToken ?? "",
    TerminalId: cfg.tid,
  };

  const secureHash = generateSecureHash(hashParams, cfg.secretKey);

  return {
    scriptUrl: getSmartBoxScriptUrl(cfg.env),
    configure: {
      MID: cfg.mid,
      TID: cfg.tid,
      CurrencyId: cfg.currencyId,
      AmountTrxn: input.amountTrxn,
      MerchantReference: input.merchantReference,
      LanguageId: input.languageId ?? "ar",
      PaymentViewType: input.paymentViewType ?? 1,
      TrxDateTime: input.trxDateTime,
      SessionToken: input.sessionToken ?? "",
      ContactInfoType: input.contactInfoType ?? 1,
      OrderItems: input.orderItems ?? [],
      IgnoreReceipt: "false",
      SecureHash: secureHash,
      SmartBoxColorConfig: {
        PrimaryColor: input.primaryColor ?? "#F97316", // CafeQR orange
      },
    },
  };
}

/**
 * Verify a *response* secureHash (callback or Cloud Notification).
 * Returns true if the recomputed hash matches the one Amwal sent.
 *
 * Field-name casing differs between callback and Cloud Notification — see
 * docs. We accept the exact field set the caller provides.
 */
export function verifyResponseHash(
  responseFields: Record<string, string | number | undefined | null>,
  receivedHash: string
): boolean {
  const cfg = getAmwalConfig();
  // Strip the hash field itself from the input if it's present.
  const filtered: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(responseFields)) {
    if (k.toLowerCase() === "securehashvalue" || k.toLowerCase() === "securehash") continue;
    if (v === undefined || v === null) continue;
    filtered[k] = v as string | number;
  }
  const expected = generateSecureHash(filtered, cfg.secretKey);
  // Constant-time compare to defend against timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "utf8"),
      Buffer.from(receivedHash.toUpperCase(), "utf8")
    );
  } catch {
    return false;
  }
}

/**
 * Helper: format a JS Date as "YYYY-MM-DD HH:mm:ss" in UTC.
 * (Amwal docs use both ISO-8601 and this form; this one is what the
 * SmartBox widget example uses.)
 */
export function formatTrxDateTime(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
  );
}
