import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { CreateTaskDialog } from "./task-dialog";

export default async function AllTasksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: currentUserProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = currentUserProfile?.role || "member";

  // Determine eligible assignees based on role
  const canAssign = ["super_admin", "corebody", "managing_director", "director", "head", "hr", "mentor"].includes(role);
  if (!canAssign) redirect("/my-tasks");

  let eligibleRoles: string[] = [];
  if (["super_admin", "corebody", "managing_director"].includes(role)) {
    eligibleRoles = ["managing_director", "director", "head", "hr", "mentor", "member"];
  } else if (["director", "head", "mentor"].includes(role)) {
    eligibleRoles = ["member"];
  } else if (role === "hr") {
    eligibleRoles = ["director", "head", "member"];
  }

  const { data: eligibleAssignees } = await supabase
    .from("profiles")
    .select("id, full_name, role, position")
    .in("role", eligibleRoles.length > 0 ? eligibleRoles : ["member"])
    .eq("status", "active")
    .order("full_name", { ascending: true });

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, assigned_to(full_name), assigned_by(full_name)")
    .order("deadline", { ascending: true });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">All Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of all tasks assigned across the society.</p>
        </div>
        <CreateTaskDialog eligibleAssignees={eligibleAssignees || []} currentUserRole={role} />
      </div>
      <Separator className="opacity-40" />
      {(!tasks || tasks.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4 border border-dashed rounded-xl border-border/50 bg-card/30">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <CheckSquare size={28} className="text-muted-foreground/30" />
          </div>
          <div>
            <p className="text-lg font-serif text-foreground">No tasks assigned yet</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task, i) => (
             <Card key={task.id} className="animate-fade-in card-hover" style={{ animationDelay: `${i * 50}ms` }}>
               <CardContent className="p-5 space-y-3">
                 <div className="flex justify-between items-start">
                   <h3 className="font-semibold text-lg">{task.title}</h3>
                   <Badge variant="outline">{task.status}</Badge>
                 </div>
                 <p className="text-sm text-muted-foreground">{task.description}</p>
                 <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                    <Clock size={12} className="text-[oklch(0.72_0.12_75)]" />
                    <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>
                 </div>
                 <div className="text-xs text-muted-foreground mt-2 bg-muted/20 p-2 rounded">
                   <span className="font-medium">To:</span> {task.assigned_to?.full_name} <br/>
                   <span className="font-medium">From:</span> {task.assigned_by?.full_name}
                 </div>
               </CardContent>
             </Card>
          ))}
        </div>
      )}
    </div>
  );
}
