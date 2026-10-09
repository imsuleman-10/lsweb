"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, CheckCircle2, Lock } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [pw, setPw]     = useState("");
  const [pw2, setPw2]   = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw !== pw2)     { setError("Passwords do not match"); return; }
    if (pw.length < 6)  { setError("Password must be at least 6 characters"); return; }

    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setDone(true);
    setTimeout(() => router.push("/"), 2500);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, oklch(0.72 0.12 75), transparent 70%)" }} />
      </div>

      <div className="relative w-full max-w-md space-y-6 animate-fade-in">
        <div className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden bg-white shadow-sm border border-border/10">
            <img src="/icon.png" alt="Logo" className="w-full h-full object-contain p-1" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold" style={{ color: "oklch(0.82 0.14 75)" }}>Literary Society</h1>
            <p className="text-xs text-muted-foreground tracking-widest uppercase mt-0.5">UET Lahore</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-xl space-y-6">
          {done ? (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center bg-green-500/10">
                <CheckCircle2 size={28} className="text-green-500" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-foreground">Password Updated!</h2>
                <p className="text-sm text-muted-foreground mt-2">Redirecting you to your dashboard…</p>
              </div>
            </div>
          ) : (
            <>
              <div>
                <h2 className="font-serif text-xl font-bold text-foreground">Set New Password</h2>
                <p className="text-sm text-muted-foreground mt-1">Choose a strong password for your account.</p>
              </div>

              {error && (
                <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input type={show ? "text" : "password"} value={pw} onChange={e => setPw(e.target.value)}
                      required minLength={6} placeholder="Min 6 characters" className="pl-9 pr-10" />
                    <button type="button" onClick={() => setShow(!show)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {show ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input type={show ? "text" : "password"} value={pw2} onChange={e => setPw2(e.target.value)}
                      required placeholder="Repeat password" className="pl-9" />
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full font-semibold mt-2"
                  style={{ background: "oklch(0.72 0.12 75)", color: "oklch(0.12 0.01 240)" }}>
                  {loading ? "Updating..." : "Set New Password"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
