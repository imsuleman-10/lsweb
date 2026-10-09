"use client";

import { useState } from "react";
import { updateMemberStatus, updateMemberRole, resetMemberPassword, deleteMember } from "./actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, UserCheck, UserX, Shield, KeyRound, Trash2 } from "lucide-react";

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  position: string;
  status: string;
  avatar_url?: string | null;
};

function getRoleColor(role: string) {
  if (role === "super_admin") return "oklch(0.72 0.12 75)";
  if (role === "corebody")   return "oklch(0.60 0.18 200)";
  if (role === "director")   return "oklch(0.55 0.18 280)";
  if (role === "head")       return "oklch(0.65 0.18 30)";
  return "oklch(0.65 0.15 150)";
}

// ── Reset Password Dialog ────────────────────────────────────────────────────
function ResetPasswordDialog({ userId, name }: { userId: string; name: string }) {
  const [open, setOpen]       = useState(false);
  const [pw, setPw]           = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]         = useState("");

  async function handleReset() {
    if (pw.length < 6) { setMsg("Min 6 characters"); return; }
    setLoading(true); setMsg("");
    try {
      await resetMemberPassword(userId, pw);
      setMsg("✓ Password updated!");
      setPw("");
      setTimeout(() => { setOpen(false); setMsg(""); }, 1500);
    } catch (e: any) {
      setMsg(e.message);
    } finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<button type="button" className="w-full" />}>
        <span className="flex items-center w-full">
          <KeyRound className="mr-2 h-4 w-4 text-orange-400" /> Reset Password
        </span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">Reset Password</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Set a new password for <span className="font-semibold text-foreground">{name}</span>.</p>
        {msg && <p className={`text-xs px-2 py-1.5 rounded ${msg.startsWith("✓") ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>{msg}</p>}
        <div className="space-y-2">
          <Label>New Password</Label>
          <Input type="text" value={pw} onChange={e => setPw(e.target.value)} placeholder="Min 6 characters" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleReset} disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white">
            {loading ? "Saving..." : "Set Password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Table ───────────────────────────────────────────────────────────────
export function MemberTable({ members, currentUserRole }: { members: Profile[]; currentUserRole: string }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const isSuperAdmin = currentUserRole === "super_admin";
  const isCoreBody   = currentUserRole === "corebody";

  async function handleStatus(id: string, s: string) {
    setLoadingId(id);
    try { await updateMemberStatus(id, s); } catch (e: any) { alert(e.message); } finally { setLoadingId(null); }
  }
  async function handleRole(id: string, role: string, pos: string) {
    setLoadingId(id);
    try { await updateMemberRole(id, role, pos); } catch (e: any) { alert(e.message); } finally { setLoadingId(null); }
  }
  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to PERMANENTLY DELETE "${name}"? This cannot be undone.`)) return;
    setLoadingId(id);
    try { await deleteMember(id); } catch (e: any) { alert(e.message); } finally { setLoadingId(null); }
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            const initials = (member.full_name || member.email).substring(0, 2).toUpperCase();
            const color    = getRoleColor(member.role);
            const roleLabel = member.position !== "none" ? member.position : member.role.replace("_", " ");
            const canModify = isSuperAdmin || (isCoreBody && !["super_admin", "corebody"].includes(member.role));

            return (
              <TableRow key={member.id} className="hover:bg-muted/20">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-border">
                      {member.avatar_url && <AvatarImage src={member.avatar_url} className="object-cover" />}
                      <AvatarFallback style={{ background: `${color}15`, color }}>{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{member.full_name || "New Member"}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider"
                    style={{ color, borderColor: `${color}30`, background: `${color}10` }}>
                    {roleLabel}
                  </Badge>
                </TableCell>

                <TableCell>
                  <Badge className={
                    member.status === "active"    ? "bg-green-500/10 text-green-500 border-green-500/20" :
                    member.status === "suspended" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                                    "bg-orange-500/10 text-orange-500 border-orange-500/20"
                  }>{member.status}</Badge>
                </TableCell>

                <TableCell className="text-right">
                  {canModify && (
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuLabel>Manage</DropdownMenuLabel>

                        {/* Change Role submenu */}
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <Shield className="mr-2 h-4 w-4" /> Change Role
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="w-52">
                            {isSuperAdmin && (
                              <>
                                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Super Admin</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleRole(member.id, "super_admin", "president")}>
                                  🏆 President
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRole(member.id, "super_admin", "treasurer")}>
                                  💰 Treasurer
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Core Body</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleRole(member.id, "corebody", "vp")}>
                                  ⭐ Vice President
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRole(member.id, "corebody", "gs")}>
                                  📋 General Secretary
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Leadership</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleRole(member.id, "managing_director", "managing_director")}>
                              🎯 Managing Director
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRole(member.id, "hr", "hr")}>
                              🤝 HR
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRole(member.id, "mentor", "mentor")}>
                              🎓 Mentor
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Department</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleRole(member.id, "director", "director")}>
                              🚀 Director
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRole(member.id, "head", "head")}>
                              👑 Head
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleRole(member.id, "member", "none")}>
                              👤 General Member
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>

                        <DropdownMenuSeparator />

                        {/* Reset Password (Super Admin only) */}
                        {isSuperAdmin && (
                          <ResetPasswordDialog
                            userId={member.id}
                            name={member.full_name || member.email}
                          />
                        )}

                        {/* Approve / Suspend (Super Admin + Core Body) */}
                        {(isSuperAdmin || isCoreBody) && member.status !== "active" && (!isCoreBody || !["super_admin", "corebody"].includes(member.role)) && (
                          <DropdownMenuItem onClick={() => handleStatus(member.id, "active")} disabled={loadingId === member.id}>
                            <UserCheck className="mr-2 h-4 w-4 text-green-500" /> Approve / Activate
                          </DropdownMenuItem>
                        )}
                        {(isSuperAdmin || isCoreBody) && member.status !== "suspended" && member.role !== "super_admin" && (!isCoreBody || member.role !== "corebody") && (
                          <DropdownMenuItem onClick={() => handleStatus(member.id, "suspended")} disabled={loadingId === member.id}>
                            <UserX className="mr-2 h-4 w-4 text-red-500" /> Suspend
                          </DropdownMenuItem>
                        )}

                        {/* Delete Member (Super Admin + CoreBody) */}
                        {(isSuperAdmin || (isCoreBody && !["super_admin", "corebody"].includes(member.role))) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(member.id, member.full_name || member.email)}
                              disabled={loadingId === member.id}
                              className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Member
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
