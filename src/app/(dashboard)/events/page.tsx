import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { CreateEventDialog } from "./event-dialog";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, MapPin, Clock, DollarSign, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function EventsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isPrivileged = ["super_admin", "corebody", "managing_director", "director"].includes(profile?.role || "");

  const { data: events } = await supabase
    .from("events")
    .select("*, created_by(full_name)")
    .order("start_date", { ascending: true });

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' });
  const fmtTime = (d: string) => new Date(d).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Events</h1>
          <p className="text-sm text-muted-foreground mt-1">Schedule and manage society events and competitions.</p>
        </div>
        {isPrivileged && <CreateEventDialog />}
      </div>

      <Separator className="opacity-40" />

      {(!events || events.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4 border border-dashed rounded-xl border-border/50 bg-card/30">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <CalendarDays size={28} className="text-muted-foreground/30" />
          </div>
          <div>
            <p className="text-lg font-serif text-foreground">No events scheduled</p>
            <p className="text-sm text-muted-foreground mt-1">Plan your first society event.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((evt, i) => (
            <Card key={evt.id} className="animate-fade-in card-hover flex flex-col" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="h-2 w-full rounded-t-xl" style={{ background: "linear-gradient(90deg, oklch(0.72 0.12 75), oklch(0.60 0.18 200))" }} />
              <CardHeader className="pb-3 flex-1">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <Badge variant="outline" className="shrink-0 text-[9px] uppercase font-semibold tracking-wider bg-muted/50">
                    {evt.status}
                  </Badge>
                  {evt.budget_allocated > 0 && (
                    <Badge variant="outline" className="shrink-0 text-[10px] text-[oklch(0.72_0.12_75)] border-[oklch(0.72_0.12_75_/_30%)] bg-[oklch(0.72_0.12_75_/_5%)]">
                      PKR {evt.budget_allocated}
                    </Badge>
                  )}
                </div>
                <CardTitle className="font-serif text-xl leading-tight">{evt.title}</CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-2 min-h-[40px]">
                  {evt.description || "No description provided."}
                </p>

                <div className="space-y-2 mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays size={13} className="text-[oklch(0.72_0.12_75)]" />
                    <span className="font-medium text-foreground/80">{fmtDate(evt.start_date)}</span>
                    <span>•</span>
                    <span>{fmtTime(evt.start_date)}</span>
                  </div>
                  {evt.location && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin size={13} className="text-[oklch(0.60_0.18_200)]" />
                      <span className="truncate">{evt.location}</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardFooter className="p-4 bg-muted/20 border-t border-border/50">
                <Link href={`/events/${evt.id}`} className="w-full">
                  <Button variant="ghost" className="w-full text-xs h-8 justify-between hover:bg-background">
                    Manage Event <ArrowRight size={14} className="text-[oklch(0.72_0.12_75)]" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
