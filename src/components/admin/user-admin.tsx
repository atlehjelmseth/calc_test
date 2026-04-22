"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Users,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  AlertCircle,
  Pencil,
  X,
  KeyRound,
  ShieldCheck,
  User,
} from "lucide-react";

interface UserData {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
}

// ── Bruker-rad ────────────────────────────────────────────────────

function UserRow({
  user,
  isSelf,
  onRefresh,
  onError,
}: {
  user: UserData;
  isSelf: boolean;
  onRefresh: () => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [mode, setMode] = useState<"view" | "edit" | "password">("view");
  const [editName, setEditName] = useState(user.name ?? "");
  const [editEmail, setEditEmail] = useState(user.email);
  const [editRole, setEditRole] = useState(user.role);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function cancelEdit() {
    setEditName(user.name ?? "");
    setEditEmail(user.email);
    setEditRole(user.role);
    setMode("view");
  }

  function cancelPassword() {
    setNewPassword("");
    setConfirmPassword("");
    setMode("view");
  }

  async function handleSaveProfile() {
    setSaving(true);
    onError("");
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "profile",
          name: editName,
          email: editEmail,
          role: editRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) { onError(data.error ?? "Kunne ikke lagre"); return; }
      setMode("view");
      await onRefresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePassword() {
    if (newPassword !== confirmPassword) {
      onError("Passordene er ikke like");
      return;
    }
    if (newPassword.length < 6) {
      onError("Passord må være minst 6 tegn");
      return;
    }
    setSaving(true);
    onError("");
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "password", password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { onError(data.error ?? "Kunne ikke lagre passord"); return; }
      cancelPassword();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Slett brukeren «${user.email}»? Dette kan ikke angres.`)) return;
    setDeleting(true);
    onError("");
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { onError(data.error ?? "Kunne ikke slette bruker"); return; }
      await onRefresh();
    } finally {
      setDeleting(false);
    }
  }

  const initials = (user.name ?? user.email)
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* Hoved-rad */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">
            {user.name ?? <span className="text-slate-400 italic">Ingen navn</span>}
            {isSelf && (
              <span className="ml-2 text-xs text-blue-500 font-normal">(deg)</span>
            )}
          </p>
          <p className="text-xs text-slate-500 truncate">{user.email}</p>
        </div>
        <span
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${
            user.role === "ADMIN"
              ? "bg-blue-100 text-blue-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {user.role === "ADMIN" ? (
            <ShieldCheck className="w-3 h-3" />
          ) : (
            <User className="w-3 h-3" />
          )}
          {user.role === "ADMIN" ? "Admin" : "Selger"}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {mode === "view" && (
            <>
              <button
                onClick={() => setMode("edit")}
                title="Rediger bruker"
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setMode("password")}
                title="Bytt passord"
                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5" />
              </button>
              {!isSelf && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  title="Slett bruker"
                  className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Rediger profil */}
      {mode === "edit" && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3 space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Rediger bruker
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Navn</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Fullt navn"
                className="input-field text-sm py-1.5"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">E-post</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="input-field text-sm py-1.5"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Rolle</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="w-full text-sm px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="SELLER">Selger</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="btn-primary py-1.5 text-xs flex items-center gap-1.5"
            >
              {saving ? (
                <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Lagre endringer
            </button>
            <button onClick={cancelEdit} className="btn-secondary py-1.5 text-xs">
              Avbryt
            </button>
          </div>
        </div>
      )}

      {/* Bytt passord */}
      {mode === "password" && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3 space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Sett nytt passord
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Nytt passord</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 6 tegn"
                className="input-field text-sm py-1.5"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Bekreft passord</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Gjenta passord"
                className="input-field text-sm py-1.5"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSavePassword}
              disabled={saving}
              className="btn-primary py-1.5 text-xs flex items-center gap-1.5"
            >
              {saving ? (
                <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <KeyRound className="w-3.5 h-3.5" />
              )}
              Sett passord
            </button>
            <button onClick={cancelPassword} className="btn-secondary py-1.5 text-xs">
              Avbryt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Opprett bruker ────────────────────────────────────────────────

function CreateUserForm({
  onCreated,
  onError,
}: {
  onCreated: () => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("SELLER");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!email || !password) { onError("E-post og passord er påkrevd"); return; }
    setSaving(true);
    onError("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || undefined, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) { onError(data.error ?? "Kunne ikke opprette bruker"); return; }
      setName(""); setEmail(""); setPassword(""); setRole("SELLER"); setOpen(false);
      await onCreated();
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Legg til bruker
      </button>
    );
  }

  return (
    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
      <p className="text-sm font-semibold text-slate-700">Ny bruker</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-slate-500 block mb-1">Navn (valgfritt)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ola Nordmann"
            className="input-field"
            autoFocus
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">E-post</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ola@prismatch.no"
            className="input-field"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Passord</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 6 tegn"
            className="input-field"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Rolle</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full text-sm px-2.5 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="SELLER">Selger</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleCreate}
          disabled={saving}
          className="btn-primary flex items-center gap-1.5 text-sm"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Opprett bruker
        </button>
        <button
          onClick={() => { setOpen(false); setName(""); setEmail(""); setPassword(""); setRole("SELLER"); }}
          className="btn-secondary text-sm"
        >
          Avbryt
        </button>
      </div>
    </div>
  );
}

// ── Hoved-komponent ───────────────────────────────────────────────

export function UserAdmin({ initialUsers, currentUserId }: { initialUsers: UserData[]; currentUserId: string }) {
  const [users, setUsers] = useState<UserData[]>(initialUsers);
  const [globalError, setGlobalError] = useState("");
  const [globalSuccess, setGlobalSuccess] = useState("");

  const refresh = useCallback(async () => {
    const res = await fetch("/api/users");
    if (res.ok) setUsers(await res.json());
  }, []);

  function handleError(msg: string) {
    setGlobalError(msg);
    setGlobalSuccess("");
    if (msg) setTimeout(() => setGlobalError(""), 5000);
  }

  return (
    <div className="card p-6">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Users className="text-indigo-600" style={{ width: 18, height: 18 }} />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold text-slate-900">Brukere</h2>
          <p className="text-sm text-slate-500">
            Administrer hvem som har tilgang til kalkulatoren.
          </p>
        </div>
        <span className="text-xs text-slate-400 font-medium mt-1">{users.length} bruker{users.length !== 1 ? "e" : ""}</span>
      </div>

      {globalError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {globalError}
        </div>
      )}

      <div className="space-y-2 mb-4">
        {users.map((user) => (
          <UserRow
            key={user.id}
            user={user}
            isSelf={user.id === currentUserId}
            onRefresh={refresh}
            onError={handleError}
          />
        ))}
      </div>

      <CreateUserForm onCreated={refresh} onError={handleError} />
    </div>
  );
}
