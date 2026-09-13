-- Créditos de análise grátis por cadastro (3, sem prazo — substitui o
-- antigo trial de 3 dias, que era só para quem escolhia o plano Mensal).
--
-- Execute no SQL Editor do Supabase.

alter table public.profiles
  add column if not exists analises_gratis_restantes integer not null default 3;

alter table public.profiles
  drop constraint if exists profiles_analises_gratis_restantes_check;

alter table public.profiles
  add constraint profiles_analises_gratis_restantes_check
  check (analises_gratis_restantes >= 0);

-- handle_new_user() (já existe) não precisa mudar: o default 3 já cobre
-- toda conta nova.

-- Decremento atômico: se o cliente decidisse "quantos créditos restam" e
-- mandasse o valor pronto, bastaria adulterar a chamada para nunca ficar
-- sem crédito. A função roda no servidor, com security definer, e só
-- decrementa se auth.uid() tiver saldo positivo — o mesmo princípio já
-- usado no resto do projeto para qualquer estado que precise ser confiável
-- (webhook de pagamento, RLS de exclusão de conta).
create or replace function public.consumir_analise_gratis()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  restantes integer;
begin
  update public.profiles
    set analises_gratis_restantes = analises_gratis_restantes - 1
  where id = auth.uid() and analises_gratis_restantes > 0
  returning analises_gratis_restantes into restantes;

  return restantes; -- null se não havia crédito
end;
$$;

revoke all on function public.consumir_analise_gratis() from public;
grant execute on function public.consumir_analise_gratis() to authenticated;
