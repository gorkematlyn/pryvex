"use client";

import { useState } from "react";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { LinkForm, type LinkFormValues } from "./link-form";
import { LinkList } from "./link-list";
import { ProfileEditorCard } from "./profile-editor-card";
import { PhoneFrame } from "@/components/bio/phone-frame";
import { ProfilePreview } from "@/components/bio/profile-preview";
import { createLink, updateLink, deleteLink, duplicateLink, toggleLink, reorderLinks, updateProfile } from "@/app/dashboard/actions";
import type { LinkRow, ProfileRow } from "@/lib/db/types";

type Profile = ProfileRow;

export function EditorShell({ initialLinks, profile }: { initialLinks: LinkRow[]; profile: Profile }) {
  const [links, setLinks] = useState(initialLinks);
  const [previewProfile, setPreviewProfile] = useState(profile);
  const [adding, setAdding] = useState(false);
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");

  async function handleCreate(values: LinkFormValues) {
    const tempId = `temp-${nanoid(8)}`;
    const optimistic: LinkRow = {
      id: tempId,
      bio_page_id: "",
      profile_id: profile.id,
      block_type: "link",
      title: values.title,
      url: values.url,
      emoji: values.emoji || null,
      icon: values.icon || null,
      thumbnail_url: values.thumbnail_url || null,
      style: {},
      utm_overrides: {},
      position: links.length,
      is_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setLinks((prev) => [...prev, optimistic]);

    const result = await createLink(values);
    if (result?.error) {
      setLinks((prev) => prev.filter((l) => l.id !== tempId));
      return result.error;
    }
    if (result?.data) {
      setLinks((prev) => prev.map((l) => (l.id === tempId ? (result.data as LinkRow) : l)));
    }
    setAdding(false);
  }

  async function handleUpdate(id: string, values: LinkFormValues) {
    const prevLinks = links;
    setLinks((prev) =>
      prev.map((l) =>
        l.id === id
          ? { ...l, title: values.title, url: values.url, emoji: values.emoji || null, icon: values.icon || null, thumbnail_url: values.thumbnail_url || null }
          : l,
      ),
    );
    const result = await updateLink(id, values);
    if (result?.error) {
      setLinks(prevLinks);
      return result.error;
    }
  }

  async function handleDelete(id: string) {
    const prevLinks = links;
    setLinks((prev) => prev.filter((l) => l.id !== id));
    const result = await deleteLink(id);
    if (result?.error) setLinks(prevLinks);
  }

  async function handleDuplicate(id: string) {
    const result = await duplicateLink(id);
    if (result?.data) setLinks((prev) => [...prev, result.data as LinkRow]);
  }

  async function handleToggle(id: string, enabled: boolean) {
    const prevLinks = links;
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, is_enabled: enabled } : l)));
    const result = await toggleLink(id, enabled);
    if (result?.error) setLinks(prevLinks);
  }

  function handleReorder(orderedIds: string[]) {
    const prevLinks = links;
    const byId = new Map(links.map((l) => [l.id, l]));
    setLinks(orderedIds.map((id, i) => ({ ...byId.get(id)!, position: i })));
    reorderLinks(orderedIds).then((result) => {
      if (result?.error) setLinks(prevLinks);
    });
  }

  function handleProfileSave(values: { display_name: string; bio: string; avatar_url: string }) {
    setPreviewProfile((p) => ({ ...p, ...values }));
    updateProfile(values);
  }

  const sortedLinks = [...links].sort((a, b) => a.position - b.position);

  return (
    <div>
      <div className="mb-4 flex gap-2 md:hidden">
        <Button
          variant={mobileView === "edit" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setMobileView("edit")}
        >
          Edit
        </Button>
        <Button
          variant={mobileView === "preview" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setMobileView("preview")}
        >
          Preview
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className={mobileView === "preview" ? "hidden md:block" : "space-y-4"}>
          <ProfileEditorCard profile={profile} onSave={handleProfileSave} />

          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-alloy">Links</h2>
            {!adding && (
              <Button size="sm" onClick={() => setAdding(true)}>
                + Add link
              </Button>
            )}
          </div>

          {adding && <LinkForm onSubmit={handleCreate} onCancel={() => setAdding(false)} />}

          <LinkList
            links={sortedLinks}
            onReorder={handleReorder}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onToggle={handleToggle}
          />
        </div>

        <div className={mobileView === "edit" ? "hidden md:block" : ""}>
          <div className="sticky top-6">
            <PhoneFrame>
              <ProfilePreview profile={previewProfile} links={sortedLinks} linkHrefFor={() => "#"} />
            </PhoneFrame>
          </div>
        </div>
      </div>
    </div>
  );
}
