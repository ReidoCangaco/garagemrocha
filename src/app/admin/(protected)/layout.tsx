import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sairDoAdmin } from "@/actions/auth-actions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  // Segunda checagem de verdade (não confia só no middleware): precisa
  // estar na allowlist admin_users. A policy "admin_ve_proprio_registro"
  // permite que o próprio usuário consulte essa linha.
  const { data: admin } = await supabase
    .from("admin_users")
    .select("id, nome")
    .eq("id", user.id)
    .maybeSingle();

  if (!admin) {
    redirect("/admin/login?erro=sem-permissao");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-paper-2">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <h1 className="font-display font-bold text-xl">
            Garagem Rocha<span className="text-signage">.</span>
          </h1>
          <form action={sairDoAdmin}>
            <button className="text-sm text-ink-soft hover:text-ink" type="submit">
              Sair ({admin.nome})
            </button>
          </form>
        </div>
        <nav className="max-w-5xl mx-auto px-5 flex gap-6 text-sm font-semibold overflow-x-auto">
          {[
            ["/admin", "Dashboard"],
            ["/admin/vagas", "Vagas"],
            ["/admin/clientes", "Clientes"],
            ["/admin/faturas", "Faturas"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="py-3 border-b-2 border-transparent hover:border-signage text-ink-soft hover:text-ink"
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="max-w-5xl mx-auto px-5 py-6">{children}</main>
    </div>
  );
}
