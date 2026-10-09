import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { MemberTable } from "./member-table";
import { Users, ShieldAlert } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { CreateUserDialog } from "./create-user-dialog";

export default async function MembersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: currentUserProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = currentUserProfile?.role || "member";
  
  const canView = ["super_admin", "corebody", "managing_director", "hr", "mentor"].includes(role);
  if (!canView) {
    redirect("/");
  }

  const { data: members } = await supabase
    .from("profiles")
    .select("*")
    .order("status", { ascending: true }) // pending first
    .order("created_at", { ascending: false });

  const pendingCount = members?.filter(m => m.status === "pending").length || 0;
  const canCreate = role === "super_admin" || role === "corebody";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Society Members</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and view registered members, leadership roles, and access.</p>
        </div>
        {canCreate && <CreateUserDialog currentUserRole={role} />}
      </div>

      <Separator className="opacity-40" />

      {role === "super_admin" && pendingCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg px-4 py-3 animate-fade-in"
          style={{ background: "oklch(0.577 0.245 27 / 8%)", border: "1px solid oklch(0.577 0.245 27 / 20%)" }}>
          <ShieldAlert size={16} className="text-destructive shrink-0" />
          <p className="text-sm text-destructive font-medium">
            There are {pendingCount} member{pendingCount > 1 ? "s" : ""} awaiting your approval.
          </p>
        </div>
      )}

      <MemberTable members={members || []} currentUserRole={role} />
    </div>
  );
}
