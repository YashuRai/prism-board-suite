import { Link, useRouter, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, FolderKanban, ListTodo, BarChart3, User, Settings, Sparkles, LogOut, Moon, Sun, Menu, X, Bell } from "lucide-react";
import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/tasks", label: "Tasks", icon: ListTodo },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const router = useRouter();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.invalidate();
    navigate({ to: "/auth", replace: true });
  }

  const initials = (user?.user_metadata?.full_name ?? user?.email ?? "U")
    .split(" ")
    .map((s: string) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen">
      {/* Sidebar - Desktop */}
      <aside className="fixed inset-y-4 left-4 z-30 hidden w-64 flex-col rounded-3xl glass p-4 lg:flex">
        <SidebarInner nav={nav} pathname={pathname} onNavigate={() => {}} />
      </aside>

      {/* Sidebar - Mobile */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="fixed inset-y-4 left-4 z-50 flex w-64 flex-col rounded-3xl glass-strong p-4 lg:hidden animate-in slide-in-from-left">
            <div className="mb-2 flex justify-end">
              <button onClick={() => setMobileOpen(false)} className="rounded-lg p-1 hover:bg-accent/20"><X className="h-5 w-5" /></button>
            </div>
            <SidebarInner nav={nav} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </>
      )}

      {/* Main */}
      <div className="lg:pl-72">
        <header className="sticky top-4 z-20 mx-4 flex items-center justify-between gap-3 rounded-2xl glass px-4 py-2.5 lg:mx-6">
          <button className="rounded-lg p-2 hover:bg-accent/20 lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden text-sm font-medium text-muted-foreground lg:block">
            Welcome back{user?.user_metadata?.full_name ? `, ${(user.user_metadata.full_name as string).split(" ")[0]}` : ""} 👋
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={toggle} className="rounded-xl p-2 transition hover:bg-accent/20" aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button className="relative rounded-xl p-2 transition hover:bg-accent/20" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
            </button>
            <div className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-xs font-bold text-primary-foreground">
              {initials}
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">{children}</main>
      </div>

      {/* Sign out (bottom of sidebar handled inline via inner) */}
      <div className="fixed bottom-6 left-8 z-30 hidden lg:block">
        <button
          onClick={signOut}
          className="flex items-center gap-2 rounded-xl glass px-4 py-2 text-sm font-medium transition hover:text-destructive"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );
}

function SidebarInner({
  nav,
  pathname,
  onNavigate,
}: {
  nav: readonly { to: string; label: string; icon: typeof LayoutDashboard }[];
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <>
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-primary-foreground shadow-elevated">
          <Sparkles className="h-4 w-4" />
        </div>
        <span className="text-xl font-bold tracking-tight">Prism</span>
      </div>
      <nav className="flex flex-col gap-1">
        {nav.map((item) => {
          const active = pathname === item.to || pathname.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "gradient-primary text-primary-foreground shadow-elevated"
                  : "text-muted-foreground hover:bg-accent/20 hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
