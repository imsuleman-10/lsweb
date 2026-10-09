"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle2, User, Mail, Lock, Eye, EyeOff, ShieldCheck, Loader2 } from "lucide-react";

export function SignupForm({ 
  error: initialError, 
  message: initialMessage, 
  verify: initialVerify, 
  email: initialEmail 
}: { 
  error?: string; 
  message?: string; 
  verify?: string; 
  email?: string; 
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(initialError || "");
  const supabase = createClient();
  
  // Track verify state manually without router bugs
  const [isVerify, setIsVerify] = useState(initialVerify === "true");
  const [currentEmail, setCurrentEmail] = useState(initialEmail || "");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const displayMessage = initialMessage;

  // OTP segmented inputs
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const hiddenOtpRef = useRef<HTMLInputElement>(null);

  function getPasswordStrength(pass: string) {
    if (!pass) return 0;
    let s = 0;
    if (pass.length > 5) s += 1;
    if (pass.length > 8) s += 1;
    if (/[A-Z]/.test(pass)) s += 1;
    if (/[0-9]/.test(pass)) s += 1;
    if (/[^A-Za-z0-9]/.test(pass)) s += 1;
    return Math.min(4, s);
  }

  const strength = getPasswordStrength(password);

  const strengthLabel = strength <= 1 ? "Weak" : strength === 2 ? "Fair" : strength === 3 ? "Good" : "Strong";
  const strengthColor = strength <= 2 ? "bg-orange-500" : strength === 3 ? "bg-yellow-500" : "bg-green-500";

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pasted = value.replace(/\D/g, "").slice(0, 6).split("");
      const newOtp = [...otp];
      pasted.forEach((char, i) => {
        if (index + i < 6) newOtp[index + i] = char;
      });
      setOtp(newOtp);
      if (hiddenOtpRef.current) hiddenOtpRef.current.value = newOtp.join("");
      const nextFocus = Math.min(index + pasted.length, 5);
      otpRefs.current[nextFocus]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, "");
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (hiddenOtpRef.current) hiddenOtpRef.current.value = newOtp.join("");

    if (digit !== "" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const full_name = formData.get("full_name") as string;

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error || "Signup failed");
        setLoading(false);
      } else if (data.redirectUrl) {
        window.location.replace(data.redirectUrl);
      } else if (data.verify) {
        setCurrentEmail(data.email || email);
        setIsVerify(true);
        setLoading(false);
      }
    } catch (err) {
      setErrorMsg("An unexpected error occurred.");
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setVerifyLoading(true);
    setErrorMsg("");

    try {
      const enteredOtp = otp.join("");
      if (enteredOtp.length !== 6) {
        setErrorMsg("Please enter all 6 digits.");
        setVerifyLoading(false);
        return;
      }

      // Step 1: Verify OTP with our server — create auth user + profile
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentEmail, otp: enteredOtp }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error || "Verification failed. Please try again.");
        setVerifyLoading(false);
        return;
      }

      // Step 2: Sign in to establish browser session
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        setErrorMsg("Account created but sign-in failed. Please go to login page.");
        setVerifyLoading(false);
        return;
      }

      // Step 3: Redirect to dashboard (pending admin approval)
      window.location.replace("/");
    } catch (err) {
      setErrorMsg("An unexpected error occurred. Please try again.");
      setVerifyLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0 || !currentEmail || resending) return;
    setErrorMsg("");
    setResendSuccess(false);
    setResending(true);

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentEmail }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error || "Failed to resend code. Please try again.");
      } else {
        setResendSuccess(true);
        setResendCooldown(60);
        const timer = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) { clearInterval(timer); return 0; }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err) {
      setErrorMsg("Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center p-6 sm:p-10 lg:p-16">
      <div className="w-full max-w-[420px] space-y-7 animate-fade-in bg-card/50 backdrop-blur-xl p-8 rounded-2xl border border-border/50 shadow-2xl">
        
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-white border border-border/10 shadow-sm">
            <img src="/icon.png" alt="Logo" className="w-full h-full object-contain p-1" />
          </div>
          <div>
            <p className="text-[12px] font-bold tracking-[0.18em] uppercase"
              style={{ color: "oklch(0.82 0.14 75)" }}>Literary Society</p>
            <p className="text-[10px] text-muted-foreground">UET Lahore</p>
          </div>
        </div>

        {/* Header */}
        <div className="text-center lg:text-left">
          <h2 className="font-serif text-[2rem] font-bold text-foreground leading-tight">
            {isVerify ? "Verify your email" : "Create an Account"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {isVerify 
              ? `We sent a 6-digit code to ${currentEmail}. Enter it below.`
              : "Apply for a general membership. Admin approval required for full access."}
          </p>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm animate-fade-in bg-destructive/10 border border-destructive/20 text-destructive">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p className="font-medium">{errorMsg}</p>
          </div>
        )}
        {displayMessage && !errorMsg && (
          <div className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm animate-fade-in bg-green-500/10 border border-green-500/20 text-green-500">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            <p className="font-medium">{displayMessage}</p>
          </div>
        )}

        {/* OTP VERIFY FORM */}
        {isVerify ? (
          <form onSubmit={handleVerify} className="space-y-6">
            {/* Hidden email and otp fields sent to server */}
            <input type="hidden" name="email" value={currentEmail} />
            <input type="hidden" name="otp" ref={hiddenOtpRef} defaultValue="" />

            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground/80 flex justify-center">
                Security Code
              </Label>
              <div className="flex justify-center gap-2 sm:gap-3">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-12 h-14 text-center text-xl font-bold bg-background border border-border rounded-xl focus-visible:outline-none focus-visible:ring-2 transition-all"
                    style={{ "--tw-ring-color": "oklch(0.72 0.12 75 / 40%)" } as React.CSSProperties}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 px-1">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || resending}
                  className="font-medium transition-colors hover:underline disabled:opacity-50 disabled:no-underline"
                  style={{ color: resendCooldown > 0 ? undefined : "oklch(0.78 0.14 75)" }}
                >
                  {resending ? "Sending..." : resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend 6-digit code"}
                </button>
                <button
                  type="button"
                  onClick={() => { setIsVerify(false); setErrorMsg(""); setResendSuccess(false); }}
                  className="hover:underline text-muted-foreground transition-colors"
                >
                  Change email
                </button>
              </div>

              {resendSuccess && (
                <p className="text-center text-xs text-green-500 animate-fade-in font-medium">
                  ✓ A new 6-digit code has been sent to your email.
                </p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={otp.join("").length !== 6 || verifyLoading}
              className="w-full font-semibold tracking-wide transition-all duration-150 active:scale-[0.98] border-0 h-12 rounded-xl group relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, oklch(0.75 0.14 75) 0%, oklch(0.65 0.10 75) 100%)",
                color: "oklch(0.10 0.01 240)",
              }}
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
              <span className="relative flex items-center justify-center gap-2">
                {verifyLoading ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                {verifyLoading ? "Verifying..." : "Verify & Continue"}
              </span>
            </Button>
          </form>

        ) : (
          // SIGNUP FORM
          <form onSubmit={handleSignup} className="space-y-5">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-sm font-medium text-foreground/80">
                Full Name
              </Label>
              <div className="relative group">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[oklch(0.72_0.12_75)] transition-colors" />
                <Input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="John Doe"
                  className="pl-10 h-12 bg-background border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-1 rounded-xl"
                  style={{ "--tw-ring-color": "oklch(0.72 0.12 75 / 40%)" } as React.CSSProperties}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground/80">
                University Email
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
                  className="pl-10 h-12 bg-background border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-1 rounded-xl"
                  style={{ "--tw-ring-color": "oklch(0.72 0.12 75 / 40%)" } as React.CSSProperties}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground/80">
                Password
              </Label>
              <div className="relative group">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[oklch(0.72_0.12_75)] transition-colors" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  className="pl-10 pr-12 h-12 bg-background border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-1 rounded-xl"
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

              {/* Password Strength */}
              {password.length > 0 && (
                <div className="pt-1 space-y-1.5 animate-in fade-in slide-in-from-top-1">
                  <div className="flex gap-1 h-1.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-full transition-all duration-300 ${strength >= i ? strengthColor : "bg-muted"}`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground text-right">{strengthLabel}</p>
                </div>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2.5 pt-1">
              <input
                type="checkbox"
                id="terms"
                required
                className="mt-0.5 shrink-0 w-4 h-4 rounded border-border accent-[oklch(0.72_0.12_75)] cursor-pointer"
              />
              <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none">
                I agree to the{" "}
                <span className="font-medium" style={{ color: "oklch(0.78 0.14 75)" }}>Terms of Service</span>
                {" "}and understand that my account requires admin approval before access is granted.
              </label>
            </div>

            {/* Submit */}
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
                {loading ? "Creating Account..." : "Create Account & Send OTP"}
              </span>
            </Button>
          </form>
        )}

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground pt-2 border-t border-border/40">
          Already a member?{" "}
          <Link
            href="/login"
            className="font-semibold transition-colors hover:underline underline-offset-2"
            style={{ color: "oklch(0.78 0.14 75)" }}
          >
            Sign in instead
          </Link>
        </p>
      </div>
    </div>
  );
}
