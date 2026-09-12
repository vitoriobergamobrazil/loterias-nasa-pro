-- Cobranças do Asaas.
--
-- Liga a cobrança criada no gateway ao usuário e ao plano. Sem essa ponte, o
-- webhook recebe "pagamento X confirmado" e não tem como saber de quem é.
--
-- Execute no SQL Editor do Supabase.

create type public.cobranca_status as enum (
  'pendente',
  'confirmada',
  'recebida',
  'vencida',
  'estornada',
  'cancelada'
);

create table if not exists public.cobrancas (
  -- id da cobrança no Asaas (ex.: "pay_080225913252"), chave natural do webhook
  id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  plano text not null,
  valor numeric(10,2) not null check (valor > 0),
  metodo text not null check (metodo in ('PIX', 'CREDIT_CARD', 'BOLETO', 'UNDEFINED')),
  status public.cobranca_status not null default 'pendente',
  url_pagamento text,
  vence_em date,
  criada_em timestamptz not null default now(),
  paga_em timestamptz,
  evento_bruto jsonb
);

create index if not exists cobrancas_user_idx on public.cobrancas (user_id, criada_em desc);
create index if not exists cobrancas_email_idx on public.cobrancas (email);
create index if not exists cobrancas_status_idx on public.cobrancas (status);

alter table public.cobrancas enable row level security;

-- Cada pessoa enxerga só as próprias cobranças.
drop policy if exists "users read own charges" on public.cobrancas;
create policy "users read own charges"
on public.cobrancas for select
to authenticated
using (user_id = auth.uid() or public.is_owner());

-- Nenhuma policy de escrita: quem grava é a Edge Function via service_role.
-- O navegador não pode criar nem confirmar cobrança — isso é o que impede
-- alguém de marcar o próprio pagamento como recebido.

-- Guarda o id do cliente no Asaas para não recriar cadastro a cada cobrança.
alter table public.profiles
  add column if not exists asaas_customer_id text;

create index if not exists profiles_asaas_customer_idx
  on public.profiles (asaas_customer_id);
