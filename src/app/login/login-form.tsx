"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle2, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";

export function LoginForm({ error: initialError, message }: { error?: string; message?: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(initialError || "");
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        setErrorMsg("Invalid email or password");
        setLoading(false);
      } else {
        // Hard browser redirect — ensures Supabase session cookies
        // are included in the next server request. router.push() is
        // not reliable here because client-side navigation happens
        // before the SSR cookie is committed.
        window.location.replace("/");
      }
    } catch (err) {
      setErrorMsg("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center p-6 sm:p-10 lg:p-16">
      <div className="w-full max-w-[420px] space-y-7 animate-fade-in">
        
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-lg overflow-hidden bg-white border border-border/10 shadow-sm">
            <img src="/icon.png" alt="Logo" className="w-full h-full object-contain p-0.5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase"
              style={{ color: "oklch(0.82 0.14 75)" }}>Literary Society</p>
            <p className="text-[9px] text-muted-foreground">UET Lahore</p>
          </div>
        </div>

        {/* Header */}
        <div>
          <h2 className="font-serif text-[2rem] font-bold text-foreground leading-tight">Welcome back</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your society account to continue.
          </p>
        </div>

        <Separator className="opacity-20" />

        {/* Error Alert */}
        {errorMsg && (
          <div className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm animate-fade-in bg-destructive/10 border border-destructive/20 text-destructive">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p className="font-medium">{errorMsg}</p>
          </div>
        )}

        {/* Success Alert */}
        {message && (
          <div className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm animate-fade-in bg-green-500/10 border border-green-500/20 text-green-500">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            <p className="font-medium">{message}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground/80">
              Email address
            </Label>
            <div className="relative group">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[oklch(0.72_0.12_75)] transition-colors" />
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@student.uet.edu.pk"
                className="pl-10 h-12 bg-card border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-1 rounded-xl transition-all"
                style={{ "--tw-ring-color": "oklch(0.72 0.12 75 / 40%)" } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium text-foreground/80">
                Password
              </Label>
              <Link href="/forgot-password"
                className="text-xs hover:underline underline-offset-2 font-medium transition-colors"
                style={{ color: "oklch(0.78 0.14 75)" }}>
                Forgot password?
              </Link>
            </div>
            <div className="relative group">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[oklch(0.72_0.12_75)] transition-colors" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="pl-10 pr-12 h-12 bg-card border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-1 rounded-xl transition-all"
                style={{ "--tw-ring-color": "oklch(0.72 0.12 75 / 40%)" } as React.CSSProperties}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="w-full font-semibold tracking-wide transition-all duration-150 active:scale-[0.98] border-0 h-12 rounded-xl mt-2 group relative overflow-hidden shadow-lg"
            style={{
              background: "linear-gradient(135deg, oklch(0.75 0.14 75) 0%, oklch(0.65 0.10 75) 100%)",
              color: "oklch(0.10 0.01 240)",
            }}
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
            <span className="relative flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" size={18} /> : null}
              {loading ? "Signing in..." : "Sign in to Society"}
              {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            </span>
          </Button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center gap-3 pt-1">
          <div className="flex-1 h-px bg-border/50" />
          <span className="text-[11px] text-muted-foreground/60 uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-border/50" />
        </div>

        {/* Footer */}
        <div className="text-center space-y-1">
          <p className="text-xs text-muted-foreground">
            Access is restricted to registered society members.
          </p>
          <p className="text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold hover:underline underline-offset-2 transition-colors"
              style={{ color: "oklch(0.78 0.14 75)" }}>
              Apply for membership
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
