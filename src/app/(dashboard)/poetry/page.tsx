import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Feather } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { PoetryDialog } from "./poetry-dialog";
import { DeletePoemButton } from "./delete-poem-button";

export default async function PoetryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "member";
  const canDeleteAll = ["super_admin", "corebody"].includes(role);

  const { data: poetry } = await supabase
    .from("poetry")
    .select("id, title, content, language, created_at, author_id, profiles!author_id(full_name)")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Poetry Collection</h1>
          <p className="text-sm text-muted-foreground mt-1">Literary works submitted by society members.</p>
        </div>
        <PoetryDialog />
      </div>
      <Separator className="opacity-40" />

      {(!poetry || poetry.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4 border border-dashed rounded-xl border-border/50 bg-card/30">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Feather size={28} className="text-muted-foreground/30" />
          </div>
          <p className="text-lg font-serif text-foreground">No poetry submitted yet</p>
          <p className="text-sm text-muted-foreground">Be the first to share your words.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {poetry.map((poem, i) => {
            const showDelete = canDeleteAll || poem.author_id === user.id;

            return (
              <Card key={poem.id} className="animate-fade-in card-hover overflow-hidden group" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="h-0.5 w-full bg-gradient-to-r from-[oklch(0.72_0.12_75_/_60%)] to-transparent" />
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-serif text-xl font-bold leading-snug">{poem.title}</h3>
                    {poem.language && (
                      <Badge variant="outline" className="text-[10px] shrink-0">{poem.language}</Badge>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute left-0 top-0 w-0.5 h-full rounded-full bg-[oklch(0.72_0.12_75_/_25%)]" />
                    <p className="text-sm text-foreground/80 whitespace-pre-line leading-relaxed pl-4 font-serif italic">
                      {poem.content.length > 300 ? poem.content.slice(0, 300) + "..." : poem.content}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-border/40">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Feather size={10} />
                      {(poem as any).profiles?.full_name || "Anonymous"}
                    </p>
                    <div className="flex items-center gap-3">
                      <p className="text-[10px] text-muted-foreground/60">
                        {new Date(poem.created_at).toLocaleDateString("en-PK")}
                      </p>
                      {showDelete && (
                        <DeletePoemButton poemId={poem.id} poemTitle={poem.title} />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
