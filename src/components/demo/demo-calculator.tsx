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
} from "lucide-react";
import { PhoneCard } from "@/components/calculator/phone-card";
import { ElectricityCard } from "@/components/calculator/electricity-card";
import { formatNOK } from "@/lib/calculations";

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

function parseNum(val: string): number {
  const cleaned = val.replace(/\s/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.max(0, num);
}

function useAnimatedValue(target: number, active: boolean) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }
    const startTime = performance.now();
    const DURATION = 1400;

    function animate(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / DURATION, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      setValue(Math.round(target * eased));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, active]);

  return active ? value : 0;
}

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
          cx="50"
          cy="50"
          r="46"
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
      <span
        className={`text-sm flex items-center gap-1 ${
          status === "done"
            ? "text-slate-600"
            : status === "active"
            ? "text-slate-900 font-semibold"
            : "text-slate-400"
        }`}
      >
        {label}
        {status === "active" && (
          <span className="inline-flex gap-0.5 ml-0.5">
            <span
              className="w-1 h-1 bg-green-500 rounded-full animate-bounce inline-block"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="w-1 h-1 bg-green-500 rounded-full animate-bounce inline-block"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="w-1 h-1 bg-green-500 rounded-full animate-bounce inline-block"
              style={{ animationDelay: "300ms" }}
            />
          </span>
        )}
      </span>
    </div>
  );
}

function ResultCard({
  Icon,
  iconBg,
  iconColor,
  label,
  monthly,
  yearly,
  visible,
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
    <div
      className={`card p-5 transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-9 h-9 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}
        >
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
          <p className="text-lg font-bold tabular-nums text-emerald-600">
            {formatNOK(animatedMonthly)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 mb-0.5">Per år</p>
          <p className="text-2xl font-bold tabular-nums text-emerald-600">
            {formatNOK(animatedYearly)}
          </p>
        </div>
      </div>
    </div>
  );
}

function TotalCard({ savings, visible }: { savings: Savings; visible: boolean }) {
  const totalMonthly =
    savings.accounting.monthly +
    savings.insurance.monthly +
    savings.electricity.monthly +
    savings.phone.monthly;
  const totalYearly =
    savings.accounting.yearly +
    savings.insurance.yearly +
    savings.electricity.yearly +
    savings.phone.yearly;

  const animatedMonthly = useAnimatedValue(Math.round(totalMonthly), visible);
  const animatedYearly = useAnimatedValue(Math.round(totalYearly), visible);

  const breakdown = [
    { label: "Regnskap", yearly: savings.accounting.yearly, color: "bg-blue-500" },
    { label: "Forsikring", yearly: savings.insurance.yearly, color: "bg-purple-500" },
    { label: "Telefoni", yearly: savings.phone.yearly, color: "bg-orange-500" },
    { label: "Strøm", yearly: savings.electricity.yearly, color: "bg-yellow-500" },
  ].filter((item) => item.yearly > 0);

  return (
    <div
      className={`rounded-xl border p-6 bg-gradient-to-r from-emerald-600 to-emerald-500 border-emerald-400 shadow-lg shadow-emerald-500/20 transition-all duration-700 ${
        visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-5 h-5 text-emerald-200" />
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-100">
              Total estimert besparelse
            </p>
          </div>
          <div className="flex items-baseline gap-4 mt-2">
            <div>
              <p className="text-sm mb-0.5 text-emerald-200">Per måned</p>
              <p className="text-3xl font-bold tabular-nums text-white">
                {formatNOK(animatedMonthly)}
              </p>
            </div>
            <div className="w-px h-10 bg-emerald-400/40" />
            <div>
              <p className="text-sm mb-0.5 text-emerald-200">Per år</p>
              <p className="text-4xl font-bold tabular-nums text-white">
                {formatNOK(animatedYearly)}
              </p>
            </div>
          </div>
        </div>
        {breakdown.length > 0 && (
          <div className="flex-shrink-0 space-y-1.5 min-w-[160px]">
            <p className="text-xs text-emerald-200 font-semibold uppercase tracking-wider mb-2">
              Fordeling
            </p>
            {breakdown.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.color}`} />
                <span className="text-xs text-emerald-100 flex-1">{item.label}</span>
                <span className="text-xs font-semibold text-white tabular-nums">
                  {formatNOK(item.yearly)}/år
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DemoAccountingCard({
  percentage,
  onSavings,
  onHasData,
}: {
  percentage: number;
  onSavings: (monthly: number, yearly: number) => void;
  onHasData: (has: boolean) => void;
}) {
  const [cost, setCost] = useState("");

  const savings = useMemo(() => {
    const yearly = parseNum(cost);
    const yearlySavings = yearly * (percentage / 100);
    return { monthly: yearlySavings / 12, yearly: yearlySavings };
  }, [cost, percentage]);

  useEffect(() => {
    onSavings(savings.monthly, savings.yearly);
  }, [savings, onSavings]);

  useEffect(() => {
    onHasData(cost !== "");
  }, [cost, onHasData]);

  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <FileText className="text-blue-600" style={{ width: 18, height: 18 }} />
        </div>
        <h3 className="font-semibold text-slate-900 text-sm">Regnskap</h3>
      </div>
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
    </div>
  );
}

function DemoInsuranceCard({
  percentage,
  onSavings,
  onHasData,
}: {
  percentage: number;
  onSavings: (monthly: number, yearly: number) => void;
  onHasData: (has: boolean) => void;
}) {
  const [cost, setCost] = useState("");

  const savings = useMemo(() => {
    const yearly = parseNum(cost);
    const yearlySavings = yearly * (percentage / 100);
    return { monthly: yearlySavings / 12, yearly: yearlySavings };
  }, [cost, percentage]);

  useEffect(() => {
    onSavings(savings.monthly, savings.yearly);
  }, [savings, onSavings]);

  useEffect(() => {
    onHasData(cost !== "");
  }, [cost, onHasData]);

  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Shield className="text-purple-600" style={{ width: 18, height: 18 }} />
        </div>
        <h3 className="font-semibold text-slate-900 text-sm">Forsikring</h3>
      </div>
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
    </div>
  );
}

function buildSteps(hasData: {
  accounting: boolean;
  insurance: boolean;
  electricity: boolean;
  phone: boolean;
}): string[] {
  const list: string[] = ["Kobler til datakildene...", "Analyserer bedriftsprofil..."];
  if (hasData.electricity) list.push("Henter strømpriser...", "Sammenligner strømavtaler...");
  if (hasData.phone) list.push("Henter mobilabonnementer...", "Beregner volumbesparelser...");
  if (hasData.accounting) list.push("Analyserer regnskapshonorar...");
  if (hasData.insurance) list.push("Sjekker forsikringspremier...");
  list.push("Beregner total besparelse...", "Verifiserer resultater...", "Klar!");
  return list;
}

export function DemoCalculator({ settings }: { settings: Settings }) {
  const [phase, setPhase] = useState<Phase>("input");

  const [accountingSavings, setAccountingSavings] = useState<CategorySavings>({ monthly: 0, yearly: 0 });
  const [insuranceSavings, setInsuranceSavings] = useState<CategorySavings>({ monthly: 0, yearly: 0 });
  const [electricitySavings, setElectricitySavings] = useState<CategorySavings>({ monthly: 0, yearly: 0 });
  const [phoneSavings, setPhoneSavings] = useState<CategorySavings>({ monthly: 0, yearly: 0 });

  const [hasData, setHasData] = useState({
    accounting: false,
    insurance: false,
    electricity: false,
    phone: false,
  });

  const [snapshot, setSnapshot] = useState<Savings | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const [stepIndex, setStepIndex] = useState(-1);
  const [revealedCount, setRevealedCount] = useState(0);
  const [showTotal, setShowTotal] = useState(false);

  const anyData = hasData.accounting || hasData.insurance || hasData.electricity || hasData.phone;

  const handleAccountingSavings = useCallback(
    (monthly: number, yearly: number) => setAccountingSavings({ monthly, yearly }),
    []
  );
  const handleInsuranceSavings = useCallback(
    (monthly: number, yearly: number) => setInsuranceSavings({ monthly, yearly }),
    []
  );
  const handleElectricitySavings = useCallback(
    (monthly: number, yearly: number) => setElectricitySavings({ monthly, yearly }),
    []
  );
  const handlePhoneSavings = useCallback(
    (monthly: number, yearly: number) => setPhoneSavings({ monthly, yearly }),
    []
  );

  const handleAccountingData = useCallback(
    (has: boolean) => setHasData((prev) => ({ ...prev, accounting: has })),
    []
  );
  const handleInsuranceData = useCallback(
    (has: boolean) => setHasData((prev) => ({ ...prev, insurance: has })),
    []
  );
  const handleElectricityData = useCallback(
    (has: boolean) => setHasData((prev) => ({ ...prev, electricity: has })),
    []
  );
  const handlePhoneData = useCallback(
    (has: boolean) => setHasData((prev) => ({ ...prev, phone: has })),
    []
  );

  function startSearch() {
    const snap: Savings = {
      accounting: accountingSavings,
      insurance: insuranceSavings,
      electricity: electricitySavings,
      phone: phoneSavings,
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
  }

  // Advance search steps
  useEffect(() => {
    if (phase !== "searching" || stepIndex < 0 || steps.length === 0) return;
    const msPerStep = Math.floor(24000 / steps.length);

    if (stepIndex < steps.length - 1) {
      const t = setTimeout(() => setStepIndex((p) => p + 1), msPerStep);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setPhase("revealing");
      }, msPerStep);
      return () => clearTimeout(t);
    }
  }, [phase, stepIndex, steps]);

  // Stagger reveal of result cards
  const revealItems = useMemo(() => {
    if (!snapshot) return [];
    return [
      snapshot.accounting.yearly > 0
        ? { key: "accounting", label: "Regnskap", Icon: FileText, iconBg: "bg-blue-100", iconColor: "text-blue-600", savings: snapshot.accounting }
        : null,
      snapshot.insurance.yearly > 0
        ? { key: "insurance", label: "Forsikring", Icon: Shield, iconBg: "bg-purple-100", iconColor: "text-purple-600", savings: snapshot.insurance }
        : null,
      snapshot.phone.yearly > 0
        ? { key: "phone", label: "Telefoni", Icon: Smartphone, iconBg: "bg-orange-100", iconColor: "text-orange-600", savings: snapshot.phone }
        : null,
      snapshot.electricity.yearly > 0
        ? { key: "electricity", label: "Strøm", Icon: Zap, iconBg: "bg-yellow-100", iconColor: "text-yellow-600", savings: snapshot.electricity }
        : null,
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
      const t = setTimeout(() => {
        setShowTotal(true);
        setPhase("done");
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [phase, revealedCount, revealItems.length]);

  return (
    <div className="p-6 max-w-[1400px] mx-auto w-full">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-green-600" />
            <h1 className="text-xl font-bold text-slate-900">Demo-kalkulator</h1>
          </div>
          <p className="text-sm text-slate-500">
            Fyll inn kundeinformasjon og søk etter besparelser
          </p>
        </div>
        {(phase === "done") && (
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Start på nytt
          </button>
        )}
      </div>

      {/* Input phase */}
      {phase === "input" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
            <DemoAccountingCard
              percentage={settings.accountingPercentage}
              onSavings={handleAccountingSavings}
              onHasData={handleAccountingData}
            />
            <DemoInsuranceCard
              percentage={settings.insurancePercentage}
              onSavings={handleInsuranceSavings}
              onHasData={handleInsuranceData}
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

          <div
            className={`flex justify-center transition-all duration-500 ${
              anyData ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
            }`}
          >
            <button
              onClick={startSearch}
              disabled={!anyData}
              className="flex items-center gap-2.5 px-10 py-4 bg-green-500 hover:bg-green-600 text-white font-bold text-base rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-600/40 transition-all duration-200 active:scale-95"
            >
              <Search className="w-5 h-5" />
              SØK BESPARELSER
            </button>
          </div>
        </>
      )}

      {/* Searching phase */}
      {phase === "searching" && (
        <div className="flex flex-col items-center py-6">
          <ScannerAnimation />
          <h2 className="text-lg font-bold text-slate-900 mb-1">Søker etter besparelser...</h2>
          <p className="text-sm text-slate-500 mb-8">Dette tar ca. 20–30 sekunder</p>

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

      {/* Revealing / done phase */}
      {(phase === "revealing" || phase === "done") && snapshot && (
        <>
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900">
              {revealItems.length > 0 ? "Besparelser funnet" : "Analyse fullført"}
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

          {showTotal && <TotalCard savings={snapshot} visible={showTotal} />}
        </>
      )}
    </div>
  );
}
