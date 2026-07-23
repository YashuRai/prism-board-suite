import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { Moon, Sun, Monitor, LogOut, Bell, Shield } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Prism" },
      { name: "description", content: "Configure your Prism experience — theme, notifications and security." },
      { property: "og:title", content: "Settings — Prism" },
      { property: "og:description", content: "Configure your Prism experience." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const router = useRouter();
  const qc = useQueryClient();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.invalidate();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tune Prism to your workflow.</p>
      </div>

      <Section title="Appearance" icon={Monitor}>
        <div className="grid grid-cols-2 gap-3">
          <ThemeOption current={theme} value="light" onSelect={setTheme} icon={Sun} label="Light" />
          <ThemeOption current={theme} value="dark" onSelect={setTheme} icon={Moon} label="Dark" />
        </div>
      </Section>

      <Section title="Notifications" icon={Bell}>
        <Toggle label="Email notifications" defaultChecked />
        <Toggle label="Deadline alerts" defaultChecked />
        <Toggle label="Weekly summary" />
      </Section>

      <Section title="Security" icon={Shield}>
        <p className="text-sm text-muted-foreground">Signed in via Lovable Cloud auth. Password reset and 2FA available in the Cloud dashboard.</p>
      </Section>

      <Section title="Account" icon={LogOut}>
        <button onClick={signOut} className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-destructive transition hover:bg-destructive/15">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </Section>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Sun; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function ThemeOption({ current, value, onSelect, icon: Icon, label }: { current: string; value: "light" | "dark"; onSelect: (v: "light" | "dark") => void; icon: typeof Sun; label: string }) {
  const active = current === value;
  return (
    <button
      onClick={() => onSelect(value)}
      className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition ${active ? "border-primary bg-primary/10 shadow-elevated" : "border-border hover:bg-accent/20"}`}
    >
      <Icon className="h-5 w-5" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function Toggle({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
      <span className="text-sm">{label}</span>
      <input type="checkbox" defaultChecked={defaultChecked} className="h-5 w-9 cursor-pointer appearance-none rounded-full bg-muted transition checked:bg-primary relative before:absolute before:left-0.5 before:top-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-transform before:content-[''] checked:before:translate-x-4" />
    </label>
  );
}
