import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, GripVertical, Trash2, Calendar } from "lucide-react";
import { createTask, deleteTask, updateTask, STATUS_LABELS, TASK_STATUSES, type Task, type TaskStatus } from "@/lib/api";
import { format } from "date-fns";

export function KanbanBoard({ projectId, tasks, isLoading }: { projectId?: string; tasks: Task[]; isLoading: boolean }) {
  const qc = useQueryClient();
  const [dragId, setDragId] = useState<string | null>(null);

  const updateMut = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Task> }) => updateTask(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["tasks", projectId] });
      toast.success("Task deleted");
    },
  });

  function onDrop(status: TaskStatus) {
    if (!dragId) return;
    const task = tasks.find((t) => t.id === dragId);
    if (!task || task.status === status) { setDragId(null); return; }
    updateMut.mutate({
      id: dragId,
      patch: { status, completed_at: status === "done" ? new Date().toISOString() : null },
    });
    setDragId(null);
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {TASK_STATUSES.map((s) => (
          <div key={s} className="glass h-96 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {TASK_STATUSES.map((status) => {
        const cards = tasks.filter((t) => t.status === status);
        return (
          <div
            key={status}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(status)}
            className="flex min-h-96 flex-col rounded-2xl glass p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${statusDot(status)}`} />
                <h3 className="text-sm font-semibold">{STATUS_LABELS[status]}</h3>
                <span className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{cards.length}</span>
              </div>
              <AddTaskInline projectId={projectId} status={status} />
            </div>

            <div className="flex-1 space-y-2 scrollbar-thin overflow-y-auto">
              {cards.map((t) => (
                <div
                  key={t.id}
                  draggable
                  onDragStart={() => setDragId(t.id)}
                  onDragEnd={() => setDragId(null)}
                  className={`group cursor-grab rounded-xl border border-border bg-card/70 p-3 shadow-sm transition hover:shadow-elevated active:cursor-grabbing ${dragId === t.id ? "opacity-40" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{t.title}</div>
                      {t.description && <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{t.description}</div>}
                      <div className="mt-2 flex items-center gap-2 text-[10px]">
                        <span className={`rounded-full px-2 py-0.5 font-semibold uppercase ${priorityCls(t.priority)}`}>{t.priority}</span>
                        {t.deadline && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3 w-3" /> {format(new Date(t.deadline), "MMM d")}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteMut.mutate(t.id)}
                      className="rounded p-1 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-destructive/15 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {cards.length === 0 && (
                <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  Drop tasks here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AddTaskInline({ projectId, status }: { projectId?: string; status: TaskStatus }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: () => createTask({ title, status, priority, project_id: projectId ?? null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["tasks", projectId] });
      setTitle("");
      setOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="rounded-lg p-1 text-muted-foreground transition hover:bg-accent/20 hover:text-foreground">
        <Plus className="h-4 w-4" />
      </button>
    );
  }
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (title.trim()) mut.mutate(); }}
      className="absolute inset-x-0 top-full z-10 mt-1 rounded-xl border border-border bg-popover p-2 shadow-elevated"
    >
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        placeholder="Task title..."
        className="w-full rounded-lg bg-transparent p-1.5 text-sm outline-none"
      />
      <div className="mt-1 flex items-center gap-1">
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="flex-1 rounded-md bg-muted/60 p-1 text-xs outline-none">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button type="submit" className="rounded-md gradient-primary px-2 py-1 text-xs font-semibold text-primary-foreground">Add</button>
      </div>
    </form>
  );
}

function statusDot(s: TaskStatus) {
  return {
    todo: "bg-[color:var(--accent)]",
    in_progress: "bg-primary",
    review: "bg-secondary",
    done: "bg-[color:var(--success)]",
  }[s];
}

function priorityCls(p: string) {
  return {
    low: "bg-[color:var(--accent)]/15 text-[color:var(--accent)]",
    medium: "bg-[color:var(--warning)]/15 text-[color:var(--warning)]",
    high: "bg-destructive/15 text-destructive",
  }[p] ?? "bg-muted text-muted-foreground";
}
