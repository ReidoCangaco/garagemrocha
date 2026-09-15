import { notFound } from "next/navigation";
import Link from "next/link";
import { buscarClientePorToken, servicoSupabasePortal } from "@/lib/portal";
import { formatarMoeda, formatarData, formatarCompetencia } from "@/lib/formato";
import { PillStatus } from "@/components/Pill";
import type { StatusVisual } from "@/lib/status";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function PortalHomePage({ params }: { params: { token: string } }) {
  const cliente = await buscarClientePorToken(params.token);
  if (!cliente) notFound();

  const supabase = servicoSupabasePortal();
  const { data: faturaAtual } = await supabase
    .from("faturas_com_status_visual")
    .select("id, competencia, valor, data_vencimento, status_visual, dias_em_atraso")
    .eq("cliente_id", cliente.id)
    .order("competencia", { ascending: false })
    .limit(1)
    .maybeSingle();

  const contratoAtivo = (cliente.contratos as any[])?.find((c) => c.status === "ativo");
  const veiculo = (cliente.veiculos as any[])?.[0];
  const primeiroNome = cliente.nome_completo.split(" ")[0];

  return (
    <div className="min-h-screen">
      <header className="max-w-md mx-auto px-5 pt-6 pb-3">
        <h1 className="font-display font-bold text-2xl">
          Garagem Rocha<span className="text-signage">.</span>
        </h1>
      </header>

      <main className="max-w-md mx-auto px-5 pb-14">
        <p className="text-sm text-ink-soft my-4">
          Olá, <strong className="text-ink">{primeiroNome}</strong>
        </p>

        {contratoAtivo && (
          <div className="bg-asphalt text-paper-2 rounded-2xl p-5 mb-5 relative overflow-hidden pl-6">
            <div
              className="absolute top-0 bottom-0 left-0 w-2"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(180deg, #E8B324 0 14px, transparent 14px 24px)",
              }}
            />
            <div className="flex justify-between items-end flex-wrap gap-3">
              <div>
                <p className="text-xs text-[#A9AEB6] mb-0.5">Vaga</p>
                <p className="font-display font-bold text-4xl leading-none">
                  {contratoAtivo.vagas?.numero}
                </p>
              </div>
              {veiculo && (
                <div className="text-right">
                  <p className="text-sm text-[#C9CDD2]">{veiculo.modelo}</p>
                  <p className="font-mono font-bold bg-signage text-asphalt inline-block px-2.5 py-0.5 rounded mt-1 tracking-wider">
                    {veiculo.placa}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {faturaAtual && (
          <div className="card mb-5">
            <h2 className="font-display text-sm font-semibold text-ink-soft uppercase tracking-wide mb-3">
              Mensalidade atual
            </h2>
            <p className="text-sm text-ink-soft">{formatarCompetencia(faturaAtual.competencia)}</p>
            <p className="font-display font-bold text-4xl my-1">{formatarMoeda(Number(faturaAtual.valor))}</p>
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <span className="text-sm text-ink-soft">
                Vencimento: {formatarData(faturaAtual.data_vencimento)}
              </span>
              <PillStatus
                status={faturaAtual.status_visual as StatusVisual}
                diasEmAtraso={faturaAtual.dias_em_atraso}
              />
            </div>
            {faturaAtual.status_visual !== "pago" ? (
              <Link href={`/portal/${params.token}/faturas/${faturaAtual.id}`} className="btn btn-primary w-full">
                Pagar com PIX
              </Link>
            ) : (
              <button className="btn btn-ghost w-full" disabled>Pagamento confirmado</button>
            )}
          </div>
        )}

        <Link href={`/portal/${params.token}/faturas`} className="card block hover:bg-paper">
          <p className="font-display text-sm font-semibold text-ink-soft uppercase tracking-wide">
            Ver histórico completo →
          </p>
        </Link>
      </main>
    </div>
  );
}
