"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Calculator,
  Settings2,
  LogOut,
  ChevronRight,
  Users,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

const navItems = [
  {
    href: "/calculator",
    label: "Kalkulator",
    icon: Calculator,
    roles: ["ADMIN", "SELLER"],
  },
  {
    href: "/demo",
    label: "Demo-kalkulator",
    icon: Sparkles,
    roles: ["ADMIN"],
  },
  {
    href: "/admin",
    label: "Administrasjon",
    icon: Settings2,
    roles: ["ADMIN"],
  },
  {
    href: "/admin/users",
    label: "Brukere",
    icon: Users,
    roles: ["ADMIN"],
  },
];

export function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const userRole = session?.user?.role ?? "SELLER";

  const visibleItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  );

  const initials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : session?.user?.email?.[0]?.toUpperCase() ?? "?";

  const displayName = session?.user?.name ?? session?.user?.email ?? "";
  const roleLabel = userRole === "ADMIN" ? "Administrator" : "Selger";

  return (
    <aside className="w-56 bg-white border-r border-slate-200 h-full flex flex-col flex-shrink-0 shadow-sm">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-slate-100 flex-shrink-0">
        <Logo className="h-[22px] w-auto" />
      </div>

      {/* Navigasjon — scrollable so long nav lists don't push footer off screen */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">
          Meny
        </p>
        {visibleItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-green-500 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Brukerinfo + handlinger — always pinned to bottom */}
      <div className="px-3 py-3 border-t border-slate-100 space-y-0.5 flex-shrink-0">
        {/* Brukerinfo */}
        <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">
              {displayName}
            </p>
            <p className="text-xs text-slate-400">{roleLabel}</p>
          </div>
        </div>

        {/* Logg ut */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 text-slate-500 hover:text-red-600 text-sm font-medium px-3 py-2.5 rounded-lg hover:bg-red-50 transition-all duration-150"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Logg ut</span>
        </button>
      </div>
    </aside>
  );
}
