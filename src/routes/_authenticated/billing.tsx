import { createFileRoute } from "@tanstack/react-router";
import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/billing")({
  head: () => ({ meta: [{ title: "Billing · ClipForge AI" }] }),
  component: BillingPage,
});

const tiers = [
  { name: "Free", price: "$0", features: ["60 min/mo", "720p", "Watermark"], cta: "Current plan" },
  { name: "Starter", price: "$15", features: ["5 hrs/mo", "1080p", "No watermark"], cta: "Upgrade" },
  { name: "Pro", price: "$29", features: ["Unlimited", "4K", "Brand kit", "Priority"], cta: "Upgrade", featured: true },
  { name: "Business", price: "$79", features: ["Team", "API", "SSO ready"], cta: "Talk to sales" },
];

function BillingPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground/60">Billing</p>
      <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">Plans & credits</h1>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={cn(
              "relative flex flex-col rounded-2xl border p-6",
              t.featured
                ? "border-[#7C3AED]/40 bg-gradient-to-b from-[#7C3AED]/10 to-transparent"
                : "border-white/10 bg-white/[0.02]"
            )}
          >
            {t.featured && (
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-[#7C3AED] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
                Popular
              </div>
            )}
            <p className="text-sm font-medium text-muted-foreground">{t.name}</p>
            <p className="mt-2 font-display text-4xl font-medium">{t.price}<span className="text-sm text-muted-foreground"> /mo</span></p>
            <ul className="mt-4 flex-1 space-y-2">
              {t.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-foreground/80">
                  <Check className="size-3.5 text-[#10B981]" /> {f}
                </li>
              ))}
            </ul>
            <button
              className={cn(
                "mt-6 rounded-xl px-4 py-2 text-sm font-semibold",
                t.featured
                  ? "bg-[#7C3AED] text-white hover:bg-[#8B5CF6]"
                  : "border border-white/10 bg-white/5 text-foreground hover:bg-white/10"
              )}
            >
              {t.cta}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="size-4 text-[#7C3AED]" /> Credits work like minutes of video processed.
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Stripe billing is coming soon. Reach out if you want early access to Pro.
        </p>
      </div>
    </div>
  );
}
