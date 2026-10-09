"use client";

import { useState } from "react";
import { createAnnouncement } from "./actions";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Megaphone } from "lucide-react";

export function AnnouncementDialog({ canPost }: { canPost: boolean }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!canPost) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      await createAnnouncement(new FormData(e.currentTarget));
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
        <Megaphone className="mr-2 h-4 w-4" /> Post Announcement
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Post Announcement</DialogTitle>
          <DialogDescription>Broadcast an official message to all society members.</DialogDescription>
        </DialogHeader>
        {errorMsg && <div className="text-xs text-red-500 bg-red-500/10 p-2 rounded">{errorMsg}</div>}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required placeholder="e.g. Upcoming Mushaira Event" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea id="content" name="content" required rows={5} placeholder="Write the full announcement here..." className="resize-none" />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-[oklch(0.72_0.12_75)] text-[oklch(0.12_0.01_240)]">
              {loading ? "Posting..." : "Post Now"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
