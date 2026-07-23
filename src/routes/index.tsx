import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { CheckCircle2, LayoutGrid, Sparkles, BarChart3, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Prism — Project management, reimagined" },
      { name: "description", content: "A premium project management tool with kanban boards, analytics, and beautiful glassmorphism design." },
      { property: "og:title", content: "Prism — Project management, reimagined" },
      { property: "og:description", content: "Plan projects, track tasks, and stay in flow." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-4 z-40 mx-auto flex max-w-6xl items-center justify-between rounded-2xl glass px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl gradient-primary text-primary-foreground shadow-elevated">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold tracking-tight">Prism</span>
        </div>
        <Link
          to="/auth"
          className="rounded-xl gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-elevated transition hover:opacity-90"
        >
          Get started
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-6 pt-20 pb-16">
        <section className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3 w-3" /> New — AI task suggestions coming soon
          </span>
          <h1 className="mt-6 text-5xl font-extrabold tracking-tight md:text-7xl">
            Project management,
            <span className="text-gradient block">reimagined.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Plan projects, drag tasks across boards, and visualize your team's momentum — all wrapped in a beautiful glassmorphism UI.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-xl gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-elevated transition hover:opacity-90"
            >
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-xl glass px-6 py-3 text-sm font-semibold transition hover:bg-accent/20"
            >
              See features
            </a>
          </div>
        </section>

        <section id="features" className="mt-24 grid gap-5 md:grid-cols-3">
          {[
            { icon: LayoutGrid, title: "Kanban boards", desc: "Drag tasks across To Do, In Progress, Review, and Done." },
            { icon: BarChart3, title: "Live analytics", desc: "Weekly progress, completion pies, productivity graphs." },
            { icon: CheckCircle2, title: "Stay in flow", desc: "Priorities, deadlines, tags, and dark mode out of the box." },
          ].map((f) => (
            <div key={f.title} className="glass rounded-2xl p-6 transition hover:shadow-elevated hover:-translate-y-1">
              <div className="grid h-11 w-11 place-items-center rounded-xl gradient-primary text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-6 pb-10 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Prism. Crafted with care.
      </footer>
    </div>
  );
}
