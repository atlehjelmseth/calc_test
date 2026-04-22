"use client";

import { useState, useCallback } from "react";
import {
  Zap,
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
import { ElectricityProviderData, ElectricityPlanData } from "@/lib/electricity-calculations";

// ── Avtale-rad ────────────────────────────────────────────────────

function PlanRow({
  plan,
  onSave,
  onDelete,
}: {
  plan: ElectricityPlanData;
  onSave: (id: string, fixedAmount: number, markup: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [fixed, setFixed] = useState(plan.fixedAmount.toString());
  const [markup, setMarkup] = useState(plan.markup.toString());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    const f = parseFloat(fixed);
    const m = parseFloat(markup);
    if (isNaN(f) || isNaN(m) || f < 0 || m < 0) return;
    setSaving(true);
    try {
      await onSave(plan.id, f, m);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Slett avtalen «${plan.name}»?`)) return;
    setDeleting(true);
    try {
      await onDelete(plan.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-slate-50 group">
      <span className="text-sm text-slate-600 flex-1 min-w-0 truncate">{plan.name}</span>

      {editing ? (
        <div className="flex items-center gap-2">
          <div className="relative w-24">
            <input
              type="number"
              value={fixed}
              onChange={(e) => setFixed(e.target.value)}
              className="input-field py-1 text-sm pr-12"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
              kr/mnd
            </span>
          </div>
          <div className="relative w-24">
            <input
              type="number"
              value={markup}
              onChange={(e) => setMarkup(e.target.value)}
              className="input-field py-1 text-sm pr-14"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
              øre/kWh
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
            onClick={() => { setEditing(false); setFixed(plan.fixedAmount.toString()); setMarkup(plan.markup.toString()); }}
            className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-slate-500 tabular-nums w-20 text-right">
            {plan.fixedAmount},- kr/mnd
          </span>
          <span className="text-xs text-slate-500 tabular-nums w-20 text-right">
            {plan.markup} øre/kWh
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
        className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-400 transition-all rounded flex-shrink-0"
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
  onSetOurOffer,
  onRefresh,
}: {
  provider: ElectricityProviderData;
  onUpdatePlan: (planId: string, fixedAmount: number, markup: number) => Promise<void>;
  onDeletePlan: (planId: string) => Promise<void>;
  onAddPlan: (providerId: string, name: string, fixedAmount: number, markup: number) => Promise<void>;
  onDeleteProvider: (providerId: string) => Promise<void>;
  onSetOurOffer: (providerId: string) => Promise<void>;
  onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [addingPlan, setAddingPlan] = useState(false);
  const [newName, setNewName] = useState("");
  const [newFixed, setNewFixed] = useState("");
  const [newMarkup, setNewMarkup] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAddPlan() {
    const f = parseFloat(newFixed);
    const m = parseFloat(newMarkup);
    if (!newName.trim() || isNaN(f) || isNaN(m) || f < 0 || m < 0) return;
    setSaving(true);
    try {
      await onAddPlan(provider.id, newName.trim(), f, m);
      setNewName(""); setNewFixed(""); setNewMarkup(""); setAddingPlan(false);
      onRefresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
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
          <span className="font-semibold text-slate-800 text-sm truncate">{provider.name}</span>
          {provider.isOurOffer && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex-shrink-0">
              <Star className="w-2.5 h-2.5" />
              Vår referanseavtale
            </span>
          )}
          <span className="text-xs text-slate-400 ml-auto mr-3 flex-shrink-0">
            {provider.plans.length} {provider.plans.length === 1 ? "avtale" : "avtaler"}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Slett ${provider.name} og alle tilhørende avtaler?`))
              onDeleteProvider(provider.id);
          }}
          className="p-1.5 text-slate-200 hover:text-red-400 transition-colors flex-shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3">
          {provider.plans.length === 0 ? (
            <p className="text-sm text-slate-400 italic py-2">Ingen avtaler ennå</p>
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

          {!provider.isOurOffer && (
            <button
              onClick={() => onSetOurOffer(provider.id)}
              className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 hover:text-green-700 font-medium px-2 py-1 rounded-lg hover:bg-green-50 transition-colors border border-dashed border-slate-300 hover:border-green-300"
            >
              <Star className="w-3 h-3" />
              Sett som vår referanseavtale
            </button>
          )}

          {addingPlan ? (
            <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Ny avtale
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Avtalenavn</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder='f.eks. "Spot Næring"'
                    className="input-field text-xs py-1.5"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Fastbeløp (kr/mnd)</label>
                  <input
                    type="number"
                    value={newFixed}
                    onChange={(e) => setNewFixed(e.target.value)}
                    placeholder="39"
                    className="input-field text-xs py-1.5"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Påslag (øre/kWh)</label>
                  <input
                    type="number"
                    value={newMarkup}
                    onChange={(e) => setNewMarkup(e.target.value)}
                    placeholder="2.5"
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
                  Lagre avtale
                </button>
                <button
                  onClick={() => { setAddingPlan(false); setNewName(""); setNewFixed(""); setNewMarkup(""); }}
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
              Legg til avtale
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Hoved-komponent ───────────────────────────────────────────────

export function ElectricityAdmin({ initialProviders }: { initialProviders: ElectricityProviderData[] }) {
  const [providers, setProviders] = useState<ElectricityProviderData[]>(initialProviders);
  const [addingProvider, setAddingProvider] = useState(false);
  const [newProviderName, setNewProviderName] = useState("");
  const [newIsOurOffer, setNewIsOurOffer] = useState(false);
  const [globalError, setGlobalError] = useState("");

  const refresh = useCallback(async () => {
    const res = await fetch("/api/electricity-providers");
    if (res.ok) setProviders(await res.json());
  }, []);

  async function handleUpdatePlan(planId: string, fixedAmount: number, markup: number) {
    setGlobalError("");
    const res = await fetch(`/api/electricity-plans/${planId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fixedAmount, markup }),
    });
    if (!res.ok) { setGlobalError("Kunne ikke lagre priser"); return; }
    await refresh();
  }

  async function handleDeletePlan(planId: string) {
    setGlobalError("");
    const res = await fetch(`/api/electricity-plans/${planId}`, { method: "DELETE" });
    if (!res.ok) setGlobalError("Kunne ikke slette avtale");
  }

  async function handleAddPlan(providerId: string, name: string, fixedAmount: number, markup: number) {
    setGlobalError("");
    const res = await fetch("/api/electricity-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ providerId, name, fixedAmount, markup }),
    });
    if (!res.ok) setGlobalError("Kunne ikke legge til avtale");
  }

  async function handleDeleteProvider(providerId: string) {
    setGlobalError("");
    const res = await fetch(`/api/electricity-providers/${providerId}`, { method: "DELETE" });
    if (!res.ok) { setGlobalError("Kunne ikke slette leverandør"); return; }
    await refresh();
  }

  async function handleSetOurOffer(providerId: string) {
    setGlobalError("");
    const res = await fetch(`/api/electricity-providers/${providerId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isOurOffer: true }),
    });
    if (!res.ok) { setGlobalError("Kunne ikke oppdatere tilbudsside"); return; }
    await refresh();
  }

  async function handleAddProvider() {
    if (!newProviderName.trim()) return;
    setGlobalError("");
    const res = await fetch("/api/electricity-providers", {
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
        <div className="w-9 h-9 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Zap className="text-yellow-600" style={{ width: 18, height: 18 }} />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold text-slate-900">Strømleverandører</h2>
          <p className="text-sm text-slate-500">
            Administrer leverandører og strømavtaler. Klikk på en leverandør for å se og redigere priser.
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
            onSetOurOffer={handleSetOurOffer}
            onRefresh={refresh}
          />
        ))}
      </div>

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
