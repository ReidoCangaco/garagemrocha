import { createClient } from "@/lib/supabase/server";
import { criarVaga } from "@/actions/admin-actions";

export const dynamic = "force-dynamic";

export default async function VagasPage() {
  const supabase = createClient();
  const { data: vagas } = await supabase.from("vagas").select("id, numero, status").order("numero");

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-semibold text-xl">Vagas</h2>
      </div>

      <form action={criarVaga} className="flex items-end gap-3 mb-6">
        <div>
          <label className="label" htmlFor="numero">Número da vaga</label>
          <input className="input" id="numero" name="numero" placeholder="Ex: 12" required />
        </div>
        <button className="btn btn-primary" type="submit">Adicionar vaga</button>
      </form>

      <div className="flex gap-4 text-xs text-ink-soft mb-4">
        <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded bg-asphalt inline-block" /> Ocupada</span>
        <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded border border-border inline-block" /> Livre</span>
      </div>

      <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
        {(vagas ?? []).map((v) => (
          <div
            key={v.id}
            title={`Vaga ${v.numero} — ${v.status}`}
            className={`aspect-square rounded flex items-center justify-center font-mono text-xs font-bold ${
              v.status === "ocupada"
                ? "bg-asphalt text-paper-2"
                : v.status === "inativa"
                ? "bg-border text-ink-soft"
                : "bg-paper-2 border border-dashed border-border text-ink-soft"
            }`}
          >
            {v.numero}
          </div>
        ))}
      </div>

      {(vagas ?? []).length === 0 && (
        <p className="text-sm text-ink-soft">Nenhuma vaga cadastrada ainda.</p>
      )}
    </div>
  );
}
