"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Phone, Plus, Trash2, ChevronDown, PenLine } from "lucide-react";
import {
  PhoneProviderData,
  PhonePlanData,
  findSMBMatch,
} from "@/lib/phone-calculations";
import { formatNOK } from "@/lib/calculations";

// ── Types ────────────────────────────────────────────────────────────────────

interface PresetSub {
  type: "preset";
  localId: string;
  providerId: string;
  planId: string;
  quantity: number;
}

interface CustomSub {
  type: "custom";
  localId: string;
  name: string;
  fribruk: boolean;
  dataGB: string;
  pricePerSub: string;
  quantity: number;
}

type AnySub = PresetSub | CustomSub;

function newPresetSub(): PresetSub {
  return { type: "preset", localId: Math.random().toString(36).slice(2), providerId: "", planId: "", quantity: 1 };
}

function newCustomSub(): CustomSub {
  return { type: "custom", localId: Math.random().toString(36).slice(2), name: "", fribruk: false, dataGB: "", pricePerSub: "", quantity: 1 };
}

function parseNum(v: string) {
  const n = parseFloat(v.replace(",", "."));
  return isNaN(n) || n < 0 ? 0 : n;
}

// ── Preset subscription row ──────────────────────────────────────────────────

function PresetRow({
  sub,
  providers,
  onChange,
  onRemove,
}: {
  sub: PresetSub;
  providers: PhoneProviderData[];
  onChange: (s: PresetSub) => void;
  onRemove: () => void;
}) {
  const competitors = providers.filter((p) => !p.isOurOffer);
  const selectedProvider = competitors.find((p) => p.id === sub.providerId);

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1 min-w-0">
        <select
          value={sub.providerId}
          onChange={(e) => onChange({ ...sub, providerId: e.target.value, planId: "" })}
          className="w-full appearance-none text-sm px-2.5 py-2 pr-7 border border-slate-200 rounded-lg bg-white text-slate-800
            focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
        >
          <option value="">Leverandør</option>
          {competitors.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
      </div>

      <div className="relative flex-1 min-w-0">
        <select
          value={sub.planId}
          onChange={(e) => onChange({ ...sub, planId: e.target.value })}
          disabled={!sub.providerId}
          className="w-full appearance-none text-sm px-2.5 py-2 pr-7 border border-slate-200 rounded-lg bg-white text-slate-800
            focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Abonnement</option>
          {selectedProvider?.plans.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
      </div>

      <QuantityStepper value={sub.quantity} onChange={(q) => onChange({ ...sub, quantity: q })} />

      <button onClick={onRemove} className="p-1.5 text-slate-300 hover:text-red-400 transition-colors flex-shrink-0">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Custom subscription row ──────────────────────────────────────────────────

function CustomRow({
  sub,
  onChange,
  onRemove,
}: {
  sub: CustomSub;
  onChange: (s: CustomSub) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-2.5 space-y-2">
      {/* Row 1: name */}
      <div className="flex items-center gap-1.5">
        <PenLine className="w-3 h-3 text-slate-400 flex-shrink-0" />
        <input
          type="text"
          value={sub.name}
          onChange={(e) => onChange({ ...sub, name: e.target.value })}
          placeholder="Navn på abonnement"
          className="flex-1 min-w-0 text-sm px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400
            focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
        />
      </div>

      {/* Row 2: GB | price | qty | trash */}
      <div className="flex items-center gap-2">
        {/* GB / Fri bruk */}
        {sub.fribruk ? (
          <button
            onClick={() => onChange({ ...sub, fribruk: false, dataGB: "" })}
            className="flex-shrink-0 text-xs font-medium px-2 py-1.5 bg-green-100 text-green-700 rounded-lg border border-green-200 hover:bg-green-200 transition-colors whitespace-nowrap"
          >
            Fri bruk ✕
          </button>
        ) : (
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="relative w-16">
              <input
                type="text"
                inputMode="numeric"
                value={sub.dataGB}
                onChange={(e) => onChange({ ...sub, dataGB: e.target.value })}
                placeholder="0"
                className="w-full text-sm px-2 py-1.5 pr-6 border border-slate-200 rounded-lg bg-white text-slate-800
                  focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              />
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">GB</span>
            </div>
            <button
              onClick={() => onChange({ ...sub, fribruk: true, dataGB: "" })}
              title="Fri bruk"
              className="text-base text-slate-400 hover:text-green-600 w-6 h-7 flex items-center justify-center rounded hover:bg-green-50 transition-colors"
            >
              ∞
            </button>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <input
            type="text"
            inputMode="decimal"
            value={sub.pricePerSub}
            onChange={(e) => onChange({ ...sub, pricePerSub: e.target.value })}
            placeholder="Pris"
            className="flex-1 min-w-0 text-sm px-2 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-800
              focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
          />
          <span className="text-xs text-slate-400 flex-shrink-0">kr</span>
        </div>

        <SmallQuantityStepper value={sub.quantity} onChange={(q) => onChange({ ...sub, quantity: q })} />

        <button onClick={onRemove} className="p-1 text-slate-300 hover:text-red-400 transition-colors flex-shrink-0">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Shared quantity steppers ─────────────────────────────────────────────────

function QuantityStepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden flex-shrink-0">
      <button
        onClick={() => onChange(Math.max(1, value - 1))}
        className="px-2.5 py-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors text-sm font-bold"
      >
        −
      </button>
      <span className="w-7 text-center text-sm font-semibold text-slate-800 tabular-nums">{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        className="px-2.5 py-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors text-sm font-bold"
      >
        +
      </button>
    </div>
  );
}

function SmallQuantityStepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden flex-shrink-0">
      <button
        onClick={() => onChange(Math.max(1, value - 1))}
        className="px-1.5 py-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors text-xs font-bold"
      >
        −
      </button>
      <span className="w-5 text-center text-xs font-semibold text-slate-800 tabular-nums">{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        className="px-1.5 py-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors text-xs font-bold"
      >
        +
      </button>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

interface PhoneCardProps {
  onSavings: (monthly: number, yearly: number) => void;
  hideResults?: boolean;
  onHasData?: (has: boolean) => void;
}

export function PhoneCard({ onSavings, hideResults, onHasData }: PhoneCardProps) {
  const [providers, setProviders] = useState<PhoneProviderData[]>([]);
  const [subs, setSubs] = useState<AnySub[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/phone-providers")
      .then((r) => r.json())
      .then((data: PhoneProviderData[]) => setProviders(data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const smbPlans = useMemo(() => providers.find((p) => p.isOurOffer)?.plans ?? [], [providers]);

  const totalMonthlySavings = useMemo(() => {
    let totalCustomer = 0;
    let totalSMB = 0;

    for (const sub of subs) {
      if (sub.type === "preset") {
        const plan = providers
          .find((p) => p.id === sub.providerId)
          ?.plans.find((pl) => pl.id === sub.planId);
        if (!plan) continue;
        const smbMatch = findSMBMatch(plan, smbPlans);
        if (!smbMatch) continue;
        totalCustomer += plan.pricePerSub * sub.quantity;
        totalSMB += smbMatch.pricePerSub * sub.quantity;
      } else {
        const price = parseNum(sub.pricePerSub);
        if (price === 0) continue;
        const dataGB = sub.fribruk ? -1 : parseNum(sub.dataGB) || 0;
        const pseudoPlan: PhonePlanData = { id: "custom", label: sub.name, dataGB, pricePerSub: price, sortOrder: 0 };
        const smbMatch = findSMBMatch(pseudoPlan, smbPlans);
        if (!smbMatch) continue;
        totalCustomer += price * sub.quantity;
        totalSMB += smbMatch.pricePerSub * sub.quantity;
      }
    }

    // Single clamp across all lines: a cheaper-than-SMB line correctly offsets
    // savings from other lines rather than being silently dropped
    return Math.max(0, totalCustomer - totalSMB);
  }, [subs, providers, smbPlans]);

  useEffect(() => {
    onSavings(totalMonthlySavings, totalMonthlySavings * 12);
  }, [totalMonthlySavings, onSavings]);

  useEffect(() => {
    onHasData?.(subs.length > 0);
  }, [subs.length, onHasData]);

  const addPreset = useCallback(() => setSubs((prev) => [...prev, newPresetSub()]), []);
  const addCustom = useCallback(() => setSubs((prev) => [...prev, newCustomSub()]), []);

  const updateSub = useCallback((localId: string, updated: AnySub) => {
    setSubs((prev) => prev.map((s) => (s.localId === localId ? updated : s)));
  }, []);

  const removeSub = useCallback((localId: string) => {
    setSubs((prev) => prev.filter((s) => s.localId !== localId));
  }, []);

  const hasSavings = totalMonthlySavings > 0;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Phone className="text-orange-600" style={{ width: 18, height: 18 }} />
          </div>
          <h3 className="font-semibold text-slate-900 text-sm">Telefoni</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={addPreset}
            disabled={isLoading}
            className="flex items-center gap-1 text-xs font-semibold text-green-600 hover:text-green-700
              bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            Legg til
          </button>
          <button
            onClick={addCustom}
            disabled={isLoading}
            className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700
              bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            title="Legg til egendefinert abonnement"
          >
            <PenLine className="w-3.5 h-3.5" />
            Eget
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && subs.length === 0 && (
        <div className="flex gap-2">
          <button
            onClick={addPreset}
            className="flex-1 flex flex-col items-center justify-center gap-2 py-5
              rounded-lg border-2 border-dashed border-slate-200 text-slate-400
              hover:border-green-300 hover:text-green-500 hover:bg-green-50/50 transition-all group"
          >
            <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium">Velg fra liste</span>
          </button>
          <button
            onClick={addCustom}
            className="flex-1 flex flex-col items-center justify-center gap-2 py-5
              rounded-lg border-2 border-dashed border-slate-200 text-slate-400
              hover:border-slate-300 hover:text-slate-500 hover:bg-slate-50 transition-all group"
          >
            <PenLine className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium">Egendefinert</span>
          </button>
        </div>
      )}

      {!isLoading && subs.length > 0 && (
        <div className="space-y-2">
          {subs.map((sub) =>
            sub.type === "preset" ? (
              <PresetRow
                key={sub.localId}
                sub={sub}
                providers={providers}
                onChange={(updated) => updateSub(sub.localId, updated)}
                onRemove={() => removeSub(sub.localId)}
              />
            ) : (
              <CustomRow
                key={sub.localId}
                sub={sub}
                onChange={(updated) => updateSub(sub.localId, updated)}
                onRemove={() => removeSub(sub.localId)}
              />
            )
          )}
        </div>
      )}

      {/* Besparelsesoppsummering */}
      {!hideResults && (
        <div
          className={`rounded-lg p-3 mt-3 transition-all duration-300 ${
            hasSavings ? "bg-emerald-50 border border-emerald-100" : "bg-slate-50 border border-slate-100"
          }`}
        >
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Estimert besparelse
          </p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Per måned</p>
              <p className={`text-lg font-bold tabular-nums ${hasSavings ? "text-emerald-600" : "text-slate-300"}`}>
                {hasSavings ? formatNOK(totalMonthlySavings) : "0,-"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 mb-0.5">Per år</p>
              <p className={`text-2xl font-bold tabular-nums ${hasSavings ? "text-emerald-600" : "text-slate-300"}`}>
                {hasSavings ? formatNOK(totalMonthlySavings * 12) : "0,-"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
