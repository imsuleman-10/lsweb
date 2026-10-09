import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Layers } from "lucide-react";
import { CreatePhylumDialog } from "./phylum-dialog";
import { PhylumCard } from "./phylum-card";

import { createAdminClient } from "@/utils/supabase/admin";

export default async function PhylumsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role, position").eq("id", user.id).single();
  const role = (profile?.role || "").trim().toLowerCase();
  const position = (profile?.position || "").trim().toLowerCase();

  const isPrivileged =
    ["super_admin", "corebody", "core_body", "managing_director"].includes(role) ||
    ["vp", "gs", "president", "treasurer", "managing_director"].includes(position);

  if (!isPrivileged) redirect("/");

  // Fetch all members for assignment dropdown
  const { data: allMembers } = await admin
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("status", "active")
    .order("full_name", { ascending: true });

  // Fetch phylums with director and head profiles
  const { data: phylums } = await admin
    .from("phylums")
    .select(`
      *,
      director:director_id(id, full_name, email, avatar_url),
      head:head_id(id, full_name, email, avatar_url)
    `)
    .order("type", { ascending: true })
    .order("name", { ascending: true });

  const wings   = phylums?.filter(p => p.type === "wing")   ?? [];
  const depts   = phylums?.filter(p => p.type !== "wing")   ?? [];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Phylums & Wings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage society departments, wings, and their leadership.
          </p>
        </div>
        {isPrivileged && <CreatePhylumDialog />}
      </div>
      <Separator className="opacity-40" />

      {(!phylums || phylums.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4 border border-dashed rounded-2xl border-border/50 bg-card/30">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Layers size={28} className="text-muted-foreground/30" />
          </div>
          <div>
            <p className="text-lg font-serif text-foreground">No departments or wings yet</p>
            <p className="text-sm text-muted-foreground mt-1">Start by creating your first Phylum or Wing.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {depts.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Phylums · {depts.length}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {depts.map((p, i) => (
                  <PhylumCard
                    key={p.id}
                    phylum={p}
                    allMembers={allMembers ?? []}
                    isPrivileged={isPrivileged}
                    delay={i * 60}
                  />
                ))}
              </div>
            </section>
          )}

          {wings.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Wings · {wings.length}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {wings.map((p, i) => (
                  <PhylumCard
                    key={p.id}
                    phylum={p}
                    allMembers={allMembers ?? []}
                    isPrivileged={isPrivileged}
                    delay={i * 60}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
