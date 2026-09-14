export function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatarData(data: string | Date): string {
  const d = typeof data === "string" ? new Date(data + "T00:00:00") : data;
  return d.toLocaleDateString("pt-BR");
}

export function formatarCompetencia(data: string): string {
  const d = new Date(data + "T00:00:00");
  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  return `${meses[d.getMonth()]}/${d.getFullYear()}`;
}
