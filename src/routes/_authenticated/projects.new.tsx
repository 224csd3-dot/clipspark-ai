import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Link as LinkIcon, Upload, Sparkles } from "lucide-react";
import { toast } from "sonner";

const searchSchema = z.object({ url: z.string().optional() });

export const Route = createFileRoute("/_authenticated/projects/new")({
  head: () => ({ meta: [{ title: "New project · ClipForge AI" }] }),
  validateSearch: searchSchema,
  component: NewProject,
});

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return m?.[1] ?? null;
}

function NewProject() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [url, setUrl] = useState(search.url ?? "");
  const [preview, setPreview] = useState<{ id: string; title: string; channel: string; thumb: string } | null>(null);
  const [validating, setValidating] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const id = extractYouTubeId(url);
    if (!id) {
      setPreview(null);
      return;
    }
    setValidating(true);
    // YouTube oEmbed for basic metadata (no API key required)
    fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setPreview({
            id,
            title: data.title,
            channel: data.author_name,
            thumb: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
          });
        } else {
          setPreview({
            id,
            title: "YouTube Video",
            channel: "Unknown",
            thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
          });
        }
      })
      .finally(() => setValidating(false));
  }, [url]);

  async function handleCreate() {
    if (!preview) return;
    setCreating(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("projects")
        .insert({
          user_id: u.user.id,
          title: preview.title,
          source_url: `https://www.youtube.com/watch?v=${preview.id}`,
          source_type: "youtube",
          channel: preview.channel,
          thumbnail_url: preview.thumb,
          status: "processing",
          progress: 0,
          current_step: "Downloading Video",
        })
        .select("id")
        .single();
      if (error) throw error;
      navigate({ to: "/projects/$projectId", params: { projectId: data.id } });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create project");
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground/60">New</p>
      <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">
        Create a project
      </h1>
      <p className="mt-2 text-muted-foreground">
        Drop a YouTube URL — or upload your own footage — and we'll do the rest.
      </p>

      <div className="mt-8 space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <LinkIcon className="size-4 text-[#7C3AED]" /> YouTube URL
          </div>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=…"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-[#7C3AED]/50"
          />
        </div>

        <div className="grid place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-8 text-center text-sm text-muted-foreground">
          <Upload className="mb-2 size-5" />
          Or drop a video file (MP4, MOV up to 4 hours)
          <span className="mt-1 text-xs opacity-60">Coming soon — use a YouTube link for now</span>
        </div>

        {validating && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Validating…
          </div>
        )}

        {preview && (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <div className="flex gap-4 p-4">
              <img
                src={preview.thumb}
                alt=""
                className="aspect-video w-40 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 font-medium">{preview.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{preview.channel}</p>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2 text-sm font-semibold text-white hover:bg-[#8B5CF6] disabled:opacity-60"
                >
                  {creating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  Generate Clips
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
