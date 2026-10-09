"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PushNotificationManager } from "@/components/PushNotificationManager";
import {
  Home, BookOpen, Megaphone, Bell, User,
  CheckSquare, Users, Star, Layers, CalendarDays,
  DollarSign, Settings, ScrollText, LogOut,
  ChevronLeft, ChevronRight, Shield, Menu
} from "lucide-react";
import { logout } from "@/app/login/actions";

// ─── Types ─────────────────────────────────────────────────────
interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  position: string;
  status: string;
  avatar_url: string | null;
}

interface NavItem {
  href: string;
  label: string;
  Icon: React.ElementType;
}

// ─── Nav Config ─────────────────────────────────────────────────
function getNavGroups(role: string) {
  const always: NavItem[] = [
    { href: "/", label: "Dashboard", Icon: Home },
  ];

  const personal: NavItem[] = [
    { href: "/poetry", label: "Poetry", Icon: BookOpen },
    { href: "/announcements", label: "Announcements", Icon: Megaphone },
    { href: "/notifications", label: "Notifications", Icon: Bell },
    { href: "/profile", label: "Profile", Icon: User },
    { href: "/settings", label: "Settings", Icon: Settings },
  ];

  const memberWork: NavItem[] = [
    { href: "/my-tasks", label: "My Tasks", Icon: CheckSquare },
  ];

  // Head: can see team & assign tasks
  const headWork: NavItem[] = [
    { href: "/tasks", label: "Assign Tasks", Icon: CheckSquare },
    { href: "/my-tasks", label: "My Tasks", Icon: CheckSquare },
    { href: "/my-team", label: "My Team", Icon: Users },
  ];

  // Director: head + events
  const directorWork: NavItem[] = [
    { href: "/tasks", label: "Assign Tasks", Icon: CheckSquare },
    { href: "/my-tasks", label: "My Tasks", Icon: CheckSquare },
    { href: "/my-team", label: "My Team", Icon: Users },
    { href: "/events", label: "Events", Icon: CalendarDays },
  ];

  // HR: members + tasks
  const hrWork: NavItem[] = [
    { href: "/members", label: "Members", Icon: Users },
    { href: "/tasks", label: "Assign Tasks", Icon: CheckSquare },
    { href: "/my-tasks", label: "My Tasks", Icon: CheckSquare },
  ];

  // Managing Director: like corebody but with team view
  const managingDirectorWork: NavItem[] = [
    { href: "/members", label: "Members", Icon: Users },
    { href: "/phylums", label: "Phylums / Wings", Icon: Layers },
    { href: "/tasks", label: "All Tasks", Icon: CheckSquare },
    { href: "/my-tasks", label: "My Tasks", Icon: CheckSquare },
    { href: "/my-team", label: "My Team", Icon: Users },
    { href: "/events", label: "Events", Icon: CalendarDays },
  ];

  // Mentor: team view + tasks
  const mentorWork: NavItem[] = [
    { href: "/tasks", label: "Assign Tasks", Icon: CheckSquare },
    { href: "/my-tasks", label: "My Tasks", Icon: CheckSquare },
    { href: "/my-team", label: "My Team", Icon: Users },
  ];

  const coreBodyWork: NavItem[] = [
    { href: "/members", label: "Members", Icon: Users },
    { href: "/core-body", label: "Core Body", Icon: Star },
    { href: "/phylums", label: "Phylums / Wings", Icon: Layers },
    { href: "/events", label: "Events", Icon: CalendarDays },
    { href: "/tasks", label: "All Tasks", Icon: CheckSquare },
    { href: "/finance", label: "Finance", Icon: DollarSign },
  ];

  const adminWork: NavItem[] = [
    { href: "/members", label: "Members", Icon: Users },
    { href: "/core-body", label: "Core Body", Icon: Star },
    { href: "/phylums", label: "Phylums / Wings", Icon: Layers },
    { href: "/events", label: "Events", Icon: CalendarDays },
    { href: "/tasks", label: "All Tasks", Icon: CheckSquare },
    { href: "/finance", label: "Finance", Icon: DollarSign },
    { href: "/audit", label: "Audit Logs", Icon: ScrollText },
  ];

  let workItems: NavItem[] = memberWork;
  if (role === "super_admin")        workItems = adminWork;
  else if (role === "corebody")      workItems = coreBodyWork;
  else if (role === "managing_director") workItems = managingDirectorWork;
  else if (role === "director")      workItems = directorWork;
  else if (role === "head")          workItems = headWork;
  else if (role === "hr")            workItems = hrWork;
  else if (role === "mentor")        workItems = mentorWork;

  return { always, work: workItems, personal };
}

// ─── Role accent color ──────────────────────────────────────────
function getRoleColor(role: string): string {
  const map: Record<string, string> = {
    super_admin:       "oklch(0.72 0.12 75)",
    corebody:          "oklch(0.60 0.18 200)",
    managing_director: "oklch(0.62 0.20 300)",
    director:          "oklch(0.55 0.18 280)",
    head:              "oklch(0.65 0.18 30)",
    hr:                "oklch(0.65 0.18 160)",
    mentor:            "oklch(0.67 0.16 50)",
    member:            "oklch(0.65 0.15 150)",
  };
  return map[role] ?? map.member;
}

// ─── Sidebar NavLink ────────────────────────────────────────────
function NavLink({ item, collapsed, active, onClick }: { item: NavItem; collapsed: boolean; active: boolean; onClick?: () => void }) {
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 relative",
        collapsed ? "md:justify-center md:px-2" : "",
        active
          ? "text-sidebar-foreground bg-sidebar-accent"
          : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] rounded-r-full"
          style={{ background: "oklch(0.72 0.12 75)" }} />
      )}
      <item.Icon size={16} className="shrink-0" />
      <span className={cn("truncate", collapsed ? "md:hidden" : "")}>{item.label}</span>
    </Link>
  );
}

// ─── Section Label ──────────────────────────────────────────────
function SectionLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  return (
    <>
      <div className={cn("mx-3 my-1 h-px bg-sidebar-border/50", collapsed ? "md:block hidden" : "hidden")} />
      <p className={cn("px-3 pt-3 pb-1 text-[10px] font-semibold tracking-[0.14em] uppercase text-sidebar-foreground/30", collapsed ? "md:hidden" : "")}>
        {label}
      </p>
    </>
  );
}

// ─── Sidebar ────────────────────────────────────────────────────
function Sidebar({ profile, collapsed, mobileOpen, onToggle, setMobileOpen }: {
  profile: Profile;
  collapsed: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  setMobileOpen: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const { always, work, personal } = getNavGroups(profile.role);
  const accentColor = getRoleColor(profile.role);
  const initials = (profile.full_name ?? profile.email ?? "?")
    .split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  const ROLE_LABELS: Record<string, string> = {
    super_admin: "Super Admin",
    corebody: "Core Body",
    managing_director: "Managing Director",
    director: "Director",
    head: "Head",
    hr: "HR",
    mentor: "Mentor",
    member: "Member",
  };
  const roleLabel = profile.position && profile.position !== "none"
    ? profile.position.replace(/_/g, " ").toUpperCase()
    : (ROLE_LABELS[profile.role] ?? profile.role.replace(/_/g, " ")).toUpperCase();

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 md:relative md:z-0 flex flex-col h-full border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out shrink-0",
        mobileOpen ? "translate-x-0 w-[240px]" : "-translate-x-full w-[240px] md:translate-x-0",
        collapsed ? "md:w-[60px]" : "md:w-[240px]"
      )}>
        {/* Logo */}
        <div 
          onClick={onToggle}
          className={cn(
          "flex items-center h-[60px] border-b border-sidebar-border px-4 shrink-0 gap-3 cursor-pointer hover:bg-sidebar-accent/30 transition-colors",
          collapsed && "md:justify-center md:px-2"
        )}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden bg-white shadow-sm border border-border/10">
            <img src="/icon.png" alt="Logo" className="w-full h-full object-contain p-0.5" />
          </div>
          <div className={cn("min-w-0 transition-opacity", collapsed ? "md:hidden" : "")}>
            <p className="text-[10px] font-bold tracking-[0.18em] uppercase truncate"
              style={{ color: "oklch(0.82 0.14 75)" }}>
              Literary Society
            </p>
            <p className="text-[9px] text-sidebar-foreground/35 truncate">UET Lahore</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
          {always.map(item => (
            <NavLink key={item.href} item={item} collapsed={collapsed} active={pathname === item.href} onClick={() => setMobileOpen(false)} />
          ))}

          {work.length > 0 && (
            <>
              <SectionLabel label="Management" collapsed={collapsed} />
              {work.map(item => (
                <NavLink key={item.href} item={item} collapsed={collapsed} active={pathname === item.href} onClick={() => setMobileOpen(false)} />
              ))}
            </>
          )}

          <SectionLabel label="Personal" collapsed={collapsed} />
          {personal.map(item => (
            <NavLink key={item.href} item={item} collapsed={collapsed} active={pathname === item.href} onClick={() => setMobileOpen(false)} />
          ))}
        </nav>

        {/* User Section */}
        <div className="shrink-0 border-t border-sidebar-border p-3">
          
          <div className={cn("flex justify-center", collapsed ? "md:flex hidden" : "hidden")}>
            <Avatar className="h-8 w-8">
              {profile.avatar_url && <AvatarImage src={profile.avatar_url} className="object-cover" />}
              <AvatarFallback className="text-[11px] font-bold"
                style={{ background: `${accentColor}20`, color: accentColor }}>
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className={cn("flex items-center gap-2.5", collapsed ? "md:hidden" : "flex")}>
            <Avatar className="h-8 w-8 shrink-0">
              {profile.avatar_url && <AvatarImage src={profile.avatar_url} className="object-cover" />}
              <AvatarFallback className="text-[11px] font-bold"
                style={{ background: `${accentColor}20`, color: accentColor }}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-sidebar-foreground truncate">
                {profile.full_name || "Member"}
              </p>
              <Badge variant="outline"
                className="mt-0.5 text-[9px] px-1.5 py-0 h-4 font-semibold tracking-wide border"
                style={{ color: accentColor, borderColor: `${accentColor}30`, background: `${accentColor}10` }}>
                {roleLabel}
              </Badge>
            </div>
            <form action={logout}>
              <button title="Sign out"
                className="text-sidebar-foreground/30 hover:text-sidebar-foreground transition-colors p-1 rounded">
                <LogOut size={14} />
              </button>
            </form>
          </div>
        </div>

      </aside>
    </>
  );
}

// ─── Topbar ─────────────────────────────────────────────────────
function Topbar({ profile, onOpenMobile }: { profile: Profile; onOpenMobile: () => void }) {
  const pathname = usePathname();
  const pageTitle = pathname === "/"
    ? "Dashboard"
    : pathname.slice(1).split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");

  const isSuperAdmin = profile.role === "super_admin";

  return (
    <header className="h-[60px] border-b border-border flex items-center justify-between px-4 md:px-6 bg-background/80 backdrop-blur-sm shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={onOpenMobile} className="md:hidden p-1.5 -ml-1.5 rounded-md text-foreground/70 hover:bg-muted hover:text-foreground">
          <Menu size={20} />
        </button>
        <h1 className="font-serif text-lg font-semibold text-foreground">{pageTitle}</h1>
      </div>
      <div className="flex items-center gap-2">
        {isSuperAdmin && (
          <Badge variant="outline" className="text-[10px] gap-1 border hidden sm:flex"
            style={{ color: "oklch(0.72 0.12 75)", borderColor: "oklch(0.72 0.12 75 / 30%)", background: "oklch(0.72 0.12 75 / 8%)" }}>
            <Shield size={9} /> Super Admin
          </Badge>
        )}
        <Link href="/notifications">
          <button className="relative w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ background: "oklch(0.72 0.12 75)" }} />
          </button>
        </Link>
      </div>
    </header>
  );
}

// ─── Main Export ─────────────────────────────────────────────────
import { PushManager } from "@/components/push-manager";

export function DashboardLayout({ children, profile }: {
  children: React.ReactNode;
  profile: Profile;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <PushManager />
      <Sidebar 
        profile={profile} 
        collapsed={collapsed} 
        mobileOpen={mobileOpen}
        onToggle={() => setCollapsed(p => !p)} 
        setMobileOpen={setMobileOpen}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar profile={profile} onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
