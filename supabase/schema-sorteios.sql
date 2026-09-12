-- Cache de sorteios: prêmio estimado e próximo concurso vindos do portal da Caixa.
-- Execute no SQL Editor do Supabase.
--
-- O DIA e o HORÁRIO do sorteio NÃO ficam aqui: são determinísticos
-- (Mega-Sena quarta/sábado, Lotofácil segunda a sábado, sempre 20h) e o app
-- calcula no cliente. Aqui guardamos só o que precisa vir de fonte externa.
--
-- A gravação é feita pela Edge Function `fetch-sorteios` usando a
-- service_role key, que ignora RLS. Por isso só existe policy de leitura.

create table if not exists public.sorteios_cache (
  modalidade text primary key check (modalidade in ('megasena', 'lotofacil')),
  proximo_concurso integer not null check (proximo_concurso > 0),
  premio_estimado bigint not null check (premio_estimado > 0),
  data_atualizacao timestamptz not null default now()
);

create index if not exists sorteios_cache_data_atualizacao_idx
  on public.sorteios_cache (data_atualizacao);

alter table public.sorteios_cache enable row level security;

-- Prêmio estimado é informação pública: qualquer visitante pode ler.
drop policy if exists "public can read sorteios cache" on public.sorteios_cache;
create policy "public can read sorteios cache"
on public.sorteios_cache for select
to anon, authenticated
using (true);

-- Sem seed de dados: a tabela nasce vazia de propósito.
-- Enquanto a Edge Function não rodar, o app mostra "—" no prêmio em vez de
-- um número inventado. Rode a função uma vez para popular:
--   curl https://<project-ref>.supabase.co/functions/v1/fetch-sorteios

-- ---------------------------------------------------------------------------
-- MIGRAÇÃO (só se você chegou a criar a versão anterior desta tabela)
-- ---------------------------------------------------------------------------
-- A versão anterior tinha id bigint, proximo_sorteio, hora_sorteio e um seed
-- com valores fictícios. Para migrar, rode:
--
--   drop table if exists public.sorteios_cache;
--
-- e depois execute este arquivo novamente.
