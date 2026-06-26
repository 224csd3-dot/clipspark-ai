import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, ArrowRight, Sparkles, Clock, HardDrive, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · ClipForge AI" }] }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).single();
      return data;
    },
  });

  const { data: projects } = useQuery({
    queryKey: ["projects", "recent"],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, title, thumbnail_url, status, progress, created_at")
        .order("created_at", { ascending: false })
        .limit(6);
      return data ?? [];
    },
  });

  const credits = profile?.credits_remaining ?? 0;
  const creditsTotal = profile?.credits_total ?? 60;
  const storage = profile?.storage_used_mb ?? 0;
  const plan = profile?.plan ?? "free";

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground/60">
            Welcome back
          </p>
          <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">
            {profile?.display_name ? `Hi, ${profile.display_name.split(" ")[0]}` : "Your workspace"}
          </h1>
        </div>
        <Link
          to="/projects/new"
          className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-12px_rgba(124,58,237,0.9)] hover:bg-[#8B5CF6]"
        >
          <Plus className="size-4" /> Generate from URL
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          icon={Zap}
          label="Credits remaining"
          value={`${credits} min`}
          accent="#7C3AED"
          progress={creditsTotal > 0 ? (credits / creditsTotal) * 100 : 0}
          sub={`${creditsTotal} included with ${plan}`}
        />
        <StatCard
          icon={HardDrive}
          label="Storage used"
          value={`${storage} MB`}
          accent="#2563EB"
          progress={Math.min(100, (storage / 5000) * 100)}
          sub="5 GB included"
        />
        <StatCard
          icon={Sparkles}
          label="Plan"
          value={plan.toUpperCase()}
          accent="#10B981"
          sub="Upgrade for unlimited"
          cta={
            <Link to="/billing" className="text-xs font-medium text-[#10B981] hover:underline">
              View plans →
            </Link>
          }
        />
      </div>

      <section className="mt-12">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-xl font-medium tracking-tight">Recent projects</h2>
          <Link to="/projects" className="text-xs text-muted-foreground hover:text-foreground">
            View all →
          </Link>
        </div>

        {!projects || projects.length === 0 ? (
          <EmptyState onCreate={() => navigate({ to: "/projects/new" })} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <Link
                key={p.id}
                to="/projects/$projectId"
                params={{ projectId: p.id }}
                className="group block overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02] transition-all hover:border-white/15 hover:bg-white/[0.04]"
              >
                <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-[#7C3AED]/30 to-[#2563EB]/20">
                  {p.thumbnail_url && (
                    <img
                      src={p.thumbnail_url}
                      alt=""
                      className="size-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
                    />
                  )}
                  <div className="absolute right-3 top-3">
                    <StatusBadge status={p.status} />
                  </div>
                </div>
                <div className="p-4">
                  <p className="line-clamp-1 font-medium">{p.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  progress,
  cta,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string;
  sub?: string;
  accent: string;
  progress?: number;
  cta?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
      <div className="flex items-center gap-3">
        <div
          className="grid size-9 place-items-center rounded-lg"
          style={{ backgroundColor: `color-mix(in oklab, ${accent} 18%, transparent)` }}
        >
          <Icon className="size-4" style={{ color: accent }} />
        </div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      </div>
      <p className="mt-4 font-display text-3xl font-medium tracking-tight">{value}</p>
      {progress !== undefined && (
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full"
            style={{ width: `${progress}%`, background: accent }}
          />
        </div>
      )}
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{sub}</span>
        {cta}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "Pending", cls: "bg-white/10 text-white/80" },
    processing: { label: "Processing", cls: "bg-[#2563EB]/20 text-[#7DA4F5]" },
    completed: { label: "Ready", cls: "bg-[#10B981]/20 text-[#34D399]" },
    failed: { label: "Failed", cls: "bg-red-500/20 text-red-300" },
  };
  const v = map[status] ?? map.pending;
  return (
    <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium backdrop-blur", v.cls)}>
      {v.label}
    </span>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="grid place-items-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-16 text-center">
      <div className="relative">
        <div className="absolute inset-0 -m-6 rounded-full bg-[#7C3AED]/20 blur-2xl" />
        <div className="relative grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#2563EB] shadow-[0_0_40px_-8px_rgba(124,58,237,0.6)]">
          <Sparkles className="size-6 text-white" />
        </div>
      </div>
      <h3 className="mt-6 font-display text-xl font-medium tracking-tight">
        Your first viral clip is one paste away
      </h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Drop a YouTube URL and we'll generate captioned, vertically reframed shorts ranked by viral
        potential.
      </p>
      <button
        onClick={onCreate}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#8B5CF6]"
      >
        Generate clips <ArrowRight className="size-4" />
      </button>
    </div>
  );
}
