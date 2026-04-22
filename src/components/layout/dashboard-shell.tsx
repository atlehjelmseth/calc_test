"use client";

import { createContext, useContext, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Sidebar } from "./sidebar";
import { Logo } from "@/components/ui/logo";
import { X, LogOut } from "lucide-react";

// ── Preview context ────────────────────────────────────────────────

interface PreviewContextValue {
  startPreview: () => void;
}

export const PreviewContext = createContext<PreviewContextValue | null>(null);

export function usePreview() {
  return useContext(PreviewContext);
}

// ── Seller top bar (used in both seller and admin-preview mode) ────

function SellerHeader({ onExitPreview }: { onExitPreview?: () => void }) {
  const { data: session } = useSession();
  const displayName = session?.user?.name ?? session?.user?.email ?? "";
  const roleLabel = session?.user?.role === "ADMIN" ? "Administrator" : "Selger";

  return (
    <>
      {onExitPreview && (
        <div className="bg-amber-500 text-white px-5 py-2.5 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
            <span className="text-sm font-semibold">
              Selger-visning — slik ser selgerne kalkulatoren
            </span>
          </div>
          <button
            onClick={onExitPreview}
            className="flex items-center gap-1.5 text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg font-semibold transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Tilbake til admin-visning
          </button>
        </div>
      )}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <Logo className="h-[22px] w-auto" />
        <div className="flex items-center gap-3">
          {displayName && (
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-800 leading-tight">{displayName}</p>
              <p className="text-xs text-slate-400">{roleLabel}</p>
            </div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logg ut
          </button>
        </div>
      </header>
    </>
  );
}

// ── Shell ──────────────────────────────────────────────────────────

interface DashboardShellProps {
  children: React.ReactNode;
  isAdmin: boolean;
}

export function DashboardShell({ children, isAdmin: serverIsAdmin }: DashboardShellProps) {
  const { data: session, status } = useSession();
  const [previewMode, setPreviewMode] = useState(false);

  // Once the client session is confirmed, use it — overrides any bfcache-restored
  // server prop from a previous session (e.g. admin navigating back as a seller)
  const isAdmin =
    status === "authenticated" ? session?.user?.role === "ADMIN" : serverIsAdmin;

  // Sellers: top bar with logo + user info + logout, content centered
  if (!isAdmin) {
    return (
      <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">
        <SellerHeader />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    );
  }

  // Admin in seller-preview mode
  if (previewMode) {
    return (
      <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">
        <SellerHeader onExitPreview={() => setPreviewMode(false)} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    );
  }

  // Normal admin view: sticky sidebar + scrollable main
  return (
    <PreviewContext.Provider value={{ startPreview: () => setPreviewMode(true) }}>
      <div className="flex h-screen overflow-hidden bg-slate-100">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </PreviewContext.Provider>
  );
}
