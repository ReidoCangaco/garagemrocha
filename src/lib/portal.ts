import { createServiceClient } from "@/lib/supabase/service";

/**
 * Busca um cliente pelo portal_token. Roda com a service_role key porque
 * o cliente não tem sessão/JWT do Supabase Auth — o token da URL é a
 * própria credencial. Nunca exponha esse client ao browser.
 */
export async function buscarClientePorToken(token: string) {
  const supabase = createServiceClient();

  const { data: cliente } = await supabase
    .from("clientes")
    .select(
      `id, nome_completo, ativo,
       veiculos(placa, modelo),
       contratos(id, status, valor_mensalidade, vagas(numero))`
    )
    .eq("portal_token", token)
    .maybeSingle();

  if (!cliente || !cliente.ativo) return null;
  return cliente;
}

export function servicoSupabasePortal() {
  return createServiceClient();
}
