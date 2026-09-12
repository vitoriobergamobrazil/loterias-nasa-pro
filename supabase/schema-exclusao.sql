-- Solicitações de exclusão de conta e dados.
--
-- Atende dois requisitos distintos:
--  * Google Play: desde 2023, todo app com criação de conta precisa oferecer
--    exclusão dentro do app E por uma URL pública, acessível sem instalar o
--    app e sem fazer login.
--  * LGPD Art. 18, VI: direito à eliminação dos dados pessoais.
--
-- Pedidos feitos de dentro do app, com sessão autenticada, são executados na
-- hora. Pedidos vindos da página pública entram aqui para processamento,
-- porque sem sessão não há como provar a titularidade do e-mail.
--
-- Execute no SQL Editor do Supabase.

create type public.exclusao_status as enum ('pendente', 'concluida', 'rejeitada');

create table if not exists public.exclusao_solicitacoes (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) between 5 and 254),
  motivo text check (motivo is null or char_length(motivo) <= 1000),
  origem text not null default 'web' check (origem in ('web', 'app')),
  status public.exclusao_status not null default 'pendente',
  solicitado_em timestamptz not null default now(),
  processado_em timestamptz,
  observacao text
);

create index if not exists exclusao_solicitacoes_status_idx
  on public.exclusao_solicitacoes (status, solicitado_em);

create index if not exists exclusao_solicitacoes_email_idx
  on public.exclusao_solicitacoes (email);

alter table public.exclusao_solicitacoes enable row level security;

-- Qualquer pessoa pode ABRIR um pedido: é o requisito da página pública.
-- Ninguém pode ler a fila pelo navegador — ela expõe e-mails de terceiros.
drop policy if exists "anyone can request deletion" on public.exclusao_solicitacoes;
create policy "anyone can request deletion"
on public.exclusao_solicitacoes for insert
to anon, authenticated
with check (status = 'pendente');

drop policy if exists "owners can read deletion queue" on public.exclusao_solicitacoes;
create policy "owners can read deletion queue"
on public.exclusao_solicitacoes for select
to authenticated
using (public.is_owner());

drop policy if exists "owners can process deletion queue" on public.exclusao_solicitacoes;
create policy "owners can process deletion queue"
on public.exclusao_solicitacoes for update
to authenticated
using (public.is_owner())
with check (public.is_owner());

-- Fila do dia a dia:
--   select * from public.exclusao_solicitacoes
--   where status = 'pendente' order by solicitado_em;
