import { corStatus, rotuloStatus, type StatusVisual } from "@/lib/status";

const DOT_CLASS: Record<"ok" | "warn" | "late", string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  late: "bg-late",
};

export function PillStatus({
  status,
  diasEmAtraso,
}: {
  status: StatusVisual;
  diasEmAtraso?: number | null;
}) {
  const cor = corStatus(status);
  return (
    <span className={`pill pill-${cor}`}>
      <span className={`pill-dot ${DOT_CLASS[cor]}`} />
      {rotuloStatus(status, diasEmAtraso)}
    </span>
  );
}
