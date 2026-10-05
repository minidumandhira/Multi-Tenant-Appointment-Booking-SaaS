"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070a12] p-5 text-slate-100 sm:p-8">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-fuchsia-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/[0.09] bg-[#101624] shadow-2xl shadow-black/30 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden flex-col justify-between bg-gradient-to-br from-pink-500/20 via-fuchsia-500/10 to-blue-500/20 p-10 lg:flex">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 via-fuchsia-500 to-blue-500 font-bold text-white shadow-lg shadow-fuchsia-500/20">
                B
              </div>
              <span className="text-lg font-semibold tracking-wide text-white">
                BookFlow
              </span>
            </div>

            <p className="mt-20 text-xs font-semibold uppercase tracking-[0.22em] text-pink-300">
              Appointment operations
            </p>
            <h2 className="mt-4 max-w-sm text-4xl font-semibold leading-tight tracking-tight text-white">
              Make every booking feel effortless.
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-6 text-slate-300">
              Bring your businesses, services, customers, staff, and schedule together in one calm workspace.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Your workspace is ready when you are.
          </div>
        </section>

        <section className="p-6 sm:p-10">
          <div className="mb-10 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 via-fuchsia-500 to-blue-500 font-bold text-white">
                B
              </div>
              <span className="text-lg font-semibold tracking-wide text-white">
                BookFlow
              </span>
            </div>
          </div>

          <div className="mx-auto max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-300">
              Welcome back
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
              Sign in to your workspace
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Continue managing your appointment-based business with BookFlow.
            </p>

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-200">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/[0.12] bg-white/[0.05] px-4 py-3 text-white placeholder:text-slate-600 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-400/20"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-200">
                    Password
                  </label>
                  <span className="text-xs text-slate-500">Keep it secure</span>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/[0.12] bg-white/[0.05] px-4 py-3 text-white placeholder:text-slate-600 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-400/20"
                  placeholder="Enter your password"
                  required
                />
              </div>

              {error && (
                <p className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-fuchsia-500 px-4 py-3 font-medium text-white shadow-lg shadow-pink-500/15 transition hover:from-pink-400 hover:to-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}