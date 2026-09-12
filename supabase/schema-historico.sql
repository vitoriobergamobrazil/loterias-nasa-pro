-- Histórico oficial de concursos da Caixa.
-- Substitui o histórico que era fabricado com Math.random() no cliente e que
-- alimentava o simulador de desempenho, o mapa de calor e o ranking de
-- dezenas quentes/frias.
--
-- Execute no SQL Editor do Supabase.

create table if not exists public.concursos_historico (
  modalidade text not null check (modalidade in ('megasena', 'lotofacil')),
  concurso integer not null check (concurso > 0),
  data_apuracao date not null,
  dezenas smallint[] not null check (array_length(dezenas, 1) between 6 and 20),
  acumulado boolean not null default false,
  rateio jsonb not null default '[]'::jsonb,
  sincronizado_em timestamptz not null default now(),
  primary key (modalidade, concurso)
);

-- As análises leem sempre "os N mais recentes desta modalidade".
create index if not exists concursos_historico_recentes_idx
  on public.concursos_historico (modalidade, concurso desc);

alter table public.concursos_historico enable row level security;

-- Resultado de loteria é informação pública.
drop policy if exists "public can read historico" on public.concursos_historico;
create policy "public can read historico"
on public.concursos_historico for select
to anon, authenticated
using (true);

-- A escrita é feita só pela Edge Function sync-historico, que usa a
-- service_role key e portanto ignora RLS. Nenhuma policy de escrita aqui:
-- o navegador não deve conseguir inventar resultado de sorteio.

-- Popule rodando a Edge Function (repita até total_no_banco parar de subir):
--   curl "https://<project-ref>.supabase.co/functions/v1/sync-historico?modalidade=megasena&quantidade=50"
--   curl "https://<project-ref>.supabase.co/functions/v1/sync-historico?modalidade=lotofacil&quantidade=50"
