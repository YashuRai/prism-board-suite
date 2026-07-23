import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listProjects, listTasks } from "@/lib/api";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subDays, startOfDay, startOfMonth, subMonths } from "date-fns";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Prism" },
      { name: "description", content: "Deep dive into your productivity trends and project growth." },
      { property: "og:title", content: "Analytics — Prism" },
      { property: "og:description", content: "Deep dive into productivity trends." },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const projectsQ = useQuery({ queryKey: ["projects"], queryFn: () => listProjects() });
  const tasksQ = useQuery({ queryKey: ["tasks"], queryFn: () => listTasks() });

  const projects = projectsQ.data ?? [];
  const tasks = tasksQ.data ?? [];
  const done = tasks.filter((t) => t.status === "done");

  const daily = Array.from({ length: 14 }).map((_, i) => {
    const d = startOfDay(subDays(new Date(), 13 - i));
    return {
      day: format(d, "MMM d"),
      completed: done.filter((t) => t.completed_at && startOfDay(new Date(t.completed_at)).getTime() === d.getTime()).length,
    };
  });

  const monthly = Array.from({ length: 6 }).map((_, i) => {
    const d = startOfMonth(subMonths(new Date(), 5 - i));
    const label = format(d, "MMM");
    const projectsCreated = projects.filter((p) => startOfMonth(new Date(p.created_at)).getTime() === d.getTime()).length;
    const tasksCompleted = done.filter((t) => t.completed_at && startOfMonth(new Date(t.completed_at)).getTime() === d.getTime()).length;
    return { month: label, projects: projectsCreated, tasks: tasksCompleted };
  });

  const priorityData = [
    { name: "High", value: tasks.filter((t) => t.priority === "high").length, color: "oklch(0.63 0.24 27)" },
    { name: "Medium", value: tasks.filter((t) => t.priority === "medium").length, color: "oklch(0.78 0.17 75)" },
    { name: "Low", value: tasks.filter((t) => t.priority === "low").length, color: "oklch(0.72 0.14 210)" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your productivity, visualized.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Daily Completion (14d)">
          <LineChart data={daily}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} />
            <YAxis stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="completed" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, fill: "var(--primary)" }} />
          </LineChart>
        </ChartCard>

        <ChartCard title="Monthly Growth">
          <BarChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} />
            <YAxis stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            <Bar dataKey="projects" fill="var(--secondary)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="tasks" fill="var(--primary)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard title="Tasks by Priority">
          <PieChart>
            <Pie data={priorityData} dataKey="value" nameKey="name" outerRadius={90} label>
              {priorityData.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
          </PieChart>
        </ChartCard>

        <div className="glass grid grid-cols-2 gap-4 rounded-2xl p-6">
          {[
            { label: "Total Projects", value: projects.length },
            { label: "Total Tasks", value: tasks.length },
            { label: "Completed Tasks", value: done.length },
            { label: "Pending Tasks", value: tasks.length - done.length },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
              <div className="mt-2 text-4xl font-bold text-gradient">{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const tooltipStyle = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 };

function ChartCard({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
      </div>
    </div>
  );
}
