import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Project = Tables<"projects">;
export type Task = Tables<"tasks">;
export type Profile = Tables<"profiles">;

export const TASK_STATUSES = ["todo", "in_progress", "review", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  done: "Completed",
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: "oklch(0.72 0.14 210)",
  medium: "oklch(0.78 0.17 75)",
  high: "oklch(0.63 0.24 27)",
};

// Projects
export async function listProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createProject(input: Omit<TablesInsert<"projects">, "owner_id">) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("projects")
    .insert({ ...input, owner_id: u.user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProject(id: string, patch: TablesUpdate<"projects">) {
  const { data, error } = await supabase.from("projects").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteProject(id: string) {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

// Tasks
export async function listTasks(projectId?: string): Promise<Task[]> {
  let q = supabase.from("tasks").select("*").order("position", { ascending: true });
  if (projectId) q = q.eq("project_id", projectId);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function createTask(input: Omit<TablesInsert<"tasks">, "owner_id">) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("tasks")
    .insert({ ...input, owner_id: u.user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTask(id: string, patch: TablesUpdate<"tasks">) {
  const { data, error } = await supabase.from("tasks").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

// Profile
export async function getMyProfile(): Promise<Profile | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateMyProfile(patch: TablesUpdate<"profiles">) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not authenticated");
  const { data, error } = await supabase.from("profiles").update(patch).eq("id", u.user.id).select().single();
  if (error) throw error;
  return data;
}
