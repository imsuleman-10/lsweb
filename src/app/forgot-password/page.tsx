"use client";

import { useState } from "react";
import Link from "next/link";
import { sendForgotPasswordEmail } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.set("email", email);
      await sendForgotPasswordEmail(fd);
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, oklch(0.72 0.12 75), transparent 70%)" }} />
      </div>

      <div className="relative w-full max-w-md space-y-6 animate-fade-in">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden bg-white shadow-sm border border-border/10">
            <img src="/icon.png" alt="Logo" className="w-full h-full object-contain p-1" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold" style={{ color: "oklch(0.82 0.14 75)" }}>
              Literary Society
            </h1>
            <p className="text-xs text-muted-foreground tracking-widest uppercase mt-0.5">UET Lahore</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-xl space-y-6">
          {sent ? (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center bg-green-500/10">
                <CheckCircle2 size={28} className="text-green-500" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-foreground">Email Sent!</h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  A password reset link has been sent to <strong className="text-foreground">{email}</strong>.
                  Check your inbox and follow the link to reset your password.
                </p>
              </div>
              <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium"
                style={{ color: "oklch(0.72 0.12 75)" }}>
                <ArrowLeft size={14} /> Back to Login
              </Link>
            </div>
          ) : (
            <>
              <div>
                <h2 className="font-serif text-xl font-bold text-foreground">Forgot Password</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              {error && (
                <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com" className="pl-9" />
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full font-semibold"
                  style={{ background: "oklch(0.72 0.12 75)", color: "oklch(0.12 0.01 240)" }}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>

              <div className="text-center">
                <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5">
                  <ArrowLeft size={13} /> Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
