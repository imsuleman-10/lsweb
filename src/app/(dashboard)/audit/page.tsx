import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollText, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default async function AuditPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!["super_admin", "corebody"].includes(profile?.role ?? "")) redirect("/");

  const { data: logs } = await supabase
    .from("audit_logs")
    .select("*, actor_id(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(100);

  const ENTITY_COLORS: Record<string, string> = {
    tasks: "oklch(0.65 0.15 150)",
    profiles: "oklch(0.60 0.18 200)",
    transactions: "oklch(0.72 0.12 75)",
    events: "oklch(0.55 0.18 280)",
    announcements: "oklch(0.65 0.18 30)",
    phylums: "oklch(0.60 0.18 350)",
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Audit Logs</h1>
        <p className="text-sm text-muted-foreground mt-1">Complete trail of all administrative actions in the society.</p>
      </div>
      <Separator className="opacity-40" />

      {(!logs || logs.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4 border border-dashed rounded-xl border-border/50">
          <ScrollText size={28} className="text-muted-foreground/30" />
          <p className="text-lg font-serif text-foreground">No audit logs yet</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border/50" />
          <ul className="space-y-3 pl-10">
            {logs.map((log, i) => {
              const color = ENTITY_COLORS[log.entity] ?? "oklch(0.65 0.10 240)";
              return (
                <li key={log.id} className="relative animate-fade-in" style={{ animationDelay: `${i * 20}ms` }}>
                  <div className="absolute -left-10 mt-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-background"
                    style={{ background: color }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                  <Card className="hover:border-border/80 transition-colors">
                    <CardContent className="p-4 flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="text-sm text-foreground/90 leading-snug">{log.action}</p>
                        <p className="text-xs text-muted-foreground">
                          by {log.actor_id?.full_name || log.actor_id?.email || "System"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(log.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(log.created_at).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        {log.entity && (
                          <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded mt-1 inline-block"
                            style={{ color, background: `${color}15` }}>
                            {log.entity}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
