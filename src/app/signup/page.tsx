import { SignupForm } from "./signup-form";

export const metadata = {
  title: "Create Account — Literary Society UET",
  description: "Apply for general membership in the Literary Society, University of Engineering & Technology, Lahore.",
};

export default async function SignupPage(props: {
  searchParams: Promise<{ error?: string; message?: string; verify?: string; email?: string }>;
}) {
  const searchParams = await props.searchParams;

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── LEFT PANEL — Branding ─────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: "oklch(0.09 0.01 240)" }}>
        
        {/* Dot grid texture */}
        <div aria-hidden className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle, oklch(0.9 0 0) 1px, transparent 1px)`,
            backgroundSize: "28px 28px"
          }} />
        
        {/* Gradient glow blobs */}
        <div aria-hidden className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none"
          style={{ background: "oklch(0.72 0.12 75 / 8%)" }} />
        <div aria-hidden className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full blur-[100px] pointer-events-none"
          style={{ background: "oklch(0.60 0.18 200 / 5%)" }} />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden bg-white shadow-sm border border-border/10">
              <img src="/icon.png" alt="Logo" className="w-full h-full object-contain p-1" />
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
              Begin your<br />
              <span style={{
                background: "linear-gradient(135deg, oklch(0.85 0.15 75) 0%, oklch(0.68 0.10 75) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>literary journey.</span>
            </h1>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[340px]">
            Join the Society as a General Member. Once your account is approved, you'll gain access to 
            events, tasks, poetry, and the full society platform.
          </p>

          {/* How it works steps */}
          <div className="space-y-3 pt-2">
            {[
              { step: "01", label: "Create your account", desc: "Fill in your details and verify your email" },
              { step: "02", label: "Await admin approval", desc: "Our admins review and activate your account" },
              { step: "03", label: "Get your role", desc: "Start as a General Member, grow into leadership" },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full border flex items-center justify-center"
                  style={{ borderColor: "oklch(0.72 0.12 75 / 25%)", background: "oklch(0.72 0.12 75 / 8%)" }}>
                  <span className="text-[9px] font-bold" style={{ color: "oklch(0.82 0.14 75)" }}>{s.step}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground/90">{s.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                </div>
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
              &ldquo;Words can be like X-rays if you use them properly — they&apos;ll go through anything.
              You read and you&apos;re pierced.&rdquo;
            </p>
            <p className="text-[10px] text-muted-foreground/50">— Aldous Huxley</p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — Signup Form ──────────────────────── */}
      <SignupForm
        error={searchParams.error}
        message={searchParams.message}
        verify={searchParams.verify}
        email={searchParams.email}
      />
    </div>
  );
}
