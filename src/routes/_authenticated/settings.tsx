import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings · ClipForge AI" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setEmail(u.user.email ?? "");
      const { data } = await supabase.from("profiles").select("display_name").eq("id", u.user.id).single();
      setName(data?.display_name ?? "");
    })();
  }, []);

  async function save() {
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { error } = await supabase.from("profiles").update({ display_name: name }).eq("id", u.user.id);
      if (error) throw error;
      toast.success("Saved");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground/60">Settings</p>
      <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">Profile</h1>

      <div className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <Field label="Display name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-[#7C3AED]/50"
          />
        </Field>
        <Field label="Email">
          <input
            value={email}
            disabled
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-muted-foreground"
          />
        </Field>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#8B5CF6] disabled:opacity-60"
        >
          {saving && <Loader2 className="size-4 animate-spin" />} Save changes
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
