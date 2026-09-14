import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com a service_role key — IGNORA o RLS.
 *
 * Só pode ser importado a partir de código que roda no servidor:
 * - a rota do portal do cliente (para buscar pelo portal_token, já que o
 *   cliente não tem sessão/JWT do Supabase Auth)
 * - a função de gerar faturas do mês
 *
 * NUNCA importar isso em um Client Component ou expor essa chave ao browser.
 */
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
