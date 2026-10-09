import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, CheckSquare, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default async function MyTeamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: currentProfile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const role = currentProfile?.role;

  if (!["director", "head", "corebody", "super_admin", "managing_director", "hr", "mentor"].includes(role)) {
    redirect("/");
  }

  // Get team members — people who have tasks assigned by this user
  const { data: assignedTasks } = await supabase
    .from("tasks")
    .select("*, assigned_to(id, full_name, email, role, position, status, avatar_url)")
    .eq("assigned_by", user.id);

  // Build unique members with their task counts
  const memberMap = new Map<string, { profile: any; tasks: any[] }>();
  for (const task of assignedTasks ?? []) {
    const p = task.assigned_to;
    if (!p) continue;
    if (!memberMap.has(p.id)) memberMap.set(p.id, { profile: p, tasks: [] });
    memberMap.get(p.id)!.tasks.push(task);
  }
  const teamMembers = Array.from(memberMap.values());

  function getRoleColor(role: string) {
    if (role === "director") return "oklch(0.55 0.18 280)";
    if (role === "head") return "oklch(0.65 0.18 30)";
    return "oklch(0.65 0.15 150)";
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">My Team</h1>
        <p className="text-sm text-muted-foreground mt-1">Members you have assigned tasks to.</p>
      </div>
      <Separator className="opacity-40" />

      {teamMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4 border border-dashed rounded-xl border-border/50 bg-card/30">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Users size={28} className="text-muted-foreground/30" />
          </div>
          <p className="text-lg font-serif text-foreground">No team members yet</p>
          <p className="text-sm text-muted-foreground">Assign tasks to members to see your team here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teamMembers.map(({ profile, tasks }, i) => {
            const color = getRoleColor(profile.role);
            const initials = (profile.full_name || profile.email || "?").split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
            const pending = tasks.filter(t => t.status !== "completed").length;
            const completed = tasks.filter(t => t.status === "completed").length;

            return (
              <Card key={profile.id} className="animate-fade-in card-hover" style={{ animationDelay: `${i * 60}ms` }}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11 border border-border">
                      {profile.avatar_url && <AvatarImage src={profile.avatar_url} className="object-cover" />}
                      <AvatarFallback className="text-sm font-bold" style={{ background: `${color}15`, color }}>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{profile.full_name || "Member"}</p>
                      <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase shrink-0"
                      style={{ color, borderColor: `${color}30`, background: `${color}10` }}>
                      {profile.position !== "none" ? profile.position : profile.role.replace("_", " ")}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 pt-1 border-t border-border/50">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock size={12} className="text-orange-400" />
                      <span>{pending} pending</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CheckSquare size={12} className="text-green-400" />
                      <span>{completed} completed</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
