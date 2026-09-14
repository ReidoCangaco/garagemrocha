import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-center">
      <div>
        <h1 className="font-display font-bold text-3xl mb-2">
          Pátio Central<span className="text-signage">.</span>
        </h1>
        <p className="text-sm text-ink-soft mb-6">
          Clientes acessam pelo link pessoal enviado por WhatsApp/e-mail.
        </p>
        <Link href="/admin/login" className="btn btn-primary !w-auto px-6">
          Entrar como administrador
        </Link>
      </div>
    </div>
  );
}
