import { notFound } from "next/navigation";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { buscarClientePorToken, servicoSupabasePortal } from "@/lib/portal";
import { formatarMoeda, formatarData, formatarCompetencia } from "@/lib/formato";
import { PillStatus } from "@/components/Pill";
import type { StatusVisual } from "@/lib/status";
import { gerarPayloadPix, gerarQrCodeDataUrl } from "@/lib/pix";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function DetalheFaturaPage({
  params,
}: {
  params: { token: string; id: string };
}) {
  noStore();
  const cliente = await buscarClientePorToken(params.token);
  if (!cliente) notFound();

  const supabase = servicoSupabasePortal();
  const { data: fatura } = await supabase
    .from("faturas_com_status_visual")
    .select("id, competencia, valor, data_vencimento, status_visual, dias_em_atraso, pix_txid, cliente_id")
    .eq("id", params.id)
    .maybeSingle();

  // Garante que a fatura pertence a este cliente (mesmo com o ID "certo" na
  // URL, ele nunca enxerga fatura de outra pessoa).
  if (!fatura || fatura.cliente_id !== cliente.id) notFound();

  let qrCodeDataUrl: string | null = null;
  let copiaECola: string | null = null;

  if (fatura.status_visual !== "pago" && fatura.status_visual !== "cancelado") {
    const txid = fatura.pix_txid || `FAT${fatura.id.replace(/-/g, "").slice(0, 20)}`;
    copiaECola = gerarPayloadPix({
      chave: process.env.PIX_CHAVE || "",
      nomeRecebedor: process.env.PIX_NOME_RECEBEDOR || "GARAGEM ROCHA",
      cidade: process.env.PIX_CIDADE || "SAO PAULO",
      valor: Number(fatura.valor),
      txid,
    });
    qrCodeDataUrl = await gerarQrCodeDataUrl(copiaECola);

    if (!fatura.pix_txid) {
      await supabase.from("faturas").update({ pix_txid: txid }).eq("id", fatura.id);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="max-w-md mx-auto px-5 pt-6 pb-3">
        <Link href={`/portal/${params.token}/faturas`} className="text-sm text-ink-soft">← Voltar</Link>
        <h1 className="font-display font-bold text-2xl mt-2">{formatarCompetencia(fatura.competencia)}</h1>
      </header>

      <main className="max-w-md mx-auto px-5 pb-14">
        <div className="card mb-5">
          <p className="font-display font-bold text-3xl mb-1">{formatarMoeda(Number(fatura.valor))}</p>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm text-ink-soft">Vencimento: {formatarData(fatura.data_vencimento)}</span>
            <PillStatus status={fatura.status_visual as StatusVisual} diasEmAtraso={fatura.dias_em_atraso} dataVencimento={fatura.data_vencimento} />
          </div>
        </div>

        {qrCodeDataUrl && copiaECola && (
          <div className="card text-center">
            <h2 className="font-display text-sm font-semibold text-ink-soft uppercase tracking-wide mb-3">
              Pagar com PIX
            </h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrCodeDataUrl} alt="QR Code PIX" className="mx-auto rounded-lg border border-border mb-4" width={220} height={220} />
            <div className="bg-paper rounded-lg px-3 py-2.5 text-left mb-2">
              <p className="text-[11px] font-mono text-ink-soft break-all">{copiaECola}</p>
            </div>
            <p className="text-xs text-ink-soft mb-4">
              Copie o código acima ou escaneie o QR no app do seu banco.
            </p>
            <p className="text-xs text-ink-soft">
              Depois de pagar, o administrador confirma o recebimento e o status muda para "Pago" aqui mesmo.
            </p>
          </div>
        )}

        {fatura.status_visual === "pago" && (
          <div className="card text-center text-ok font-semibold">Pagamento confirmado ✓</div>
        )}
      </main>
    </div>
  );
}
