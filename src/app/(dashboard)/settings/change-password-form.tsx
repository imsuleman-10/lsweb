"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";

export function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [pw, setPw]           = useState("");
  const [pw2, setPw2]         = useState("");
  const [show, setShow]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw !== pw2)    { setError("New passwords do not match"); return; }
    if (pw.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (pw === current) { setError("New password must be different from current password"); return; }

    setLoading(true);
    setError("");
    setSuccess(false);

    const supabase = createClient();

    // Re-authenticate with current password first
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) { setError("Session expired. Please login again."); setLoading(false); return; }

    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current,
    });

    if (signInErr) {
      setLoading(false);
      setError("Current password is incorrect.");
      return;
    }

    // Update to new password
    const { error: updateErr } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);

    if (updateErr) {
      setError(updateErr.message);
      return;
    }

    setSuccess(true);
    setCurrent(""); setPw(""); setPw2("");
    setTimeout(() => setSuccess(false), 4000);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">{error}</div>
      )}
      {success && (
        <div className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2.5 flex items-center gap-2">
          <CheckCircle2 size={14} /> Password changed successfully!
        </div>
      )}

      <div className="space-y-2">
        <Label>Current Password</Label>
        <div className="relative">
          <Input type={show ? "text" : "password"} value={current} onChange={e => setCurrent(e.target.value)} required placeholder="Your current password" className="pr-10" />
          <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>New Password</Label>
        <Input type={show ? "text" : "password"} value={pw} onChange={e => setPw(e.target.value)} required minLength={6} placeholder="Min 6 characters" />
      </div>

      <div className="space-y-2">
        <Label>Confirm New Password</Label>
        <Input type={show ? "text" : "password"} value={pw2} onChange={e => setPw2(e.target.value)} required placeholder="Repeat new password" />
      </div>

      <Button type="submit" disabled={loading} className="bg-[oklch(0.72_0.12_75)] hover:bg-[oklch(0.68_0.10_75)] text-[oklch(0.12_0.01_240)] font-semibold">
        {loading ? "Updating..." : "Change Password"}
      </Button>
    </form>
  );
}
