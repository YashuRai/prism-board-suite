import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listTasks } from "@/lib/api";
import { KanbanBoard } from "@/components/KanbanBoard";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — Prism" },
      { name: "description", content: "All your tasks across every project in one kanban view." },
      { property: "og:title", content: "Tasks — Prism" },
      { property: "og:description", content: "All your tasks across every project in one kanban view." },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  const tasksQ = useQuery({ queryKey: ["tasks"], queryFn: () => listTasks() });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">All Tasks</h1>
        <p className="mt-1 text-sm text-muted-foreground">Drag tasks between columns to update status.</p>
      </div>
      <KanbanBoard tasks={tasksQ.data ?? []} isLoading={tasksQ.isLoading} />
    </div>
  );
}
