import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getProject, listTasks } from "@/lib/api";
import { ArrowLeft, Calendar } from "lucide-react";
import { format } from "date-fns";
import { KanbanBoard } from "@/components/KanbanBoard";

export const Route = createFileRoute("/_authenticated/projects/$projectId")({
  head: () => ({
    meta: [
      { title: "Project — Prism" },
      { name: "description", content: "Manage tasks with a drag-and-drop kanban board." },
      { property: "og:title", content: "Project — Prism" },
      { property: "og:description", content: "Manage tasks with a drag-and-drop kanban board." },
    ],
  }),
  component: ProjectDetail,
});

function ProjectDetail() {
  const { projectId } = useParams({ from: "/_authenticated/projects/$projectId" });
  const projectQ = useQuery({ queryKey: ["project", projectId], queryFn: () => getProject(projectId) });
  const tasksQ = useQuery({ queryKey: ["tasks", projectId], queryFn: () => listTasks(projectId) });

  if (projectQ.isLoading) return <div className="glass h-40 animate-pulse rounded-2xl" />;
  if (!projectQ.data) {
    return (
      <div className="glass rounded-3xl p-10 text-center">
        <h1 className="text-xl font-semibold">Project not found</h1>
        <Link to="/projects" className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to projects
        </Link>
      </div>
    );
  }

  const p = projectQ.data;
  const tasks = tasksQ.data ?? [];

  return (
    <div className="space-y-6">
      <Link to="/projects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All projects
      </Link>

      <div className="glass rounded-3xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 shrink-0 rounded-2xl shadow-elevated" style={{ background: `linear-gradient(135deg, ${p.color}, ${p.color}aa)` }} />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{p.title}</h1>
              {p.description && <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="rounded-full bg-muted/60 px-2 py-0.5 capitalize">{p.priority} priority</span>
                {p.deadline && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {format(new Date(p.deadline), "MMM d, yyyy")}
                  </span>
                )}
                <span>{tasks.length} tasks</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <KanbanBoard projectId={projectId} tasks={tasks} isLoading={tasksQ.isLoading} />
    </div>
  );
}
