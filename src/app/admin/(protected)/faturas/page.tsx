import { createClient } from "@/lib/supabase/server";
import { formatarMoeda, formatarData, formatarCompetencia } from "@/lib/formato";
import { PillStatus } from "@/components/Pill";
import { gerarFaturasDoMes, marcarFaturaComoPaga, cancelarFatura } from "@/actions/admin-actions";
import type { StatusVisual } from "@/lib/status";

export const dynamic = "force-dynamic";

const FILTROS = [
  { valor: "todas", label: "Todas" },
  { valor: "pendente", label: "Pendentes" },
  { valor: "pago", label: "Pagas" },
  { valor: "atrasado", label: "Atrasadas" },
] as const;

export default async function FaturasPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabase = createClient();
  const filtroAtivo = searchParams.status ?? "todas";

  let query = supabase
    .from("faturas_com_status_visual")
    .select("id, competencia, valor, data_vencimento, status, status_visual, dias_em_atraso, clientes(nome_completo)")
    .order("data_vencimento", { ascending: false })
    .limit(200);

  if (filtroAtivo === "pendente") query = query.eq("status", "pendente");
  if (filtroAtivo === "pago") query = query.eq("status", "pago");
  if (filtroAtivo === "atrasado") query = query.eq("status_visual", "atrasado");

  const { data: faturas } = await query;

  const hoje = new Date();
  const competenciaAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`;

  return (
    <div>
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <h2 className="font-display font-semibold text-xl">Faturas</h2>
        <form action={gerarFaturasDoMes} className="flex items-center gap-2">
          <input type="date" name="competencia" defaultValue={competenciaAtual} className="input !w-auto" />
          <button className="btn btn-primary text-sm" type="submit">Gerar faturas do mês</button>
        </form>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTROS.map((f) => (
          <a
            key={f.valor}
            href={`/admin/faturas?status=${f.valor}`}
            className={`btn text-xs !w-auto !px-3 !py-1.5 ${
              filtroAtivo === f.valor ? "bg-asphalt text-paper-2" : "btn-ghost"
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-left text-xs text-ink-soft">
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Competência</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Vencimento</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(faturas ?? []).map((f: any) => {
              const marcarPagaComId = marcarFaturaComoPaga.bind(null, f.id);
              const cancelarComId = cancelarFatura.bind(null, f.id);
              return (
                <tr key={f.id} className="border-t border-border hover:bg-paper">
                  <td className="px-4 py-3">{f.clientes?.nome_completo}</td>
                  <td className="px-4 py-3">{formatarCompetencia(f.competencia)}</td>
                  <td className="px-4 py-3 font-mono text-xs">{formatarMoeda(Number(f.valor))}</td>
                  <td className="px-4 py-3">{formatarData(f.data_vencimento)}</td>
                  <td className="px-4 py-3">
                    <PillStatus status={f.status_visual as StatusVisual} diasEmAtraso={f.dias_em_atraso} dataVencimento={f.data_vencimento} />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {f.status === "pendente" && (
                      <div className="flex gap-3 justify-end">
                        <form action={marcarPagaComId}>
                          <button className="text-xs underline" type="submit">marcar pago</button>
                        </form>
                        <form action={cancelarComId}>
                          <button className="text-xs underline text-late" type="submit">cancelar</button>
                        </form>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(faturas ?? []).length === 0 && (
          <p className="text-sm text-ink-soft px-4 py-6">Nenhuma fatura encontrada para este filtro.</p>
        )}
      </div>
    </div>
  );
}
