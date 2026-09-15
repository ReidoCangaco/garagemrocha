import { entrarComoAdmin } from "@/actions/auth-actions";

const MENSAGENS: Record<string, string> = {
  credenciais: "E-mail ou senha incorretos.",
  "sem-permissao": "Este usuário não tem acesso ao painel administrativo.",
};

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { erro?: string };
}) {
  const mensagemErro = searchParams.erro ? MENSAGENS[searchParams.erro] : null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display font-bold text-3xl mb-1">
          Garagem Rocha<span className="text-signage">.</span>
        </h1>
        <p className="text-sm text-ink-soft mb-8">Painel administrativo</p>

        {mensagemErro && (
          <div className="mb-4 rounded-lg bg-late-bg text-late text-sm px-3 py-2.5">
            {mensagemErro}
          </div>
        )}

        <form action={entrarComoAdmin} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">E-mail</label>
            <input className="input" type="email" id="email" name="email" required autoFocus />
          </div>
          <div>
            <label className="label" htmlFor="senha">Senha</label>
            <input className="input" type="password" id="senha" name="senha" required />
          </div>
          <button className="btn btn-primary w-full" type="submit">Entrar</button>
        </form>
      </div>
    </div>
  );
}
