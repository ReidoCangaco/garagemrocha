import { corStatus, rotuloPrazo, rotuloStatus, type StatusVisual } from "@/lib/status";

const DOT_CLASS: Record<"ok" | "warn" | "late", string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  late: "bg-late",
};

export function PillStatus({
  status,
  diasEmAtraso,
  dataVencimento,
}: {
  status: StatusVisual;
  diasEmAtraso?: number | null;
  dataVencimento?: string | null;
}) {
  const prazo = rotuloPrazo(status, dataVencimento);
  const cor = prazo && status !== "vence_hoje" ? "warn" : corStatus(status);
  return (
    <span className={`pill pill-${cor}`}>
      <span className={`pill-dot ${DOT_CLASS[cor]}`} />
      {prazo ?? rotuloStatus(status, diasEmAtraso)}
    </span>
  );
}
