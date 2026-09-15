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

export function rotuloPrazo(status: StatusVisual, dataVencimento?: string | null): string | null {
  if (status === "vence_hoje") return "Vence hoje";
  if (!["em_dia", "proximo_vencimento"].includes(status) || !dataVencimento) return null;

  const hoje = new Date();
  const hojeUtc = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const [ano, mes, dia] = dataVencimento.slice(0, 10).split("-").map(Number);
  const vencimentoUtc = Date.UTC(ano, mes - 1, dia);
  const dias = Math.round((vencimentoUtc - hojeUtc) / 86_400_000);

  return `Faltam ${dias} ${dias === 1 ? "dia" : "dias"} para o vencimento`;
}

export function corStatus(status: StatusVisual): "ok" | "warn" | "late" {
  return CONFIG[status]?.cor ?? "warn";
}
