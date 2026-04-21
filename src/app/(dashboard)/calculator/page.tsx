"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calculator,
  FileText,
  Shield,
  TrendingDown,
  RefreshCw,
} from "lucide-react";
import { PhoneCard } from "@/components/calculator/phone-card";
import { ElectricityCard } from "@/components/calculator/electricity-card";
import { formatNOK } from "@/lib/calculations";

interface Settings {
  accountingPercentage: number;
  insurancePercentage: number;
}

const DEFAULT_SETTINGS: Settings = {
  accountingPercentage: 20,
  insurancePercentage: 10,
};

function parseNum(val: string): number {
  const cleaned = val.replace(/\s/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.max(0, num);
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  unit,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  unit?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "0"}
          className="input-field pr-14"
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 pointer-events-none">
            {unit}
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

function SavingsDisplay({
  monthly,
  yearly,
  label = "Estimert besparelse",
}: {
  monthly: number;
  yearly: number;
  label?: string;
}) {
  const hasSavings = monthly > 0 || yearly > 0;
  return (
    <div
      className={`rounded-lg p-3 mt-3 transition-all duration-300 ${
        hasSavings
          ? "bg-emerald-50 border border-emerald-100"
          : "bg-slate-50 border border-slate-100"
      }`}
    >
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        {label}
      </p>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Per måned</p>
          <p
            className={`text-lg font-bold tabular-nums ${
              hasSavings ? "text-emerald-600" : "text-slate-300"
            }`}
          >
            {hasSavings ? formatNOK(monthly) : "–"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 mb-0.5">Per år</p>
          <p
            className={`text-2xl font-bold tabular-nums ${
              hasSavings ? "text-emerald-600" : "text-slate-300"
            }`}
          >
            {hasSavings ? formatNOK(yearly) : "–"}
          </p>
        </div>
      </div>
    </div>
  );
}

function AccountingCard({
  percentage,
  onSavings,
}: {
  percentage: number;
  onSavings: (monthly: number, yearly: number) => void;
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

  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <FileText className="w-4.5 h-4.5 text-blue-600" style={{ width: 18, height: 18 }} />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 text-sm">Regnskap</h3>
        </div>
      </div>

      <InputField
        label="Årlig kostnad"
        value={cost}
        onChange={setCost}
        placeholder="180 000"
        unit="kr/år"
        hint="Eks. regnskapshonorar, lønn til regnskapsfører"
      />

      <SavingsDisplay monthly={savings.monthly} yearly={savings.yearly} />
    </div>
  );
}

function InsuranceCard({
  percentage,
  onSavings,
}: {
  percentage: number;
  onSavings: (monthly: number, yearly: number) => void;
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

  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Shield className="w-4.5 h-4.5 text-purple-600" style={{ width: 18, height: 18 }} />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 text-sm">Forsikring</h3>
        </div>
      </div>

      <InputField
        label="Årlig kostnad"
        value={cost}
        onChange={setCost}
        placeholder="42 000"
        unit="kr/år"
        hint="Eks. bedriftsforsikring, ansvarsforsikring"
      />

      <SavingsDisplay monthly={savings.monthly} yearly={savings.yearly} />
    </div>
  );
}

function SummaryCard({
  accounting,
  insurance,
  electricity,
  phone,
}: {
  accounting: { monthly: number; yearly: number };
  insurance: { monthly: number; yearly: number };
  electricity: { monthly: number; yearly: number };
  phone: { monthly: number; yearly: number };
}) {
  const totalMonthly =
    accounting.monthly + insurance.monthly + electricity.monthly + phone.monthly;
  const totalYearly =
    accounting.yearly + insurance.yearly + electricity.yearly + phone.yearly;
  const hasAny = totalYearly > 0;

  const breakdown = [
    { label: "Regnskap", monthly: accounting.monthly, yearly: accounting.yearly, color: "bg-blue-500" },
    { label: "Forsikring", monthly: insurance.monthly, yearly: insurance.yearly, color: "bg-purple-500" },
    { label: "Telefoni", monthly: phone.monthly, yearly: phone.yearly, color: "bg-orange-500" },
    { label: "Strøm", monthly: electricity.monthly, yearly: electricity.yearly, color: "bg-yellow-500" },
  ].filter((item) => item.yearly > 0);

  return (
    <div
      className={`rounded-xl border p-6 transition-all duration-500 ${
        hasAny
          ? "bg-gradient-to-r from-emerald-600 to-emerald-500 border-emerald-400 shadow-lg shadow-emerald-500/20"
          : "bg-white border-slate-200 shadow-card"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown
              className={`w-5 h-5 ${hasAny ? "text-emerald-200" : "text-slate-300"}`}
            />
            <p
              className={`text-sm font-semibold uppercase tracking-wider ${
                hasAny ? "text-emerald-100" : "text-slate-400"
              }`}
            >
              Total estimert besparelse
            </p>
          </div>
          <div className="flex items-baseline gap-4 mt-2">
            <div>
              <p className={`text-sm mb-0.5 ${hasAny ? "text-emerald-200" : "text-slate-400"}`}>
                Per måned
              </p>
              <p className={`text-3xl font-bold tabular-nums ${hasAny ? "text-white" : "text-slate-300"}`}>
                {hasAny ? formatNOK(totalMonthly) : "–"}
              </p>
            </div>
            <div className={`w-px h-10 ${hasAny ? "bg-emerald-400/40" : "bg-slate-200"}`} />
            <div>
              <p className={`text-sm mb-0.5 ${hasAny ? "text-emerald-200" : "text-slate-400"}`}>
                Per år
              </p>
              <p className={`text-4xl font-bold tabular-nums ${hasAny ? "text-white" : "text-slate-300"}`}>
                {hasAny ? formatNOK(totalYearly) : "–"}
              </p>
            </div>
          </div>
        </div>

        {hasAny && breakdown.length > 0 && (
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

      {!hasAny && (
        <p className="text-slate-400 text-sm mt-3">
          Fyll inn kundeinformasjon i feltene over for å se estimerte besparelser
        </p>
      )}
    </div>
  );
}

export default function CalculatorPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  const [accountingSavings, setAccountingSavings] = useState({ monthly: 0, yearly: 0 });
  const [insuranceSavings, setInsuranceSavings] = useState({ monthly: 0, yearly: 0 });
  const [electricitySavings, setElectricitySavings] = useState({ monthly: 0, yearly: 0 });
  const [phoneSavings, setPhoneSavings] = useState({ monthly: 0, yearly: 0 });

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.savings) {
          setSettings({
            accountingPercentage: data.savings.accountingPercentage,
            insurancePercentage: data.savings.insurancePercentage,
          });
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingSettings(false));
  }, []);

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

  return (
    <div className="p-6 max-w-[1400px]">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Calculator className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl font-bold text-slate-900">Besparelseskalkulator</h1>
          {isLoadingSettings && (
            <RefreshCw className="w-4 h-4 text-slate-400 animate-spin ml-1" />
          )}
        </div>
        <p className="text-sm text-slate-500">
          Legg inn kundens nåværende kostnader for å estimere besparelser
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-5">
        <AccountingCard
          percentage={settings.accountingPercentage}
          onSavings={handleAccountingSavings}
        />
        <InsuranceCard
          percentage={settings.insurancePercentage}
          onSavings={handleInsuranceSavings}
        />
        <PhoneCard onSavings={handlePhoneSavings} />
        <ElectricityCard onSavings={handleElectricitySavings} />
      </div>

      <SummaryCard
        accounting={accountingSavings}
        insurance={insuranceSavings}
        electricity={electricitySavings}
        phone={phoneSavings}
      />

      <p className="text-xs text-slate-400 mt-4 text-center">
        Alle besparelser er estimater basert på standardparametere. Faktiske besparelser kan variere.
      </p>
    </div>
  );
}
