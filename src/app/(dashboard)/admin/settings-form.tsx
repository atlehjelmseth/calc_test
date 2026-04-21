"use client";

import { useState } from "react";
import {
  FileText,
  Shield,
  Save,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";

interface SavingsData {
  id: string;
  accountingPercentage: number;
  insurancePercentage: number;
}

interface AdminSettingsFormProps {
  initialSavings: SavingsData;
}

type SaveState = "idle" | "saving" | "success" | "error";

function AdminInput({
  label,
  value,
  onChange,
  unit,
  description,
  min = 0,
  step = "0.1",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit?: string;
  description?: string;
  min?: number;
  step?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          step={step}
          className="input-field pr-20"
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 pointer-events-none bg-white pl-1">
            {unit}
          </span>
        )}
      </div>
      {description && (
        <p className="text-xs text-slate-400 mt-1">{description}</p>
      )}
    </div>
  );
}

function SectionCard({
  icon,
  title,
  description,
  iconClass,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  iconClass: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-6">
      <div className="flex items-start gap-3 mb-5">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconClass}`}>
          {icon}
        </div>
        <div>
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function SaveButton({
  state,
  onClick,
}: {
  state: SaveState;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={state === "saving"}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
        state === "success"
          ? "bg-emerald-600 text-white"
          : state === "error"
          ? "bg-red-600 text-white"
          : "btn-primary"
      }`}
    >
      {state === "saving" ? (
        <>
          <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          Lagrer...
        </>
      ) : state === "success" ? (
        <>
          <CheckCircle className="w-4 h-4" />
          Lagret!
        </>
      ) : state === "error" ? (
        <>
          <AlertCircle className="w-4 h-4" />
          Feil – prøv igjen
        </>
      ) : (
        <>
          <Save className="w-4 h-4" />
          Lagre endringer
        </>
      )}
    </button>
  );
}

export function AdminSettingsForm({ initialSavings }: AdminSettingsFormProps) {
  const [accounting, setAccounting] = useState(
    initialSavings.accountingPercentage.toString()
  );
  const [insurance, setInsurance] = useState(
    initialSavings.insurancePercentage.toString()
  );
  const [savingsState, setSavingsState] = useState<SaveState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function saveSavingsSettings() {
    setSavingsState("saving");
    setErrorMsg("");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "savings",
          accountingPercentage: parseFloat(accounting),
          insurancePercentage: parseFloat(insurance),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Lagring feilet");
      }
      setSavingsState("success");
      setTimeout(() => setSavingsState("idle"), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Ukjent feil");
      setSavingsState("error");
      setTimeout(() => setSavingsState("idle"), 4000);
    }
  }

  return (
    <div className="space-y-5">
      {errorMsg && (
        <div className="flex items-center gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      <SectionCard
        icon={<FileText className="w-4.5 h-4.5 text-blue-600" style={{ width: 18, height: 18 }} />}
        iconClass="bg-blue-100"
        title="Besparelsesrater"
        description="Prosentandel kunden sparer på regnskap og forsikring"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <AdminInput
            label="Regnskap – besparelse"
            value={accounting}
            onChange={setAccounting}
            unit="%"
            step="0.5"
            description="Prosent av kundens årlige regnskapskostnad"
          />
          <AdminInput
            label="Forsikring – besparelse"
            value={insurance}
            onChange={setInsurance}
            unit="%"
            step="0.5"
            description="Prosent av kundens årlige forsikringskostnad"
          />
        </div>

        <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700 mb-4 flex items-start gap-2">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-blue-500" />
          <span>
            Med disse innstillingene: kunde med 180 000 kr/år regnskap sparer{" "}
            <strong>
              {new Intl.NumberFormat("nb-NO").format(
                Math.round(180000 * (parseFloat(accounting) / 100))
              )}{" "}
              kr/år
            </strong>
            , og 42 000 kr/år forsikring sparer{" "}
            <strong>
              {new Intl.NumberFormat("nb-NO").format(
                Math.round(42000 * (parseFloat(insurance) / 100))
              )}{" "}
              kr/år
            </strong>
            .
          </span>
        </div>

        <SaveButton state={savingsState} onClick={saveSavingsSettings} />
      </SectionCard>
    </div>
  );
}
