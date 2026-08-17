"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { deleteQrCode } from "@/app/dashboard/qr/actions";
import { generateQrDataUrl, DEFAULT_QR_STYLE } from "@/lib/domain/qr";

export interface QrListItem {
  id: string;
  label: string | null;
  target_type: string;
  url: string;
}

export function QrList({ items }: { items: QrListItem[] }) {
  if (items.length === 0) {
    return <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-alloy-faint">No QR codes yet.</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <QrCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function QrCard({ item }: { item: QrListItem }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    generateQrDataUrl(item.url, DEFAULT_QR_STYLE).then(setDataUrl).catch(() => setDataUrl(null));
  }, [item.url]);

  async function handleDelete() {
    if (!confirm("Delete this QR code?")) return;
    await deleteQrCode(item.id);
    router.refresh();
  }

  return (
    <Card className="flex items-center gap-3 p-3">
      <div className="rounded-lg bg-white p-1.5">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt="" className="h-16 w-16" />
        ) : (
          <div className="h-16 w-16 animate-pulse bg-shadow-raised" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-alloy">{item.label || item.target_type.replace("_", " ")}</p>
        <p className="truncate text-[11px] text-alloy-faint">{item.url}</p>
        <div className="mt-2 flex gap-2">
          <CopyButton value={item.url} />
          <button onClick={handleDelete} className="text-xs text-alloy-faint hover:text-red-400">
            Delete
          </button>
        </div>
      </div>
    </Card>
  );
}
