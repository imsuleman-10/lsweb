import { BookOpen } from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Sign In — Literary Society UET",
};

export default async function LoginPage(props: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const searchParams = await props.searchParams;

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── LEFT PANEL — Branding ─────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: "oklch(0.09 0.01 240)" }}>
        {/* Subtle dot grid texture */}
        <div aria-hidden className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle, oklch(0.9 0 0) 1px, transparent 1px)`,
            backgroundSize: "28px 28px"
          }} />
        {/* Gold glow blob */}
        <div aria-hidden className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none"
          style={{ background: "oklch(0.72 0.12 75 / 8%)" }} />
        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "oklch(0.72 0.12 75 / 12%)", border: "1px solid oklch(0.72 0.12 75 / 25%)" }}>
              <BookOpen size={18} style={{ color: "oklch(0.82 0.14 75)" }} />
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.2em] uppercase"
                style={{ color: "oklch(0.82 0.14 75)" }}>Literary Society</p>
              <p className="text-[10px] text-muted-foreground">University of Engineering & Technology, Lahore</p>
            </div>
          </div>
        </div>
        {/* Center Content */}
        <div className="relative z-10 space-y-7">
          <div className="w-12 h-[2px] rounded-full" style={{ background: "oklch(0.72 0.12 75 / 60%)" }} />
          <div>
            <h1 className="font-serif text-[2.8rem] font-bold leading-[1.15] text-foreground">
              Where words<br />
              <span style={{
                background: "linear-gradient(135deg, oklch(0.85 0.15 75) 0%, oklch(0.68 0.10 75) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>shape legacy.</span>
            </h1>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[340px]">
            The official management platform for organizing events, tracking responsibilities, 
            publishing poetry, and maintaining financial accountability.
          </p>
          {/* Stats Row */}
          <div className="flex gap-8 pt-2">
            {[
              { n: "7", label: "Core Body" },
              { n: "40+", label: "Members" },
              { n: "∞", label: "Stories" },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-serif text-2xl font-bold text-foreground">{s.n}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Quote card at bottom */}
        <div className="relative z-10">
          <div className="rounded-xl p-5 space-y-3"
            style={{ background: "oklch(0.72 0.12 75 / 6%)", border: "1px solid oklch(0.72 0.12 75 / 15%)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="oklch(0.72 0.12 75 / 50%)" style={{ marginBottom: 4 }}>
              <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
              <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
            </svg>
            <p className="text-sm text-muted-foreground italic leading-relaxed font-serif">
              A society flourishes when its members are accountable, its leaders are transparent,
              and its stories are told with authenticity.
            </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — Login Form ──────────────────────── */}
      <LoginForm error={searchParams.error} message={searchParams.message} />
    </div>
  );
}
