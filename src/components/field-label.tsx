import { Label } from "@/components/ui/label";

export function FieldLabel({ label, helper }: { label: string; helper?: string }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {helper ? <p className="text-xs text-[color:var(--muted)]">{helper}</p> : null}
    </div>
  );
}
