import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase parses the recovery token from the URL automatically and emits PASSWORD_RECOVERY
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message ?? "Could not update password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090909] px-6">
      <form onSubmit={handleSubmit} className="glass-strong w-full max-w-md rounded-3xl p-8">
        <Logo withWordmark={false} className="mb-4 scale-125" />
        <h1 className="font-display text-2xl font-medium tracking-tight">Set a new password</h1>
        <p className="mt-1 text-sm text-muted-foreground">Choose something memorable.</p>
        <div className="mt-6 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">New password</label>
          <input
            required
            minLength={6}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none focus:border-[#7C3AED]/50"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] py-3 text-sm font-semibold text-white hover:bg-[#8B5CF6] disabled:opacity-60"
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          Update password
        </button>
      </form>
    </div>
  );
}
