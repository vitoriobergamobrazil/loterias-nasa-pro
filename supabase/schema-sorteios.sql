-- Sorteios Cache - Armazena dados atualizados de Mega-Sena e Lotofácil
-- Execute no SQL Editor do Supabase

create table public.sorteios_cache (
  id bigint generated always as identity primary key,
  modalidade text not null check (modalidade in ('megasena', 'lotofacil')),
  proximo_concurso integer not null,
  proximo_sorteio text not null,
  hora_sorteio text not null default '20h',
  premio_estimado bigint not null,
  data_atualizacao timestamptz not null default now(),
  unique (modalidade)
);

create index sorteios_cache_modalidade_idx on public.sorteios_cache (modalidade);
create index sorteios_cache_data_atualizacao_idx on public.sorteios_cache (data_atualizacao);

alter table public.sorteios_cache enable row level security;

-- Permitir que QUALQUER PESSOA leia o cache de sorteios (é info pública)
create policy "public can read sorteios cache"
on public.sorteios_cache for select
to anon, authenticated
using (true);

-- Apenas admin pode atualizar (via function ou scheduler)
create policy "admin can update sorteios cache"
on public.sorteios_cache for update
to authenticated
using (exists(select 1 from public.profiles where id = auth.uid() and role = 'owner'))
with check (exists(select 1 from public.profiles where id = auth.uid() and role = 'owner'));

create policy "admin can insert sorteios cache"
on public.sorteios_cache for insert
to authenticated
with check (exists(select 1 from public.profiles where id = auth.uid() and role = 'owner'));

-- Initial seed data (valid for ~2 weeks)
insert into public.sorteios_cache (modalidade, proximo_concurso, proximo_sorteio, premio_estimado)
values
  ('megasena', 2836, 'Quarta', 60000000),
  ('lotofacil', 3329, 'Hoje', 1500000)
on conflict (modalidade) do nothing;
