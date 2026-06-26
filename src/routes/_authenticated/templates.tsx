import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "./analytics";

export const Route = createFileRoute("/_authenticated/templates")({
  head: () => ({ meta: [{ title: "Templates · ClipForge AI" }] }),
  component: () => (
    <ComingSoon
      title="Templates"
      copy="Podcast, Talking Head, Interview, Gaming, Tutorial, Reaction and more — coming soon."
    />
  ),
});
