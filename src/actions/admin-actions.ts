"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { apenasDigitos, validarCpf } from "@/lib/cpf";

/** Lança erro se o usuário logado não estiver na allowlist de admins. */
async function exigirAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { data: admin } = await supabase
    .from("admin_users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (!admin) throw new Error("Sem permissão de administrador.");

  return { supabase, adminId: user.id };
}

// ---------------------------------------------------------------------
// VAGAS
// ---------------------------------------------------------------------
export async function criarVaga(formData: FormData) {
  const { supabase } = await exigirAdmin();
  const numero = String(formData.get("numero") || "").trim();
  if (!numero) throw new Error("Informe o número da vaga.");

  const { error } = await supabase.from("vagas").insert({ numero });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/vagas");
}

// ---------------------------------------------------------------------
// CLIENTES + VEÍCULO + CONTRATO (cadastro completo em uma única ação)
// ---------------------------------------------------------------------
export async function criarClienteCompleto(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const nomeCompleto = String(formData.get("nome_completo") || "").trim();
  const cpfBruto = String(formData.get("cpf") || "");
  const telefone = String(formData.get("telefone") || "").trim() || null;
  const email = String(formData.get("email") || "").trim() || null;
  const endereco = String(formData.get("endereco") || "").trim() || null;

  const placa = String(formData.get("placa") || "").trim().toUpperCase();
  const modelo = String(formData.get("modelo") || "").trim() || null;

  const vagaId = String(formData.get("vaga_id") || "");
  const valorMensalidade = Number(formData.get("valor_mensalidade") || 0);
  const diaVencimento = Number(formData.get("dia_vencimento") || 0);
  const dataInicio = String(formData.get("data_inicio") || "");

  if (!validarCpf(cpfBruto)) throw new Error("CPF inválido.");
  if (!vagaId) throw new Error("Selecione uma vaga.");
  if (!(valorMensalidade > 0)) throw new Error("Informe o valor da mensalidade.");
  if (!(diaVencimento >= 1 && diaVencimento <= 28)) {
    throw new Error("Dia de vencimento deve ser entre 1 e 28.");
  }

  const cpf = apenasDigitos(cpfBruto);

  const { data: cliente, error: erroCliente } = await supabase
    .from("clientes")
    .insert({ nome_completo: nomeCompleto, cpf, telefone, email, endereco })
    .select("id")
    .single();
  if (erroCliente) throw new Error(erroCliente.message);

  let veiculoId: string | null = null;
  if (placa) {
    const { data: veiculo, error: erroVeiculo } = await supabase
      .from("veiculos")
      .insert({ cliente_id: cliente.id, placa, modelo })
      .select("id")
      .single();
    if (erroVeiculo) throw new Error(erroVeiculo.message);
    veiculoId = veiculo.id;
  }

  const { error: erroContrato } = await supabase.from("contratos").insert({
    cliente_id: cliente.id,
    vaga_id: vagaId,
    veiculo_id: veiculoId,
    valor_mensalidade: valorMensalidade,
    dia_vencimento: diaVencimento,
    data_inicio: dataInicio,
  });
  if (erroContrato) throw new Error(erroContrato.message);

  await supabase.from("vagas").update({ status: "ocupada" }).eq("id", vagaId);

  revalidatePath("/admin/clientes");
  revalidatePath("/admin/vagas");
  redirect(`/admin/clientes/${cliente.id}`);
}

export async function desativarCliente(clienteId: string) {
  const { supabase } = await exigirAdmin();

  await supabase.from("clientes").update({ ativo: false }).eq("id", clienteId);
  await supabase
    .from("contratos")
    .update({ status: "encerrado", data_fim: new Date().toISOString().slice(0, 10) })
    .eq("cliente_id", clienteId)
    .eq("status", "ativo");

  // libera a(s) vaga(s) que esse cliente ocupava
  const { data: contratos } = await supabase
    .from("contratos")
    .select("vaga_id")
    .eq("cliente_id", clienteId);
  for (const c of contratos ?? []) {
    await supabase.from("vagas").update({ status: "livre" }).eq("id", c.vaga_id);
  }

  revalidatePath("/admin/clientes");
  revalidatePath(`/admin/clientes/${clienteId}`);
  revalidatePath("/admin/vagas");
}

export async function reativarCliente(clienteId: string) {
  const { supabase } = await exigirAdmin();
  await supabase.from("clientes").update({ ativo: true }).eq("id", clienteId);
  revalidatePath("/admin/clientes");
  revalidatePath(`/admin/clientes/${clienteId}`);
}

export async function regenerarLinkPortal(clienteId: string) {
  const { supabase } = await exigirAdmin();
  const { error } = await supabase.rpc("regenerar_portal_token", { p_cliente_id: clienteId });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/clientes/${clienteId}`);
}

// Cliente só pode ser excluído fisicamente se não tiver nenhuma fatura.
export async function excluirClienteSeSemFaturas(clienteId: string) {
  const { supabase } = await exigirAdmin();

  const { count } = await supabase
    .from("faturas")
    .select("id", { count: "exact", head: true })
    .eq("cliente_id", clienteId);

  if (count && count > 0) {
    throw new Error(
      "Este cliente tem faturas no histórico e não pode ser excluído — desative-o em vez disso."
    );
  }

  await supabase.from("clientes").delete().eq("id", clienteId);
  revalidatePath("/admin/clientes");
  redirect("/admin/clientes");
}

// ---------------------------------------------------------------------
// FATURAS
// ---------------------------------------------------------------------
export async function gerarFaturasDoMes(formData: FormData) {
  const { supabase } = await exigirAdmin();
  const competencia = String(formData.get("competencia") || "");
  if (!competencia) throw new Error("Selecione a competência.");

  const { error } = await supabase.rpc("gerar_faturas_mes", { p_competencia: competencia });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/faturas");
}

export async function marcarFaturaComoPaga(faturaId: string) {
  const { supabase, adminId } = await exigirAdmin();

  const { data: fatura, error: erroFatura } = await supabase
    .from("faturas")
    .select("valor, cliente_id")
    .eq("id", faturaId)
    .single();
  if (erroFatura) throw new Error(erroFatura.message);

  const { error } = await supabase
    .from("faturas")
    .update({
      status: "pago",
      data_pagamento: new Date().toISOString(),
      forma_pagamento: "manual",
    })
    .eq("id", faturaId);
  if (error) throw new Error(error.message);

  await supabase.from("pagamentos").insert({
    fatura_id: faturaId,
    valor: fatura.valor,
    metodo: "manual",
    registrado_por: adminId,
  });

  const { data: cliente } = await supabase
    .from("clientes")
    .select("portal_token")
    .eq("id", fatura.cliente_id)
    .single();

  revalidatePath("/admin/faturas");
  if (cliente?.portal_token) {
    revalidatePath(`/portal/${cliente.portal_token}`);
    revalidatePath(`/portal/${cliente.portal_token}/faturas`);
    revalidatePath(`/portal/${cliente.portal_token}/faturas/${faturaId}`);
  }
}

export async function cancelarFatura(faturaId: string) {
  const { supabase } = await exigirAdmin();
  const { error } = await supabase
    .from("faturas")
    .update({ status: "cancelado" })
    .eq("id", faturaId)
    .eq("status", "pendente");
  if (error) throw new Error(error.message);
  revalidatePath("/admin/faturas");
  revalidatePath("/admin");
}

export async function reabrirFatura(faturaId: string) {
  const { supabase } = await exigirAdmin();

  const { error: erroPagamentos } = await supabase
    .from("pagamentos")
    .delete()
    .eq("fatura_id", faturaId);
  if (erroPagamentos) throw new Error(erroPagamentos.message);

  const { error } = await supabase
    .from("faturas")
    .update({ status: "pendente", data_pagamento: null, forma_pagamento: null })
    .eq("id", faturaId)
    .in("status", ["cancelado", "pago"]);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/faturas");
  revalidatePath("/admin");
}

export async function excluirFatura(faturaId: string) {
  const { supabase } = await exigirAdmin();

  const { error: erroPagamentos } = await supabase
    .from("pagamentos")
    .delete()
    .eq("fatura_id", faturaId);
  if (erroPagamentos) throw new Error(erroPagamentos.message);

  const { error } = await supabase
    .from("faturas")
    .delete()
    .eq("id", faturaId)
    .in("status", ["pendente", "cancelado", "pago"]);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/faturas");
  revalidatePath("/admin");
}
