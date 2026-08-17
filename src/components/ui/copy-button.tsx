"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyButton({ value, size = "sm" }: { value: string; size?: "sm" | "md" }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard unavailable — no-op
    }
  }

  return (
    <Button variant="secondary" size={size} onClick={copy}>
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}
