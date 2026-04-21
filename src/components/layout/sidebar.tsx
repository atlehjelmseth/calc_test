"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Calculator,
  Settings2,
  LogOut,
  TrendingDown,
  ChevronRight,
} from "lucide-react";

const navItems = [
  {
    href: "/calculator",
    label: "Kalkulator",
    icon: Calculator,
    roles: ["ADMIN", "SELLER"],
  },
  {
    href: "/admin",
    label: "Administrasjon",
    icon: Settings2,
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

  return (
    <aside className="w-64 bg-[#0f172a] min-h-screen flex flex-col flex-shrink-0">
      {/* Logo / Brand */}
      <div className="px-6 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <TrendingDown className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-tight">
              Prismatch
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">Besparelseskalkulator</p>
          </div>
        </div>
      </div>

      {/* Navigasjon */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider px-3 mb-2">
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
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
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

      {/* Brukerinfo + Logg ut */}
      <div className="px-3 py-4 border-t border-slate-700/50">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 bg-blue-600/20 border border-blue-500/30 rounded-full flex items-center justify-center text-blue-300 text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {session?.user?.name ?? session?.user?.email}
            </p>
            <p className="text-slate-400 text-xs">
              {userRole === "ADMIN" ? "Administrator" : "Selger"}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 text-slate-400 hover:text-white text-sm w-full px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-all duration-150"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Logg ut
        </button>
      </div>
    </aside>
  );
}
