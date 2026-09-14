import { notFound } from "next/navigation";
import Link from "next/link";
import { buscarClientePorToken, servicoSupabasePortal } from "@/lib/portal";
import { formatarMoeda, formatarCompetencia } from "@/lib/formato";
import { PillStatus } from "@/components/Pill";
import type { StatusVisual } from "@/lib/status";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function HistoricoPage({ params }: { params: { token: string } }) {
  const cliente = await buscarClientePorToken(params.token);
  if (!cliente) notFound();

  const supabase = servicoSupabasePortal();
  const { data: faturas } = await supabase
    .from("faturas_com_status_visual")
    .select("id, competencia, valor, status_visual, dias_em_atraso")
    .eq("cliente_id", cliente.id)
    .order("competencia", { ascending: false });

  return (
    <div className="min-h-screen">
      <header className="max-w-md mx-auto px-5 pt-6 pb-3">
        <Link href={`/portal/${params.token}`} className="text-sm text-ink-soft">← Voltar</Link>
        <h1 className="font-display font-bold text-2xl mt-2">Histórico</h1>
      </header>

      <main className="max-w-md mx-auto px-5 pb-14">
        <div className="card divide-y divide-border">
          {(faturas ?? []).map((f: any) => (
            <Link
              key={f.id}
              href={`/portal/${params.token}/faturas/${f.id}`}
              className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
            >
              <span className="font-semibold text-sm">{formatarCompetencia(f.competencia)}</span>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-ink-soft">{formatarMoeda(Number(f.valor))}</span>
                <PillStatus status={f.status_visual as StatusVisual} diasEmAtraso={f.dias_em_atraso} />
              </div>
            </Link>
          ))}
          {(faturas ?? []).length === 0 && (
            <p className="text-sm text-ink-soft py-4">Nenhuma fatura registrada ainda.</p>
          )}
        </div>
      </main>
    </div>
  );
}
