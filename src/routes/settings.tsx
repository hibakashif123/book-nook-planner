import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Profile } from "@/lib/books";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Profile settings — BookTok" },
      { name: "description", content: "Update your BookTok username, display name, bio and avatar." },
      { property: "og:title", content: "Profile settings — BookTok" },
      { property: "og:description", content: "Manage how other readers see you." },
    ],
  }),
  component: SettingsPage,
});

const schema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers and underscores only"),
  displayName: z.string().trim().max(60),
  bio: z.string().trim().max(300),
  avatarUrl: z.string().trim().url("Avatar must be a valid URL").max(500).or(z.literal("")),
});

function SettingsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user]);

  const profileQuery = useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });

  const [form, setForm] = useState({ username: "", displayName: "", bio: "", avatarUrl: "" });

  useEffect(() => {
    if (profileQuery.data) {
      setForm({
        username: profileQuery.data.username ?? "",
        displayName: profileQuery.data.display_name ?? "",
        bio: profileQuery.data.bio ?? "",
        avatarUrl: profileQuery.data.avatar_url ?? "",
      });
    }
  }, [profileQuery.data?.id]);

  const save = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Check the form.");
      const { error } = await supabase
        .from("profiles")
        .update({
          username: parsed.data.username,
          display_name: parsed.data.displayName || null,
          bio: parsed.data.bio || null,
          avatar_url: parsed.data.avatarUrl || null,
        })
        .eq("id", user!.id);
      if (error) {
        throw new Error(
          error.code === "23505" ? "That username is already taken." : error.message,
        );
      }
      return parsed.data.username;
    },
    onSuccess: (username) => {
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      toast.success("Profile saved");
      navigate({ to: "/u/$username", params: { username } });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!user) return null;
  if (profileQuery.isLoading) return <Skeleton className="mx-auto mt-12 h-64 max-w-md" />;

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-4xl">Profile settings</h1>
      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <div className="grid gap-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            maxLength={30}
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="displayName">Display name</Label>
          <Input
            id="displayName"
            maxLength={60}
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="avatarUrl">Avatar image URL</Label>
          <Input
            id="avatarUrl"
            maxLength={500}
            value={form.avatarUrl}
            onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            maxLength={300}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </div>
        <Button type="submit" disabled={save.isPending}>
          Save profile
        </Button>
      </form>
    </div>
  );
}
