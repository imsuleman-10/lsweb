"use client";

import { useState } from "react";
import { updateProfile } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Save, CheckCircle } from "lucide-react";

export function ProfileForm({ initialName, initialBio }: { initialName: string; initialBio: string }) {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSaved(false);
    try {
      await updateProfile(new FormData(e.currentTarget));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <div className="text-xs text-red-500 bg-red-500/10 p-3 rounded-lg">{error}</div>}
      <div className="space-y-2">
        <Label htmlFor="full_name">Full Name</Label>
        <Input id="full_name" name="full_name" defaultValue={initialName} required placeholder="Your full name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" defaultValue={initialBio} rows={4} placeholder="Tell the society a little about yourself..." className="resize-none" />
      </div>
      <Button type="submit" disabled={loading} className="bg-[oklch(0.72_0.12_75)] hover:bg-[oklch(0.68_0.10_75)] text-[oklch(0.12_0.01_240)] font-semibold">
        {saved ? <><CheckCircle size={14} className="mr-2" /> Saved!</> : <><Save size={14} className="mr-2" />{loading ? "Saving..." : "Save Profile"}</>}
      </Button>
    </form>
  );
}
