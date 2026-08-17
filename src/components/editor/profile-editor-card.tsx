"use client";

import { useState } from "react";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import type { ProfileRow } from "@/lib/db/types";

type Profile = ProfileRow;

export function ProfileEditorCard({
  profile,
  onSave,
}: {
  profile: Profile;
  onSave: (values: { display_name: string; bio: string; avatar_url: string }) => void;
}) {
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [status, setStatus] = useState<"idle" | "saved">("idle");

  function commit() {
    onSave({ display_name: displayName, bio, avatar_url: avatarUrl });
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 1500);
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-alloy">Profile</h2>
        {status === "saved" && <span className="text-xs text-electric">Saved</span>}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="display_name">Display name</Label>
          <Input
            id="display_name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            onBlur={commit}
            maxLength={80}
            placeholder={profile.username}
          />
        </div>
        <div>
          <Label htmlFor="avatar_url">Avatar URL</Label>
          <Input
            id="avatar_url"
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            onBlur={commit}
            placeholder="https://…"
          />
        </div>
      </div>
      <div className="mt-4">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" rows={3} maxLength={280} value={bio} onChange={(e) => setBio(e.target.value)} onBlur={commit} placeholder="Tell people what you do" />
      </div>
    </Card>
  );
}
