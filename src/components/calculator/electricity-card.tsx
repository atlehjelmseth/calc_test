"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Zap, ChevronDown, PenLine } from "lucide-react";
import {
  ElectricityProviderData,
  ElectricityPlanData,
  calcElectricitySavings,
} from "@/lib/electricity-calculations";
import { formatNOK } from "@/lib/calculations";

function parseNum(val: string): number {
  const cleaned = val.replace(/\s/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.max(0, num);
}

interface ElectricityCardProps {
  onSavings: (monthly: number, yearly: number) => void;
  hideResults?: boolean;
  onHasData?: (has: boolean) => void;
}

export function ElectricityCard({ onSavings, hideResults, onHasData }: ElectricityCardProps) {
  const [providers, setProviders] = useState<ElectricityProviderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [annualKwh, setAnnualKwh] = useState("");
  const [providerId, setProviderId] = useState("");
  const [planId, setPlanId] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [manualFixed, setManualFixed] = useState("");
  const [manualMarkup, setManualMarkup] = useState("");

  useEffect(() => {
    fetch("/api/electricity-providers")
      .then((r) => r.json())
      .then((data: ElectricityProviderData[]) => setProviders(data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const ourPlan = useMemo<ElectricityPlanData | undefined>(() => {
    return providers.find((p) => p.isOurOffer)?.plans[0];
  }, [providers]);

  const competitorProviders = useMemo(
    () => providers.filter((p) => !p.isOurOffer),
    [providers]
  );

  const selectedProvider = competitorProviders.find((p) => p.id === providerId);
  const selectedPlan = selectedProvider?.plans.find((p) => p.id === planId);

  const customerPlan = useMemo<ElectricityPlanData | undefined>(() => {
    if (manualMode) {
      const fixed = parseNum(manualFixed);
      const markup = parseNum(manualMarkup);
      if (fixed === 0 && markup === 0) return undefined;
      return { id: "manual", name: "Manuell", fixedAmount: fixed, markup };
    }
    return selectedPlan;
  }, [manualMode, manualFixed, manualMarkup, selectedPlan]);

  const savings = useMemo(() => {
    const kwh = parseNum(annualKwh);
    if (!customerPlan || !ourPlan || kwh === 0) return { monthly: 0, yearly: 0 };
    return calcElectricitySavings(kwh, customerPlan, ourPlan);
  }, [annualKwh, customerPlan, ourPlan]);

  useEffect(() => {
    onSavings(savings.monthly, savings.yearly);
  }, [savings, onSavings]);

  useEffect(() => {
    onHasData?.(annualKwh !== "");
  }, [annualKwh, onHasData]);

  const handleProviderChange = useCallback((newProviderId: string) => {
    setProviderId(newProviderId);
    setPlanId("");
  }, []);

  function switchMode(manual: boolean) {
    setManualMode(manual);
    setProviderId("");
    setPlanId("");
    setManualFixed("");
    setManualMarkup("");
  }

  const hasSavings = savings.yearly > 0;

  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Zap className="text-yellow-600" style={{ width: 18, height: 18 }} />
        </div>
        <h3 className="font-semibold text-slate-900 text-sm">Strøm</h3>
      </div>

      {/* kWh-felt */}
      <div className="mb-3">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Årlig strømforbruk
        </label>
        <div className="relative">
          <input
            type="text"
            inputMode="decimal"
            value={annualKwh}
            onChange={(e) => setAnnualKwh(e.target.value)}
            placeholder="20 000"
            className="input-field pr-16"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 pointer-events-none">
            kWh/år
          </span>
        </div>
      </div>

      {/* Modus-toggle */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg mb-3">
        <button
          type="button"
          onClick={() => switchMode(false)}
          className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
            !manualMode
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Velg avtale
        </button>
        <button
          type="button"
          onClick={() => switchMode(true)}
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-md transition-colors ${
            manualMode
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <PenLine className="w-3 h-3" />
          Egne tall
        </button>
      </div>

      {/* Leverandør og avtale */}
      {!manualMode && (
        <div className="flex gap-2">
          <div className="relative flex-1 min-w-0">
            <select
              value={providerId}
              onChange={(e) => handleProviderChange(e.target.value)}
              disabled={isLoading}
              className="w-full appearance-none text-sm px-2.5 py-2 pr-7 border border-slate-200 rounded-lg bg-white text-slate-800
                focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Leverandør</option>
              {competitorProviders.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative flex-1 min-w-0">
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              disabled={!providerId}
              className="w-full appearance-none text-sm px-2.5 py-2 pr-7 border border-slate-200 rounded-lg bg-white text-slate-800
                focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Avtale</option>
              {selectedProvider?.plans.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Manuelle tall */}
      {manualMode && (
        <div className="flex gap-2">
          <div className="flex-1 min-w-0">
            <label className="block text-xs text-slate-500 mb-1">Fastledd</label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={manualFixed}
                onChange={(e) => setManualFixed(e.target.value)}
                placeholder="0"
                className="input-field text-sm py-2 pr-14"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                kr/mnd
              </span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-xs text-slate-500 mb-1">Påslag</label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={manualMarkup}
                onChange={(e) => setManualMarkup(e.target.value)}
                placeholder="0"
                className="input-field text-sm py-2 pr-14"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                øre/kWh
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Besparelsesoppsummering */}
      {!hideResults && (
        <div
          className={`rounded-lg p-3 mt-3 transition-all duration-300 ${
            hasSavings
              ? "bg-emerald-50 border border-emerald-100"
              : "bg-slate-50 border border-slate-100"
          }`}
        >
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Estimert besparelse
          </p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Per måned</p>
              <p className={`text-lg font-bold tabular-nums ${hasSavings ? "text-emerald-600" : "text-slate-300"}`}>
                {hasSavings ? formatNOK(savings.monthly) : "0,-"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 mb-0.5">Per år</p>
              <p className={`text-2xl font-bold tabular-nums ${hasSavings ? "text-emerald-600" : "text-slate-300"}`}>
                {hasSavings ? formatNOK(savings.yearly) : "0,-"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
