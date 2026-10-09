"use client";

import { useState } from "react";
import { submitPoem } from "./actions";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Feather } from "lucide-react";

export function PoetryDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      await submitPoem(new FormData(e.currentTarget));
      setOpen(false);
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-[oklch(0.72_0.12_75)] hover:bg-[oklch(0.68_0.10_75)] text-[oklch(0.12_0.01_240)] font-semibold border-0" />}>
        <Feather className="mr-2 h-4 w-4" /> Submit Poetry
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Submit Your Poetry</DialogTitle>
          <DialogDescription>Share your literary work with the society.</DialogDescription>
        </DialogHeader>
        {errorMsg && <div className="text-xs text-red-500 bg-red-500/10 p-2 rounded">{errorMsg}</div>}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required placeholder="Name of your poem" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <select id="language" name="language" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="Urdu">Urdu</option>
                <option value="English">English</option>
                <option value="Punjabi">Punjabi</option>
                <option value="Hindi">Hindi</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Poetry Content</Label>
            <Textarea id="content" name="content" required rows={8} placeholder={"زندگی سے ہے یہ عشق کی روداد...\n\nShare your poem here..."} className="resize-none font-serif text-sm leading-relaxed" />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-[oklch(0.72_0.12_75)] text-[oklch(0.12_0.01_240)]">
              {loading ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
