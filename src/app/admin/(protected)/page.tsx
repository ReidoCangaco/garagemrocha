import { createClient } from "@/lib/supabase/server";
import { formatarMoeda } from "@/lib/formato";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();

  const [{ count: totalClientes }, { data: vagas }, { data: faturasMes }, { data: inadimplentes }] =
    await Promise.all([
      supabase.from("clientes").select("id", { count: "exact", head: true }).eq("ativo", true),
      supabase.from("vagas").select("status"),
      supabase
        .from("faturas_com_status_visual")
        .select("valor,status")
        .gte("competencia", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)),
      supabase
        .from("faturas_com_status_visual")
        .select("id,cliente_id,valor", { count: "exact" })
        .eq("status_visual", "atrasado"),
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
