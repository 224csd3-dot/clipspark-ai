import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Check, Loader2, Download, Heart, Edit3, Trash2, Copy, Sparkles, TrendingUp, Brain, Clock, Users, Target, Image as ImageIcon, Zap, Activity, X, Wand2, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/projects/$projectId")({
  head: () => ({ meta: [{ title: "Project · ClipForge AI" }] }),
  component: ProjectPage,
});

const STEPS = [
  "Downloading Video",
  "Extracting Audio",
  "Generating Transcript",
  "Analyzing Transcript",
  "Detecting Viral Moments",
  "Removing Silences",
  "Generating Captions",
  "Cropping Video",
  "Face Tracking",
  "Rendering Shorts",
  "Creating Titles",
  "Generating Hashtags",
  "Preparing Downloads",
] as const;

function ProjectPage() {
  const { projectId } = Route.useParams();
  const queryClient = useQueryClient();
  const simulatedRef = useRef(false);

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("*").eq("id", projectId).single();
      return data;
    },
    refetchInterval: (q) => (q.state.data?.status === "processing" ? 1500 : false),
  });

  const { data: clips } = useQuery({
    queryKey: ["clips", projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from("clips")
        .select("*")
        .eq("project_id", projectId)
        .order("viral_score", { ascending: false });
      return data ?? [];
    },
    enabled: project?.status === "completed",
  });

  // Simulate processing pipeline (client-side mock until real video pipeline is wired)
  useEffect(() => {
    if (!project || project.status !== "processing" || simulatedRef.current) return;
    simulatedRef.current = true;

    let cancelled = false;
    (async () => {
      for (let i = 0; i < STEPS.length; i++) {
        if (cancelled) return;
        await new Promise((r) => setTimeout(r, 900));
        await supabase
          .from("projects")
          .update({
            current_step: STEPS[i],
            progress: Math.round(((i + 1) / STEPS.length) * 100),
          })
          .eq("id", projectId);
        queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      }
      if (cancelled) return;
      // Generate mock clips
      const mockClips = generateMockClips(projectId, project.user_id);
      await supabase.from("clips").insert(mockClips);
      await supabase.from("projects").update({ status: "completed", progress: 100 }).eq("id", projectId);
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["clips", projectId] });
      toast.success("Clips ready!");
    })();

    return () => {
      cancelled = true;
    };
  }, [project, projectId, queryClient]);

  if (!project) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <Link
        to="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Projects
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl font-medium tracking-tight">{project.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {project.channel ? `${project.channel} · ` : ""}YouTube
          </p>
        </div>
        {project.thumbnail_url && (
          <img
            src={project.thumbnail_url}
            alt=""
            className="aspect-video w-56 rounded-xl border border-white/10 object-cover"
          />
        )}
      </div>

      {project.status === "processing" ? (
        <ProcessingTimeline currentStep={project.current_step} progress={project.progress} />
      ) : project.status === "completed" ? (
        <ClipsGrid clips={clips ?? []} />
      ) : (
        <div className="mt-10 rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-200">
          Processing failed. Try regenerating.
        </div>
      )}
    </div>
  );
}

function ProcessingTimeline({ currentStep, progress }: { currentStep: string | null; progress: number }) {
  const currentIdx = STEPS.findIndex((s) => s === currentStep);
  return (
    <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
      <div className="glass-strong relative overflow-hidden rounded-3xl p-8">
        <div className="absolute inset-0 -z-10 bg-grid opacity-30" />
        <div className="absolute -right-20 -top-20 size-72 rounded-full bg-[#7C3AED]/20 blur-3xl" />
        <div className="text-center">
          <div className="relative mx-auto grid size-32 place-items-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#g)"
                strokeWidth="6"
                strokeDasharray={`${(progress / 100) * 283} 283`}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
              <defs>
                <linearGradient id="g">
                  <stop offset="0%" stopColor="#7C3AED" />
                  <stop offset="100%" stopColor="#2563EB" />
                </linearGradient>
              </defs>
            </svg>
            <span className="font-display text-3xl font-medium tabular-nums">{progress}%</span>
          </div>
          <p className="mt-6 font-display text-xl font-medium tracking-tight">{currentStep ?? "Starting…"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This usually takes 2–4 minutes for a 30-minute video.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/8 bg-white/[0.02] p-6">
        <p className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Pipeline
        </p>
        <ol className="space-y-1.5">
          {STEPS.map((s, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;
            return (
              <li
                key={s}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
                  active && "bg-[#7C3AED]/10 text-foreground",
                  !active && !done && "text-muted-foreground/60",
                  done && "text-foreground/80"
                )}
              >
                <span
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-full border text-[10px]",
                    done && "border-[#10B981]/40 bg-[#10B981]/15 text-[#10B981]",
                    active && "border-[#7C3AED]/50 bg-[#7C3AED]/20 text-white",
                    !done && !active && "border-white/10"
                  )}
                >
                  {done ? <Check className="size-3" /> : active ? <Loader2 className="size-3 animate-spin" /> : i + 1}
                </span>
                {s}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

type ThumbStyle = {
  style: "Bold" | "Minimal" | "MrBeast" | "Podcast" | "Business" | "Dark Theme";
  headline: string;
  bg: string;
  accent: string;
};

type ClipStrategy = {
  retention_pct: number;
  hook_strength: "Weak" | "Solid" | "Strong" | "Elite";
  story_arc: "Incomplete" | "Building" | "Completed";
  platform: string;
  upload_time: string;
  audience: string;
  watch_time_sec: number;
  thumbnail: string;
  narrative: string;
  hook_alternatives: string[];
  thumbnails: ThumbStyle[];
};

type Clip = {
  id: string;
  title: string;
  hook: string | null;
  description: string | null;
  hashtags: string[] | null;
  emotion: string | null;
  viral_score: number;
  score_reasons: any;
  strategy: any;
  start_sec: number;
  end_sec: number;
  thumbnail_url: string | null;
  favorite: boolean;
};

function ClipsGrid({ clips }: { clips: Clip[] }) {
  const queryClient = useQueryClient();
  const [openClip, setOpenClip] = useState<Clip | null>(null);

  async function toggleFav(clip: Clip) {
    await supabase.from("clips").update({ favorite: !clip.favorite }).eq("id", clip.id);
    queryClient.invalidateQueries({ queryKey: ["clips"] });
  }

  async function deleteClip(clip: Clip) {
    await supabase.from("clips").delete().eq("id", clip.id);
    queryClient.invalidateQueries({ queryKey: ["clips"] });
    toast.success("Clip deleted");
  }

  const topClip = clips[0];

  return (
    <div className="mt-10">
      {topClip && <StrategistHero clip={topClip} onOpen={() => setOpenClip(topClip)} />}

      <div className="mb-4 mt-10 flex items-center justify-between">
        <h2 className="font-display text-xl font-medium tracking-tight">
          {clips.length} clips ready
        </h2>
        <p className="text-xs text-muted-foreground">Sorted by viral score</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {clips.map((c) => (
          <ClipCard
            key={c.id}
            clip={c}
            onFav={() => toggleFav(c)}
            onDelete={() => deleteClip(c)}
            onOpen={() => setOpenClip(c)}
          />
        ))}
      </div>

      {openClip && <StrategistDrawer clip={openClip} onClose={() => setOpenClip(null)} />}
    </div>
  );
}

function getStrategy(clip: Clip): ClipStrategy {
  const s = (clip.strategy ?? {}) as Partial<ClipStrategy>;
  return {
    retention_pct: s.retention_pct ?? 88,
    hook_strength: s.hook_strength ?? "Strong",
    story_arc: s.story_arc ?? "Completed",
    platform: s.platform ?? "TikTok",
    upload_time: s.upload_time ?? "8 PM",
    audience: s.audience ?? "Entrepreneurs",
    watch_time_sec: s.watch_time_sec ?? 28,
    thumbnail: s.thumbnail ?? "Included",
    narrative: s.narrative ?? "Opens with a sharp curiosity gap in the first 3 seconds and holds emotional intensity through the payoff.",
  };
}

function StrategistHero({ clip, onOpen }: { clip: Clip; onOpen: () => void }) {
  const st = getStrategy(clip);
  return (
    <div className="glass-strong relative overflow-hidden rounded-3xl p-7 sm:p-9">
      <div className="absolute -right-24 -top-24 size-72 rounded-full bg-[#7C3AED]/25 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 size-72 rounded-full bg-[#2563EB]/20 blur-3xl" />
      <div className="absolute inset-0 -z-10 bg-grid opacity-25" />

      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#7C3AED]/40 bg-[#7C3AED]/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#C4B5FD]">
          <Brain className="size-3" /> AI Content Strategist
        </span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Top pick</span>
      </div>

      <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="min-w-0">
          <h3 className="font-display text-2xl font-medium tracking-tight sm:text-3xl">
            {clip.hook ?? clip.title}
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            This clip has the highest chance of going viral — {st.narrative}
          </p>
          <button
            onClick={onOpen}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
          >
            See full strategy <TrendingUp className="size-4" />
          </button>
        </div>

        <div className="relative grid size-36 shrink-0 place-items-center self-center lg:self-end">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke="url(#sg)" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${(clip.viral_score / 100) * 283} 283`}
            />
            <defs>
              <linearGradient id="sg">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#7C3AED" />
              </linearGradient>
            </defs>
          </svg>
          <div className="text-center">
            <div className="font-display text-4xl font-medium tabular-nums">{clip.viral_score}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Virality</div>
          </div>
        </div>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Metric icon={<Activity className="size-3.5" />} label="Retention" value={`${st.retention_pct}%`} />
        <Metric icon={<Zap className="size-3.5" />} label="Hook" value={st.hook_strength} />
        <Metric icon={<Sparkles className="size-3.5" />} label="Emotion" value={clip.emotion ?? "—"} />
        <Metric icon={<Target className="size-3.5" />} label="Platform" value={st.platform} />
        <Metric icon={<Clock className="size-3.5" />} label="Best post" value={st.upload_time} />
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-1 font-display text-sm font-medium">{value}</div>
    </div>
  );
}

function StrategistDrawer({ clip, onClose }: { clip: Clip; onClose: () => void }) {
  const st = getStrategy(clip);
  const rows: Array<[React.ReactNode, string, string]> = [
    [<Sparkles className="size-3.5" />, "Virality Score", `${clip.viral_score}/100`],
    [<Activity className="size-3.5" />, "Retention Prediction", `${st.retention_pct}%`],
    [<Zap className="size-3.5" />, "Hook Strength", st.hook_strength],
    [<Sparkles className="size-3.5" />, "Emotion", clip.emotion ?? "—"],
    [<TrendingUp className="size-3.5" />, "Story Arc", st.story_arc],
    [<Target className="size-3.5" />, "Recommended Platform", st.platform],
    [<Clock className="size-3.5" />, "Best Upload Time", st.upload_time],
    [<Users className="size-3.5" />, "Target Audience", st.audience],
    [<Clock className="size-3.5" />, "Expected Watch Time", `${st.watch_time_sec} seconds`],
    [<ImageIcon className="size-3.5" />, "Suggested Thumbnail", st.thumbnail],
  ];

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative ml-auto flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-white/10 bg-[#0A0A0B] p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#7C3AED]/40 bg-[#7C3AED]/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#C4B5FD]">
              <Brain className="size-3" /> Strategist Report
            </span>
            <h3 className="mt-3 font-display text-xl font-medium tracking-tight">
              {clip.hook ?? clip.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 place-items-center rounded-lg border border-white/8 hover:bg-white/5"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="mt-4 rounded-xl border border-white/8 bg-white/[0.03] p-4 text-sm leading-relaxed text-muted-foreground">
          {st.narrative}
        </p>

        <div className="mt-6 divide-y divide-white/5 rounded-xl border border-white/8 bg-white/[0.02]">
          {rows.map(([icon, label, value]) => (
            <div key={label} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">{icon} {label}</span>
              <span className="font-display font-medium">{value}</span>
            </div>
          ))}
        </div>

        <button className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-3 text-sm font-semibold text-white hover:bg-[#8B5CF6]">
          <Download className="size-4" /> Export this clip
        </button>
      </div>
    </div>
  );
}

function ClipCard({ clip, onFav, onDelete, onOpen }: { clip: Clip; onFav: () => void; onDelete: () => void; onOpen: () => void }) {
  const dur = clip.end_sec - clip.start_sec;
  const reasons = (clip.score_reasons as string[] | null) ?? [];
  return (
    <div className="group overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02] transition-all hover:border-white/20">
      <div className="relative aspect-[9/16] bg-gradient-to-br from-[#7C3AED]/30 to-[#2563EB]/20">
        {clip.thumbnail_url && (
          <img src={clip.thumbnail_url} alt="" className="size-full object-cover opacity-80" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md border border-[#10B981]/40 bg-[#10B981]/15 px-2 py-1 backdrop-blur-md">
          <Sparkles className="size-3 text-[#10B981]" />
          <span className="font-mono text-[10px] font-semibold text-[#10B981]">{clip.viral_score}</span>
        </div>
        <div className="absolute right-3 top-3 rounded-md bg-black/60 px-2 py-0.5 font-mono text-[10px] text-white backdrop-blur">
          {dur}s
        </div>

        <div className="absolute inset-x-3 bottom-3">
          <p className="line-clamp-2 text-sm font-semibold text-white">{clip.hook ?? clip.title}</p>
          {clip.emotion && (
            <p className="mt-1 text-[10px] uppercase tracking-widest text-white/60">{clip.emotion}</p>
          )}
        </div>
      </div>

      <div className="p-4">
        <p className="line-clamp-2 text-sm font-medium">{clip.title}</p>
        {reasons.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {reasons.slice(0, 2).map((r) => (
              <span
                key={r}
                className="rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-muted-foreground"
              >
                {r}
              </span>
            ))}
          </div>
        )}
        {clip.hashtags && clip.hashtags.length > 0 && (
          <p className="mt-2 line-clamp-1 text-xs text-[#A78BFA]">
            {clip.hashtags.slice(0, 3).map((h) => `#${h}`).join(" ")}
          </p>
        )}

        <button
          onClick={onOpen}
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#7C3AED]/30 bg-[#7C3AED]/10 px-3 py-1.5 text-[11px] font-semibold text-[#C4B5FD] transition-colors hover:bg-[#7C3AED]/20"
        >
          <Brain className="size-3" /> AI Strategy
        </button>

        <div className="mt-2 flex items-center gap-1">
          <button className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#7C3AED] px-3 py-2 text-xs font-semibold text-white hover:bg-[#8B5CF6]">
            <Download className="size-3.5" /> Export
          </button>
          <IconBtn onClick={onFav} active={clip.favorite} aria="Favorite">
            <Heart className={cn("size-3.5", clip.favorite && "fill-[#7C3AED] text-[#7C3AED]")} />
          </IconBtn>
          <IconBtn aria="Edit">
            <Edit3 className="size-3.5" />
          </IconBtn>
          <IconBtn aria="Duplicate">
            <Copy className="size-3.5" />
          </IconBtn>
          <IconBtn onClick={onDelete} aria="Delete">
            <Trash2 className="size-3.5" />
          </IconBtn>
        </div>
      </div>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  active,
  aria,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  aria: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={aria}
      className={cn(
        "grid size-8 place-items-center rounded-lg border border-white/8 transition-colors hover:bg-white/5",
        active && "border-[#7C3AED]/40 bg-[#7C3AED]/10"
      )}
    >
      {children}
    </button>
  );
}

function generateMockClips(projectId: string, userId: string) {
  const titles = [
    "The one mistake every founder makes",
    "Why most creators quit in year two",
    "This single hire changed everything",
    "The 30-second pitch that raised $20M",
    "How we 10x'd retention overnight",
    "The skill nobody is teaching",
    "What VCs won't tell you",
    "I wish I knew this at 22",
    "The exact framework I use weekly",
    "Stop doing this on day one",
    "How AI killed our roadmap",
    "Three lessons from 100 podcasts",
  ];
  const emotions = ["Inspiring", "Tense", "Surprising", "Funny", "Educational", "Bold"];
  const reasonBank = [
    "Strong hook",
    "High emotion",
    "Fast pacing",
    "Good retention",
    "Powerful ending",
    "Clear takeaway",
    "Curiosity gap",
  ];
  const tagBank = ["founders", "AI", "startup", "creators", "growth", "podcast", "viral", "marketing", "hiring"];
  const platforms = ["TikTok", "YouTube Shorts", "Instagram Reels", "LinkedIn", "X"];
  const times = ["8 PM", "7 PM", "9 PM", "12 PM", "6 AM"];
  const audiences = ["Entrepreneurs", "Creators", "Marketers", "Investors", "Students", "Engineers"];
  const hookStrengths = ["Solid", "Strong", "Elite"] as const;
  const arcs = ["Building", "Completed"] as const;
  const narratives = [
    "Opens with a curiosity gap in the first 3 seconds and holds emotional intensity through the payoff.",
    "Pattern-interrupt opener followed by a tight 3-beat story arc, ending on a memorable punchline.",
    "Specific number + bold claim in the first frame; pacing tightens every 4 seconds.",
    "Confessional tone hooks identity-driven viewers, then resolves with an actionable takeaway.",
    "Visual + verbal mismatch creates a stop-scroll moment; payoff lands at the 70% mark.",
  ];

  return titles.map((t, i) => {
    const start = 60 + i * 70;
    const end = start + 30 + Math.floor(Math.random() * 28);
    const score = 72 + Math.floor(Math.random() * 27);
    const reasons = [...reasonBank].sort(() => 0.5 - Math.random()).slice(0, 3);
    const hashtags = [...tagBank].sort(() => 0.5 - Math.random()).slice(0, 4);
    const retention = 70 + Math.floor(Math.random() * 28);
    return {
      project_id: projectId,
      user_id: userId,
      title: t,
      hook: t,
      description: `${t}. A clip generated from your video, optimized for short-form platforms.`,
      hashtags,
      emotion: emotions[i % emotions.length],
      viral_score: score,
      score_reasons: reasons,
      strategy: {
        retention_pct: retention,
        hook_strength: hookStrengths[Math.min(2, Math.floor(score / 33))],
        story_arc: arcs[score > 85 ? 1 : 0],
        platform: platforms[i % platforms.length],
        upload_time: times[i % times.length],
        audience: audiences[i % audiences.length],
        watch_time_sec: Math.floor((end - start) * (retention / 100)),
        thumbnail: "Included",
        narrative: narratives[i % narratives.length],
      },
      start_sec: start,
      end_sec: end,
      aspect_ratio: "9:16",
    };
  });
}
