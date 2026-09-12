-- Correção: o formulário de captura na home trata o WhatsApp como OPCIONAL,
-- mas a tabela exigia phone NOT NULL. Resultado: todo lead que não informava
-- telefone era rejeitado pelo banco e perdido silenciosamente.
--
-- Execute no SQL Editor do Supabase.

alter table public.visitor_leads
  alter column phone drop not null;

-- O check original rejeitava qualquer valor fora de 8..20 caracteres,
-- incluindo NULL em alguns cenários. Recria aceitando ausência de telefone.
alter table public.visitor_leads
  drop constraint if exists visitor_leads_phone_check;

alter table public.visitor_leads
  add constraint visitor_leads_phone_check
  check (phone is null or char_length(phone) between 8 and 20);

-- A policy de insert já existe e continua válida:
--   "visitors can register with consent" (with check marketing_consent = true)
