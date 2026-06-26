import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Check, Loader2, Download, Heart, Edit3, Trash2, Copy, Sparkles, TrendingUp, Brain, Clock, Users, Target, Image as ImageIcon, Zap, Activity, X } from "lucide-react";
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

type Clip = {
  id: string;
  title: string;
  hook: string | null;
  description: string | null;
  hashtags: string[] | null;
  emotion: string | null;
  viral_score: number;
  score_reasons: any;
  start_sec: number;
  end_sec: number;
  thumbnail_url: string | null;
  favorite: boolean;
};

function ClipsGrid({ clips }: { clips: Clip[] }) {
  const queryClient = useQueryClient();

  async function toggleFav(clip: Clip) {
    await supabase.from("clips").update({ favorite: !clip.favorite }).eq("id", clip.id);
    queryClient.invalidateQueries({ queryKey: ["clips"] });
  }

  async function deleteClip(clip: Clip) {
    await supabase.from("clips").delete().eq("id", clip.id);
    queryClient.invalidateQueries({ queryKey: ["clips"] });
    toast.success("Clip deleted");
  }

  return (
    <div className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-medium tracking-tight">
          {clips.length} clips ready
        </h2>
        <p className="text-xs text-muted-foreground">Sorted by viral score</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {clips.map((c) => (
          <ClipCard key={c.id} clip={c} onFav={() => toggleFav(c)} onDelete={() => deleteClip(c)} />
        ))}
      </div>
    </div>
  );
}

function ClipCard({ clip, onFav, onDelete }: { clip: Clip; onFav: () => void; onDelete: () => void }) {
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

        <div className="mt-3 flex items-center gap-1">
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

  return titles.map((t, i) => {
    const start = 60 + i * 70;
    const end = start + 30 + Math.floor(Math.random() * 28);
    const score = 72 + Math.floor(Math.random() * 27);
    const reasons = [...reasonBank].sort(() => 0.5 - Math.random()).slice(0, 3);
    const hashtags = [...tagBank].sort(() => 0.5 - Math.random()).slice(0, 4);
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
      start_sec: start,
      end_sec: end,
      aspect_ratio: "9:16",
    };
  });
}
