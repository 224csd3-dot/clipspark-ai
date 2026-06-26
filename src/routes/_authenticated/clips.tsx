import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/clips")({
  head: () => ({ meta: [{ title: "AI Clips · ClipForge AI" }] }),
  component: ClipsPage,
});

function ClipsPage() {
  const { data: clips } = useQuery({
    queryKey: ["clips", "all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("clips")
        .select("id, title, hook, viral_score, thumbnail_url, project_id, start_sec, end_sec")
        .order("viral_score", { ascending: false })
        .limit(60);
      return data ?? [];
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground/60">Library</p>
      <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">AI Clips</h1>

      {!clips?.length ? (
        <div className="mt-8 grid place-items-center rounded-3xl border border-dashed border-white/10 p-16 text-center">
          <p className="font-display text-xl">No clips yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate a project and your top-scoring clips will surface here.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {clips.map((c) => (
            <Link
              key={c.id}
              to="/projects/$projectId"
              params={{ projectId: c.project_id }}
              className="group overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02] transition-all hover:border-white/20"
            >
              <div className="relative aspect-[9/16] bg-gradient-to-br from-[#7C3AED]/30 to-[#2563EB]/20">
                {c.thumbnail_url && <img src={c.thumbnail_url} alt="" className="size-full object-cover" />}
                <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md border border-[#10B981]/40 bg-[#10B981]/15 px-1.5 py-0.5 backdrop-blur-md">
                  <Sparkles className="size-3 text-[#10B981]" />
                  <span className="font-mono text-[10px] font-semibold text-[#10B981]">{c.viral_score}</span>
                </div>
              </div>
              <div className="p-3">
                <p className="line-clamp-2 text-xs font-medium">{c.hook ?? c.title}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
