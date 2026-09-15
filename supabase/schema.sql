-- =====================================================================
-- PÁTIO CENTRAL — schema inicial (MVP)
-- Rode este arquivo inteiro no SQL Editor do Supabase (projeto novo).
-- =====================================================================

create extension if not exists "pgcrypto";

-- =========================================
-- ADMINISTRADORES (allowlist sobre auth.users)
-- =========================================
create table public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  created_at timestamptz not null default now()
);

-- =========================================
-- VAGAS
-- =========================================
create table public.vagas (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  status text not null default 'livre'
    check (status in ('livre', 'ocupada', 'inativa')),
  created_at timestamptz not null default now()
);

-- =========================================
-- CLIENTES
-- =========================================
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  portal_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  auth_user_id uuid unique references auth.users(id) on delete set null, -- reservado p/ futuro login com senha
  nome_completo text not null,
  cpf text not null unique,
  telefone text,
  email text,
  endereco text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.clientes (cpf);
create index on public.clientes (portal_token);

-- =========================================
-- VEÍCULOS
-- =========================================
create table public.veiculos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  placa text not null,
  modelo text,
  cor text,
  created_at timestamptz not null default now()
);

create index on public.veiculos (cliente_id);

-- =========================================
-- CONTRATOS
-- =========================================
create table public.contratos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  vaga_id uuid not null references public.vagas(id) on delete restrict,
  veiculo_id uuid references public.veiculos(id) on delete set null,
  valor_mensalidade numeric(10,2) not null check (valor_mensalidade > 0),
  dia_vencimento smallint not null check (dia_vencimento between 1 and 28),
  data_inicio date not null,
  data_fim date,
  status text not null default 'ativo'
    check (status in ('ativo', 'encerrado', 'suspenso')),
  created_at timestamptz not null default now()
);

create index on public.contratos (cliente_id);
create index on public.contratos (vaga_id);

create unique index contratos_vaga_ativa_unica
  on public.contratos (vaga_id)
  where status = 'ativo';

create or replace function public.sincronizar_status_vaga()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.vagas v
  set status = case
    when v.status = 'inativa' then 'inativa'
    when exists (
      select 1
      from public.contratos c
      where c.vaga_id = v.id
        and c.status = 'ativo'
    ) then 'ocupada'
    else 'livre'
  end
  where v.id = coalesce(new.vaga_id, old.vaga_id);

  return coalesce(new, old);
end;
$$;

create trigger trg_sincronizar_status_vaga_after_contrato
  after insert or update of vaga_id, status or delete
  on public.contratos
  for each row
  execute function public.sincronizar_status_vaga();

-- =========================================
-- FATURAS
-- =========================================
create table public.faturas (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references public.contratos(id) on delete cascade,
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  competencia date not null,
  valor numeric(10,2) not null check (valor > 0),
  data_vencimento date not null,
  status text not null default 'pendente'
    check (status in ('pendente', 'pago', 'cancelado')),
  data_pagamento timestamptz,
  forma_pagamento text,
  pix_txid text,
  pix_e2e_id text,
  created_at timestamptz not null default now(),
  constraint faturas_contrato_competencia_unica unique (contrato_id, competencia)
);

create index on public.faturas (cliente_id);
create index on public.faturas (status);
create index on public.faturas (data_vencimento);

-- =========================================
-- PAGAMENTOS (log/auditoria)
-- =========================================
create table public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  fatura_id uuid not null references public.faturas(id) on delete cascade,
  valor numeric(10,2) not null,
  metodo text not null,
  status text not null default 'confirmado'
    check (status in ('confirmado', 'estornado')),
  provedor text,
  provedor_payload jsonb,
  registrado_por uuid references public.admin_users(id),
  criado_em timestamptz not null default now()
);

create index on public.pagamentos (fatura_id);

-- =========================================
-- VIEW: status visual derivado (não altera dado, só exibe)
-- =========================================
create or replace view public.faturas_com_status_visual as
select
  f.*,
  case
    when f.status = 'pago' then 'pago'
    when f.status = 'cancelado' then 'cancelado'
    when f.data_vencimento < current_date then 'atrasado'
    when f.data_vencimento = current_date then 'vence_hoje'
    when f.data_vencimento <= current_date + interval '5 days' then 'proximo_vencimento'
    else 'em_dia'
  end as status_visual,
  case
    when f.status = 'pendente' and f.data_vencimento < current_date
      then (current_date - f.data_vencimento)
    else null
  end as dias_em_atraso
from public.faturas f;

-- =========================================
-- FUNÇÃO: gerar faturas do mês para todos os contratos ativos
-- =========================================
create or replace function public.gerar_faturas_mes(p_competencia date)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_competencia date := date_trunc('month', p_competencia)::date;
  v_inseridas integer;
begin
  insert into public.faturas (contrato_id, cliente_id, competencia, valor, data_vencimento)
  select
    c.id,
    c.cliente_id,
    v_competencia,
    c.valor_mensalidade,
    make_date(
      extract(year from v_competencia)::int,
      extract(month from v_competencia)::int,
      c.dia_vencimento
    )
  from public.contratos c
  where c.status = 'ativo'
    and (c.data_fim is null or c.data_fim >= v_competencia)
    and c.data_inicio <= (v_competencia + interval '1 month' - interval '1 day')
  on conflict (contrato_id, competencia) do nothing;

  get diagnostics v_inseridas = row_count;
  return v_inseridas;
end;
$$;

-- =========================================
-- FUNÇÃO: regenerar o link pessoal do portal de um cliente
-- (usada quando um link vaza ou é encaminhado por engano)
-- =========================================
create or replace function public.regenerar_portal_token(p_cliente_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_novo_token text := encode(gen_random_bytes(24), 'hex');
begin
  update public.clientes set portal_token = v_novo_token, updated_at = now()
  where id = p_cliente_id;
  return v_novo_token;
end;
$$;

-- =========================================
-- ROW LEVEL SECURITY
-- Cliente não tem sessão própria (acesso é via portal_token, resolvido no
-- servidor com a service_role key) — então aqui só existe a regra de admin.
-- =========================================
alter table public.clientes enable row level security;
alter table public.veiculos enable row level security;
alter table public.contratos enable row level security;
alter table public.faturas enable row level security;
alter table public.pagamentos enable row level security;
alter table public.vagas enable row level security;
alter table public.admin_users enable row level security;

-- Um admin autenticado pode verificar se ele mesmo é admin
create policy "admin_ve_proprio_registro"
  on public.admin_users for select
  using (id = auth.uid());

create policy "admin_acesso_total_clientes"
  on public.clientes for all
  using (exists (select 1 from public.admin_users where id = auth.uid()))
  with check (exists (select 1 from public.admin_users where id = auth.uid()));

create policy "admin_acesso_total_veiculos"
  on public.veiculos for all
  using (exists (select 1 from public.admin_users where id = auth.uid()))
  with check (exists (select 1 from public.admin_users where id = auth.uid()));

create policy "admin_acesso_total_contratos"
  on public.contratos for all
  using (exists (select 1 from public.admin_users where id = auth.uid()))
  with check (exists (select 1 from public.admin_users where id = auth.uid()));

create policy "admin_acesso_total_faturas"
  on public.faturas for all
  using (exists (select 1 from public.admin_users where id = auth.uid()))
  with check (exists (select 1 from public.admin_users where id = auth.uid()));

create policy "admin_acesso_total_pagamentos"
  on public.pagamentos for all
  using (exists (select 1 from public.admin_users where id = auth.uid()))
  with check (exists (select 1 from public.admin_users where id = auth.uid()));

create policy "admin_acesso_total_vagas"
  on public.vagas for all
  using (exists (select 1 from public.admin_users where id = auth.uid()))
  with check (exists (select 1 from public.admin_users where id = auth.uid()));

-- A view herda RLS das tabelas base automaticamente.
