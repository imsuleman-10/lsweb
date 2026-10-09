"use client";

import { useState } from "react";
import { createMember } from "./actions";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";

export function CreateUserDialog({ currentUserRole }: { currentUserRole: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const isSuperAdmin = currentUserRole === "super_admin";
  const isCoreBody = currentUserRole === "corebody";

  if (!isSuperAdmin && !isCoreBody) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      await createMember(new FormData(e.currentTarget));
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
        <UserPlus className="mr-2 h-4 w-4" />
        Create Member
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Create Member Account</DialogTitle>
          <DialogDescription>
            Manually create login credentials and assign roles for a new member.
          </DialogDescription>
        </DialogHeader>
        {errorMsg && <div className="text-xs text-red-500 bg-red-500/10 p-2 rounded">{errorMsg}</div>}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input id="full_name" name="full_name" required placeholder="e.g. John Doe" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="john@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Temporary Password</Label>
            <Input id="password" name="password" type="text" required placeholder="Min 6 characters" minLength={6} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select id="role" name="role" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                <option value="member">Member</option>
                <option value="head">Head</option>
                <option value="director">Director</option>
                {isSuperAdmin && (
                  <>
                    <option value="mentor">Mentor</option>
                    <option value="hr">HR</option>
                    <option value="managing_director">Managing Director</option>
                    <option value="corebody">Core Body</option>
                    <option value="super_admin">Super Admin</option>
                  </>
                )}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Position Title</Label>
              <select id="position" name="position" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                <option value="none">None</option>
                <option value="head">Head</option>
                <option value="director">Director</option>
                {isSuperAdmin && (
                  <>
                    <option value="mentor">Mentor</option>
                    <option value="hr">HR</option>
                    <option value="managing_director">Managing Director</option>
                    <option value="vp">Vice President</option>
                    <option value="gs">General Secretary</option>
                    <option value="treasurer">Treasurer</option>
                    <option value="president">President</option>
                  </>
                )}
              </select>
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-[oklch(0.72_0.12_75)] text-[oklch(0.12_0.01_240)]">
              {loading ? "Creating..." : "Create Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
