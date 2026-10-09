import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, User, Bell, Shield, Globe } from "lucide-react";
import { ChangePasswordForm } from "./change-password-form";
import { logout } from "@/app/login/actions";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const isSuperAdmin = profile?.role === "super_admin";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and society preferences.</p>
      </div>
      <Separator className="opacity-40" />

      <div className="space-y-4">
        {/* Account Details */}
        <Card className="animate-fade-in">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-base flex items-center gap-2">
              <User size={16} /> Account Details
            </CardTitle>
          </CardHeader>
          <Separator className="opacity-20 mx-6" />
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Full Name</p>
                <p className="text-sm text-foreground">{profile?.full_name || "Not set"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Email</p>
                <p className="text-sm text-foreground">{profile?.email}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Role</p>
                <p className="text-sm text-foreground capitalize">{profile?.role?.replace("_", " ")}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Status</p>
                <Badge className={profile?.status === "active" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-orange-500/10 text-orange-500 border-orange-500/20"}>
                  {profile?.status}
                </Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              To update your name or bio, go to{" "}
              <a href="/profile" className="underline underline-offset-2" style={{ color: "oklch(0.72 0.12 75)" }}>My Profile</a>.
            </p>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="animate-fade-in" style={{ animationDelay: "60ms" }}>
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-base flex items-center gap-2">
              <Shield size={16} /> Change Password
            </CardTitle>
          </CardHeader>
          <Separator className="opacity-20 mx-6" />
          <CardContent className="p-6">
            <ChangePasswordForm />
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="animate-fade-in" style={{ animationDelay: "100ms" }}>
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-base flex items-center gap-2">
              <Bell size={16} /> Push Notifications
            </CardTitle>
          </CardHeader>
          <Separator className="opacity-20 mx-6" />
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              Push notifications are managed automatically by your browser. Ensure notifications are enabled for this site in your browser settings.
            </p>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="animate-fade-in border-destructive/20" style={{ animationDelay: "140ms" }}>
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-base flex items-center gap-2 text-destructive">
              <Settings size={16} /> Account Actions
            </CardTitle>
          </CardHeader>
          <Separator className="opacity-20 mx-6" />
          <CardContent className="p-6">
            <form action={logout}>
              <button type="submit" className="text-sm text-destructive hover:underline underline-offset-2">
                Sign out of this account
              </button>
            </form>
          </CardContent>
        </Card>

        {/* Society Info (Admin) */}
        {isSuperAdmin && (
          <Card className="animate-fade-in" style={{ animationDelay: "180ms", borderColor: "oklch(0.72 0.12 75 / 30%)" }}>
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-base flex items-center gap-2">
                <Globe size={16} /> Society Settings
              </CardTitle>
            </CardHeader>
            <Separator className="opacity-20 mx-6" />
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Society</p>
                  <p className="text-foreground">Literary Society, UET Lahore</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Database</p>
                  <p className="text-foreground font-mono text-xs">gzepikqhswwoxvqntqqj</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
