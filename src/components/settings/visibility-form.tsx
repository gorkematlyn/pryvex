"use client";

import { useState } from "react";
import { updateVisibility } from "@/app/dashboard/settings/actions";
import { Button } from "@/components/ui/button";
import { Card, FieldError } from "@/components/ui/card";
import type { UserSettingsRow } from "@/lib/db/types";

export function VisibilityForm({
  settings,
  username,
}: {
  settings: UserSettingsRow;
  username: string;
}) {
  const [searchVisible, setSearchVisible] = useState(settings.search_engine_visible);
  const [llmVisible, setLlmVisible] = useState(settings.llm_visible);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved">("idle");
  const [error, setError] = useState<string | undefined>();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(undefined);

    const result = await updateVisibility({
      search_engine_visible: searchVisible,
      llm_visible: llmVisible,
    });
    setPending(false);

    if (result?.error) {
      setError(result.error);
      return;
    }
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 1500);
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-alloy">Discoverability</h2>
        {status === "saved" && <span className="text-xs text-electric">Saved</span>}
      </div>
      <p className="mt-1 text-xs text-alloy-dim">
        Controls how pryvex.com/{username} may be indexed. Both are on by default.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <label className="flex items-start gap-3 text-sm text-alloy">
          <input
            type="checkbox"
            checked={searchVisible}
            onChange={(e) => setSearchVisible(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border accent-electric"
          />
          <span>
            Allow search engines
            <span className="mt-0.5 block text-xs text-alloy-faint">
              Lets Google, Bing and others index your public page so it can appear in results.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3 text-sm text-alloy">
          <input
            type="checkbox"
            checked={llmVisible}
            onChange={(e) => setLlmVisible(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border accent-electric"
          />
          <span>
            Allow AI crawlers
            <span className="mt-0.5 block text-xs text-alloy-faint">
              Lets AI assistants read and cite your page. Turning this off sends a noai directive
              and blocks known AI crawlers — this is a request that well-behaved crawlers honour,
              not an enforceable block.
            </span>
          </span>
        </label>

        <FieldError>{error}</FieldError>

        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </form>
    </Card>
  );
}
