import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Users, Star, Layers, CheckSquare, TrendingUp, TrendingDown,
  DollarSign, ArrowRight, PlusCircle, UserPlus, Wallet, FolderPlus,
  FileText, Clock, AlertTriangle, BookOpen, Megaphone, CheckCircle,
  CalendarDays, ScrollText, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// ─── Stat Card ──────────────────────────────────────────────────
function StatCard({ label, value, sub, Icon, accentColor, delay = 0 }: any) {
  return (
    <Card className="animate-fade-in border bg-card card-hover" style={{ animationDelay: `${delay}ms`, borderColor: `${accentColor}30` }}>
      <CardContent className="p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <p className="text-xs font-medium text-muted-foreground tracking-wider uppercase">{label}</p>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}25` }}>
            <Icon size={16} style={{ color: accentColor }} />
          </div>
        </div>
        <div>
          <p className="text-3xl font-serif font-bold text-foreground">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Finance Card ────────────────────────────────────────────────
function FinanceCard({ income, expenses }: any) {
  const balance = income - expenses;
  const pct = income > 0 ? Math.min((expenses / income) * 100, 100) : 0;
  const fmt = (n: number) => new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(n);

  return (
    <Card className="animate-fade-in delay-200 card-hover h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-serif text-base font-semibold">Financial Overview</CardTitle>
          <Link href="/finance">
            <Button variant="ghost" size="sm" className="text-xs h-7 px-2 gap-1" style={{ color: "oklch(0.78 0.14 75)" }}>
              Ledger <ArrowRight size={11} />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <Separator className="opacity-20 mx-6" />
      <CardContent className="p-6 space-y-5">
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: "Income", value: fmt(income), color: "oklch(0.70 0.15 150)", Icon: TrendingUp },
            { label: "Expenses", value: fmt(expenses), color: "oklch(0.70 0.2 27)", Icon: TrendingDown },
            { label: "Balance", value: fmt(balance), color: "oklch(0.82 0.14 75)", Icon: DollarSign },
          ].map((item) => (
            <div key={item.label} className="space-y-1">
              <item.Icon size={14} className="mx-auto" style={{ color: item.color }} />
              <p className="text-sm font-serif font-bold leading-tight" style={{ color: item.color }}>{item.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{item.label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>Budget utilization</span>
            <span className="font-medium">{pct.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: pct > 80 ? "linear-gradient(90deg, oklch(0.72 0.12 75), oklch(0.70 0.2 27))" : "linear-gradient(90deg, oklch(0.72 0.12 75), oklch(0.70 0.15 150))" }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Quick Actions ───────────────────────────────────────────────
function QuickActions({ actions }: { actions: any[] }) {
  return (
    <Card className="animate-fade-in delay-150 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-base font-semibold">Quick Launch</CardTitle>
      </CardHeader>
      <Separator className="opacity-20 mx-6" />
      <CardContent className="p-4 grid grid-cols-2 gap-2">
        {actions.map((a) => (
          <Link key={a.href} href={a.href}>
            <div className="flex flex-col justify-center items-center gap-2 p-4 rounded-xl border border-border bg-background hover:border-[oklch(0.72_0.12_75_/_30%)] hover:bg-[oklch(0.72_0.12_75_/_5%)] transition-all duration-150 group cursor-pointer text-center h-full">
              <a.Icon size={20} className="text-muted-foreground group-hover:text-[oklch(0.82_0.14_75)] transition-colors shrink-0" />
              <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors leading-tight">{a.label}</span>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Activity Feed ───────────────────────────────────────────────
function ActivityFeed({ logs }: { logs: any[] }) {
  return (
    <Card className="animate-fade-in delay-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-serif text-base font-semibold">Recent Activity</CardTitle>
          <Link href="/audit"><Button variant="ghost" size="sm" className="text-xs h-7 px-2 gap-1" style={{ color: "oklch(0.78 0.14 75)" }}>View all <ArrowRight size={11} /></Button></Link>
        </div>
      </CardHeader>
      <Separator className="opacity-20 mx-6" />
      <CardContent className="p-6">
        {logs.length === 0 ? (
          <div className="py-10 text-center"><p className="text-sm text-muted-foreground">No activity recorded</p></div>
        ) : (
          <ul className="space-y-4">
            {logs.map((log, i) => (
              <li key={log.id} className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "oklch(0.72 0.12 75 / 12%)", border: "1px solid oklch(0.72 0.12 75 / 20%)" }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: "oklch(0.72 0.12 75)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground/85 leading-snug">{log.action}</p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock size={10} />{new Date(log.created_at).toLocaleString("en-PK")}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/login");

  // Fetch dynamic stats based on role
  const isSuperAdmin        = profile.role === "super_admin";
  const isCoreBody          = profile.role === "corebody";
  const isManagingDirector  = profile.role === "managing_director";
  const isDirector          = profile.role === "director";
  const isHead              = profile.role === "head";
  const isHR                = profile.role === "hr";
  const isMentor            = profile.role === "mentor";
  const isMember            = profile.role === "member";
  const isTeamLead          = isManagingDirector || isDirector || isHead || isHR || isMentor;

  // Shared fetches
  const { count: eventsCount } = await supabase.from("events").select("*", { count: "exact", head: true });
  
  // Role specific fetches
  let membersCount = 0, phylumsCount = 0, myTasksCount = 0, assignedTasksCount = 0, pendingMembersCount = 0;
  let incomeRes, expenseRes, auditRes;

  if (isSuperAdmin || isCoreBody || isManagingDirector || isHR) {
    const { count: mc } = await supabase.from("profiles").select("*", { count: "exact", head: true });
    membersCount = mc || 0;
    
    if (isSuperAdmin || isCoreBody || isManagingDirector) {
      const { count: pc } = await supabase.from("phylums").select("*", { count: "exact", head: true });
      phylumsCount = pc || 0;
    }
    
    if (isSuperAdmin) {
      const { count: pendingCount } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("status", "pending");
      pendingMembersCount = pendingCount || 0;
      incomeRes = await supabase.from("transactions").select("amount").eq("type", "income").eq("status", "active");
      expenseRes = await supabase.from("transactions").select("amount").eq("type", "expense").eq("status", "active");
    }
  }

  if (isTeamLead) {
    const { count: ac } = await supabase.from("tasks").select("*", { count: "exact", head: true }).eq("assigned_by", user.id);
    assignedTasksCount = ac || 0;
  }

  // Everyone has their own tasks
  const { count: mt } = await supabase.from("tasks").select("*", { count: "exact", head: true }).eq("assigned_to", user.id).neq("status", "completed");
  myTasksCount = mt || 0;

  auditRes = await supabase.from("audit_logs").select("id, action, actor_id, created_at").order("created_at", { ascending: false }).limit(6);

  const totalIncome = ((incomeRes as any)?.data ?? []).reduce((s: number, r: any) => s + Number(r.amount), 0);
  const totalExpense = ((expenseRes as any)?.data ?? []).reduce((s: number, r: any) => s + Number(r.amount), 0);
  const auditLogs = auditRes?.data ?? [];

  // Determine actions
  let quickActions: any[] = [];
  if (isSuperAdmin) {
    quickActions = [
      { label: "Manage Members", href: "/members", Icon: UserPlus },
      { label: "Finance Ledger", href: "/finance", Icon: Wallet },
      { label: "Create Event", href: "/events", Icon: CalendarDays },
      { label: "Audit Logs", href: "/audit", Icon: ScrollText },
    ];
  } else if (isCoreBody) {
    quickActions = [
      { label: "Manage Members", href: "/members", Icon: UserPlus },
      { label: "Manage Phylums", href: "/phylums", Icon: FolderPlus },
      { label: "Assign Task", href: "/tasks", Icon: CheckSquare },
      { label: "Events", href: "/events", Icon: CalendarDays },
    ];
  } else if (isManagingDirector) {
    quickActions = [
      { label: "Phylums / Wings", href: "/phylums", Icon: FolderPlus },
      { label: "Members Directory", href: "/members", Icon: Users },
      { label: "Assign Task", href: "/tasks", Icon: CheckSquare },
      { label: "My Team", href: "/my-team", Icon: Users },
    ];
  } else if (isHR) {
    quickActions = [
      { label: "Members Directory", href: "/members", Icon: Users },
      { label: "Assign Task", href: "/tasks", Icon: CheckSquare },
      { label: "Events & Activities", href: "/events", Icon: CalendarDays },
      { label: "My Tasks", href: "/my-tasks", Icon: CheckSquare },
    ];
  } else if (isMentor) {
    quickActions = [
      { label: "Mentorship Team", href: "/my-team", Icon: Users },
      { label: "Assign Task", href: "/tasks", Icon: CheckSquare },
      { label: "Poetry & Literary", href: "/poetry", Icon: BookOpen },
      { label: "Events", href: "/events", Icon: CalendarDays },
    ];
  } else if (isTeamLead) {
    quickActions = [
      { label: "Assign Task", href: "/tasks", Icon: PlusCircle },
      { label: "My Team", href: "/my-team", Icon: Users },
      { label: "My Tasks", href: "/my-tasks", Icon: CheckSquare },
      { label: "Events", href: "/events", Icon: CalendarDays },
    ];
  } else {
    quickActions = [
      { label: "My Pending Tasks", href: "/my-tasks", Icon: CheckSquare },
      { label: "Read Poetry", href: "/poetry", Icon: BookOpen },
      { label: "Announcements", href: "/announcements", Icon: Megaphone },
      { label: "Update Profile", href: "/profile", Icon: User },
    ];
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="animate-fade-in flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Good day,</p>
          <h2 className="font-serif text-3xl font-bold text-foreground mt-0.5">
            {profile.full_name?.split(" ")[0] ?? "Member"}
            <span className="ml-2 inline-block" style={{ color: "oklch(0.82 0.14 75)" }}>✦</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
            <Clock size={11} /> {new Date().toLocaleDateString("en-PK", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] px-3 py-1 font-semibold uppercase tracking-widest border border-[oklch(0.72_0.12_75_/_30%)] text-[oklch(0.82_0.14_75)] bg-[oklch(0.72_0.12_75_/_10%)]">
          {profile.position !== "none" ? profile.position : profile.role.replace("_", " ")}
        </Badge>
      </div>

      <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, oklch(0.72 0.12 75 / 40%), transparent)" }} />

      {/* ── Admin Pending Applications Banner (Admin Only) ── */}
      {isSuperAdmin && pendingMembersCount > 0 && (
        <div className="flex items-center justify-between gap-4 rounded-xl px-5 py-3.5 animate-fade-in bg-amber-500/10 border border-amber-500/25 text-amber-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
              <UserPlus size={18} className="text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {pendingMembersCount} Membership Application{pendingMembersCount > 1 ? "s" : ""} Pending Approval
              </p>
              <p className="text-xs text-muted-foreground">
                New user accounts require administrator review and activation before access is granted.
              </p>
            </div>
          </div>
          <Link href="/members">
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold h-8 px-3 rounded-lg text-xs gap-1.5 shadow-sm">
              Review & Approve <ArrowRight size={13} />
            </Button>
          </Link>
        </div>
      )}

      {/* ── Overdue / Pending Task Alert for everyone ── */}
      {myTasksCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg px-4 py-3 animate-fade-in" style={{ background: "oklch(0.577 0.245 27 / 8%)", border: "1px solid oklch(0.577 0.245 27 / 20%)" }}>
          <AlertTriangle size={15} className="text-destructive shrink-0" />
          <p className="text-sm text-destructive">You have <span className="font-semibold">{myTasksCount} pending task{myTasksCount > 1 ? "s" : ""}</span>.</p>
          <Link href="/my-tasks" className="ml-auto"><Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:bg-destructive/10">View <ArrowRight size={11} /></Button></Link>
        </div>
      )}

      {/* ── Dynamic Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isSuperAdmin && (
          <>
            <StatCard label="Total Members" value={membersCount} Icon={Users} accentColor="oklch(0.60 0.18 200)" delay={0} />
            <StatCard label="Phylums" value={phylumsCount} Icon={Layers} accentColor="oklch(0.55 0.18 280)" delay={75} />
            <StatCard label="My Tasks" value={myTasksCount} Icon={CheckSquare} accentColor="oklch(0.65 0.15 150)" delay={150} />
            <StatCard label="Total Events" value={eventsCount ?? 0} Icon={CalendarDays} accentColor="oklch(0.72 0.12 75)" delay={225} />
          </>
        )}
        {isCoreBody && !isSuperAdmin && (
          <>
            <StatCard label="Total Members" value={membersCount} Icon={Users} accentColor="oklch(0.60 0.18 200)" delay={0} />
            <StatCard label="Phylums" value={phylumsCount} Icon={Layers} accentColor="oklch(0.55 0.18 280)" delay={75} />
            <StatCard label="My Tasks" value={myTasksCount} Icon={CheckSquare} accentColor="oklch(0.65 0.15 150)" delay={150} />
            <StatCard label="Total Events" value={eventsCount ?? 0} Icon={CalendarDays} accentColor="oklch(0.72 0.12 75)" delay={225} />
          </>
        )}
        {isManagingDirector && (
          <>
            <StatCard label="Total Members" value={membersCount} Icon={Users} accentColor="oklch(0.60 0.18 200)" delay={0} />
            <StatCard label="Phylums / Wings" value={phylumsCount} Icon={Layers} accentColor="oklch(0.55 0.18 280)" delay={75} />
            <StatCard label="Directorial Tasks" value={assignedTasksCount} Icon={CheckCircle} accentColor="oklch(0.72 0.12 75)" delay={150} />
            <StatCard label="Total Events" value={eventsCount ?? 0} Icon={CalendarDays} accentColor="oklch(0.65 0.15 150)" delay={225} />
          </>
        )}
        {isHR && (
          <>
            <StatCard label="Registered Members" value={membersCount} Icon={Users} accentColor="oklch(0.60 0.18 200)" delay={0} />
            <StatCard label="Assigned Tasks" value={assignedTasksCount} Icon={CheckCircle} accentColor="oklch(0.55 0.18 280)" delay={75} />
            <StatCard label="My Tasks" value={myTasksCount} Icon={CheckSquare} accentColor="oklch(0.65 0.15 150)" delay={150} />
            <StatCard label="Events & Activities" value={eventsCount ?? 0} Icon={CalendarDays} accentColor="oklch(0.72 0.12 75)" delay={225} />
          </>
        )}
        {isMentor && (
          <>
            <StatCard label="Mentees / Team" value={assignedTasksCount} Icon={Users} accentColor="oklch(0.60 0.18 200)" delay={0} />
            <StatCard label="Tasks Assigned" value={assignedTasksCount} Icon={CheckCircle} accentColor="oklch(0.55 0.18 280)" delay={75} />
            <StatCard label="My Tasks" value={myTasksCount} Icon={CheckSquare} accentColor="oklch(0.65 0.15 150)" delay={150} />
            <StatCard label="Total Events" value={eventsCount ?? 0} Icon={CalendarDays} accentColor="oklch(0.72 0.12 75)" delay={225} />
          </>
        )}
        {isTeamLead && !isManagingDirector && !isHR && !isMentor && (
          <>
            <StatCard label="My Pending Tasks" value={myTasksCount} Icon={CheckSquare} accentColor="oklch(0.65 0.15 150)" delay={0} />
            <StatCard label="Tasks Assigned by Me" value={assignedTasksCount} Icon={CheckCircle} accentColor="oklch(0.55 0.18 280)" delay={75} />
            <StatCard label="Total Events" value={eventsCount ?? 0} Icon={CalendarDays} accentColor="oklch(0.72 0.12 75)" delay={150} />
          </>
        )}
        {isMember && !isTeamLead && !isCoreBody && !isSuperAdmin && (
          <>
            <StatCard label="My Pending Tasks" value={myTasksCount} Icon={CheckSquare} accentColor="oklch(0.65 0.15 150)" delay={0} />
            <StatCard label="Total Events" value={eventsCount ?? 0} Icon={CalendarDays} accentColor="oklch(0.72 0.12 75)" delay={75} />
          </>
        )}
      </div>

      {/* ── Dynamic Lower Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {isSuperAdmin && (
          <div className="lg:col-span-2">
            <FinanceCard income={totalIncome} expenses={totalExpense} />
          </div>
        )}
        {(!isSuperAdmin && (isCoreBody || isTeamLead || isMember)) && (
          <div className="lg:col-span-2">
            <ActivityFeed logs={auditLogs} />
          </div>
        )}
        
        <div className={isSuperAdmin ? "col-span-1" : "col-span-1"}>
          <QuickActions actions={quickActions} />
        </div>
      </div>
      
      {isSuperAdmin && (
        <ActivityFeed logs={auditLogs} />
      )}
    </div>
  );
}
