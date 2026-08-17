import { Card } from "@/components/ui/card";

export function StatTile({ label, value, sublabel }: { label: string; value: string | number; sublabel?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-alloy-dim">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-alloy">{value}</p>
      {sublabel && <p className="mt-1 text-xs text-alloy-faint">{sublabel}</p>}
    </Card>
  );
}
