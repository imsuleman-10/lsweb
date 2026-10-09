import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, Wallet, Hash } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { TransactionDialog } from "./transaction-dialog";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(n);

export default async function FinancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isTreasurer = profile?.role === "super_admin";

  // Only super_admin can view finance
  if (!isTreasurer && profile?.role !== "corebody") redirect("/");

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const txns = transactions ?? [];
  const totalIncome   = txns.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense  = txns.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const balance       = totalIncome - totalExpense;
  const utilization   = totalIncome > 0 ? Math.min((totalExpense / totalIncome) * 100, 100) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Finance Ledger</h1>
          <p className="text-sm text-muted-foreground mt-1">Track society income, expenses, and budget utilization.</p>
        </div>
        <TransactionDialog isTreasurer={isTreasurer} />
      </div>
      <Separator className="opacity-40" />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Income",   value: fmt(totalIncome),  Icon: TrendingUp,  color: "oklch(0.65 0.15 150)", count: txns.filter(t => t.type === "income").length },
          { label: "Total Expenses", value: fmt(totalExpense), Icon: TrendingDown, color: "oklch(0.70 0.2 27)",   count: txns.filter(t => t.type === "expense").length },
          { label: "Net Balance",    value: fmt(balance),      Icon: Wallet,       color: balance >= 0 ? "oklch(0.72 0.12 75)" : "oklch(0.70 0.2 27)", count: txns.length },
        ].map((card, i) => (
          <Card key={card.label} className="animate-fade-in card-hover" style={{ animationDelay: `${i * 60}ms`, borderColor: `${card.color}30` }}>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{card.label}</p>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${card.color}15`, border: `1px solid ${card.color}25` }}>
                  <card.Icon size={14} style={{ color: card.color }} />
                </div>
              </div>
              <p className="text-2xl font-serif font-bold" style={{ color: card.color }}>{card.value}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Hash size={10} /> {card.count} transaction{card.count !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Budget Progress */}
      <Card className="animate-fade-in" style={{ animationDelay: "200ms" }}>
        <CardContent className="p-5 space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-foreground">Budget Utilization</p>
              <p className="text-xs text-muted-foreground mt-0.5">Expenses as a percentage of income</p>
            </div>
            <Badge variant="outline" className={
              utilization > 90 ? "text-red-500 border-red-500/30 bg-red-500/10" :
              utilization > 70 ? "text-orange-400 border-orange-400/30 bg-orange-400/10" :
              "text-green-500 border-green-500/30 bg-green-500/10"
            }>
              {utilization.toFixed(1)}%
            </Badge>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${utilization}%`,
                background: utilization > 90
                  ? "linear-gradient(90deg, oklch(0.70 0.2 27), oklch(0.65 0.25 27))"
                  : utilization > 70
                    ? "linear-gradient(90deg, oklch(0.72 0.12 75), oklch(0.70 0.2 50))"
                    : "linear-gradient(90deg, oklch(0.72 0.12 75), oklch(0.70 0.15 150))",
              }} />
          </div>
          <div className="flex justify-between text-[11px] text-muted-foreground pt-0.5">
            <span>PKR 0</span>
            <span>{fmt(totalIncome)} total budget</span>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      {txns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4 border border-dashed rounded-xl border-border/50 bg-card/30">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <DollarSign size={28} className="text-muted-foreground/30" />
          </div>
          <p className="text-lg font-serif text-foreground">No financial records yet</p>
          {isTreasurer && <p className="text-sm text-muted-foreground">Use "Record Transaction" to add the first entry.</p>}
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">All Transactions</h2>
          {txns.map((txn, i) => (
            <Card key={txn.id} className="animate-fade-in card-hover" style={{ animationDelay: `${i * 40}ms` }}>
              <CardContent className="p-4 flex items-center gap-4">
                {/* Type icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  txn.type === "income" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                }`}>
                  {txn.type === "income" ? <TrendingUp size={17} /> : <TrendingDown size={17} />}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{txn.category}</p>
                    <Badge variant="outline" className={`text-[9px] uppercase tracking-wider px-1.5 py-0 h-4 ${
                      txn.type === "income" ? "text-green-500 border-green-500/30 bg-green-500/8" : "text-red-500 border-red-500/30 bg-red-500/8"
                    }`}>
                      {txn.type}
                    </Badge>
                  </div>
                  {txn.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{txn.description}</p>}
                  {txn.reference_id && (
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5 font-mono">REF: {txn.reference_id}</p>
                  )}
                </div>

                {/* Amount + date */}
                <div className="text-right shrink-0">
                  <p className={`font-bold font-serif text-base ${txn.type === "income" ? "text-green-500" : "text-red-500"}`}>
                    {txn.type === "income" ? "+" : "−"} {fmt(Number(txn.amount))}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {new Date(txn.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
