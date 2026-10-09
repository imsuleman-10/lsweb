"use client";

import { useState } from "react";
import { createTransaction } from "./actions";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WalletCards } from "lucide-react";

export function TransactionDialog({ isTreasurer }: { isTreasurer: boolean }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isTreasurer) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      await createTransaction(new FormData(e.currentTarget));
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
        <WalletCards className="mr-2 h-4 w-4" />
        Record Transaction
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Record Transaction</DialogTitle>
          <DialogDescription>
            Log a new income or expense for the society ledger.
          </DialogDescription>
        </DialogHeader>
        {errorMsg && <div className="text-xs text-red-500 bg-red-500/10 p-2 rounded">{errorMsg}</div>}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Transaction Type</Label>
              <select id="type" name="type" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <option value="income">Income (+)</option>
                <option value="expense">Expense (-)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (PKR)</Label>
              <Input id="amount" name="amount" type="number" min="0" step="0.01" required placeholder="e.g. 5000" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select id="category" name="category" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <option value="Membership Fee">Membership Fee</option>
              <option value="Event Ticket">Event Ticket</option>
              <option value="Sponsorship">Sponsorship</option>
              <option value="Donation">Donation</option>
              <option value="Marketing">Marketing / Printing</option>
              <option value="Catering">Catering / Refreshments</option>
              <option value="Logistics">Logistics / Venue</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input id="description" name="description" placeholder="Brief details about the transaction..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reference_id">Reference / Receipt Number (Optional)</Label>
            <Input id="reference_id" name="reference_id" placeholder="e.g. REC-001" />
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-[oklch(0.72_0.12_75)] text-[oklch(0.12_0.01_240)]">
              {loading ? "Recording..." : "Save Transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
