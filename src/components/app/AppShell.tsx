import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  Sparkles,
  Layers,
  Palette,
  BarChart3,
  CreditCard,
  Settings,
  LogOut,
  Plus,
  Bell,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/clips", label: "AI Clips", icon: Sparkles },
  { to: "/templates", label: "Templates", icon: Layers },
  { to: "/brand-kit", label: "Brand Kit", icon: Palette },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
] as const;

const bottomItems = [
  { to: "/billing", label: "Billing", icon: CreditCard },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [email, setEmail] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-[#090909] text-foreground">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-white/5 bg-[#0b0b0d] p-4 md:flex">
        <div className="mb-8 px-2 pt-2">
          <Link to="/dashboard"><Logo /></Link>
        </div>

        <Link
          to="/projects/new"
          className="mb-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-3 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-12px_rgba(124,58,237,0.9)] transition-all hover:bg-[#8B5CF6]"
        >
          <Plus className="size-4" /> New Project
        </Link>

        <nav className="flex flex-1 flex-col gap-0.5">
          {navItems.map((item) => (
            <NavLink key={item.to} {...item} active={pathname.startsWith(item.to)} />
          ))}
          <div className="mt-auto space-y-0.5 pt-4">
            {bottomItems.map((item) => (
              <NavLink key={item.to} {...item} active={pathname.startsWith(item.to)} />
            ))}
          </div>
        </nav>

        <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#2563EB] text-xs font-semibold uppercase">
            {email?.[0] ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{email ?? "—"}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Free plan</p>
          </div>
          <button
            onClick={signOut}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            aria-label="Sign out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/5 bg-[#090909]/80 px-6 backdrop-blur-xl">
          <div className="md:hidden"><Logo /></div>
          <div className="flex items-center gap-2">
            <button className="rounded-lg p-2 text-muted-foreground hover:bg-white/5 hover:text-foreground">
              <Bell className="size-4" />
            </button>
          </div>
        </header>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

function NavLink({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
        active
          ? "bg-white/[0.06] text-foreground"
          : "text-muted-foreground hover:bg-white/[0.03] hover:text-foreground"
      )}
    >
      <Icon className={cn("size-4", active && "text-[#A78BFA]")} />
      {label}
    </Link>
  );
}
