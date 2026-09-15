import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatarMoeda } from "@/lib/formato";
import { formatarCpf } from "@/lib/cpf";

export const dynamic = "force-dynamic";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const supabase = createClient();
  const termo = searchParams.q?.trim() ?? "";

  let query = supabase
    .from("clientes")
    .select(
      `id, nome_completo, cpf, ativo,
       contratos!inner(status, valor_mensalidade, dia_vencimento, vagas(numero))`
    )
    .eq("contratos.status", "ativo")
    .order("nome_completo");

  if (termo) {
    query = query.or(`nome_completo.ilike.%${termo}%,cpf.ilike.%${termo.replace(/\D/g, "")}%`);
  }

  const { data: clientes } = await query;

  return (
    <div>
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <h2 className="font-display font-semibold text-xl">Clientes</h2>
        <Link href="/admin/clientes/novo" className="btn btn-primary">+ Novo cliente</Link>
      </div>

      <form className="mb-5">
        <input
          className="input max-w-sm"
          type="text"
          name="q"
          placeholder="Buscar por nome ou CPF..."
          defaultValue={termo}
        />
      </form>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-xs text-ink-soft">
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">CPF</th>
              <th className="px-4 py-3">Vaga</th>
              <th className="px-4 py-3">Mensalidade</th>
              <th className="px-4 py-3">Vencimento</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {(clientes ?? []).map((c: any) => (
              <tr key={c.id} className="border-t border-border hover:bg-paper">
                <td className="px-4 py-3">
                  <Link href={`/admin/clientes/${c.id}`} className="font-medium hover:underline">
                    {c.nome_completo}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{formatarCpf(c.cpf)}</td>
                <td className="px-4 py-3">{c.contratos?.[0]?.vagas?.numero ?? "—"}</td>
                <td className="px-4 py-3">
                  {formatarMoeda(Number(c.contratos?.[0]?.valor_mensalidade ?? 0))}
                </td>
                <td className="px-4 py-3">dia {c.contratos?.[0]?.dia_vencimento ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`pill ${c.ativo ? "pill-ok" : "pill-late"}`}>
                    {c.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(clientes ?? []).length === 0 && (
          <p className="text-sm text-ink-soft px-4 py-6">Nenhum cliente encontrado.</p>
        )}
      </div>
    </div>
  );
}
