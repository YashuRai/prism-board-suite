import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyProfile, updateMyProfile } from "@/lib/api";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { User } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Prism" },
      { name: "description", content: "Manage your Prism profile, bio and avatar." },
      { property: "og:title", content: "Profile — Prism" },
      { property: "og:description", content: "Manage your Prism profile." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const profQ = useQuery({ queryKey: ["profile"], queryFn: getMyProfile });

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    if (profQ.data) {
      setFullName(profQ.data.full_name ?? "");
      setBio(profQ.data.bio ?? "");
      setAvatarUrl(profQ.data.avatar_url ?? "");
    }
  }, [profQ.data]);

  const mut = useMutation({
    mutationFn: () => updateMyProfile({ full_name: fullName, bio, avatar_url: avatarUrl || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const initials = (fullName || user?.email || "U").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">How you show up in Prism.</p>
      </div>

      <div className="glass rounded-3xl p-6">
        <div className="mb-6 flex items-center gap-4">
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="h-20 w-20 rounded-2xl object-cover shadow-elevated" />
          ) : (
            <div className="grid h-20 w-20 place-items-center rounded-2xl gradient-primary text-xl font-bold text-primary-foreground shadow-elevated">
              {initials}
            </div>
          )}
          <div>
            <div className="font-semibold">{fullName || user?.email}</div>
            <div className="text-sm text-muted-foreground">{user?.email}</div>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-4">
          <Field label="Full name" value={fullName} onChange={setFullName} />
          <Field label="Avatar URL" value={avatarUrl} onChange={setAvatarUrl} placeholder="https://..." />
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="Tell us about yourself..."
              className="w-full rounded-xl border border-border bg-input/40 p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button type="submit" disabled={mut.isPending} className="rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-elevated hover:opacity-90 disabled:opacity-50">
            {mut.isPending ? "Saving..." : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-input/40 p-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}
