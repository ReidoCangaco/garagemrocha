# Pátio Central

Sistema de gestão de vagas de estacionamento mensalista — MVP.

Stack: Next.js (App Router) + TypeScript + Tailwind CSS + Supabase (Postgres + Auth) + Vercel.

## O que já funciona nesta versão

- Painel administrativo (login com e-mail/senha): dashboard, cadastro de vagas,
  cadastro completo de clientes (dados + veículo + contrato), geração automática
  de faturas do mês, marcação manual de pagamento, desativação de clientes.
- Portal do cliente **sem login**: cada cliente recebe um link pessoal
  (`/portal/SEU-TOKEN`) que mostra a vaga, a mensalidade atual e o histórico.
- PIX: cada fatura gera um QR Code + código "copia e cola" próprios (payload
  BR Code do Bacen), sem depender de nenhum provedor pago. A confirmação hoje
  é manual (o admin marca como paga); a Fase 2 (webhook automático de um
  provedor como Asaas/Efí/Mercado Pago) é um passo futuro, já compatível com
  o campo `pix_txid` gravado desde já.

## Passo a passo para colocar no ar (uns 15–20 min)

### 1. Criar o projeto no Supabase (grátis)

1. Crie uma conta em [supabase.com](https://supabase.com) e um novo projeto.
2. Vá em **SQL Editor**, cole o conteúdo de `supabase/schema.sql` e rode.
3. Vá em **Project Settings → API** e anote:
   - `Project URL`
   - `anon public key`
   - `service_role key` (fique atento: essa é secreta, nunca vai para o navegador)

### 2. Configurar o projeto localmente

```bash
npm install
cp .env.example .env.local
```

Preencha o `.env.local` com os valores do passo 1, mais os dados da sua chave
PIX (`PIX_CHAVE`, `PIX_NOME_RECEBEDOR`, `PIX_CIDADE`) e as credenciais do
primeiro admin (`ADMIN_EMAIL`, `ADMIN_SENHA`, `ADMIN_NOME`).

### 3. Criar o primeiro usuário administrador

```bash
npm run criar-admin
```

Isso cria o usuário no Supabase Auth e já registra ele como admin
(tabela `admin_users`). É a única forma de virar admin — não existe tela
pública de cadastro de administrador, de propósito.

### 4. Rodar localmente

```bash
npm run dev
```

Abra `http://localhost:3000/admin/login` e entre com o e-mail/senha do admin.

### 5. Publicar na Vercel (grátis)

1. Suba este projeto para um repositório no GitHub.
2. Em [vercel.com](https://vercel.com), importe o repositório.
3. Nas variáveis de ambiente do projeto na Vercel, adicione as mesmas do
   `.env.local` (exceto as `ADMIN_*`, que só servem para o script local).
4. Ajuste `NEXT_PUBLIC_SITE_URL` para a URL final da Vercel — é ela que entra
   nos links do portal que você envia aos clientes.
5. Deploy.

## Uso do dia a dia

1. **Cadastre as vagas** em `/admin/vagas`.
2. **Cadastre os clientes** em `/admin/clientes/novo` (isso já cria o veículo
   e o contrato, e ocupa a vaga escolhida).
3. Copie o **link do portal** na página do cliente (`/admin/clientes/[id]`) e
   envie por WhatsApp.
4. Todo mês, clique em **"Gerar faturas do mês"** em `/admin/faturas`
   (ou repita a chamada da função `gerar_faturas_mes` — dá para automatizar
   depois com o Supabase Cron, ver seção "Próximos passos").
5. Quando um cliente pagar, confira o PIX recebido e clique em
   **"marcar pago"** na fatura correspondente.

## Próximos passos (fora do escopo desta versão)

- **Geração automática de faturas por cron**: habilitar `pg_cron` no Supabase
  e agendar `select gerar_faturas_mes(date_trunc('month', now()));` todo dia 1.
- **Confirmação automática de PIX**: contratar um provedor (Asaas, Efí ou
  Mercado Pago — ver comparação na especificação técnica), criar a cobrança
  via API deles em vez do payload local, e implementar
  `POST /api/webhooks/pix` para receber a confirmação e atualizar a fatura.
- **Notificações de vencimento** por WhatsApp/e-mail.
- **Login com senha para o cliente**, se a base crescer muito e o reenvio
  manual do link virar trabalho — o campo `auth_user_id` já está reservado
  na tabela `clientes` para isso.

## Estrutura do projeto

```
supabase/schema.sql        → schema completo (rodar uma vez no Supabase)
scripts/criar-admin.mjs    → bootstrap do primeiro administrador
src/lib/                   → clientes Supabase, geração de PIX, formatação, CPF
src/actions/                → server actions (toda escrita de dados passa por aqui)
src/app/admin/...          → painel administrativo
src/app/portal/[token]/... → portal do cliente (sem login)
```
