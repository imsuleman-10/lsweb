"use client";

import { useState } from "react";
import { createTask } from "./actions";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle } from "lucide-react";

type Profile = { id: string; full_name: string | null; role: string; position: string };

export function CreateTaskDialog({ eligibleAssignees, currentUserRole }: { eligibleAssignees: Profile[], currentUserRole: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const isCoreBody = ["super_admin", "corebody"].includes(currentUserRole);
  const isHead = ["director", "head"].includes(currentUserRole);

  if (!isCoreBody && !isHead) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      await createTask(new FormData(e.currentTarget));
      setOpen(false);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button className="bg-[oklch(0.72_0.12_75)] hover:bg-[oklch(0.68_0.10_75)] text-[oklch(0.12_0.01_240)] font-semibold border-0" />
      }>
        <PlusCircle className="mr-2 h-4 w-4" />
        Assign Task
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Assign Task</DialogTitle>
          <DialogDescription>
            {isCoreBody ? "Assign tasks to Core Body, Directors, or Heads." : "Assign tasks to general members."}
          </DialogDescription>
        </DialogHeader>
        {errorMsg && <div className="text-xs text-red-500 bg-red-500/10 p-2 rounded">{errorMsg}</div>}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input id="title" name="title" required placeholder="e.g. Design Event Poster" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" placeholder="Optional details..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assigned_to">Assignee</Label>
            <select id="assigned_to" name="assigned_to" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
              <option value="">Select a member...</option>
              {eligibleAssignees.map(m => (
                <option key={m.id} value={m.id}>{m.full_name || m.id} ({m.role})</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input id="deadline" name="deadline" type="datetime-local" required />
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-[oklch(0.72_0.12_75)] text-[oklch(0.12_0.01_240)]">
              {loading ? "Assigning..." : "Assign Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
