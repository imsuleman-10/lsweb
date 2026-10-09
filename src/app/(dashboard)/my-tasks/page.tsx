import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ListTodo } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { TaskCard } from "./task-card";

export default async function MyTasksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, assigned_by(full_name)")
    .eq("assigned_to", user.id)
    .order("deadline", { ascending: true });

  const pending = tasks?.filter(t => t.status !== "completed") ?? [];
  const completed = tasks?.filter(t => t.status === "completed") ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">My Tasks</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your responsibilities and update their progress.</p>
      </div>
      <Separator className="opacity-40" />

      {(!tasks || tasks.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4 border border-dashed rounded-xl border-border/50 bg-card/30">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <ListTodo size={28} className="text-muted-foreground/30" />
          </div>
          <p className="text-lg font-serif text-foreground">No tasks assigned to you</p>
          <p className="text-sm text-muted-foreground">When tasks are assigned, they will appear here.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {pending.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground">
                Pending — {pending.length}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pending.map((task, i) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}
          {completed.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground">
                Completed — {completed.length}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
                {completed.map((task, i) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
