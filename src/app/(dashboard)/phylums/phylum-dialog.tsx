"use client";

import { useState } from "react";
import { createPhylum } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Layers } from "lucide-react";

export function CreatePhylumDialog() {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [type, setType]       = useState<"phylum" | "wing">("phylum");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    formData.set("type", type);
    try {
      await createPhylum(formData);
      setOpen(false);
      setType("phylum");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button className="gap-2 font-semibold"
          style={{ background: "oklch(0.72 0.12 75)", color: "oklch(0.12 0.01 240)" }}>
          <Plus size={15} /> New Phylum / Wing
        </Button>
      } />
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg flex items-center gap-2">
            <Layers size={18} className="text-muted-foreground" /> Create Phylum or Wing
          </DialogTitle>
        </DialogHeader>

        {/* Type Toggle */}
        <div className="flex gap-2">
          {(["phylum", "wing"] as const).map(t => (
            <button key={t} type="button" onClick={() => setType(t)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border"
              style={type === t ? {
                background: "oklch(0.72 0.12 75 / 15%)",
                borderColor: "oklch(0.72 0.12 75 / 40%)",
                color: "oklch(0.82 0.14 75)",
              } : {
                background: "transparent",
                borderColor: "var(--border)",
                color: "var(--muted-foreground)"
              }}>
              {t === "phylum" ? "📚 Phylum (Department)" : "🪽 Wing"}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
        )}

        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phylum-name">
              {type === "phylum" ? "Phylum" : "Wing"} Name *
            </Label>
            <Input
              id="phylum-name"
              name="name"
              required
              placeholder={type === "phylum" ? "e.g. Literary Arts" : "e.g. Social Media Wing"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phylum-desc">Description</Label>
            <Textarea
              id="phylum-desc"
              name="description"
              rows={3}
              placeholder="Brief description of this department's focus..."
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}
              style={{ background: "oklch(0.72 0.12 75)", color: "oklch(0.12 0.01 240)" }}
              className="font-semibold">
              {loading ? "Creating..." : `Create ${type === "phylum" ? "Phylum" : "Wing"}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
