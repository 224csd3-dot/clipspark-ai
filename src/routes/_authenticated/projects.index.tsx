import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/projects/")({
  head: () => ({ meta: [{ title: "Projects · ClipForge AI" }] }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects", "all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground/60">Library</p>
          <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">Projects</h1>
        </div>
        <Link
          to="/projects/new"
          className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#8B5CF6]"
        >
          <Plus className="size-4" /> New
        </Link>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-video animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : !projects?.length ? (
          <div className="grid place-items-center rounded-3xl border border-dashed border-white/10 p-16 text-center">
            <p className="font-display text-xl">No projects yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Generate your first one to get started.</p>
            <Link
              to="/projects/new"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#8B5CF6]"
            >
              <Plus className="size-4" /> New project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <Link
                key={p.id}
                to="/projects/$projectId"
                params={{ projectId: p.id }}
                className="group overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02] transition-all hover:border-white/15"
              >
                <div className="relative aspect-video bg-gradient-to-br from-[#7C3AED]/30 to-[#2563EB]/20">
                  {p.thumbnail_url && (
                    <img src={p.thumbnail_url} alt="" className="size-full object-cover" />
                  )}
                </div>
                <div className="p-4">
                  <p className="line-clamp-1 font-medium">{p.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                    {p.status}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
