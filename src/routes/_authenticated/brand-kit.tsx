import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "./analytics";

export const Route = createFileRoute("/_authenticated/brand-kit")({
  head: () => ({ meta: [{ title: "Brand Kit · ClipForge AI" }] }),
  component: () => (
    <ComingSoon
      title="Brand Kit"
      copy="Save fonts, logos, watermark, intro/outro and color palettes — auto-applied to every export."
    />
  ),
});
