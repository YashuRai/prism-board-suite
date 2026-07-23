import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listProjects, listTasks, createProject, deleteProject } from "@/lib/api";
import { Plus, Search, FolderKanban, Trash2, Calendar, MoreVertical } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

const COLORS = ["#4F46E5", "#8B5CF6", "#06B6D4", "#22C55E", "#EF4444", "#F59E0B", "#EC4899"];

export const Route = createFileRoute("/_authenticated/projects")({
  head: () => ({
    meta: [
      { title: "Projects — Prism" },
      { name: "description", content: "Create, organize and manage your projects." },
      { property: "og:title", content: "Projects — Prism" },
      { property: "og:description", content: "Create, organize and manage your projects." },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const qc = useQueryClient();

  const projectsQ = useQuery({ queryKey: ["projects"], queryFn: () => listProjects() });
  const tasksQ = useQuery({ queryKey: ["tasks"], queryFn: () => listTasks() });

  const delMut = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Project deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = (projectsQ.data ?? []).filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">{projectsQ.data?.length ?? 0} projects</p>
        </div>
        <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-elevated transition hover:opacity-90">
          <Plus className="h-4 w-4" /> New project
        </button>
      </div>

      <div className="glass flex items-center gap-2 rounded-2xl px-4 py-2.5">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {projectsQ.isLoading ? (
        <SkeletonGrid />
      ) : filtered.length === 0 ? (
        <EmptyState onCreate={() => setShowNew(true)} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const projectTasks = (tasksQ.data ?? []).filter((t) => t.project_id === p.id);
            const doneCount = projectTasks.filter((t) => t.status === "done").length;
            const pct = projectTasks.length === 0 ? 0 : Math.round((doneCount / projectTasks.length) * 100);
            return (
              <div key={p.id} className="group glass rounded-2xl p-5 transition hover:-translate-y-1 hover:shadow-elevated">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <Link to="/projects/$projectId" params={{ projectId: p.id }} className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-xl" style={{ background: `linear-gradient(135deg, ${p.color}, ${p.color}88)` }} />
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">{p.title}</h3>
                      <p className="text-xs text-muted-foreground capitalize">{p.priority} priority</p>
                    </div>
                  </Link>
                  <button
                    onClick={() => confirm("Delete this project and all its tasks?") && delMut.mutate(p.id)}
                    className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-destructive/15 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {p.description && <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>}
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{projectTasks.length} tasks</span>
                  <span className="font-semibold">{pct}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full gradient-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
                {p.deadline && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" /> {format(new Date(p.deadline), "MMM d, yyyy")}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showNew && <NewProjectDialog onClose={() => setShowNew(false)} />}
    </div>
  );
}

function NewProjectDialog({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [priority, setPriority] = useState("medium");
  const [deadline, setDeadline] = useState("");
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: () => createProject({ title, description: description || null, color, priority, deadline: deadline || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-4 animate-in fade-in" onClick={onClose}>
      <div className="glass-strong w-full max-w-md rounded-3xl p-6 shadow-elevated animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold">Create project</h2>
        <form onSubmit={(e) => { e.preventDefault(); if (!title.trim()) return; mut.mutate(); }} className="mt-5 space-y-4">
          <Input label="Title" value={title} onChange={setTitle} required autoFocus />
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border bg-input/40 p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Color</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full ring-offset-2 ring-offset-background transition ${color === c ? "ring-2 ring-foreground" : ""}`}
                  style={{ background: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full rounded-xl border border-border bg-input/40 p-2.5 text-sm outline-none focus:border-primary">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <Input label="Deadline" type="date" value={deadline} onChange={setDeadline} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-medium hover:bg-accent/20">Cancel</button>
            <button type="submit" disabled={mut.isPending} className="rounded-xl gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-elevated hover:opacity-90 disabled:opacity-50">
              {mut.isPending ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", ...rest }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; autoFocus?: boolean }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
        className="w-full rounded-xl border border-border bg-input/40 p-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="glass flex flex-col items-center justify-center rounded-3xl p-16 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl gradient-primary text-primary-foreground shadow-elevated">
        <FolderKanban className="h-7 w-7" />
      </div>
      <h3 className="mt-5 text-lg font-semibold">No projects yet</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">Create your first project to start organizing your work.</p>
      <button onClick={onCreate} className="mt-6 inline-flex items-center gap-2 rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-elevated hover:opacity-90">
        <Plus className="h-4 w-4" /> New project
      </button>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="glass h-44 animate-pulse rounded-2xl" />
      ))}
    </div>
  );
}
