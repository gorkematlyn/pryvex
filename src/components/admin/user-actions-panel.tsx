"use client";

import { useState } from "react";
import {
  sendUserPasswordReset,
  sendUserNotification,
  changeUserRole,
} from "@/app/admin/users/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card, FieldError } from "@/components/ui/card";
import type { NotificationLevel, UserRole } from "@/lib/db/types";

export function UserActionsPanel({
  userId,
  email,
  role,
  canChangeRole,
}: {
  userId: string;
  email: string;
  role: UserRole;
  canChangeRole: boolean;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [level, setLevel] = useState<NotificationLevel>("info");
  const [nextRole, setNextRole] = useState<UserRole>(role);
  const [pending, setPending] = useState<string | null>(null);
  const [result, setResult] = useState<{ error?: string; success?: string }>({});

  async function run(key: string, fn: () => Promise<{ error?: string; success?: string }>) {
    setPending(key);
    setResult({});
    setResult(await fn());
    setPending(null);
  }

  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-alloy">Actions</h2>

      <div className="mt-4 space-y-5">
        <div>
          <p className="text-xs font-medium text-alloy-dim">Password</p>
          <p className="mt-1 text-xs text-alloy-faint">
            Sends a one-hour reset link to {email}. Their current password keeps working until they
            use it.
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-2"
            disabled={pending !== null}
            onClick={() => run("reset", () => sendUserPasswordReset(userId))}
          >
            {pending === "reset" ? "Sending…" : "Send password reset"}
          </Button>
        </div>

        <div className="border-t border-border-soft pt-4">
          <p className="text-xs font-medium text-alloy-dim">Send a notification</p>
          <div className="mt-2 space-y-2.5">
            <div>
              <Label htmlFor="note-title">Title</Label>
              <Input
                id="note-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="About your account"
                maxLength={120}
              />
            </div>
            <div>
              <Label htmlFor="note-body">Message</Label>
              <Textarea
                id="note-body"
                rows={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="What should they know?"
                maxLength={1000}
              />
            </div>
            <div>
              <Label htmlFor="note-level">Level</Label>
              <Select
                id="note-level"
                value={level}
                onChange={(e) => setLevel(e.target.value as NotificationLevel)}
              >
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </Select>
            </div>
            <Button
              variant="secondary"
              size="sm"
              disabled={pending !== null || !title.trim() || !body.trim()}
              onClick={() =>
                run("notify", async () => {
                  const response = await sendUserNotification({ userId, title, body, level });
                  if (response.success) {
                    setTitle("");
                    setBody("");
                  }
                  return response;
                })
              }
            >
              {pending === "notify" ? "Sending…" : "Send notification"}
            </Button>
          </div>
        </div>

        {canChangeRole && (
          <div className="border-t border-border-soft pt-4">
            <p className="text-xs font-medium text-alloy-dim">Role</p>
            <p className="mt-1 text-xs text-alloy-faint">
              Admins reach the panel; super admins can additionally edit plans, roles and payment
              credentials.
            </p>
            <div className="mt-2 flex gap-2">
              <Select
                value={nextRole}
                onChange={(e) => setNextRole(e.target.value as UserRole)}
                aria-label="Role"
                className="max-w-[200px]"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super admin</option>
              </Select>
              <Button
                variant="secondary"
                size="sm"
                disabled={pending !== null || nextRole === role}
                onClick={() => run("role", () => changeUserRole(userId, nextRole))}
              >
                {pending === "role" ? "Saving…" : "Update role"}
              </Button>
            </div>
          </div>
        )}
      </div>

      <FieldError>{result.error}</FieldError>
      {result.success && <p className="mt-3 text-xs text-electric">{result.success}</p>}
    </Card>
  );
}
