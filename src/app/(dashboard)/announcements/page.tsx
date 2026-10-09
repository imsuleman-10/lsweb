import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Megaphone, Calendar } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { AnnouncementDialog } from "./announcement-dialog";

import { createAdminClient } from "@/utils/supabase/admin";

import { DeleteAnnouncementButton } from "./delete-button";

export default async function AnnouncementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role, position").eq("id", user.id).single();
  const role = (profile?.role || "").trim().toLowerCase();
  const position = (profile?.position || "").trim().toLowerCase();

  const canPost =
    ["super_admin", "corebody", "core_body", "managing_director"].includes(role) ||
    ["vp", "gs", "president", "treasurer", "managing_director"].includes(position);

  let announcements: any[] = [];
  try {
    const { data } = await admin
      .from("announcements")
      .select("*, published_by(full_name)")
      .order("created_at", { ascending: false });
    if (data) announcements = data;
  } catch {}

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Announcements</h1>
          <p className="text-sm text-muted-foreground mt-1">Official society broadcasts and updates.</p>
        </div>
        <AnnouncementDialog canPost={canPost} />
      </div>
      <Separator className="opacity-40" />
      {(!announcements || announcements.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4 border border-dashed rounded-xl border-border/50 bg-card/30">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Megaphone size={28} className="text-muted-foreground/30" />
          </div>
          <p className="text-lg font-serif text-foreground">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann, i) => (
            <Card key={ann.id} className="animate-fade-in card-hover" style={{ animationDelay: `${i * 50}ms` }}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[oklch(0.72_0.12_75_/_15%)] text-[oklch(0.72_0.12_75)] shrink-0 mt-0.5">
                      <Megaphone size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg leading-snug">{ann.title}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                        <Calendar size={10} />
                        {new Date(ann.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })}
                        {ann.published_by?.full_name && <> · by {ann.published_by.full_name}</>}
                      </p>
                    </div>
                  </div>
                  {canPost && (
                    <DeleteAnnouncementButton id={ann.id} title={ann.title} />
                  )}
                </div>
                <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-line pl-14">{ann.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
