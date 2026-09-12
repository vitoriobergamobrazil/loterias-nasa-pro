# Publicação na Google Play — conformidade

Documento de apoio para o preenchimento do Play Console. Cada resposta abaixo
reflete o que o código realmente faz hoje.

URLs públicas (já no ar pelo GitHub Pages):

- Política de Privacidade: `https://vitoriobergamobrazil.github.io/loterias-nasa-pro/privacidade.html`
- Exclusão de conta: `https://vitoriobergamobrazil.github.io/loterias-nasa-pro/excluir-conta.html`

---

## ⛔ Bloqueador antes de submeter: forma de pagamento

A política **Google Play Payments** exige que assinaturas e conteúdo digital
consumidos dentro do app usem **Google Play Billing**. O app vende hoje planos
PRO por **PIX**, que é cobrança externa — isso é motivo de reprovação e, se
passar despercebido na revisão, de remoção posterior.

Três saídas possíveis:

1. **Integrar Google Play Billing** para as assinaturas. É o caminho padrão.
   O Google fica com a comissão (15% no primeiro milhão de dólares por ano).
2. **Publicar sem venda no app**: o APK oferece só o plano gratuito, e a
   assinatura é feita no site. O app **não pode** ter botão, link ou texto
   levando ao pagamento externo — a política proíbe até a menção.
3. **Manter PIX apenas na versão web** (PWA pelo navegador), que não passa pela
   Play Store, e publicar na loja uma versão sem venda.

Enquanto isso não estiver definido, o restante do checklist não adianta: a
submissão cai na revisão de pagamentos.

> Observação: o `confirmarPagamentoSimulado()` hoje recusa PIX Avulso e Anual
> com mensagem honesta de "gateway não conectado", e só o teste de 3 dias
> libera acesso. Ou seja, no estado atual **não há cobrança real acontecendo** —
> o que dá tempo de decidir o caminho antes de ligar qualquer gateway.

---

## Data safety — respostas

### Coleta e compartilhamento

| Tipo de dado | Coletado | Compartilhado | Obrigatório | Finalidade |
|---|---|---|---|---|
| Nome | Sim | Não | Sim | Funcionalidade do app; comunicações |
| E-mail | Sim | Não | Sim | Funcionalidade do app; gerenciamento de conta; comunicações |
| Telefone | Sim | Não | **Não** | Comunicações (marketing) |
| IDs de usuário | Sim | Não | Sim | Gerenciamento de conta |
| Fotos (foto de perfil do login social) | Sim | Não | Não | Personalização do perfil |

Declarar **Não** para: localização, informações financeiras, saúde, mensagens,
contatos, calendário, arquivos, atividade de navegação, histórico de busca,
apps instalados, desempenho do app, diagnósticos, gravações de áudio.

Ponto de atenção ao preencher: "Compartilhado" no vocabulário do Google
significa transferir a terceiros. Supabase é **processador** (infraestrutura
contratada), então **não** conta como compartilhamento. Google e Meta aparecem
como provedores de login — os dados vêm deles para você, e não o contrário.

### Perguntas de segurança

| Pergunta | Resposta |
|---|---|
| Dados são criptografados em trânsito? | **Sim** (HTTPS em toda a comunicação) |
| O usuário pode pedir exclusão dos dados? | **Sim** — dentro do app e pela URL pública |
| Dados coletados são obrigatórios ou opcionais? | Telefone e foto são opcionais; nome e e-mail, obrigatórios |
| Segue a Families Policy? | **Não se aplica** — app 18+ |
| Passou por revisão de segurança independente? | Não |

### Finalidades a marcar

- Funcionalidade do app
- Gerenciamento de conta
- Comunicações com o desenvolvedor (só para telefone/e-mail, com consentimento)

Não marcar: publicidade ou marketing de terceiros, análise, personalização de
anúncios, prevenção a fraude, conformidade legal.

---

## Classificação de conteúdo (IARC)

Responda com atenção — é aqui que um app de loteria costuma tropeçar.

| Pergunta do questionário | Resposta | Por quê |
|---|---|---|
| O app permite apostar dinheiro real? | **Não** | O app não recebe aposta nem paga prêmio |
| O app ensina ou simula jogo de azar? | **Não** | Não há simulação de cassino nem de partida |
| O app faz referência a jogos de azar? | **Sim** | Trata de loterias oficiais da Caixa |
| Tem conteúdo sexual, violência, linguagem imprópria, drogas? | **Não** | — |
| Tem interação entre usuários? | **Não** | Não há chat, comentário ou perfil público |
| Compartilha localização? | **Não** | — |
| Permite compras digitais? | Depende da decisão sobre pagamento (ver bloqueador acima) | — |

Classificação esperada: **18 anos**, por referência a jogos de azar. Marque o
público-alvo como adulto; **não** inclua faixas infantis, ou o app entra na
Families Policy e será reprovado.

---

## Políticas relevantes e situação atual

### Real-Money Gambling, Games, and Contests

O app é uma ferramenta de organização e conferência, não uma casa lotérica.
Para sustentar isso na revisão, a descrição na loja deve dizer explicitamente
que o app **não recebe apostas, não movimenta dinheiro de apostas e não paga
prêmios**. Esse texto já está no rodapé do app e no topo da política.

O risco real aqui é de **alegação enganosa**: prometer aumento de chance de
ganhar viola tanto a política do Google quanto o Art. 37 do CDC. Por isso:

- Nenhum número exibido é inventado. Prêmio, resultado e histórico vêm da
  Caixa; sem fonte, a tela mostra "—" ou avisa que está indisponível.
- A conferência de bilhete nunca diz "não premiado" sem ter comparado com o
  resultado oficial daquela data.
- O aviso legal de que não há garantia de ganho está no app.

Revise os textos de marketing com o mesmo critério: "análise estatística" é
defensável; "aumente suas chances" não é.

### Exclusão de conta (obrigatória desde 2023)

| Requisito | Situação |
|---|---|
| Excluir a conta dentro do app | Menu de conta → "Meus Dados (Art. 18 LGPD)" → "Excluir Todos Meus Dados" |
| URL pública, sem login e sem instalar | `excluir-conta.html` |
| Informar o que é apagado e o que é retido | Tabela na própria página |
| Apagar de fato no servidor | Edge Function `delete-account` |

### Dados do usuário

| Requisito | Situação |
|---|---|
| Política de privacidade acessível | `privacidade.html`, sem login |
| Link no Play Console e dentro do app | A cadastrar no Console; rodapé do app já linka |
| Coleta limitada ao necessário | Só nome, e-mail e telefone opcional |
| Consentimento de marketing separado | Caixa própria, recusável, app funciona sem |

### Permissões

O app é uma TWA e não pede permissões sensíveis: sem localização, câmera,
microfone, contatos ou armazenamento externo. Nada a justificar no Console.

---

## Checklist antes de enviar

**Decisão pendente**

- [ ] Definir o caminho de pagamento (Play Billing, ou remover a venda do app)

**Backend no ar** (ver `BACKEND_SETUP.md`)

- [ ] 5 SQLs executados, incluindo `schema-exclusao.sql`
- [ ] 4 Edge Functions publicadas, incluindo `delete-account`
- [ ] Histórico carregado (`window.historico.total()` retornando ~200 de cada)
- [ ] Testar exclusão de conta ponta a ponta, pelo app e pela página

**Play Console**

- [ ] URL da política de privacidade cadastrada
- [ ] URL de exclusão de conta cadastrada em *App content → Data deletion*
- [ ] Data safety preenchido conforme as tabelas acima
- [ ] Questionário IARC respondido
- [ ] Público-alvo: 18+, sem faixas infantis
- [ ] Descrição afirmando que o app não recebe apostas nem paga prêmios
- [ ] Declaração de anúncios: não contém

**Técnico (TWA)**

- [ ] `assetlinks.json` servido em `/.well-known/` com o fingerprint SHA-256 do
      certificado de publicação (não o de debug)
- [ ] `manifest.json` com nome, ícones 192/512 e `start_url` corretos
- [ ] Testar a build assinada em aparelho real antes de subir

**Conferir na versão final**

- [ ] Nenhum valor de prêmio ou resultado gerado no cliente
- [ ] Rodapé linkando política de privacidade e exclusão de conta
- [ ] Aviso 18+ visível
