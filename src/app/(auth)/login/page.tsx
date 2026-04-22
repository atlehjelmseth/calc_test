"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Logo } from "@/components/ui/logo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/calculator";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: email.toLowerCase(),
        password,
        redirect: false,
        callbackUrl,
      });
      if (result?.error) {
        setError("Ugyldig e-post eller passord. Prøv igjen.");
      } else if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
          E-post
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="navn@prismatch.no"
          required
          autoComplete="email"
          autoFocus
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400
            focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors text-sm bg-white"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
          Passord
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400
              focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors text-sm pr-10 bg-white"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !email || !password}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5
          bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg
          transition-colors duration-150 mt-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Logger inn...
          </>
        ) : (
          "Logg inn"
        )}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* Subtile bakgrunnsdekorasjoner */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-green-500/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo className="h-9 w-auto" />
        </div>

        {/* Login-kort */}
        <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-lg shadow-slate-200/60">
          <h2 className="text-lg font-bold text-slate-900 mb-0.5">Logg inn</h2>
          <p className="text-slate-500 text-sm mb-6">
            Tilgang kun for Prismatch-ansatte
          </p>

          <Suspense fallback={<div className="h-48 animate-pulse bg-slate-100 rounded-lg" />}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="text-center text-slate-400 text-xs mt-6">
          © {new Date().getFullYear()} Prismatch · Internt verktøy
        </p>
      </div>
    </div>
  );
}
