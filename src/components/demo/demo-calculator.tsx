"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  FileText,
  Shield,
  Search,
  CheckCircle2,
  Sparkles,
  TrendingDown,
  Zap,
  Smartphone,
  RefreshCw,
  Eye,
  Building2,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { PhoneCard } from "@/components/calculator/phone-card";
import { ElectricityCard } from "@/components/calculator/electricity-card";
import { formatNOK } from "@/lib/calculations";
import { usePreview } from "@/components/layout/dashboard-shell";
import { CompanySearch, type Company } from "@/components/demo/company-search";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Settings {
  accountingPercentage: number;
  insurancePercentage: number;
}

type Phase = "input" | "searching" | "revealing" | "done";

interface CategorySavings {
  monthly: number;
  yearly: number;
}

interface Savings {
  accounting: CategorySavings;
  insurance: CategorySavings;
  electricity: CategorySavings;
  phone: CategorySavings;
}

interface SearchSnapshot {
  savings: Savings;
  // Raw yearly costs for accounting + insurance — known because the seller typed them in
  rawCosts: { accounting: number; insurance: number };
}

function parseNum(val: string): number {
  const cleaned = val.replace(/\s/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.max(0, num);
}

// ── Animation hook ────────────────────────────────────────────────────────────

function useAnimatedValue(target: number, active: boolean) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) { setValue(0); return; }
    const startTime = performance.now();
    const DURATION = 1400;

    function animate(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / DURATION, 1);
      const eased = 1 - Math.pow(1 - t, 4); // easeOutQuart
      setValue(Math.round(target * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, active]);

  return active ? value : 0;
}

// ── Scanner animation ─────────────────────────────────────────────────────────

function ScannerAnimation() {
  return (
    <div className="relative flex items-center justify-center w-36 h-36 mx-auto mb-6">
      <div className="absolute inset-0 rounded-full border-2 border-green-300 animate-ping opacity-25" />
      <div
        className="absolute inset-3 rounded-full border-2 border-green-400 animate-ping opacity-20"
        style={{ animationDelay: "0.4s" }}
      />
      <svg
        className="absolute inset-0 animate-spin"
        style={{ animationDuration: "2s" }}
        viewBox="0 0 100 100"
      >
        <defs>
          <linearGradient id="arc-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="1" />
          </linearGradient>
        </defs>
        <circle
          cx="50" cy="50" r="46"
          fill="none"
          stroke="url(#arc-grad)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="72 216"
        />
      </svg>
      <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/40">
        <Search className="w-8 h-8 text-white" />
      </div>
    </div>
  );
}

// ── Search step item ──────────────────────────────────────────────────────────

function StepItem({ label, status }: { label: string; status: "done" | "active" | "pending" }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="flex-shrink-0 w-5 h-5">
        {status === "done" && <CheckCircle2 className="w-5 h-5 text-green-500" />}
        {status === "active" && (
          <div className="w-5 h-5 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
        )}
        {status === "pending" && <div className="w-5 h-5 rounded-full border-2 border-slate-200" />}
      </div>
      <span className={`text-sm flex items-center gap-1 ${
        status === "done" ? "text-slate-600" :
        status === "active" ? "text-slate-900 font-semibold" :
        "text-slate-400"
      }`}>
        {label}
        {status === "active" && (
          <span className="inline-flex gap-0.5 ml-0.5">
            {[0, 150, 300].map((d) => (
              <span
                key={d}
                className="w-1 h-1 bg-green-500 rounded-full animate-bounce inline-block"
                style={{ animationDelay: `${d}ms` }}
              />
            ))}
          </span>
        )}
      </span>
    </div>
  );
}

// ── Individual category result card ──────────────────────────────────────────

function ResultCard({
  Icon, iconBg, iconColor, label, monthly, yearly, visible,
}: {
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  iconBg: string;
  iconColor: string;
  label: string;
  monthly: number;
  yearly: number;
  visible: boolean;
}) {
  const animatedYearly = useAnimatedValue(Math.round(yearly), visible);
  const animatedMonthly = useAnimatedValue(Math.round(monthly), visible);

  return (
    <div className={`card p-5 transition-all duration-700 ${
      visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"
    }`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon className={iconColor} style={{ width: 18, height: 18 }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 text-sm">{label}</h3>
          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            Besparelse funnet
          </span>
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Per måned</p>
          <p className="text-lg font-bold tabular-nums text-emerald-600">{formatNOK(animatedMonthly)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 mb-0.5">Per år</p>
          <p className="text-2xl font-bold tabular-nums text-emerald-600">{formatNOK(animatedYearly)}</p>
        </div>
      </div>
    </div>
  );
}

// ── Enhanced total summary card with charts ───────────────────────────────────

const CATEGORY_COLORS: Record<string, { bar: string; dot: string }> = {
  accounting: { bar: "bg-blue-400",   dot: "bg-blue-500" },
  insurance:  { bar: "bg-purple-400", dot: "bg-purple-500" },
  phone:      { bar: "bg-orange-400", dot: "bg-orange-500" },
  electricity:{ bar: "bg-yellow-400", dot: "bg-yellow-500" },
};

function TotalCard({
  snapshot,
  visible,
}: {
  snapshot: SearchSnapshot;
  visible: boolean;
}) {
  const { savings, rawCosts } = snapshot;

  const totalMonthly = savings.accounting.monthly + savings.insurance.monthly +
                       savings.electricity.monthly + savings.phone.monthly;
  const totalYearly  = savings.accounting.yearly + savings.insurance.yearly +
                       savings.electricity.yearly + savings.phone.yearly;

  const animatedMonthly = useAnimatedValue(Math.round(totalMonthly), visible);
  const animatedYearly  = useAnimatedValue(Math.round(totalYearly), visible);

  // Trigger bar animations slightly after the card becomes visible
  const [barsActive, setBarsActive] = useState(false);
  useEffect(() => {
    if (!visible) { setBarsActive(false); return; }
    const t = setTimeout(() => setBarsActive(true), 200);
    return () => clearTimeout(t);
  }, [visible]);

  const categories = [
    { key: "accounting",  label: "Regnskap",  yearly: savings.accounting.yearly },
    { key: "insurance",   label: "Forsikring", yearly: savings.insurance.yearly },
    { key: "phone",       label: "Telefoni",   yearly: savings.phone.yearly },
    { key: "electricity", label: "Strøm",      yearly: savings.electricity.yearly },
  ].filter((c) => c.yearly > 0);

  const maxYearly = Math.max(...categories.map((c) => c.yearly), 1);

  // Before/after comparison — only meaningful when we have the full cost for a category
  const knownCurrentCost = rawCosts.accounting + rawCosts.insurance;
  const knownSavings     = savings.accounting.yearly + savings.insurance.yearly;
  const knownNewCost     = knownCurrentCost - knownSavings;
  const savingsPct       = knownCurrentCost > 0 ? (knownSavings / knownCurrentCost) * 100 : 0;

  return (
    <div className={`transition-all duration-700 ${visible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
      <div className="rounded-xl border border-emerald-400 shadow-lg shadow-emerald-500/20 overflow-hidden">

        {/* ── Green header ── */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-5 h-5 text-emerald-200" />
                <p className="text-sm font-semibold uppercase tracking-wider text-emerald-100">
                  Total estimert besparelse
                </p>
              </div>
              <div className="flex items-baseline gap-4">
                <div>
                  <p className="text-sm mb-0.5 text-emerald-200">Per måned</p>
                  <p className="text-3xl font-bold tabular-nums text-white">{formatNOK(animatedMonthly)}</p>
                </div>
                <div className="w-px h-10 bg-emerald-400/40" />
                <div>
                  <p className="text-sm mb-0.5 text-emerald-200">Per år</p>
                  <p className="text-4xl font-bold tabular-nums text-white">{formatNOK(animatedYearly)}</p>
                </div>
              </div>
            </div>

            {/* Category dot legend */}
            {categories.length > 0 && (
              <div className="flex-shrink-0 space-y-1.5 min-w-[150px]">
                <p className="text-xs text-emerald-200 font-semibold uppercase tracking-wider mb-2">
                  Fordeling
                </p>
                {categories.map((c) => (
                  <div key={c.key} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${CATEGORY_COLORS[c.key].dot}`} />
                    <span className="text-xs text-emerald-100 flex-1">{c.label}</span>
                    <span className="text-xs font-semibold text-white tabular-nums">
                      {formatNOK(c.yearly)}/år
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── White section: bar chart + before/after ── */}
        <div className="bg-white p-6 space-y-6">

          {/* Horizontal bar chart */}
          {categories.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                Besparelse per kategori
              </p>
              <div className="space-y-3">
                {categories.map((c) => {
                  const barPct = (c.yearly / maxYearly) * 100;
                  const sharePct = totalYearly > 0 ? (c.yearly / totalYearly) * 100 : 0;
                  return (
                    <div key={c.key} className="flex items-center gap-3">
                      <span className="text-xs text-slate-600 w-20 flex-shrink-0 text-right">{c.label}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-3 rounded-full ${CATEGORY_COLORS[c.key].bar} transition-all duration-1000 ease-out`}
                          style={{ width: barsActive ? `${barPct}%` : "0%" }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-800 tabular-nums w-28 text-right">
                        {formatNOK(c.yearly)}/år
                      </span>
                      <span className="text-xs text-slate-400 w-8 text-right">
                        {Math.round(sharePct)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Before / after cost comparison — only shown when seller entered cost for acc or ins */}
          {knownCurrentCost > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Kostnadsoversikt — Regnskap & Forsikring
                </p>
                {savingsPct > 0 && (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    −{savingsPct.toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="flex items-stretch gap-3">
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">Nåværende kostnad</p>
                  <p className="text-xl font-bold text-slate-800 tabular-nums">{formatNOK(knownCurrentCost)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">per år</p>
                </div>
                <div className="flex items-center flex-shrink-0">
                  <ArrowRight className="w-4 h-4 text-slate-300" />
                </div>
                <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">Estimert ny kostnad</p>
                  <p className="text-xl font-bold text-emerald-600 tabular-nums">{formatNOK(knownNewCost)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">per år</p>
                </div>
              </div>

              {/* Stacked before/after bar visualisation */}
              <div className="mt-4 space-y-2">
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Nåværende</span>
                    <span>{formatNOK(knownCurrentCost)}/år</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-3 rounded-full bg-slate-400 transition-all duration-1000 ease-out"
                      style={{ width: barsActive ? "100%" : "0%" }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Estimert ny</span>
                    <span>{formatNOK(knownNewCost)}/år</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-3 rounded-full bg-emerald-500 transition-all duration-1000 ease-out"
                      style={{ width: barsActive ? `${(knownNewCost / knownCurrentCost) * 100}%` : "0%" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Regnskap card (demo version) ─────────────────────────────────────────────

const BILAG_OPTIONS = ["0–20", "20–40", "40–60", "60+"];

function DemoAccountingCard({
  percentage,
  onSavings,
  onHasData,
  onRawCost,
  onCrmFocusChange,
}: {
  percentage: number;
  onSavings: (monthly: number, yearly: number) => void;
  onHasData: (has: boolean) => void;
  onRawCost: (yearly: number) => void;
  onCrmFocusChange: (focused: boolean) => void;
}) {
  const [cost, setCost] = useState("");
  const [ansatte, setAnsatte] = useState("");
  const [system, setSystem] = useState("");
  const [bilag, setBilag] = useState("");

  const savings = useMemo(() => {
    const yearly = parseNum(cost);
    const yearlySavings = yearly * (percentage / 100);
    return { monthly: yearlySavings / 12, yearly: yearlySavings };
  }, [cost, percentage]);

  useEffect(() => { onSavings(savings.monthly, savings.yearly); }, [savings, onSavings]);
  useEffect(() => { onHasData(cost !== ""); }, [cost, onHasData]);
  useEffect(() => { onRawCost(parseNum(cost)); }, [cost, onRawCost]);

  function handleCrmFocus() { onCrmFocusChange(true); }
  function handleCrmBlur(e: React.FocusEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) onCrmFocusChange(false);
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <FileText className="text-blue-600" style={{ width: 18, height: 18 }} />
        </div>
        <h3 className="font-semibold text-slate-900 text-sm">Regnskap</h3>
      </div>

      {/* Calculator field */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Årlig kostnad
        </label>
        <div className="relative">
          <input
            type="text"
            inputMode="decimal"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="180 000"
            className="input-field pr-14"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 pointer-events-none">
            kr/år
          </span>
        </div>
      </div>

      {/* CRM-only fields — do not affect savings or button visibility */}
      <div
        onFocus={handleCrmFocus}
        onBlur={handleCrmBlur}
        className="mt-4 pt-4 border-t border-slate-100 space-y-3"
      >
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
          Salgsinformasjon
        </p>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Ansatte
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={ansatte}
            onChange={(e) => setAnsatte(e.target.value)}
            placeholder="0"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            System
          </label>
          <input
            type="text"
            value={system}
            onChange={(e) => setSystem(e.target.value)}
            placeholder="F.eks. Visma, Fiken..."
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Bilag/mnd
          </label>
          <div className="relative">
            <select
              value={bilag}
              onChange={(e) => setBilag(e.target.value)}
              className="w-full appearance-none text-sm px-2.5 py-2 pr-7 border border-slate-200 rounded-lg bg-white text-slate-800
                focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            >
              <option value="">–</option>
              {BILAG_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Forsikring card (demo version) ────────────────────────────────────────────

function DemoInsuranceCard({
  percentage,
  onSavings,
  onHasData,
  onRawCost,
  company,
}: {
  percentage: number;
  onSavings: (monthly: number, yearly: number) => void;
  onHasData: (has: boolean) => void;
  onRawCost: (yearly: number) => void;
  company: Company | null;
}) {
  const [cost, setCost] = useState("");
  const [claims, setClaims] = useState(""); // non-calculator, sales info only

  const savings = useMemo(() => {
    const yearly = parseNum(cost);
    const yearlySavings = yearly * (percentage / 100);
    return { monthly: yearlySavings / 12, yearly: yearlySavings };
  }, [cost, percentage]);

  useEffect(() => { onSavings(savings.monthly, savings.yearly); }, [savings, onSavings]);
  useEffect(() => { onHasData(cost !== ""); }, [cost, onHasData]);
  useEffect(() => { onRawCost(parseNum(cost)); }, [cost, onRawCost]);

  const hasCost = cost !== "";

  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Shield className="text-purple-600" style={{ width: 18, height: 18 }} />
        </div>
        <h3 className="font-semibold text-slate-900 text-sm">Forsikring</h3>
      </div>

      {/* Calculator field */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Årlig kostnad
        </label>
        <div className="relative">
          <input
            type="text"
            inputMode="decimal"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="42 000"
            className="input-field pr-14"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 pointer-events-none">
            kr/år
          </span>
        </div>
      </div>

      {/* Auto-filled company context — shown as soon as cost is entered */}
      {hasCost && company && (company.industry || company.municipality) && (
        <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
          {company.industry && (
            <p className="text-xs text-slate-500">
              Bransje: <span className="font-medium text-slate-700">{company.industry}</span>
            </p>
          )}
          {company.municipality && (
            <p className="text-xs text-slate-500">
              Kommune: <span className="font-medium text-slate-700">{company.municipality}</span>
            </p>
          )}
        </div>
      )}

      {/* Non-calculator field */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
          Salgsinformasjon
        </p>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Antall skader siste 3 år
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={claims}
            onChange={(e) => setClaims(e.target.value)}
            placeholder="0"
            className="input-field"
          />
        </div>
      </div>
    </div>
  );
}

// ── Step list builder ─────────────────────────────────────────────────────────

function buildSteps(hasData: {
  accounting: boolean;
  insurance: boolean;
  electricity: boolean;
  phone: boolean;
}): string[] {
  const list: string[] = ["Kobler til datakildene...", "Analyserer bedriftsprofil..."];
  if (hasData.electricity) list.push("Henter strømpriser...", "Sammenligner strømavtaler...");
  if (hasData.phone)       list.push("Henter mobilabonnementer...", "Beregner volumbesparelser...");
  if (hasData.accounting)  list.push("Analyserer regnskapshonorar...");
  if (hasData.insurance)   list.push("Sjekker forsikringspremier...");
  list.push("Beregner total besparelse...", "Verifiserer resultater...", "Klar!");
  return list;
}

// ── Main component ────────────────────────────────────────────────────────────

export function DemoCalculator({ settings }: { settings: Settings }) {
  const preview = usePreview();
  const [phase, setPhase] = useState<Phase>("input");

  // Savings state (reported up from child cards)
  const [accountingSavings, setAccountingSavings] = useState<CategorySavings>({ monthly: 0, yearly: 0 });
  const [insuranceSavings,  setInsuranceSavings]  = useState<CategorySavings>({ monthly: 0, yearly: 0 });
  const [electricitySavings,setElectricitySavings]= useState<CategorySavings>({ monthly: 0, yearly: 0 });
  const [phoneSavings,      setPhoneSavings]      = useState<CategorySavings>({ monthly: 0, yearly: 0 });

  // Raw yearly costs for accounting + insurance (needed for before/after chart)
  const [accountingRawCost, setAccountingRawCost] = useState(0);
  const [insuranceRawCost,  setInsuranceRawCost]  = useState(0);

  // Which cards have enough data to include in the search
  const [hasData, setHasData] = useState({ accounting: false, insurance: false, electricity: false, phone: false });

  // Company selected from Brreg
  const [company, setCompany] = useState<Company | null>(null);
  const [resetKey, setResetKey] = useState(0); // bump to remount CompanySearch

  // True while any CRM field is focused — suppresses the search button
  const [crmFocused, setCrmFocused] = useState(false);

  // Search / reveal state
  const [snapshot, setSnapshot] = useState<SearchSnapshot | null>(null);
  const [steps,    setSteps]    = useState<string[]>([]);
  const [stepIndex,setStepIndex]= useState(-1);
  const [revealedCount, setRevealedCount] = useState(0);
  const [showTotal, setShowTotal] = useState(false);

  const anyData = hasData.accounting || hasData.insurance || hasData.electricity || hasData.phone;
  const showSearchButton = anyData && !crmFocused;

  // ── Callbacks ──

  const handleAccountingSavings  = useCallback((m: number, y: number) => setAccountingSavings({ monthly: m, yearly: y }), []);
  const handleInsuranceSavings   = useCallback((m: number, y: number) => setInsuranceSavings({ monthly: m, yearly: y }),  []);
  const handleElectricitySavings = useCallback((m: number, y: number) => setElectricitySavings({ monthly: m, yearly: y }),[]);
  const handlePhoneSavings       = useCallback((m: number, y: number) => setPhoneSavings({ monthly: m, yearly: y }),       []);

  const handleAccountingRawCost = useCallback((y: number) => setAccountingRawCost(y), []);
  const handleInsuranceRawCost  = useCallback((y: number) => setInsuranceRawCost(y),  []);

  const handleAccountingData  = useCallback((has: boolean) => setHasData((p) => ({ ...p, accounting: has })),  []);
  const handleInsuranceData   = useCallback((has: boolean) => setHasData((p) => ({ ...p, insurance: has })),   []);
  const handleElectricityData = useCallback((has: boolean) => setHasData((p) => ({ ...p, electricity: has })), []);
  const handlePhoneData       = useCallback((has: boolean) => setHasData((p) => ({ ...p, phone: has })),       []);

  const handleCrmFocusChange = useCallback((focused: boolean) => setCrmFocused(focused), []);

  // ── Actions ──

  function startSearch() {
    const snap: SearchSnapshot = {
      savings: {
        accounting:  accountingSavings,
        insurance:   insuranceSavings,
        electricity: electricitySavings,
        phone:       phoneSavings,
      },
      rawCosts: {
        accounting: accountingRawCost,
        insurance:  insuranceRawCost,
      },
    };
    const builtSteps = buildSteps(hasData);
    setSnapshot(snap);
    setSteps(builtSteps);
    setStepIndex(0);
    setRevealedCount(0);
    setShowTotal(false);
    setPhase("searching");
  }

  function reset() {
    setPhase("input");
    setSnapshot(null);
    setSteps([]);
    setStepIndex(-1);
    setRevealedCount(0);
    setShowTotal(false);
    setCompany(null);
    setResetKey((k) => k + 1);
  }

  // ── Search step timer ──

  useEffect(() => {
    if (phase !== "searching" || stepIndex < 0 || steps.length === 0) return;
    const msPerStep = Math.floor(24000 / steps.length);

    if (stepIndex < steps.length - 1) {
      const t = setTimeout(() => setStepIndex((p) => p + 1), msPerStep);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setPhase("revealing"), msPerStep);
      return () => clearTimeout(t);
    }
  }, [phase, stepIndex, steps]);

  // ── Staggered reveal ──

  const revealItems = useMemo(() => {
    if (!snapshot) return [];
    return [
      snapshot.savings.accounting.yearly > 0 ? { key: "accounting", label: "Regnskap",  Icon: FileText,   iconBg: "bg-blue-100",   iconColor: "text-blue-600",   savings: snapshot.savings.accounting  } : null,
      snapshot.savings.insurance.yearly  > 0 ? { key: "insurance",  label: "Forsikring", Icon: Shield,     iconBg: "bg-purple-100", iconColor: "text-purple-600", savings: snapshot.savings.insurance   } : null,
      snapshot.savings.phone.yearly      > 0 ? { key: "phone",      label: "Telefoni",   Icon: Smartphone, iconBg: "bg-orange-100", iconColor: "text-orange-600", savings: snapshot.savings.phone       } : null,
      snapshot.savings.electricity.yearly> 0 ? { key: "electricity",label: "Strøm",      Icon: Zap,        iconBg: "bg-yellow-100", iconColor: "text-yellow-600", savings: snapshot.savings.electricity } : null,
    ].filter(Boolean) as Array<{
      key: string;
      label: string;
      Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
      iconBg: string;
      iconColor: string;
      savings: CategorySavings;
    }>;
  }, [snapshot]);

  useEffect(() => {
    if (phase !== "revealing") return;
    if (revealedCount < revealItems.length) {
      const t = setTimeout(() => setRevealedCount((p) => p + 1), 1200);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => { setShowTotal(true); setPhase("done"); }, 1500);
      return () => clearTimeout(t);
    }
  }, [phase, revealedCount, revealItems.length]);

  // ── Render ──

  return (
    <div className="p-6 max-w-[1400px] mx-auto w-full">

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-green-600" />
            <h1 className="text-xl font-bold text-slate-900">Demo-kalkulator</h1>
          </div>
          <p className="text-sm text-slate-500">Fyll inn kundeinformasjon og søk etter besparelser</p>
        </div>
        <div className="flex items-center gap-2">
          {preview && (
            <button
              onClick={preview.startPreview}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              Se som selger
            </button>
          )}
          {phase === "done" && (
            <button
              onClick={reset}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Start på nytt
            </button>
          )}
        </div>
      </div>

      {/* ── Input phase ── */}
      {phase === "input" && (
        <>
          {/* Company search */}
          <div className="card p-5 mb-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="text-green-600" style={{ width: 18, height: 18 }} />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">Bedrift</h3>
            </div>
            <CompanySearch key={resetKey} onSelect={setCompany} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
            <DemoAccountingCard
              percentage={settings.accountingPercentage}
              onSavings={handleAccountingSavings}
              onHasData={handleAccountingData}
              onRawCost={handleAccountingRawCost}
              onCrmFocusChange={handleCrmFocusChange}
            />
            <DemoInsuranceCard
              percentage={settings.insurancePercentage}
              onSavings={handleInsuranceSavings}
              onHasData={handleInsuranceData}
              onRawCost={handleInsuranceRawCost}
              company={company}
            />
            <PhoneCard
              onSavings={handlePhoneSavings}
              hideResults
              onHasData={handlePhoneData}
            />
            <ElectricityCard
              onSavings={handleElectricitySavings}
              hideResults
              onHasData={handleElectricityData}
            />
          </div>

          {/* SØK BESPARELSER button */}
          <div className={`flex flex-col items-center gap-2 transition-all duration-500 ${
            showSearchButton ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
          }`}>
            <button
              onClick={startSearch}
              disabled={!company}
              className={`flex items-center gap-2.5 px-10 py-4 font-bold text-base rounded-xl transition-all duration-200 ${
                company
                  ? "bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30 hover:shadow-green-600/40 active:scale-95"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              <Search className="w-5 h-5" />
              SØK BESPARELSER
            </button>
            {!company && (
              <p className="text-xs text-slate-400">Velg en bedrift for å søke</p>
            )}
          </div>
        </>
      )}

      {/* ── Searching phase ── */}
      {phase === "searching" && (
        <div className="flex flex-col items-center py-6">
          <ScannerAnimation />
          <h2 className="text-lg font-bold text-slate-900 mb-8">Søker etter besparelser...</h2>

          <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 w-full max-w-sm divide-y divide-slate-100">
            {steps.map((step, i) => (
              <StepItem
                key={i}
                label={step}
                status={i < stepIndex ? "done" : i === stepIndex ? "active" : "pending"}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Revealing / done phase ── */}
      {(phase === "revealing" || phase === "done") && snapshot && (
        <>
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900">
              {revealItems.length > 0 ? "Besparelser funnet" : "Analyse fullført"}
              {company && (
                <span className="text-slate-400 font-normal"> — {company.name}</span>
              )}
            </h2>
            <p className="text-sm text-slate-500">
              {revealItems.length > 0
                ? `Vi fant besparelser i ${revealItems.length} ${revealItems.length === 1 ? "kategori" : "kategorier"}`
                : "Ingen besparelser å rapportere for de valgte kategoriene"}
            </p>
          </div>

          {revealItems.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-5">
              {revealItems.map((item, i) => (
                <ResultCard
                  key={item.key}
                  Icon={item.Icon}
                  iconBg={item.iconBg}
                  iconColor={item.iconColor}
                  label={item.label}
                  monthly={item.savings.monthly}
                  yearly={item.savings.yearly}
                  visible={i < revealedCount}
                />
              ))}
            </div>
          )}

          {showTotal && <TotalCard snapshot={snapshot} visible={showTotal} />}
        </>
      )}
    </div>
  );
}
