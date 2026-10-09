"use client";

import { useState } from "react";
import { assignPhylumLeader, deletePhylum } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { UserPlus, Trash2, MoreHorizontal, Shield, User } from "lucide-react";

type Profile = { id: string; full_name: string | null; email: string; role: string; avatar_url?: string | null };
type PhylumData = {
  id: string; name: string; description: string | null; type: string; status: string;
  director: Profile | null; head: Profile | null;
};

// ── Small avatar pill ────────────────────────────────────────────
function LeaderPill({ profile, roleLabel, color }: { profile: Profile | null; roleLabel: string; color: string }) {
  if (!profile) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-dashed border-border/50">
        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
          <User size={10} className="text-muted-foreground/50" />
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground">{roleLabel}</p>
          <p className="text-[11px] text-muted-foreground italic">Unassigned</p>
        </div>
      </div>
    );
  }
  const initials = (profile.full_name || profile.email).substring(0, 2).toUpperCase();
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
      <Avatar className="h-6 w-6">
        {profile.avatar_url && <AvatarImage src={profile.avatar_url} className="object-cover" />}
        <AvatarFallback className="text-[9px] font-bold" style={{ background: `${color}15`, color }}>{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="text-[9px] uppercase tracking-widest" style={{ color }}>{roleLabel}</p>
        <p className="text-[11px] font-medium truncate">{profile.full_name || profile.email}</p>
      </div>
    </div>
  );
}

// ── Assign Leader Dialog ─────────────────────────────────────────
function AssignLeaderDialog({
  phylumId, targetRole, members, open, onClose
}: {
  phylumId: string; targetRole: "director" | "head";
  members: Profile[]; open: boolean; onClose: () => void;
}) {
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [memberId, setMemberId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.set("phylum_id", phylumId);
      fd.set("target_role", targetRole);
      fd.set("mode", mode);
      if (mode === "existing") {
        fd.set("member_id", memberId);
      } else {
        fd.set("email", email);
        fd.set("password", password);
        fd.set("full_name", fullName);
      }
      await assignPhylumLeader(fd);
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const roleLabel = targetRole === "director" ? "Director" : "Head";
  const accentColor = targetRole === "director" ? "oklch(0.55 0.18 280)" : "oklch(0.65 0.18 30)";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">Assign {roleLabel}</DialogTitle>
        </DialogHeader>

        {/* Mode Toggle */}
        <div className="flex gap-2">
          {(["existing", "new"] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border"
              style={mode === m ? {
                background: `${accentColor}15`,
                borderColor: `${accentColor}40`,
                color: accentColor,
              } : {
                background: "transparent", borderColor: "var(--border)", color: "var(--muted-foreground)"
              }}>
              {m === "existing" ? "Existing Member" : "Create New Account"}
            </button>
          ))}
        </div>

        <Separator className="opacity-20" />

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
        )}

        {mode === "existing" ? (
          <div className="space-y-2">
            <Label>Select Member</Label>
            <select
              value={memberId}
              onChange={e => setMemberId(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-1"
            >
              <option value="">— Choose a member —</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>
                  {m.full_name || m.email} ({m.role})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input placeholder="e.g. Ahmad Raza" value={fullName} onChange={e => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="e.g. ahmad@uet.edu.pk" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Temporary Password</Label>
              <Input type="text" placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} />
              <p className="text-xs text-muted-foreground">A welcome email with credentials will be sent automatically.</p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}
            style={{ background: accentColor, color: "oklch(0.12 0.01 240)" }} className="font-semibold">
            {loading ? "Assigning..." : `Assign ${roleLabel}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Phylum Card ──────────────────────────────────────────────────
export function PhylumCard({
  phylum, allMembers, isPrivileged, delay
}: {
  phylum: PhylumData; allMembers: Profile[]; isPrivileged: boolean; delay: number;
}) {
  const [assignOpen, setAssignOpen]   = useState(false);
  const [assignRole, setAssignRole]   = useState<"director" | "head">("director");
  const [deleting, setDeleting]       = useState(false);

  const isWing = phylum.type === "wing";
  const accent = isWing ? "oklch(0.60 0.18 200)" : "oklch(0.55 0.18 280)";
  const label  = isWing ? "Wing" : "Phylum";

  async function handleDelete() {
    if (!confirm(`Delete "${phylum.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try { await deletePhylum(phylum.id); } catch (e: any) { alert(e.message); } finally { setDeleting(false); }
  }

  return (
    <>
      <Card
        className="animate-fade-in card-hover group overflow-hidden"
        style={{ animationDelay: `${delay}ms`, borderColor: `${accent}25` }}
      >
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />

        <CardHeader className="pb-2 pt-4 px-5">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 min-w-0">
              <CardTitle className="font-serif text-base leading-tight truncate">{phylum.name}</CardTitle>
              {phylum.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{phylum.description}</p>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0 h-4"
                style={{ color: accent, borderColor: `${accent}30`, background: `${accent}10` }}>
                {label}
              </Badge>
              {isPrivileged && (
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100" />}>
                    <MoreHorizontal size={14} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={() => { setAssignRole("director"); setAssignOpen(true); }}>
                      <Shield size={13} className="mr-2 text-purple-400" /> Assign Director
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setAssignRole("head"); setAssignOpen(true); }}>
                      <UserPlus size={13} className="mr-2 text-orange-400" /> Assign Head
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDelete} disabled={deleting}
                      className="text-destructive focus:text-destructive">
                      <Trash2 size={13} className="mr-2" /> {deleting ? "Deleting..." : "Delete"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>

        <Separator className="opacity-20 mx-5" />

        <CardContent className="px-5 py-3 space-y-2">
          <LeaderPill
            profile={phylum.director}
            roleLabel="Director"
            color="oklch(0.55 0.18 280)"
          />
          <LeaderPill
            profile={phylum.head}
            roleLabel="Head"
            color="oklch(0.65 0.18 30)"
          />
        </CardContent>
      </Card>

      <AssignLeaderDialog
        phylumId={phylum.id}
        targetRole={assignRole}
        members={allMembers}
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
      />
    </>
  );
}
