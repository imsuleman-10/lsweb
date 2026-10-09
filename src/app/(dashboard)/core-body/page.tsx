import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Crown } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const POSITION_ORDER: Record<string, number> = {
  president: 1, treasurer: 2, vp: 3, gs: 4,
  managing_director: 5, hr: 6, mentor: 7,
};

const POSITION_LABELS: Record<string, string> = {
  president:         "President",
  treasurer:         "Treasurer",
  vp:                "Vice President",
  gs:                "General Secretary",
  managing_director: "Managing Director",
  hr:                "Human Resources",
  mentor:            "Mentor",
};

const POSITION_COLORS: Record<string, string> = {
  president:         "oklch(0.82 0.14 75)",
  treasurer:         "oklch(0.60 0.18 200)",
  vp:                "oklch(0.55 0.18 280)",
  gs:                "oklch(0.65 0.18 30)",
  managing_director: "oklch(0.62 0.20 300)",
  hr:                "oklch(0.65 0.18 160)",
  mentor:            "oklch(0.67 0.16 50)",
};

export default async function CoreBodyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: coreMembers } = await supabase
    .from("profiles")
    .select("*")
    .in("role", ["super_admin", "corebody", "managing_director", "hr", "mentor"])
    .eq("status", "active")
    .order("created_at", { ascending: true });

  const sorted = [...(coreMembers ?? [])].sort((a, b) => {
    const ao = POSITION_ORDER[a.position] ?? 99;
    const bo = POSITION_ORDER[b.position] ?? 99;
    return ao - bo;
  });

  // Group by tier
  const leadership = sorted.filter(m => ["president", "treasurer"].includes(m.position));
  const executive  = sorted.filter(m => ["vp", "gs"].includes(m.position));
  const extended   = sorted.filter(m => !["president", "treasurer", "vp", "gs"].includes(m.position));

  function MemberCard({ member, i }: { member: any; i: number }) {
    const position = member.position !== "none" ? member.position : member.role;
    const color = POSITION_COLORS[position] ?? "oklch(0.65 0.15 150)";
    const label = POSITION_LABELS[position] ?? position.replace(/_/g, " ");
    const initials = (member.full_name || member.email || "?").split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
    const isTop = ["president", "treasurer"].includes(position);

    return (
      <Card
        key={member.id}
        className="animate-fade-in card-hover overflow-hidden"
        style={{ animationDelay: `${i * 60}ms`, borderColor: `${color}30` }}
      >
        <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
        <CardContent className="p-6 flex flex-col items-center text-center gap-4">
          <div className="relative mt-2">
            <Avatar className="h-20 w-20 border-2" style={{ borderColor: `${color}50` }}>
              {member.avatar_url && <AvatarImage src={member.avatar_url} className="object-cover" />}
              <AvatarFallback className="text-xl font-bold" style={{ background: `${color}15`, color }}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: color, border: "2px solid var(--background)" }}>
              {isTop ? <Crown size={10} className="text-white fill-white" /> : <Star size={10} className="text-white fill-white" />}
            </div>
          </div>

          <div>
            <h3 className="font-serif font-bold text-lg text-foreground">{member.full_name || "Member"}</h3>
            <p className="text-xs text-muted-foreground">{member.email}</p>
          </div>

          <Badge variant="outline" className="text-[11px] uppercase tracking-wider font-semibold px-3 py-1"
            style={{ color, borderColor: `${color}40`, background: `${color}10` }}>
            {label}
          </Badge>
        </CardContent>
      </Card>
    );
  }

  function Section({ title, members }: { title: string; members: any[] }) {
    if (members.length === 0) return null;
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</h2>
          <div className="flex-1 h-px bg-border/40" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {members.map((m, i) => <MemberCard key={m.id} member={m} i={i} />)}
        </div>
      </section>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Core Body</h1>
        <p className="text-sm text-muted-foreground mt-1">Executive leadership of the Literary Society, UET Lahore.</p>
      </div>
      <Separator className="opacity-40" />

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4 border border-dashed rounded-xl border-border/50">
          <Star size={28} className="text-muted-foreground/30" />
          <p className="text-lg font-serif text-foreground">No core body members found</p>
        </div>
      ) : (
        <div className="space-y-10">
          <Section title="Leadership" members={leadership} />
          <Section title="Executive" members={executive} />
          <Section title="Extended Core Body" members={extended} />
        </div>
      )}
    </div>
  );
}
