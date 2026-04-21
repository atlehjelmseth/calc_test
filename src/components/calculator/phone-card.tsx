"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Phone, Plus, Trash2, ChevronDown } from "lucide-react";
import {
  PhoneProviderData,
  PhonePlanData,
  findSMBMatch,
} from "@/lib/phone-calculations";
import { formatNOK } from "@/lib/calculations";

interface Subscription {
  localId: string;
  providerId: string;
  planId: string;
  quantity: number;
}

function newSubscription(): Subscription {
  return {
    localId: Math.random().toString(36).slice(2),
    providerId: "",
    planId: "",
    quantity: 1,
  };
}

// ── Abonnements-rad ─────────────────────────────────────────────────────────
// Viser kun valg av leverandør, abonnement og antall — ingen per-linje besparelse

interface SubscriptionRowProps {
  sub: Subscription;
  providers: PhoneProviderData[];
  onChange: (updated: Subscription) => void;
  onRemove: () => void;
}

function SubscriptionRow({ sub, providers, onChange, onRemove }: SubscriptionRowProps) {
  const competitorProviders = providers.filter((p) => !p.isOurOffer);
  const selectedProvider = competitorProviders.find((p) => p.id === sub.providerId);

  return (
    <div className="flex items-center gap-2">
      {/* Leverandør */}
      <div className="relative flex-1 min-w-0">
        <select
          value={sub.providerId}
          onChange={(e) => onChange({ ...sub, providerId: e.target.value, planId: "" })}
          className="w-full appearance-none text-sm px-2.5 py-2 pr-7 border border-slate-200 rounded-lg bg-white text-slate-800
            focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        >
          <option value="">Leverandør</option>
          {competitorProviders.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
      </div>

      {/* Abonnement */}
      <div className="relative flex-1 min-w-0">
        <select
          value={sub.planId}
          onChange={(e) => onChange({ ...sub, planId: e.target.value })}
          disabled={!sub.providerId}
          className="w-full appearance-none text-sm px-2.5 py-2 pr-7 border border-slate-200 rounded-lg bg-white text-slate-800
            focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Abonnement</option>
          {selectedProvider?.plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
      </div>

      {/* Antall */}
      <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden flex-shrink-0">
        <button
          onClick={() => onChange({ ...sub, quantity: Math.max(1, sub.quantity - 1) })}
          className="px-2.5 py-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors text-sm font-bold"
        >
          −
        </button>
        <span className="w-7 text-center text-sm font-semibold text-slate-800 tabular-nums">
          {sub.quantity}
        </span>
        <button
          onClick={() => onChange({ ...sub, quantity: sub.quantity + 1 })}
          className="px-2.5 py-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors text-sm font-bold"
        >
          +
        </button>
      </div>

      {/* Slett */}
      <button
        onClick={onRemove}
        className="p-1.5 text-slate-300 hover:text-red-400 transition-colors flex-shrink-0"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Hoved-komponent ──────────────────────────────────────────────────────────

interface PhoneCardProps {
  onSavings: (monthly: number, yearly: number) => void;
}

export function PhoneCard({ onSavings }: PhoneCardProps) {
  const [providers, setProviders] = useState<PhoneProviderData[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/phone-providers")
      .then((r) => r.json())
      .then((data: PhoneProviderData[]) => setProviders(data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const smbPlans = useMemo(
    () => providers.find((p) => p.isOurOffer)?.plans ?? [],
    [providers]
  );

  // Netto besparelse: total kundens kostnad minus total SMB-kostnad
  // Hvis SMB totalt er dyrere enn kunden betaler i dag → 0,- i besparelse
  const totalMonthlySavings = useMemo(() => {
    let totalCustomer = 0;
    let totalSMB = 0;

    for (const sub of subscriptions) {
      const plan = providers
        .find((p) => p.id === sub.providerId)
        ?.plans.find((pl) => pl.id === sub.planId);
      if (!plan) continue;

      const smbMatch = findSMBMatch(plan, smbPlans);
      if (!smbMatch) continue;

      totalCustomer += plan.pricePerSub * sub.quantity;
      totalSMB += smbMatch.pricePerSub * sub.quantity;
    }

    // Negativ besparelse (SMB er dyrere) vises som 0,-
    return Math.max(0, totalCustomer - totalSMB);
  }, [subscriptions, providers, smbPlans]);

  useEffect(() => {
    onSavings(totalMonthlySavings, totalMonthlySavings * 12);
  }, [totalMonthlySavings, onSavings]);

  const addSubscription = useCallback(() => {
    setSubscriptions((prev) => [...prev, newSubscription()]);
  }, []);

  const updateSubscription = useCallback((localId: string, updated: Subscription) => {
    setSubscriptions((prev) => prev.map((s) => (s.localId === localId ? updated : s)));
  }, []);

  const removeSubscription = useCallback((localId: string) => {
    setSubscriptions((prev) => prev.filter((s) => s.localId !== localId));
  }, []);

  const hasSavings = totalMonthlySavings > 0;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Phone className="text-orange-600" style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Telefoni</h3>
          </div>
        </div>
        <button
          onClick={addSubscription}
          disabled={isLoading}
          className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700
            bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          Legg til
        </button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && subscriptions.length === 0 && (
        <button
          onClick={addSubscription}
          className="w-full flex flex-col items-center justify-center gap-2 py-6
            rounded-lg border-2 border-dashed border-slate-200 text-slate-400
            hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/50 transition-all group"
        >
          <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-medium">Legg til abonnement</span>
        </button>
      )}

      {!isLoading && subscriptions.length > 0 && (
        <div className="space-y-2">
          {subscriptions.map((sub) => (
            <SubscriptionRow
              key={sub.localId}
              sub={sub}
              providers={providers}
              onChange={(updated) => updateSubscription(sub.localId, updated)}
              onRemove={() => removeSubscription(sub.localId)}
            />
          ))}
        </div>
      )}

      {/* Besparelsesoppsummering */}
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
    </div>
  );
}
