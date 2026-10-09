import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bell, Clock } from "lucide-react";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const unreadCount = notifications?.filter(n => !n.is_read).length ?? 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">Your personal alerts and updates.</p>
        </div>
        {unreadCount > 0 && (
          <Badge className="bg-[oklch(0.72_0.12_75_/_15%)] text-[oklch(0.72_0.12_75)] border border-[oklch(0.72_0.12_75_/_30%)]">
            {unreadCount} unread
          </Badge>
        )}
      </div>
      <Separator className="opacity-40" />

      {(!notifications || notifications.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4 border border-dashed rounded-xl border-border/50 bg-card/30">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Bell size={28} className="text-muted-foreground/30" />
          </div>
          <p className="text-lg font-serif text-foreground">All caught up!</p>
          <p className="text-sm text-muted-foreground">You have no notifications at this time.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif, i) => (
            <Card key={notif.id} className={`animate-fade-in transition-all ${!notif.is_read ? "border-[oklch(0.72_0.12_75_/_30%)] bg-[oklch(0.72_0.12_75_/_3%)]" : ""}`}
              style={{ animationDelay: `${i * 30}ms` }}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!notif.is_read ? "bg-[oklch(0.72_0.12_75)]" : "bg-muted-foreground/30"}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${!notif.is_read ? "text-foreground font-medium" : "text-foreground/70"}`}>
                    {notif.message}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(notif.created_at).toLocaleString("en-PK")}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
