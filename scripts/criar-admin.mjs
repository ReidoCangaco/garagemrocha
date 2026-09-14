// Cria o primeiro admin: um usuário no Supabase Auth + a linha correspondente
// em admin_users. Rode uma única vez, localmente, depois de configurar o .env:
//
//   npm run criar-admin
//
// Usa as variáveis ADMIN_EMAIL, ADMIN_SENHA, ADMIN_NOME do seu .env.local
// e a SUPABASE_SERVICE_ROLE_KEY (nunca rode isso a partir do navegador).

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL;
const senha = process.env.ADMIN_SENHA;
const nome = process.env.ADMIN_NOME || "Administrador";

if (!url || !serviceKey || !email || !senha) {
  console.error(
    "Faltam variáveis no .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_SENHA"
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: usuarioCriado, error: erroCriacao } = await supabase.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  });

  if (erroCriacao) {
    console.error("Erro ao criar usuário no Supabase Auth:", erroCriacao.message);
    process.exit(1);
  }

  const { error: erroAdmin } = await supabase
    .from("admin_users")
    .insert({ id: usuarioCriado.user.id, nome });

  if (erroAdmin) {
    console.error("Usuário criado, mas houve erro ao registrar em admin_users:", erroAdmin.message);
    process.exit(1);
  }

  console.log(`Admin criado com sucesso: ${email}`);
  console.log("Já pode fazer login em /admin/login com esse e-mail e a senha definida no .env.local.");
}

main();
