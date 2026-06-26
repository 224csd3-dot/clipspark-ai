import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  Sparkles,
  Wand2,
  Crop,
  Captions,
  Gauge,
  Palette,
  Check,
  Play,
  Plus,
  Minus,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ClipForge AI — Turn any YouTube video into viral shorts" },
      {
        name: "description",
        content:
          "Paste a YouTube link and ClipForge AI generates dozens of viral-ready shorts with captions, viral score, and auto-reframing.",
      },
      { property: "og:title", content: "ClipForge AI — Turn any video into viral shorts" },
      {
        property: "og:description",
        content: "Generate viral short-form clips from long-form video in minutes.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#090909] text-foreground">
      {/* Ambient backdrop */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-[-10%] h-[520px] w-[520px] rounded-full bg-[#7C3AED] opacity-[0.18] blur-[140px] animate-float-orb" />
        <div className="absolute right-[-10%] top-[20%] h-[460px] w-[460px] rounded-full bg-[#2563EB] opacity-[0.14] blur-[140px] animate-float-orb [animation-delay:-4s]" />
        <div className="absolute left-1/2 top-[60%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#10B981] opacity-[0.06] blur-[160px]" />
      </div>

      <Nav />
      <Hero />
      <SocialProof />
      <PreviewSection />
      <Features />
      <ScoreSection />
      <Pricing />
      <Testimonials />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-[#090909]/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/"><Logo /></Link>
        <div className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="transition-colors hover:text-foreground">Features</a>
          <a href="#pricing" className="transition-colors hover:text-foreground">Pricing</a>
          <a href="#faq" className="transition-colors hover:text-foreground">FAQ</a>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/auth"
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline"
          >
            Sign in
          </Link>
          <Link
            to="/auth"
            className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            Get started
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  const [url, setUrl] = useState("");
  return (
    <section className="relative px-6 pt-40 pb-20">
      <div className="mx-auto max-w-5xl text-center">
        <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7C3AED] opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
          </span>
          New · Viral Score 3.0 with multimodal scene analysis
        </div>

        <h1 className="font-display text-balance text-5xl font-medium leading-[1.05] tracking-tight md:text-7xl">
          Turn any YouTube video into{" "}
          <span className="bg-gradient-to-r from-[#A78BFA] via-[#7C3AED] to-[#2563EB] bg-clip-text text-transparent">
            viral shorts
          </span>{" "}
          with AI
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
          Paste one link. Get dozens of captioned, vertically reframed clips ranked by viral
          potential — ready for Shorts, Reels, TikTok, and X.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const target = `/projects/new${url ? `?url=${encodeURIComponent(url)}` : ""}`;
            window.location.href = target;
          }}
          className="mx-auto mt-10 flex max-w-2xl items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2 backdrop-blur-xl shadow-[0_30px_80px_-30px_rgba(124,58,237,0.4)]"
        >
          <div className="ml-2 hidden text-muted-foreground sm:block">
            <Play className="size-4" />
          </div>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste your YouTube URL…"
            className="flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground/60"
          />
          <button
            type="submit"
            className="group inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(124,58,237,0.8)] transition-all hover:bg-[#8B5CF6]"
          >
            Generate Free Clips
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </form>
        <p className="mt-4 text-xs text-muted-foreground">
          No credit card · 60 minutes of free processing
        </p>
      </div>
    </section>
  );
}

function SocialProof() {
  const items = ["YouTube Shorts", "Instagram Reels", "TikTok", "Facebook Reels", "LinkedIn", "X"];
  return (
    <section className="px-6 pb-16">
      <div className="mx-auto max-w-5xl">
        <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground/60">
          One source, every platform
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {items.map((i) => (
            <span key={i} className="text-sm font-semibold text-muted-foreground/70">
              {i}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function PreviewSection() {
  const clips = [
    { title: "The Real Reason Founders Burn Out", score: 96, start: "00:12", end: "00:58", color: "from-[#7C3AED]/30 to-[#2563EB]/20" },
    { title: "AI Is Eating Strategy", score: 91, start: "04:22", end: "04:54", color: "from-[#2563EB]/30 to-[#10B981]/20" },
    { title: "How To Hire Like Stripe", score: 88, start: "12:10", end: "12:45", color: "from-[#10B981]/30 to-[#7C3AED]/20" },
  ];
  return (
    <section className="relative px-6 pb-32">
      <div className="mx-auto max-w-6xl">
        <div className="glass-strong relative overflow-hidden rounded-3xl p-3 shadow-[0_60px_120px_-30px_rgba(0,0,0,0.7)]">
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
            <div className="flex gap-1.5">
              <div className="size-2.5 rounded-full bg-white/10" />
              <div className="size-2.5 rounded-full bg-white/10" />
              <div className="size-2.5 rounded-full bg-white/10" />
            </div>
            <div className="font-mono text-[10px] tracking-widest text-muted-foreground/60">
              clipforge.ai / project · my-podcast-ep-42
            </div>
            <div className="size-2.5" />
          </div>

          <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-3">
            {clips.map((c) => (
              <div
                key={c.title}
                className="group relative overflow-hidden rounded-2xl border border-white/5 bg-black/50"
              >
                <div className={cn("aspect-[9/16] bg-gradient-to-br", c.color)}>
                  <div className="absolute inset-0 bg-grid opacity-20" />
                </div>

                <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md border border-[#10B981]/30 bg-[#10B981]/15 px-2 py-1 backdrop-blur-md">
                  <Sparkles className="size-3 text-[#10B981]" />
                  <span className="font-mono text-[10px] font-semibold text-[#10B981]">
                    {c.score} VIRAL
                  </span>
                </div>

                <div className="absolute inset-x-3 bottom-3 space-y-2">
                  <p className="line-clamp-2 text-sm font-semibold text-white">{c.title}</p>
                  <div className="flex items-center justify-between font-mono text-[10px] text-white/50">
                    <span>{c.start} → {c.end}</span>
                    <span>9:16</span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-2/3 bg-gradient-to-r from-[#7C3AED] to-[#2563EB]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      icon: Captions,
      color: "#7C3AED",
      title: "Animated captions",
      body: "Word-by-word kinetic typography. 8 viral styles — Hormozi, Netflix, Podcast, and more.",
    },
    {
      icon: Crop,
      color: "#2563EB",
      title: "Auto reframe",
      body: "Speaker-locked 9:16, 1:1, 4:5 crops. Face tracking keeps the subject perfectly centered.",
    },
    {
      icon: Gauge,
      color: "#10B981",
      title: "Viral Score 3.0",
      body: "Predicts engagement using multimodal scene analysis trained on millions of viral clips.",
    },
    {
      icon: Wand2,
      color: "#7C3AED",
      title: "AI hooks & titles",
      body: "Headlines, descriptions, hashtags, and SEO keywords — written for each platform.",
    },
    {
      icon: Palette,
      color: "#2563EB",
      title: "Brand kit",
      body: "Lock fonts, logos, watermark, intro/outro and colors. Applied to every export automatically.",
    },
    {
      icon: Sparkles,
      color: "#10B981",
      title: "Silence remover",
      body: "Strips dead air and filler words. Tightens pacing for higher retention out of the box.",
    },
  ];

  return (
    <section id="features" className="px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground/60">
            Engineered for growth
          </p>
          <h2 className="mt-3 font-display text-4xl font-medium tracking-tight md:text-5xl">
            Every tool a creator needs.
            <span className="text-muted-foreground"> None of the cruft.</span>
          </h2>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="group relative bg-[#0d0d0f] p-8 transition-colors hover:bg-[#111114]">
              <div
                className="mb-6 flex size-11 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: `color-mix(in oklab, ${f.color} 15%, transparent)`,
                  boxShadow: `0 0 24px -8px ${f.color}80`,
                }}
              >
                <f.icon className="size-5" style={{ color: f.color }} />
              </div>
              <h3 className="mb-2 text-lg font-semibold tracking-tight">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ScoreSection() {
  const reasons = [
    { label: "Strong hook", value: 98 },
    { label: "High emotion", value: 92 },
    { label: "Fast pacing", value: 89 },
    { label: "Good retention curve", value: 94 },
    { label: "Powerful ending", value: 86 },
  ];

  return (
    <section className="px-6 py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground/60">
            Viral Score 3.0
          </p>
          <h2 className="mt-3 font-display text-4xl font-medium tracking-tight md:text-5xl">
            We don't guess what goes viral.
            <span className="text-muted-foreground"> We score it.</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Each clip is rated 0–100 with full transparency. See exactly why our AI selected a
            moment — hook strength, emotional arc, pacing, retention shape, and the ending punch.
          </p>
        </div>

        <div className="glass relative overflow-hidden rounded-3xl p-8">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Viral Score</p>
              <p className="font-display text-7xl font-medium tracking-tight">
                94<span className="text-2xl text-muted-foreground">/100</span>
              </p>
            </div>
            <div className="rounded-full border border-[#10B981]/30 bg-[#10B981]/10 px-3 py-1 text-xs font-medium text-[#10B981]">
              Top 3% of clips
            </div>
          </div>
          <div className="mt-8 space-y-4">
            {reasons.map((r) => (
              <div key={r.label}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-foreground/80">{r.label}</span>
                  <span className="font-mono text-xs text-muted-foreground">{r.value}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#2563EB]"
                    style={{ width: `${r.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const tiers = [
    {
      name: "Free",
      price: "$0",
      cadence: "forever",
      features: ["60 mins / mo", "720p exports", "Watermark", "Standard AI"],
      cta: "Start free",
      featured: false,
    },
    {
      name: "Pro",
      price: "$29",
      cadence: "per month",
      features: ["Unlimited uploads", "4K exports", "No watermark", "Brand kit", "Priority queue"],
      cta: "Go Pro",
      featured: true,
    },
    {
      name: "Business",
      price: "$79",
      cadence: "per month",
      features: ["Team collaboration", "API access", "5 brand kits", "SSO ready", "Dedicated support"],
      cta: "Talk to sales",
      featured: false,
    },
  ];

  return (
    <section id="pricing" className="px-6 py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground/60">
            Pricing
          </p>
          <h2 className="mt-3 font-display text-4xl font-medium tracking-tight md:text-5xl">
            Scale your output, not your overhead.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={cn(
                "relative flex flex-col rounded-3xl border p-8 transition-all",
                t.featured
                  ? "border-[#7C3AED]/40 bg-gradient-to-b from-[#7C3AED]/10 to-transparent shadow-[0_0_60px_-20px_rgba(124,58,237,0.5)]"
                  : "border-white/10 bg-white/[0.02]"
              )}
            >
              {t.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#7C3AED] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                  Most popular
                </div>
              )}
              <div className="mb-6">
                <p className="text-sm font-medium text-muted-foreground">{t.name}</p>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="font-display text-5xl font-medium tracking-tight">{t.price}</span>
                  <span className="text-sm text-muted-foreground">/ {t.cadence}</span>
                </div>
              </div>
              <ul className="mb-8 flex-1 space-y-3">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-foreground/80">
                    <Check className="size-4 shrink-0 text-[#10B981]" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/auth"
                className={cn(
                  "inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-all",
                  t.featured
                    ? "bg-[#7C3AED] text-white hover:bg-[#8B5CF6]"
                    : "border border-white/10 bg-white/5 text-foreground hover:bg-white/10"
                )}
              >
                {t.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="px-6 py-32">
      <div className="mx-auto max-w-4xl">
        <div className="glass relative overflow-hidden rounded-3xl p-12">
          <div className="absolute right-6 top-6 font-display text-8xl leading-none text-white/5">"</div>
          <p className="relative font-display text-2xl leading-relaxed text-balance text-foreground/90 md:text-3xl">
            I used to spend 8 hours a week cutting podcasts for TikTok. ClipForge does it in five
            minutes — and the viral scores actually predict what hits.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <div className="size-12 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#2563EB]" />
            <div>
              <p className="font-semibold">Marcus Thorne</p>
              <p className="text-sm text-muted-foreground">Host · The Future Stack</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    {
      q: "How does the viral score work?",
      a: "We analyze each candidate clip across hook strength, emotional arc, pacing, retention curve, and ending impact using multimodal models trained on millions of high-performing short-form videos.",
    },
    {
      q: "Which languages are supported?",
      a: "100+ languages for transcription and captions including English, Spanish, French, German, Portuguese, Japanese, Korean, Mandarin, Hindi, and Arabic.",
    },
    {
      q: "Can I edit clips after generation?",
      a: "Yes. Every clip opens in a full timeline editor with trim, split, crop, captions, music, and brand controls.",
    },
    {
      q: "Do you support uploads or only YouTube?",
      a: "Both. Paste a YouTube URL or upload an MP4/MOV up to 4 hours. Drive, Loom, and Vimeo links are coming.",
    },
    {
      q: "Is my content private?",
      a: "Yes. All projects are private to your account by default with row-level security. We never use your footage to train our models.",
    },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="px-6 py-32">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground/60">FAQ</p>
          <h2 className="mt-3 font-display text-4xl font-medium tracking-tight">
            Questions, answered.
          </h2>
        </div>
        <div className="space-y-3">
          {items.map((it, idx) => {
            const isOpen = open === idx;
            return (
              <button
                key={it.q}
                onClick={() => setOpen(isOpen ? null : idx)}
                className="block w-full rounded-2xl border border-white/8 bg-white/[0.02] p-6 text-left transition-colors hover:bg-white/[0.04]"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium">{it.q}</span>
                  {isOpen ? <Minus className="size-4 text-muted-foreground" /> : <Plus className="size-4 text-muted-foreground" />}
                </div>
                {isOpen && (
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{it.a}</p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="px-6 pb-32">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#7C3AED]/20 via-[#2563EB]/10 to-transparent p-16 text-center">
        <h2 className="font-display text-4xl font-medium tracking-tight md:text-6xl">
          Ship your first viral short tonight.
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          60 free minutes. No credit card. No watermark on Pro.
        </p>
        <div className="mt-8">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            Start free <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 px-6 py-16">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
        <Logo />
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
          © 2026 ClipForge AI · Built for creators
        </p>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground">Privacy</a>
          <a href="#" className="hover:text-foreground">Terms</a>
          <a href="#" className="hover:text-foreground">X</a>
        </div>
      </div>
    </footer>
  );
}
