# Backend Sorteios - Configuração Supabase

## O que é?

Sistema robusto que scrapa dados REAIS de loterias da Caixa e os armazena no Supabase. O app lê esses dados (sem problemas de CORS).

## Como funciona?

```
1. Edge Function (Supabase) roda a cada 6h
   ↓
2. Fetcha dados reais da Caixa (ou calcula se falhar)
   ↓
3. Salva em tabela `sorteios_cache`
   ↓
4. App lê da tabela → mostra prêmios reais
   ↓
5. Pop-ups com dados REAIS disparados
```

## Setup Passo a Passo

### 1️⃣ **Criar tabela no Supabase**

Ir em: **Supabase Dashboard → SQL Editor** e executar:

```sql
-- Copy-paste do arquivo: supabase/schema-sorteios.sql
```

[Abra o arquivo `supabase/schema-sorteios.sql` e cole tudo lá]

### 2️⃣ **Deploy da Edge Function**

Terminal:
```bash
cd supabase
supabase functions deploy fetch-sorteios
```

Se não tem `supabase` CLI:
```bash
npm install -g supabase
supabase login
supabase link --project-ref [seu-project-id]
supabase functions deploy fetch-sorteios
```

### 3️⃣ **Atualizar URL no app**

Arquivo: `js/sorteios-reais.js`, linha ~11:

```javascript
functionUrl: 'https://[seu-project-id].supabase.co/functions/v1/fetch-sorteios'
```

Substituir `[seu-project-id]` por seu Supabase project ID.

Achar em: Supabase Dashboard → Settings → General → Project ID

### 4️⃣ **Setup automático (Cron)**

Supabase > SQL Editor > criar nova query:

```sql
-- Cron job: rodar fetch-sorteios a cada 6 horas
-- Vá em Dashboard > Cron > New cron
-- Command: SELECT net.http_post(
--   url := 'https://[seu-project-id].supabase.co/functions/v1/fetch-sorteios',
--   body := '{}'::jsonb
-- ) as request_id;
```

Ou deixar o app chamar manualmente (menos automatizado).

## Resultado

✅ App sempre mostra dados REAIS (sem CORS)
✅ Pop-ups disparados com prêmios corretos
✅ Funciona offline (cache + fallback inteligente)
✅ Escalável para produção

## Debug

Console do navegador:
```javascript
// Forçar sync manual
window.sorteios.sincronizar()

// Ver dados salvos
window.sorteios.ultimos()

// Ver status
fetch('https://[seu-project-id].supabase.co/functions/v1/fetch-sorteios')
  .then(r => r.json())
  .then(console.log)
```

## Troubleshooting

| Problema | Solução |
|----------|---------|
| "functionUrl undefined" | Atualizar URL em sorteios-reais.js |
| "401 Unauthorized" | Verificar se service_role key está correta |
| "Modo offline" | Função não rodou ainda. Clicar "Sincronizar" manualmente |
| Prêmios não aparecem | Ver console (`fetch(...).then(console.log)`) |

## Próximos passos

1. Executar SQL do schema
2. Deploy da função
3. Atualizar URL no app
4. Testar: clicar "Sincronizar Caixa"
5. Ver prêmios REAIS aparecendo

Qualquer dúvida, me avisa! 🚀
