import React from "react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { logout } from "@/app/login/actions";

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.status === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center mx-auto">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="oklch(0.72 0.12 75)" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h2 className="font-serif text-2xl font-bold text-foreground">Account Pending</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your account is awaiting approval from the Admin. You will receive access once your membership is confirmed.
          </p>
          <form action={logout}>
            <button className="text-sm text-[oklch(0.72_0.12_75)] hover:underline">
              Sign out
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (profile.status === "suspended") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center mx-auto">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-destructive">
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </div>
          <h2 className="font-serif text-2xl font-bold text-foreground">Account Suspended</h2>
          <p className="text-muted-foreground text-sm">
            Your account has been suspended. Please contact the society administration.
          </p>
          <form action={logout}>
            <button className="text-sm text-[oklch(0.72_0.12_75)] hover:underline">
              Sign out
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <DashboardLayout profile={profile}>{children}</DashboardLayout>;
}
