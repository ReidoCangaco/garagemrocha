import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatarMoeda, formatarData } from "@/lib/formato";
import { formatarCpf } from "@/lib/cpf";
import {
  desativarCliente,
  reativarCliente,
  regenerarLinkPortal,
  excluirClienteSeSemFaturas,
} from "@/actions/admin-actions";

export const dynamic = "force-dynamic";

export default async function DetalheClientePage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: cliente } = await supabase
    .from("clientes")
    .select(
      `id, nome_completo, cpf, telefone, email, endereco, ativo, portal_token,
       veiculos(id, placa, modelo),
       contratos(id, status, valor_mensalidade, dia_vencimento, data_inicio, vagas(numero))`
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!cliente) notFound();

  const { count: totalFaturas } = await supabase
    .from("faturas")
    .select("id", { count: "exact", head: true })
    .eq("cliente_id", params.id);

  const contratoAtivo = (cliente.contratos as any[])?.find((c) => c.status === "ativo");
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const siteUrl =
    process.env.VERCEL === "1" &&
    (!configuredSiteUrl || configuredSiteUrl.includes("localhost"))
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL || "garagemrocha.vercel.app"}`
      : configuredSiteUrl || "http://localhost:3000";
  const linkPortal = `${siteUrl}/portal/${cliente.portal_token}`;

  const desativarComId = desativarCliente.bind(null, cliente.id);
  const reativarComId = reativarCliente.bind(null, cliente.id);
  const regenerarComId = regenerarLinkPortal.bind(null, cliente.id);
  const excluirComId = excluirClienteSeSemFaturas.bind(null, cliente.id);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display font-semibold text-xl">{cliente.nome_completo}</h2>
        <span className={`pill ${cliente.ativo ? "pill-ok" : "pill-late"}`}>
          {cliente.ativo ? "Ativo" : "Inativo"}
        </span>
      </div>

      <div className="card space-y-2 text-sm">
        <p><span className="text-ink-soft">CPF:</span> {formatarCpf(cliente.cpf)}</p>
        {cliente.telefone && <p><span className="text-ink-soft">Telefone:</span> {cliente.telefone}</p>}
        {cliente.email && <p><span className="text-ink-soft">E-mail:</span> {cliente.email}</p>}
        {cliente.endereco && <p><span className="text-ink-soft">Endereço:</span> {cliente.endereco}</p>}
        {(cliente.veiculos as any[])?.[0] && (
          <p>
            <span className="text-ink-soft">Veículo:</span>{" "}
            {(cliente.veiculos as any[])[0].modelo} ·{" "}
            <span className="font-mono">{(cliente.veiculos as any[])[0].placa}</span>
          </p>
        )}
      </div>

      {contratoAtivo && (
        <div className="card space-y-2 text-sm">
          <h3 className="text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1">Contrato ativo</h3>
          <p><span className="text-ink-soft">Vaga:</span> {contratoAtivo.vagas?.numero}</p>
          <p><span className="text-ink-soft">Mensalidade:</span> {formatarMoeda(Number(contratoAtivo.valor_mensalidade))}</p>
          <p><span className="text-ink-soft">Vencimento:</span> todo dia {contratoAtivo.dia_vencimento}</p>
          <p><span className="text-ink-soft">Início:</span> {formatarData(contratoAtivo.data_inicio)}</p>
        </div>
      )}

      <div className="card space-y-3">
        <h3 className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Link pessoal do portal</h3>
        <p className="text-xs text-ink-soft">
          Envie este link por WhatsApp ou e-mail — é assim que o cliente acessa a área dele, sem senha.
        </p>
        <div className="flex items-center gap-2 bg-paper rounded-lg px-3 py-2.5 overflow-x-auto">
          <code className="text-xs whitespace-nowrap">{linkPortal}</code>
        </div>
        <form action={regenerarComId}>
          <button className="btn btn-ghost text-xs" type="submit">
            Gerar novo link (invalida o atual)
          </button>
        </form>
      </div>

      <div className="card space-y-3">
        <h3 className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Ações</h3>
        <div className="flex flex-wrap gap-3">
          {cliente.ativo ? (
            <form action={desativarComId}>
              <button className="btn btn-ghost" type="submit">Desativar cliente</button>
            </form>
          ) : (
            <form action={reativarComId}>
              <button className="btn btn-ghost" type="submit">Reativar cliente</button>
            </form>
          )}
          {!totalFaturas && (
            <form action={excluirComId}>
              <button className="btn btn-danger" type="submit">Excluir definitivamente</button>
            </form>
          )}
        </div>
        {!!totalFaturas && (
          <p className="text-xs text-ink-soft">
            Exclusão definitiva bloqueada: este cliente já tem {totalFaturas} fatura(s) no histórico.
            Use "Desativar" para preservar o registro financeiro.
          </p>
        )}
      </div>
    </div>
  );
}
