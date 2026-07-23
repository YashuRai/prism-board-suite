import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listProjects, listTasks } from "@/lib/api";
import { FolderKanban, CheckCircle2, Clock, AlertTriangle, TrendingUp, Calendar, Plus } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from "recharts";
import { format, isToday, isPast, isThisWeek, subDays, startOfDay } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Prism" },
      { name: "description", content: "Your project overview, tasks and productivity at a glance." },
      { property: "og:title", content: "Dashboard — Prism" },
      { property: "og:description", content: "Your project overview and productivity." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const projectsQ = useQuery({ queryKey: ["projects"], queryFn: () => listProjects() });
  const tasksQ = useQuery({ queryKey: ["tasks"], queryFn: () => listTasks() });

  const projects = projectsQ.data ?? [];
  const tasks = tasksQ.data ?? [];

  const done = tasks.filter((t) => t.status === "done");
  const todo = tasks.filter((t) => t.status !== "done");
  const todayTasks = tasks.filter((t) => t.deadline && isToday(new Date(t.deadline)));
  const overdue = tasks.filter((t) => t.deadline && t.status !== "done" && isPast(new Date(t.deadline)) && !isToday(new Date(t.deadline)));
  const upcoming = tasks.filter((t) => t.deadline && t.status !== "done" && isThisWeek(new Date(t.deadline))).slice(0, 5);

  const stats = [
    { label: "Total Projects", value: projects.length, icon: FolderKanban, tone: "primary" },
    { label: "Completed", value: done.length, icon: CheckCircle2, tone: "success" },
    { label: "Today's Tasks", value: todayTasks.length, icon: Clock, tone: "accent" },
    { label: "Overdue", value: overdue.length, icon: AlertTriangle, tone: "destructive" },
  ];

  // Weekly progress data
  const weekData = Array.from({ length: 7 }).map((_, i) => {
    const d = startOfDay(subDays(new Date(), 6 - i));
    const label = format(d, "EEE");
    const completed = done.filter((t) => t.completed_at && startOfDay(new Date(t.completed_at)).getTime() === d.getTime()).length;
    return { day: label, completed };
  });

  const pieData = [
    { name: "To Do", value: tasks.filter((t) => t.status === "todo").length, color: "oklch(0.72 0.14 210)" },
    { name: "In Progress", value: tasks.filter((t) => t.status === "in_progress").length, color: "oklch(0.55 0.22 275)" },
    { name: "Review", value: tasks.filter((t) => t.status === "review").length, color: "oklch(0.65 0.2 300)" },
    { name: "Done", value: done.length, color: "oklch(0.72 0.19 145)" },
  ];

  const isLoading = projectsQ.isLoading || tasksQ.isLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Everything you need to focus for the day.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="glass rounded-2xl p-5 transition hover:-translate-y-0.5 hover:shadow-elevated">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{s.label}</span>
              <div className={`grid h-9 w-9 place-items-center rounded-xl ${toneClass(s.tone)}`}>
                <s.icon className="h-4 w-4" />
              </div>
            </div>
            {isLoading ? (
              <div className="mt-4 h-9 w-16 animate-pulse rounded-lg bg-muted" />
            ) : (
              <div className="mt-3 text-3xl font-bold">{s.value}</div>
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-2xl p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Weekly Progress</h2>
              <p className="text-xs text-muted-foreground">Tasks completed over the last 7 days</p>
            </div>
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
                <Bar dataKey="completed" fill="var(--primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Task Completion</h2>
          <p className="text-xs text-muted-foreground">Breakdown by status</p>
          {tasks.length === 0 ? (
            <EmptyMini label="No tasks yet" />
          ) : (
            <div className="mt-2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={3}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Upcoming Deadlines</h2>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
          {upcoming.length === 0 ? (
            <EmptyMini label="Nothing due this week — clean slate ✨" />
          ) : (
            <ul className="space-y-2">
              {upcoming.map((t) => (
                <li key={t.id} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{t.title}</div>
                    <div className="text-xs text-muted-foreground">{t.deadline && format(new Date(t.deadline), "EEE, MMM d")}</div>
                  </div>
                  <PriorityBadge p={t.priority} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Projects</h2>
            <Link to="/projects" className="text-xs font-medium text-primary hover:underline">View all</Link>
          </div>
          {projects.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">No projects yet.</p>
              <Link to="/projects" className="mt-4 inline-flex items-center gap-2 rounded-xl gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                <Plus className="h-4 w-4" /> Create your first
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {projects.slice(0, 5).map((p) => {
                const projectTasks = tasks.filter((t) => t.project_id === p.id);
                const doneCount = projectTasks.filter((t) => t.status === "done").length;
                const pct = projectTasks.length === 0 ? 0 : Math.round((doneCount / projectTasks.length) * 100);
                return (
                  <li key={p.id}>
                    <Link to="/projects/$projectId" params={{ projectId: p.id }} className="flex items-center gap-3 rounded-xl bg-muted/40 p-3 transition hover:bg-accent/20">
                      <div className="h-10 w-1.5 rounded-full" style={{ background: p.color }} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{p.title}</div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full gradient-primary" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">{pct}%</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function toneClass(tone: string) {
  switch (tone) {
    case "success": return "bg-[color:var(--success)]/15 text-[color:var(--success)]";
    case "accent": return "bg-[color:var(--accent)]/15 text-[color:var(--accent)]";
    case "destructive": return "bg-destructive/15 text-destructive";
    default: return "gradient-primary text-primary-foreground";
  }
}

function EmptyMini({ label }: { label: string }) {
  return <div className="py-10 text-center text-sm text-muted-foreground">{label}</div>;
}

function PriorityBadge({ p }: { p: string }) {
  const map: Record<string, string> = {
    low: "bg-[color:var(--accent)]/15 text-[color:var(--accent)]",
    medium: "bg-[color:var(--warning)]/15 text-[color:var(--warning)]",
    high: "bg-destructive/15 text-destructive",
  };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${map[p] ?? map.medium}`}>{p}</span>;
}
