/**
 * /calculator — interactive "how much are you losing daily?" tool.
 *
 * This is a lead magnet, NOT a precise audit. The math uses
 * widely-quoted hospitality industry averages:
 *   • ~12% walk-away rate from queue/wait friction
 *   • ~8% of orders contain a mistake costing a remake / refund
 *   • ~15% upsell uplift that paper menus + verbal orders miss
 *   • ~2 cashier-minutes per ticket that QR ordering reclaims
 *
 * Numbers update live as the cafe owner moves the sliders, so the
 * loss feels personal. The CTA at the bottom converts loss → CafeQR
 * subscription comparison and pushes them into the signup flow.
 */

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

// ---------- Helpers ----------
function omr(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}
function omrShort(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

// ---------- Input row ----------
interface InputRowProps {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (n: number) => void;
}
function InputRow({ label, hint, value, min, max, step, unit, onChange }: InputRowProps) {
  return (
    <div className="rounded-2xl bg-white border border-zinc-200 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="min-w-0">
          <p className="text-sm font-black text-zinc-900">{label}</p>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">{hint}</p>
        </div>
        <div className="flex items-baseline gap-1 shrink-0">
          <span className="text-2xl font-black text-amber-600 font-mono">{value}</span>
          <span className="text-xs font-bold text-zinc-400">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-zinc-100 rounded-full appearance-none cursor-pointer accent-amber-600"
      />
      <div className="flex justify-between text-[10px] text-zinc-400 font-mono mt-1">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

// ---------- Result card ----------
interface ResultCardProps {
  label: string;
  value: string;
  unit: string;
  tone: "rose" | "amber" | "emerald";
  size?: "md" | "lg";
}
function ResultCard({ label, value, unit, tone, size = "md" }: ResultCardProps) {
  const toneClasses: Record<typeof tone, string> = {
    rose: "from-rose-50 to-rose-100/60 border-rose-200 text-rose-700",
    amber: "from-amber-50 to-amber-100/60 border-amber-200 text-amber-700",
    emerald: "from-emerald-50 to-emerald-100/60 border-emerald-300 text-emerald-700",
  };
  const valueSize = size === "lg" ? "text-5xl lg:text-6xl" : "text-3xl lg:text-4xl";
  return (
    <div className={`rounded-3xl bg-gradient-to-br ${toneClasses[tone]} border-2 p-6 flex flex-col`}>
      <p className="text-xs font-black uppercase tracking-wider opacity-80 mb-2">{label}</p>
      <p className={`${valueSize} font-black font-mono leading-none mb-1`}>{value}</p>
      <p className="text-xs font-bold opacity-70">{unit}</p>
    </div>
  );
}

// ---------- Main page ----------
export default function CalculatorPage() {
  // Sliders
  const [customers, setCustomers] = useState(60);     // customers/day
  const [avgOrder, setAvgOrder] = useState(3.5);      // OMR per order
  const [hours, setHours] = useState(12);             // operating hours
  const [waitMins, setWaitMins] = useState(4);        // avg wait minutes per order

  // ---- Loss model ----
  // Each percentage represents the fraction of revenue typically reclaimed
  // by a QR-ordering + KDS system per published hospitality studies.
  const dailyRevenue = customers * avgOrder;

  // Walk-away loss scales with wait time. 4-min wait ≈ 12% walk-away.
  const walkAwayRate = Math.min(0.25, 0.03 + waitMins * 0.025);
  const lossWalkAway = dailyRevenue * walkAwayRate;

  // Order-error remakes / refunds — fixed at ~8% of order value.
  const lossErrors = dailyRevenue * 0.08;

  // Missed upsell (combos / add-ons) — paper + verbal menus skip ~15% uplift.
  const lossUpsell = dailyRevenue * 0.15;

  // Cashier opportunity cost — 2 mins per ticket, valued at 2 OMR/hour wage.
  const lossCashier = (customers * 2 * (2 / 60));

  const dailyLoss = lossWalkAway + lossErrors + lossUpsell + lossCashier;
  const monthlyLoss = dailyLoss * 30;
  const yearlyLoss = dailyLoss * 365;

  // Comparison: CafeQR Popular at 9 OMR / month = 0.30 OMR / day
  const cafeqrDaily = 0.30;
  const roiMultiple = useMemo(
    () => Math.round(dailyLoss / cafeqrDaily),
    [dailyLoss]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/40 via-white to-zinc-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <Link
            href="/"
            className="inline-block text-xs font-bold text-zinc-500 hover:text-amber-600 mb-4"
          >
            ← العودة للرئيسية
          </Link>
          <div className="inline-block bg-rose-100 text-rose-700 font-black px-4 py-1.5 rounded-full text-xs mb-4 border border-rose-200 tracking-wider uppercase">
            حاسبة الخسارة اليومية
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-zinc-900 mb-3 [text-wrap:balance]">
            احسب كم يخسر كافيهك يومياً
          </h1>
          <p className="text-zinc-600 font-medium max-w-2xl mx-auto [text-wrap:balance]">
            حرّك الأشرطة لتعكس واقع كافيهك — وسترى الخسارة الحقيقية لحظياً.
            الأرقام مبنية على متوسطات الصناعة، وليست تقديراً دقيقاً.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Inputs */}
          <div className="space-y-4">
            <InputRow
              label="عدد الزبائن يومياً"
              hint="متوسط عدد الزبائن الذين يطلبون"
              value={customers}
              min={10}
              max={300}
              step={5}
              unit="زبون"
              onChange={setCustomers}
            />
            <InputRow
              label="متوسط قيمة الطلب"
              hint="بالريال العماني (ر.ع)"
              value={avgOrder}
              min={0.5}
              max={15}
              step={0.5}
              unit="ر.ع"
              onChange={setAvgOrder}
            />
            <InputRow
              label="ساعات العمل اليومية"
              hint="من الفتح إلى الإغلاق"
              value={hours}
              min={4}
              max={24}
              step={1}
              unit="ساعة"
              onChange={setHours}
            />
            <InputRow
              label="متوسط وقت انتظار الطلب"
              hint="من الطلب إلى الاستلام"
              value={waitMins}
              min={1}
              max={15}
              step={1}
              unit="دقيقة"
              onChange={setWaitMins}
            />

            {/* Inputs summary */}
            <div className="rounded-2xl bg-zinc-50 border border-zinc-200 p-4 text-sm">
              <p className="font-bold text-zinc-700">
                📊 الإيراد اليومي الحالي:{" "}
                <span className="text-zinc-900 font-mono">{omr(dailyRevenue)} ر.ع</span>
              </p>
              <p className="text-xs text-zinc-500 font-medium mt-1">
                {customers} زبون × {avgOrder} ر.ع
              </p>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            {/* The big number */}
            <ResultCard
              label="خسارة يومية تقديرية"
              value={omr(dailyLoss)}
              unit="ريال عماني / يوم"
              tone="rose"
              size="lg"
            />

            <div className="grid grid-cols-2 gap-4">
              <ResultCard
                label="خسارة شهرية"
                value={omrShort(monthlyLoss)}
                unit="ر.ع / شهر"
                tone="amber"
              />
              <ResultCard
                label="خسارة سنوية"
                value={omrShort(yearlyLoss)}
                unit="ر.ع / سنة"
                tone="amber"
              />
            </div>

            {/* Breakdown */}
            <div className="rounded-2xl bg-white border border-zinc-200 p-5">
              <p className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-3">
                تفصيل الخسارة اليومية
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center justify-between">
                  <span className="text-zinc-600">زبائن يغادرون بسبب الانتظار</span>
                  <span className="font-bold font-mono text-rose-600">{omr(lossWalkAway)}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-zinc-600">أخطاء وإعادة طلبات</span>
                  <span className="font-bold font-mono text-rose-600">{omr(lossErrors)}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-zinc-600">فرص upsell ضائعة</span>
                  <span className="font-bold font-mono text-rose-600">{omr(lossUpsell)}</span>
                </li>
                <li className="flex items-center justify-between border-t pt-2 border-zinc-100">
                  <span className="text-zinc-600">وقت الكاشير المُهدر</span>
                  <span className="font-bold font-mono text-rose-600">{omr(lossCashier)}</span>
                </li>
              </ul>
            </div>

            {/* Verdict */}
            <div className="rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-6 shadow-2xl shadow-emerald-500/30">
              <p className="text-xs font-black uppercase tracking-wider opacity-90 mb-2">
                ❓ ماذا لو استعدت هذه الخسارة؟
              </p>
              <p className="text-lg font-black mb-3 leading-snug">
                CafeQR بـ <span className="font-mono">0.30 ر.ع</span> يومياً
                <br />
                مقابل خسارة <span className="font-mono">{omr(dailyLoss)} ر.ع</span> يومياً
              </p>
              <p className="text-emerald-50 text-sm font-bold mb-5">
                ≈ {roiMultiple}× عائد على استثمارك
              </p>
              <Link
                href="/#pricing"
                className="block w-full text-center py-3 px-6 bg-white text-emerald-700 rounded-full font-black hover:scale-105 transition-transform shadow-lg"
              >
                🚀 ابدأ مجاناً في 5 دقائق ←
              </Link>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="max-w-3xl mx-auto mt-10 text-xs text-zinc-400 font-medium leading-relaxed text-center [text-wrap:balance]">
          * الأرقام تقديرات مبنية على متوسطات الصناعة (دراسات NRA و
          Toast 2024) وليست ضماناً. النتائج الفعلية تختلف حسب الموقع،
          المنيو، وعادات الزبائن. الحاسبة للاستخدام التعليمي.
        </p>
      </div>
    </div>
  );
}
