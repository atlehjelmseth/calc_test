"use client";

import { useState, useCallback } from "react";
import {
  Phone,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  AlertCircle,
  Star,
  Pencil,
  X,
} from "lucide-react";
import { PhoneProviderData, PhonePlanData } from "@/lib/phone-calculations";

// ── Hjelpefunksjoner ──────────────────────────────────────────────

function labelFromGB(dataGB: number): string {
  return dataGB === -1 ? "Fri bruk" : `${dataGB}GB`;
}

// ── Abonnements-rad ───────────────────────────────────────────────

function PlanRow({
  plan,
  onSave,
  onDelete,
}: {
  plan: PhonePlanData;
  onSave: (id: string, price: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(plan.pricePerSub.toString());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    const num = parseFloat(price);
    if (isNaN(num) || num < 0) return;
    setSaving(true);
    try {
      await onSave(plan.id, num);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Slett ${plan.label}?`)) return;
    setDeleting(true);
    try {
      await onDelete(plan.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-slate-50 group">
      <span className="text-sm text-slate-600 w-20 flex-shrink-0">{plan.label}</span>

      {editing ? (
        <div className="flex items-center gap-2 flex-1">
          <div className="relative w-28">
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="input-field py-1 text-sm pr-10"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
              kr/mnd
            </span>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-emerald-600/40 border-t-emerald-600 rounded-full animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => { setEditing(false); setPrice(plan.pricePerSub.toString()); }}
            className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm font-semibold text-slate-800 tabular-nums w-24">
            {plan.pricePerSub.toLocaleString("nb-NO")},- /mnd
          </span>
          <button
            onClick={() => setEditing(true)}
            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 transition-all rounded"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <button
        onClick={handleDelete}
        disabled={deleting}
        className="opacity-0 group-hover:opacity-100 ml-auto p-1 text-slate-300 hover:text-red-400 transition-all rounded"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Leverandørblokk ───────────────────────────────────────────────

function ProviderBlock({
  provider,
  onUpdatePlan,
  onDeletePlan,
  onAddPlan,
  onDeleteProvider,
  onRefresh,
}: {
  provider: PhoneProviderData;
  onUpdatePlan: (planId: string, price: number) => Promise<void>;
  onDeletePlan: (planId: string) => Promise<void>;
  onAddPlan: (providerId: string, label: string, dataGB: number, price: number) => Promise<void>;
  onDeleteProvider: (providerId: string) => Promise<void>;
  onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [addingPlan, setAddingPlan] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newGB, setNewGB] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAddPlan() {
    const price = parseFloat(newPrice);
    const gbVal = newLabel.toLowerCase() === "fri bruk" ? -1 : parseInt(newGB);
    if (!newLabel || isNaN(price) || (gbVal !== -1 && isNaN(gbVal))) return;
    setSaving(true);
    try {
      await onAddPlan(provider.id, newLabel, gbVal, price);
      setNewLabel(""); setNewGB(""); setNewPrice(""); setAddingPlan(false);
      onRefresh();
    } finally {
      setSaving(false);
    }
  }

  const isFribruk = newLabel.toLowerCase() === "fri bruk";

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* Leverandør-header */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-white cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {open ? (
            <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
          )}
          <span className="font-semibold text-slate-800 text-sm">{provider.name}</span>
          {provider.isOurOffer && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
              <Star className="w-2.5 h-2.5" />
              Vår tilbudsside
            </span>
          )}
          <span className="text-xs text-slate-400 ml-auto mr-3">
            {provider.plans.length} abonnementer
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Slett ${provider.name} og alle tilhørende abonnementer?`))
              onDeleteProvider(provider.id);
          }}
          className="p-1.5 text-slate-200 hover:text-red-400 transition-colors flex-shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Abonnements-liste */}
      {open && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3">
          {provider.plans.length === 0 ? (
            <p className="text-sm text-slate-400 italic py-2">Ingen abonnementer ennå</p>
          ) : (
            <div className="space-y-0.5">
              {provider.plans.map((plan) => (
                <PlanRow
                  key={plan.id}
                  plan={plan}
                  onSave={onUpdatePlan}
                  onDelete={async (id) => {
                    await onDeletePlan(id);
                    onRefresh();
                  }}
                />
              ))}
            </div>
          )}

          {/* Legg til nytt abonnement */}
          {addingPlan ? (
            <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Nytt abonnement
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Navn (f.eks. "20GB" eller "Fri bruk")</label>
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="20GB"
                    className="input-field text-xs py-1.5"
                  />
                </div>
                {!isFribruk && (
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Data (GB)</label>
                    <input
                      type="number"
                      value={newGB}
                      onChange={(e) => setNewGB(e.target.value)}
                      placeholder="20"
                      className="input-field text-xs py-1.5"
                    />
                  </div>
                )}
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Pris (kr/mnd)</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="399"
                    className="input-field text-xs py-1.5"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddPlan}
                  disabled={saving}
                  className="btn-primary py-1.5 text-xs flex items-center gap-1.5"
                >
                  {saving ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Lagre abonnement
                </button>
                <button
                  onClick={() => { setAddingPlan(false); setNewLabel(""); setNewGB(""); setNewPrice(""); }}
                  className="btn-secondary py-1.5 text-xs"
                >
                  Avbryt
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingPlan(true)}
              className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              Legg til abonnement
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Hoved-komponent ───────────────────────────────────────────────

export function PhoneAdmin({ initialProviders }: { initialProviders: PhoneProviderData[] }) {
  const [providers, setProviders] = useState<PhoneProviderData[]>(initialProviders);
  const [addingProvider, setAddingProvider] = useState(false);
  const [newProviderName, setNewProviderName] = useState("");
  const [newIsOurOffer, setNewIsOurOffer] = useState(false);
  const [globalError, setGlobalError] = useState("");

  const refresh = useCallback(async () => {
    const res = await fetch("/api/phone-providers");
    if (res.ok) setProviders(await res.json());
  }, []);

  async function handleUpdatePlan(planId: string, price: number) {
    setGlobalError("");
    const res = await fetch(`/api/phone-plans/${planId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pricePerSub: price }),
    });
    if (!res.ok) {
      setGlobalError("Kunne ikke lagre pris");
      return;
    }
    await refresh();
  }

  async function handleDeletePlan(planId: string) {
    setGlobalError("");
    const res = await fetch(`/api/phone-plans/${planId}`, { method: "DELETE" });
    if (!res.ok) setGlobalError("Kunne ikke slette abonnement");
  }

  async function handleAddPlan(
    providerId: string,
    label: string,
    dataGB: number,
    price: number
  ) {
    setGlobalError("");
    const res = await fetch("/api/phone-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ providerId, label, dataGB, pricePerSub: price }),
    });
    if (!res.ok) setGlobalError("Kunne ikke legge til abonnement");
  }

  async function handleDeleteProvider(providerId: string) {
    setGlobalError("");
    const res = await fetch(`/api/phone-providers/${providerId}`, { method: "DELETE" });
    if (!res.ok) { setGlobalError("Kunne ikke slette leverandør"); return; }
    await refresh();
  }

  async function handleAddProvider() {
    if (!newProviderName.trim()) return;
    setGlobalError("");
    const res = await fetch("/api/phone-providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newProviderName.trim(), isOurOffer: newIsOurOffer }),
    });
    if (!res.ok) { setGlobalError("Kunne ikke opprette leverandør"); return; }
    setNewProviderName(""); setNewIsOurOffer(false); setAddingProvider(false);
    await refresh();
  }

  return (
    <div className="card p-6">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Phone className="text-orange-600" style={{ width: 18, height: 18 }} />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold text-slate-900">Telefoni-leverandører</h2>
          <p className="text-sm text-slate-500">
            Administrer leverandørpriser og abonnementer. Klikk på en leverandør for å se og redigere priser.
          </p>
        </div>
      </div>

      {globalError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {globalError}
        </div>
      )}

      <div className="space-y-2 mb-4">
        {providers.map((provider) => (
          <ProviderBlock
            key={provider.id}
            provider={provider}
            onUpdatePlan={handleUpdatePlan}
            onDeletePlan={handleDeletePlan}
            onAddPlan={handleAddPlan}
            onDeleteProvider={handleDeleteProvider}
            onRefresh={refresh}
          />
        ))}
      </div>

      {/* Legg til ny leverandør */}
      {addingProvider ? (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <p className="text-sm font-semibold text-slate-700">Ny leverandør</p>
          <input
            type="text"
            value={newProviderName}
            onChange={(e) => setNewProviderName(e.target.value)}
            placeholder="Leverandørnavn"
            className="input-field"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleAddProvider()}
          />
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={newIsOurOffer}
              onChange={(e) => setNewIsOurOffer(e.target.checked)}
              className="w-4 h-4 accent-blue-600"
            />
            Dette er vår tilbudsside (sammenligningsprovider)
          </label>
          <div className="flex gap-2">
            <button onClick={handleAddProvider} className="btn-primary flex items-center gap-1.5 text-sm">
              <Plus className="w-4 h-4" /> Legg til leverandør
            </button>
            <button onClick={() => { setAddingProvider(false); setNewProviderName(""); }} className="btn-secondary text-sm">
              Avbryt
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAddingProvider(true)}
          className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Legg til leverandør
        </button>
      )}
    </div>
  );
}
