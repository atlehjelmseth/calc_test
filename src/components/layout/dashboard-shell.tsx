"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { X } from "lucide-react";

interface DashboardShellProps {
  children: React.ReactNode;
  isAdmin: boolean;
}

export function DashboardShell({ children, isAdmin }: DashboardShellProps) {
  const [previewMode, setPreviewMode] = useState(false);

  // Sellers: no sidebar, just the calculator full-width
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-100">
        <main className="w-full overflow-auto">{children}</main>
      </div>
    );
  }

  // Admin in seller-preview mode
  if (previewMode) {
    return (
      <div className="min-h-screen bg-slate-100">
        <div className="bg-amber-500 text-white px-5 py-2.5 flex items-center justify-between sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
            <span className="text-sm font-semibold">
              Selger-visning — slik ser selgerne kalkulatoren
            </span>
          </div>
          <button
            onClick={() => setPreviewMode(false)}
            className="flex items-center gap-1.5 text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg font-semibold transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Tilbake til admin-visning
          </button>
        </div>
        <main className="w-full overflow-auto">{children}</main>
      </div>
    );
  }

  // Normal admin view
  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar onPreview={() => setPreviewMode(true)} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
