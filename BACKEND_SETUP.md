# Backend — Configuração do Supabase

Todo dado de loteria exibido no app vem da Caixa através deste backend.
Nada de resultado, prêmio ou histórico é gerado no cliente.

## Por que existe um backend

O portal da Caixa não envia cabeçalhos CORS, então o navegador bloqueia a
chamada feita direto do app. As Edge Functions rodam no servidor, onde essa
restrição não existe, buscam o dado oficial e guardam no banco. O app lê do
banco.

```
Portal da Caixa  →  Edge Function (servidor)  →  Postgres  →  App
```

## Ordem de instalação

### 1. Tabelas (SQL Editor do Supabase)

Execute na ordem, cada arquivo inteiro:

| Arquivo | O que cria |
|---|---|
| `supabase/schema.sql` | Perfis, assinaturas, leads (instalação nova) |
| `supabase/migration-visitor-leads-phone.sql` | Torna o telefone opcional — **sem isso nenhum lead é salvo** |
| `supabase/schema-sorteios.sql` | Cache de prêmio estimado e próximo concurso |
| `supabase/schema-historico.sql` | Histórico oficial de concursos |

Se o banco já existe, pule o `schema.sql` e rode só os outros três.

### 2. Edge Functions

```bash
npm install -g supabase
supabase login
supabase link --project-ref cuqjmzkdwtfiicflksfs

supabase functions deploy fetch-sorteios
supabase functions deploy fetch-resultado
supabase functions deploy sync-historico
```

| Função | Responsabilidade | Quando roda |
|---|---|---|
| `fetch-sorteios` | Prêmio estimado e número do próximo concurso | Cron a cada 6h |
| `fetch-resultado` | Resultado oficial por concurso ou por data | Sob demanda, ao conferir bilhetes |
| `sync-historico` | Baixa concursos passados para as análises | Cron diário |

As três usam a `service_role` key, que o Supabase injeta automaticamente.
Nenhuma chave precisa ser colocada no código do app.

### 3. Carga inicial do histórico

`sync-historico` trabalha em lotes para não estourar o tempo limite da função
nem o rate limit da Caixa. Rode repetidamente até `faltam` chegar a zero:

```bash
BASE="https://cuqjmzkdwtfiicflksfs.supabase.co/functions/v1"

curl "$BASE/sync-historico?modalidade=megasena&quantidade=50&alvo=200"
curl "$BASE/sync-historico?modalidade=lotofacil&quantidade=50&alvo=200"
```

Resposta:

```json
{"resultado":[{"modalidade":"megasena","inseridos":50,"faltam":150,"total_no_banco":50,"ultimo_concurso":2861}]}
```

São 4 a 5 execuções por modalidade para chegar a 200 concursos.

### 4. Agendamento (Dashboard → Integrations → Cron)

| Função | Frequência sugerida | Motivo |
|---|---|---|
| `fetch-sorteios` | `0 */6 * * *` | O prêmio estimado muda entre sorteios |
| `sync-historico` | `0 3 * * *` | Pega o concurso da véspera; nada a fazer se já estiver no banco |

`fetch-resultado` não entra no cron: é chamada pelo app na hora de conferir.

## Como verificar se está no ar

No console do navegador, com o app aberto:

```javascript
window.historico.total()        // { megasena: 200, lotofacil: 200 }
window.sorteios.sincronizar()   // prêmios devem sair de "—"
window.conferencia.ultimo('megasena')
```

Pelo terminal:

```bash
curl "$BASE/fetch-resultado?modalidade=megasena"
curl "$BASE/fetch-resultado?modalidade=megasena&data=28/11/2024"
```

## Comportamento quando o backend está fora

O app nunca preenche lacuna com número inventado. O estado degradado é
sempre declarado na tela:

| Recurso | Sem backend |
|---|---|
| Data e hora do sorteio | Funciona (calendário é fixo e calculado no app) |
| Prêmio estimado | `—` |
| Conferir bilhete | `⚠️ Não foi possível conferir` |
| Bilhete com data futura | `⏳ Aguardando sorteio` |
| Mapa de calor, dezenas quentes/frias | Aviso de histórico não sincronizado |
| Retro-teste | Aviso de histórico não sincronizado |
| Gerar jogos, volante, carteira | Funciona normalmente |

O histórico fica em cache local por 12 horas, então uma queda curta do
servidor não derruba as análises.

## Solução de problemas

| Sintoma | Causa provável |
|---|---|
| Prêmio fica em `—` | `fetch-sorteios` nunca rodou; chame pela URL uma vez |
| `⚠️ Não foi possível conferir` | `fetch-resultado` não foi publicada |
| Análises avisando indisponível | Falta rodar a carga do `sync-historico` |
| Leads não aparecem na tabela | Falta a migration do telefone |
| `sync-historico` com `inseridos: 0` e `faltam > 0` | Caixa recusando conexão; espere alguns minutos |
