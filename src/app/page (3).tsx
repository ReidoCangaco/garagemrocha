import { createClient } from "@/lib/supabase/server";
import { criarClienteCompleto } from "@/actions/admin-actions";

export const dynamic = "force-dynamic";

export default async function NovoClientePage() {
  const supabase = createClient();
  const { data: vagasLivres } = await supabase
    .from("vagas")
    .select("id, numero")
    .eq("status", "livre")
    .order("numero");

  return (
    <div className="max-w-xl">
      <h2 className="font-display font-semibold text-xl mb-5">Novo cliente</h2>

      <form action={criarClienteCompleto} className="space-y-6">
        <fieldset className="card space-y-4">
          <legend className="text-sm font-semibold px-1">Dados do cliente</legend>
          <div>
            <label className="label" htmlFor="nome_completo">Nome completo</label>
            <input className="input" id="nome_completo" name="nome_completo" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="cpf">CPF</label>
              <input className="input" id="cpf" name="cpf" placeholder="000.000.000-00" required />
            </div>
            <div>
              <label className="label" htmlFor="telefone">Telefone</label>
              <input className="input" id="telefone" name="telefone" placeholder="(00) 00000-0000" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="email">E-mail (opcional)</label>
              <input className="input" id="email" name="email" type="email" />
            </div>
            <div>
              <label className="label" htmlFor="endereco">Endereço (opcional)</label>
              <input className="input" id="endereco" name="endereco" />
            </div>
          </div>
        </fieldset>

        <fieldset className="card space-y-4">
          <legend className="text-sm font-semibold px-1">Veículo</legend>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="placa">Placa</label>
              <input className="input font-mono" id="placa" name="placa" placeholder="ABC1D23" />
            </div>
            <div>
              <label className="label" htmlFor="modelo">Modelo</label>
              <input className="input" id="modelo" name="modelo" placeholder="Honda Civic" />
            </div>
          </div>
        </fieldset>

        <fieldset className="card space-y-4">
          <legend className="text-sm font-semibold px-1">Contrato</legend>
          <div>
            <label className="label" htmlFor="vaga_id">Vaga</label>
            <select className="input" id="vaga_id" name="vaga_id" required>
              <option value="">Selecione...</option>
              {(vagasLivres ?? []).map((v) => (
                <option key={v.id} value={v.id}>Vaga {v.numero}</option>
              ))}
            </select>
            {(vagasLivres ?? []).length === 0 && (
              <p className="text-xs text-late mt-1">
                Nenhuma vaga livre — cadastre vagas na aba "Vagas" primeiro.
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="valor_mensalidade">Valor da mensalidade (R$)</label>
              <input className="input" id="valor_mensalidade" name="valor_mensalidade" type="number" step="0.01" min="0.01" required />
            </div>
            <div>
              <label className="label" htmlFor="dia_vencimento">Dia de vencimento</label>
              <input className="input" id="dia_vencimento" name="dia_vencimento" type="number" min="1" max="28" required />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="data_inicio">Início do contrato</label>
            <input className="input" id="data_inicio" name="data_inicio" type="date" required />
          </div>
        </fieldset>

        <button className="btn btn-primary w-full" type="submit">Cadastrar cliente</button>
      </form>
    </div>
  );
}
