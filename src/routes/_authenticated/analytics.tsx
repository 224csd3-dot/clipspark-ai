import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics · ClipForge AI" }] }),
  component: () => (
    <ComingSoon
      title="Analytics"
      copy="Track total projects, viral scores, minutes saved, and credit usage over time."
    />
  ),
});

export function ComingSoon({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground/60">{title}</p>
      <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">{title}</h1>
      <div className="mt-8 grid place-items-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-16 text-center">
        <p className="font-display text-2xl">Coming soon</p>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">{copy}</p>
      </div>
    </div>
  );
}
