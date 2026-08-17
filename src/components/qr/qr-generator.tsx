"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, FieldError } from "@/components/ui/card";
import { createQrCode } from "@/app/dashboard/qr/actions";
import { generateQrDataUrl, generateQrSvg, DEFAULT_QR_STYLE, type QrStyle } from "@/lib/domain/qr";

type TargetType = "profile" | "link" | "short_link" | "custom";

export function QrGenerator({
  appUrl,
  username,
  links,
  shortLinks,
  defaultTarget,
  defaultId,
}: {
  appUrl: string;
  username: string;
  links: { id: string; title: string }[];
  shortLinks: { id: string; slug: string }[];
  defaultTarget?: TargetType;
  defaultId?: string;
}) {
  const [targetType, setTargetType] = useState<TargetType>(defaultTarget ?? "profile");
  const [targetLinkId, setTargetLinkId] = useState(defaultTarget === "link" ? defaultId ?? links[0]?.id ?? "" : links[0]?.id ?? "");
  const [targetShortLinkId, setTargetShortLinkId] = useState(
    defaultTarget === "short_link" ? defaultId ?? shortLinks[0]?.id ?? "" : shortLinks[0]?.id ?? "",
  );
  const [customUrl, setCustomUrl] = useState("");
  const [label, setLabel] = useState("");
  const [style, setStyle] = useState<QrStyle>(DEFAULT_QR_STYLE);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const previewUrl = useMemo(() => {
    let url = `${appUrl}/${username}`;
    if (targetType === "link" && targetLinkId) url = `${appUrl}/go/${targetLinkId}`;
    if (targetType === "short_link" && targetShortLinkId) {
      const sl = shortLinks.find((s) => s.id === targetShortLinkId);
      url = sl ? `${appUrl}/s/${sl.slug}` : url;
    }
    if (targetType === "custom") url = customUrl || "";
    return url;
  }, [targetType, targetLinkId, targetShortLinkId, customUrl, appUrl, username, shortLinks]);

  useEffect(() => {
    let cancelled = false;
    if (!previewUrl) {
      Promise.resolve().then(() => {
        if (!cancelled) {
          setDataUrl(null);
          setSvg(null);
        }
      });
      return () => {
        cancelled = true;
      };
    }
    generateQrDataUrl(previewUrl, style).then((url) => !cancelled && setDataUrl(url)).catch(() => !cancelled && setDataUrl(null));
    generateQrSvg(previewUrl, style).then((s) => !cancelled && setSvg(s)).catch(() => !cancelled && setSvg(null));
    return () => {
      cancelled = true;
    };
  }, [previewUrl, style]);

  const lowContrast = contrastRatio(style.foreground, style.background) < 2.5;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(undefined);
    const result = await createQrCode({
      target_type: targetType,
      target_link_id: targetType === "link" ? targetLinkId : undefined,
      target_short_link_id: targetType === "short_link" ? targetShortLinkId : undefined,
      custom_url: targetType === "custom" ? customUrl : undefined,
      label: label || undefined,
    });
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setLabel("");
    router.refresh();
  }

  function download(kind: "png" | "svg") {
    if (kind === "png" && dataUrl) {
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `pryvex-qr-${label || "code"}.png`;
      a.click();
    }
    if (kind === "svg" && svg) {
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pryvex-qr-${label || "code"}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-alloy">Generate a QR code</h2>
      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_220px]">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <Label htmlFor="target_type">Points to</Label>
            <select
              id="target_type"
              value={targetType}
              onChange={(e) => setTargetType(e.target.value as TargetType)}
              className="w-full rounded-lg border border-border bg-shadow-raised px-3.5 py-2.5 text-sm text-alloy outline-none focus:border-electric focus:ring-1 focus:ring-electric"
            >
              <option value="profile">My Pryvex profile</option>
              <option value="link" disabled={links.length === 0}>
                A link-in-bio link
              </option>
              <option value="short_link" disabled={shortLinks.length === 0}>
                A short link
              </option>
              <option value="custom">Custom URL</option>
            </select>
          </div>

          {targetType === "link" && (
            <select
              value={targetLinkId}
              onChange={(e) => setTargetLinkId(e.target.value)}
              className="w-full rounded-lg border border-border bg-shadow-raised px-3.5 py-2.5 text-sm text-alloy outline-none"
            >
              {links.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
          )}

          {targetType === "short_link" && (
            <select
              value={targetShortLinkId}
              onChange={(e) => setTargetShortLinkId(e.target.value)}
              className="w-full rounded-lg border border-border bg-shadow-raised px-3.5 py-2.5 text-sm text-alloy outline-none"
            >
              {shortLinks.map((s) => (
                <option key={s.id} value={s.id}>
                  /s/{s.slug}
                </option>
              ))}
            </select>
          )}

          {targetType === "custom" && (
            <Input type="url" required value={customUrl} onChange={(e) => setCustomUrl(e.target.value)} placeholder="https://example.com" />
          )}

          <div>
            <Label htmlFor="label">Label</Label>
            <Input id="label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Business card" maxLength={80} />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <Label htmlFor="fg">Foreground</Label>
              <input id="fg" type="color" value={style.foreground} onChange={(e) => setStyle((s) => ({ ...s, foreground: e.target.value }))} className="h-10 w-full rounded-lg border border-border bg-shadow-raised" />
            </div>
            <div>
              <Label htmlFor="bg">Background</Label>
              <input id="bg" type="color" value={style.background} onChange={(e) => setStyle((s) => ({ ...s, background: e.target.value }))} className="h-10 w-full rounded-lg border border-border bg-shadow-raised" />
            </div>
            <div>
              <Label htmlFor="margin">Margin</Label>
              <Input id="margin" type="number" min={0} max={8} value={style.margin} onChange={(e) => setStyle((s) => ({ ...s, margin: Number(e.target.value) }))} />
            </div>
            <div>
              <Label htmlFor="ec">Error correction</Label>
              <select
                id="ec"
                value={style.errorCorrection}
                onChange={(e) => setStyle((s) => ({ ...s, errorCorrection: e.target.value as QrStyle["errorCorrection"] }))}
                className="w-full rounded-lg border border-border bg-shadow-raised px-3 py-2.5 text-sm text-alloy outline-none"
              >
                <option value="L">Low</option>
                <option value="M">Medium</option>
                <option value="Q">Quartile</option>
                <option value="H">High</option>
              </select>
            </div>
          </div>

          {lowContrast && (
            <p className="text-xs text-amber-400">Low contrast between colors may make this QR code unreliable to scan.</p>
          )}

          <FieldError>{error}</FieldError>

          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save QR code"}
          </Button>
        </form>

        <div className="flex flex-col items-center gap-3">
          <div className="rounded-xl border border-border p-3" style={{ background: style.background }}>
            {dataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dataUrl} alt="QR code preview" className="h-40 w-40" />
            ) : (
              <div className="h-40 w-40 animate-pulse rounded-lg bg-shadow-raised" />
            )}
          </div>
          <p className="max-w-[200px] truncate text-center text-[11px] text-alloy-faint">{previewUrl}</p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => download("png")} disabled={!dataUrl}>
              PNG
            </Button>
            <Button variant="secondary" size="sm" onClick={() => download("svg")} disabled={!svg}>
              SVG
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance(hex: string): number {
  const rgb = hex
    .replace("#", "")
    .match(/.{2}/g)
    ?.map((c) => parseInt(c, 16) / 255) ?? [0, 0, 0];
  const [r, g, b] = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
