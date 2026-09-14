export type StatusVisual =
  | "pago"
  | "cancelado"
  | "atrasado"
  | "vence_hoje"
  | "proximo_vencimento"
  | "em_dia";

const CONFIG: Record<StatusVisual, { label: string; cor: "ok" | "warn" | "late" }> = {
  pago: { label: "Pago", cor: "ok" },
  cancelado: { label: "Cancelado", cor: "warn" },
  atrasado: { label: "Em atraso", cor: "late" },
  vence_hoje: { label: "Vence hoje", cor: "warn" },
  proximo_vencimento: { label: "Próximo do vencimento", cor: "warn" },
  em_dia: { label: "Em dia", cor: "ok" },
};

export function rotuloStatus(status: StatusVisual, diasEmAtraso?: number | null): string {
  if (status === "atrasado" && diasEmAtraso) {
    return `Em atraso há ${diasEmAtraso} ${diasEmAtraso === 1 ? "dia" : "dias"}`;
  }
  return CONFIG[status]?.label ?? status;
}

export function corStatus(status: StatusVisual): "ok" | "warn" | "late" {
  return CONFIG[status]?.cor ?? "warn";
}
