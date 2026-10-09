import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ProfileForm } from "./profile-form";

import { AvatarUpload } from "./avatar-upload";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/login");

  const { count: tasksCompleted } = await supabase
    .from("tasks").select("*", { count: "exact", head: true })
    .eq("assigned_to", user.id).eq("status", "completed");

  const { count: tasksPending } = await supabase
    .from("tasks").select("*", { count: "exact", head: true })
    .eq("assigned_to", user.id).neq("status", "completed");

  const roleColors: Record<string, string> = {
    super_admin: "oklch(0.72 0.12 75)", corebody: "oklch(0.60 0.18 200)",
    director: "oklch(0.55 0.18 280)", head: "oklch(0.65 0.18 30)", member: "oklch(0.65 0.15 150)"
  };
  const color = roleColors[profile.role] ?? roleColors.member;
  const initials = (profile.full_name || profile.email || "?").split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
  const joinDate = new Date(profile.created_at || Date.now()).toLocaleDateString("en-PK", { month: "long", year: "numeric" });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Your personal information and society standing.</p>
      </div>
      <Separator className="opacity-40" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="animate-fade-in lg:col-span-1" style={{ borderColor: `${color}30` }}>
          <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
          <CardContent className="p-6 flex flex-col items-center text-center gap-4">
            <div className="mt-2">
              <AvatarUpload currentUrl={profile.avatar_url} initials={initials} color={color} />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold">{profile.full_name || "No Name Set"}</h2>
              <p className="text-xs text-muted-foreground mt-1">{profile.email}</p>
            </div>
            <Badge variant="outline" className="text-[11px] uppercase tracking-wider font-semibold px-3"
              style={{ color, borderColor: `${color}40`, background: `${color}10` }}>
              {profile.position !== "none" ? profile.position : profile.role.replace("_", " ")}
            </Badge>
            <div className="w-full pt-3 border-t border-border/50 grid grid-cols-2 gap-3">
              <div className="text-center">
                <p className="text-2xl font-serif font-bold text-foreground">{tasksCompleted ?? 0}</p>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-serif font-bold text-foreground">{tasksPending ?? 0}</p>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Pending</p>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground/60">Member since {joinDate}</p>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card className="animate-fade-in lg:col-span-2" style={{ animationDelay: "100ms" }}>
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-base">Edit Your Information</CardTitle>
          </CardHeader>
          <Separator className="opacity-20 mx-6" />
          <CardContent className="p-6">
            <ProfileForm initialName={profile.full_name ?? ""} initialBio={profile.bio ?? ""} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
