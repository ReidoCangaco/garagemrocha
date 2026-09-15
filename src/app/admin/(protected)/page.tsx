import { createClient } from "@/lib/supabase/server";
import { formatarCompetencia, formatarMoeda } from "@/lib/formato";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();

  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const inicioProximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);
  const inicioHistorico = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);
  const competenciaAtual = inicioMes.toISOString().slice(0, 10);
  const competenciaSeguinte = inicioProximoMes.toISOString().slice(0, 10);

  const [{ count: totalClientes }, { data: vagas }, { data: faturasMes }, { data: inadimplentes }, { data: faturasHistorico }] =
    await Promise.all([
      supabase.from("clientes").select("id", { count: "exact", head: true }).eq("ativo", true),
      supabase.from("vagas").select("status"),
      supabase
        .from("faturas_com_status_visual")
        .select("valor,status")
        .gte("competencia", competenciaAtual)
        .lt("competencia", competenciaSeguinte),
      supabase
        .from("faturas_com_status_visual")
        .select("id,cliente_id,valor", { count: "exact" })
        .eq("status_visual", "atrasado"),
      supabase
        .from("faturas_com_status_visual")
        .select("competencia,valor,status,status_visual")
        .gte("competencia", inicioHistorico.toISOString().slice(0, 10))
        .order("competencia", { ascending: false }),
    ]);

  const vagasOcupadas = (vagas ?? []).filter((v) => v.status === "ocupada").length;
  const vagasLivres = (vagas ?? []).filter((v) => v.status === "livre").length;

  const recebidoMes = (faturasMes ?? [])
    .filter((f) => f.status === "pago")
    .reduce((soma, f) => soma + Number(f.valor), 0);
  const aReceberMes = (faturasMes ?? [])
    .filter((f) => f.status === "pendente")
    .reduce((soma, f) => soma + Number(f.valor), 0);

  const totalInadimplentes = new Set((inadimplentes ?? []).map((f) => f.cliente_id)).size;
  const valorEmAtraso = (inadimplentes ?? []).reduce((soma, f) => soma + Number(f.valor), 0);

  const meses = new Map<string, { competencia: string; recebido: number; pendente: number; atrasado: number; cancelado: number }>();
  for (const fatura of faturasHistorico ?? []) {
    const competencia = String(fatura.competencia);
    const mes = meses.get(competencia) ?? { competencia, recebido: 0, pendente: 0, atrasado: 0, cancelado: 0 };
    const valor = Number(fatura.valor);
    if (fatura.status === "pago") mes.recebido += valor;
    else if (fatura.status === "cancelado") mes.cancelado += valor;
    else if (fatura.status_visual === "atrasado") mes.atrasado += valor;
    else mes.pendente += valor;
    meses.set(competencia, mes);
  }

  return (
    <div>
      <h2 className="font-display font-semibold text-xl mb-5">Dashboard</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Clientes ativos" valor={String(totalClientes ?? 0)} />
        <Stat label="Vagas ocupadas" valor={`${vagasOcupadas}/${vagasOcupadas + vagasLivres}`} />
        <Stat label="Recebido este mês" valor={formatarMoeda(recebidoMes)} cor="ok" />
        <Stat label="A receber este mês" valor={formatarMoeda(aReceberMes)} />
        <Stat label="Inadimplentes" valor={String(totalInadimplentes)} cor="late" />
        <Stat label="Valor em atraso" valor={formatarMoeda(valorEmAtraso)} cor="late" />
      </div>

      <section>
        <h3 className="font-display font-semibold text-lg mb-3">Resumo por mês</h3>
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm min-w-[680px]">
            <thead>
              <tr className="text-left text-xs text-ink-soft">
                <th className="px-4 py-3">Competência</th>
                <th className="px-4 py-3">Recebido</th>
                <th className="px-4 py-3">A receber</th>
                <th className="px-4 py-3">Em atraso</th>
                <th className="px-4 py-3">Cancelado</th>
              </tr>
            </thead>
            <tbody>
              {[...meses.values()].map((mes) => (
                <tr key={mes.competencia} className="border-t border-border">
                  <td className="px-4 py-3 font-semibold">{formatarCompetencia(mes.competencia)}</td>
                  <td className="px-4 py-3 text-ok">{formatarMoeda(mes.recebido)}</td>
                  <td className="px-4 py-3">{formatarMoeda(mes.pendente)}</td>
                  <td className="px-4 py-3 text-late">{formatarMoeda(mes.atrasado)}</td>
                  <td className="px-4 py-3 text-warn">{formatarMoeda(mes.cancelado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {meses.size === 0 && <p className="text-sm text-ink-soft px-4 py-6">Nenhuma fatura registrada nos últimos meses.</p>}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, valor, cor }: { label: string; valor: string; cor?: "ok" | "late" }) {
  const corClasse = cor === "ok" ? "text-ok" : cor === "late" ? "text-late" : "text-ink";
  return (
    <div className="card">
      <p className="text-xs text-ink-soft mb-1.5">{label}</p>
      <p className={`font-display font-bold text-2xl ${corClasse}`}>{valor}</p>
    </div>
  );
}
