# HANDOFF — Plataforma de Inscrição Camerata 21
**Data:** 18/07/2026 · **Status:** em produção, com pendências de validação

---

## 1. O QUE É

Plataforma web para inscrição de instrumentistas da **Camerata 21 — Orquestra Afro-Brasileira da Universidade Zumbi dos Palmares**.

**Escopo deliberadamente restrito:** a plataforma serve *exclusivamente* para captar inscrições. Não vende, não persuade, não faz marketing. A landing institucional existe apenas como contexto para quem quiser saber mais — acessível por menu e oferecida ao final do processo.

**Stack:** Google Apps Script (backend + serving) + Google Sheets (banco de dados) + Netlify (landing em domínio próprio). Custo zero.

---

## 2. ARQUITETURA ATUAL

### 2.1 Projeto Google Apps Script
Nome: **"Inscrições Camerata 21"**

| Arquivo | Função |
|---|---|
| `Code.gs` | Backend completo: roteamento, gravação, logística, e-mails, OTP, dashboard |
| `index.html` | Landing institucional (versão servida pelo GAS) |
| `cadastro.html` | Wizard de inscrição, 13 telas |
| `admin.html` | Dashboard administrativo com login OTP |

⚠️ **Nomes dos arquivos HTML devem ser minúsculos.** `HtmlService` é case-sensitive. Já houve erro `No HTML file named index was found` por terem sido criados como `Index.html`.

### 2.2 Rotas
| URL | Destino |
|---|---|
| `/exec` | Landing |
| `/exec?page=cadastro` | Formulário |
| `/exec?page=admin` | Dashboard |

Roteamento por query string (`e.parameter.page`), **não** por `e.pathInfo` — este último quebra quando `e` chega vazio.

### 2.3 Planilha (ID: `1T7zvDl_w8irOdk8VeIz2iMKlEO94Dv6G8_cHwTQSWSg`)
6 abas, criadas automaticamente por `setupPlanilha()`:

| Aba | Conteúdo |
|---|---|
| **Admins** | Email, Nome, Tipo — controla acesso ao dashboard |
| **Inscrições** | 22 colunas (ver ordem exata no `prepareSheetRow`) |
| **Pré-Convocados** | 35 músicos já mapeados, semeados por `seedPreCadastro()` |
| **Partituras** | Controle de edição de partes (ainda não usada) |
| **Logística** | Estrutura criada, ainda não populada |
| **TempOTP** | Códigos temporários de acesso admin |

**Ordem das colunas de Inscrições** (crítico — o dashboard lê por índice):
`Timestamp | Nome Completo | Nome Artístico | E-mail | Telefone | Instrumento | Piccolo | Corne Inglês | Clarone/Requinta | Disp. Ensaio 16/Ago | Aceite Repertório | Ranking Repertório | Material | Estante Própria | Disp. Concerto 20/Nov | Disp. Semana Concerto | CEP | Transporte | Distância | Tempo | Custo Estimado | Status`

### 2.4 Funções do Code.gs
| Função | Uso |
|---|---|
| `doGet(e)` | Roteamento; injeta `baseUrl` nos templates; seta meta viewport |
| `setupPlanilha()` | **Executar 1x manualmente.** Cria abas e cabeçalhos; adiciona dono como Super Admin |
| `seedPreCadastro()` | **Executar 1x manualmente.** Semeia os 35 pré-convocados |
| `checkEmail(email)` | Checagem de duplicidade chamada pela Tela 01 |
| `processRegistration(formData)` | Valida, checa duplicidade, calcula logística, grava, dispara e-mails |
| `calculateLogistics(cep)` | Geocoding + rota até a UZP via serviço nativo `Maps` |
| `calculateCost(m, transporte)` | Uber: R$2,50/km + R$5 base · Público: R$10,40 (ida/volta) · Carro: 0 |
| `sendConfirmationEmail(d, log)` | E-mail ao músico com espelho completo dos dados + logo UZP via CID |
| `notifyAdmin(d)` | E-mail estilizado aos admins com botão para a planilha |
| `requestOTP` / `validateOTP` | Login passwordless, código de 6 dígitos, validade 10 min |
| `getDashboardData()` | Total, % de meta, metas por naipe, custo somado, distribuição por transporte, 10 recentes |

### 2.5 Netlify (landing em domínio próprio)
- **Domínio:** `camerata21.com` (comprado no **Squarespace**)
- **Site Netlify:** `warm-custard-e097e1.netlify.app`
- **DNS configurado no Squarespace:** registro `A @ → 75.2.60.5` e `CNAME www → warm-custard-e097e1.netlify.app` ✓
- **Status em 18/07:** aguardando propagação (TTL 4h)
- **Pasta de deploy:** `index.html` + `_redirects` (arrastar a pasta inteira em Deploy manually)

**Conteúdo do `_redirects`:**
```
/inscricao   [URL_GAS]/exec?page=cadastro   302
/admin       [URL_GAS]/exec?page=admin      302
```

**Decisão de arquitetura importante:** os botões da landing apontam para `/inscricao` e `/admin` (rotas do próprio domínio), não para a URL do Google. Se a URL do GAS mudar, edita-se **apenas o `_redirects`** — os links já divulgados no WhatsApp continuam válidos.

**URL do deploy atual (18/07):**
`https://script.google.com/macros/s/AKfycbwAcNcRzaG-0shUIKtn_WgQlvbQRCcS5y2F2h-TC4z01lifoAtphz1hPPG4M3qGf7mqIA/exec`

---

## 3. O FLUXO DE INSCRIÇÃO (13 telas)

| # | Tela | Interação |
|---|---|---|
| 0 | Poka-yoke de abandono ("reserve 3 minutos") | botão |
| 1 | E-mail + confirmação | **digitação** + checagem de duplicidade ao vivo |
| 2 | Nome, sobrenome, **nome artístico** (opcional) | digitação |
| 3 | WhatsApp com seletor de DDI | digitação + select |
| 4 | Instrumento (13 opções, inclui Percussão) | cards |
| 4b | Condicional: Piccolo / Corne Inglês / Clarone-Requinta | cards |
| 5 | Disponibilidade ensaio 16/Ago (a partir das 18h, ~3h) | cards, avanço automático |
| 6 | Ciência do repertório + aviso de partituras em breve | checkbox |
| 7 | Ranking de preferência do repertório | drag & drop + setas ↑↓ |
| 8 | Material (tablet/impresso) **+ estante própria** | cards |
| 9 | Ponte ("partituras em breve") | botão |
| 10 | Disponibilidade concerto 20/Nov (Sala São Paulo) | cards, avanço automático |
| 11 | Disponibilidade semana do concerto | cards, avanço automático |
| 12 | CEP (validação ViaCEP) + transporte | digitação mínima + cards |
| 13 | Revisão com **botão Editar por linha** | botões |
| fim | "Obrigado, [nome]" + botão + redirect automático em 10s | — |

**Recursos transversais:** barra de progresso com %, botão **↺ Recomeçar** (telas 1–13), modo edição que retorna à revisão automaticamente, histórico de navegação para o botão ←.

---

## 4. IDENTIDADE VISUAL

```
--meianoite   #1F0A33   fundo principal
--meianoite-2 #2A1244   cards e inputs
--farol       #FFB800   dourado, cor de ação
--acido       #B2FF05   verde-limão, confirmações
--cobalto     #2E4BFF   azul, avisos
--pergaminho  #F2EDE2   texto e fundos claros
--tinta       #17082A   texto sobre dourado
--erro        #FF3D5A
```
**Tipografia:** Fraunces (títulos, 900, itálico para ênfase) + Space Grotesk (corpo, 300).
**Motivos:** suturas tracejadas douradas, wordmark `CAMERATA21` com "21" em itálico menor.

**Tom de voz definido:** NuBank + Rodrigo da Mata — profissional, elegante, artístico, sem formalidade excessiva, dialogando com a Gen Z.

**Imagens embutidas em base64** no `index.html` (arquivo tem ~285KB por isso):
1. Foto de regência (P&B, hero em tela cheia)
2. Headshot formal do João (seção Regência)
3. Foto do Dr. José Vicente (seção A Universidade)
4. Logo UZP

**Decisão de design:** a seção "A Universidade" tem fundo **pergaminho** (invertido), porque a logo da UZP é azul sobre branco e ficaria suja em fundo escuro. Delimitada por suturas tracejadas douradas.

**Tratamento do reitor:** foto + legenda seca "Dr. José Vicente · Reitor" + texto sobre *a universidade*, não sobre a pessoa. Âncora institucional, não homenagem — evita o tom puxa-saco.

---

## 5. ARMADILHAS TÉCNICAS JÁ MAPEADAS

| Armadilha | Regra |
|---|---|
| **Deploy não atualiza** | Colar código novo **não** publica. É obrigatório: Implantar → Gerenciar implantações → ✏️ → **Nova versão**. Editar a implantação existente (não criar nova) mantém a URL estável |
| **Links não funcionam** | O GAS serve dentro de iframe sandbox. Todo link interno precisa de `target="_top"` |
| **Nomes de arquivo** | Minúsculos, sem extensão ao criar (o GAS anexa `.html` sozinho) |
| **Viewport mobile** | O `<meta viewport>` do HTML é descartado. Quem garante mobile é `.addMetaTag("viewport", ...)` no `doGet` |
| **APIs** | `MailApp` e `Maps` são nativos. **Não** habilitar Gmail API nem Drive API em Serviços |
| **Imagens em e-mail** | Gmail bloqueia base64 inline. Usar `inlineImages` + `cid:` (é como a logo UZP chega) |
| **Cota de e-mail** | MailApp: 100/dia em conta gratuita. Com 35+ inscritos, monitorar |

---

## 6. PENDÊNCIAS

### 6.1 Não validado em produção
Estes recursos foram entregues em código, mas **os últimos testes do usuário ocorreram antes do redeploy** — os e-mails vistos às 6h59 e 7h21 eram da versão antiga:
- [ ] E-mail de confirmação com wordmark + logo UZP + espelho de 100% dos dados
- [ ] E-mail de notificação ao admin estilizado
- [ ] Link "Área administrativa" no rodapé da landing
- [ ] Checagem de duplicidade na Tela 01
- [ ] Botões "Editar" na tela de revisão
- [ ] Botão "↺ Recomeçar"
- [ ] Tela final "Obrigado" + redirect automático
- [ ] Dashboard com metas, % e custo dinâmico

**Antes de testar:** apagar a linha de teste da aba Inscrições (senão o próprio e-mail bloqueia novos testes).

### 6.2 Dados a confirmar
- [ ] **`DESTINO_UZP`** no Code.gs está como "Av. Santos Dumont, 843, São Paulo" — **nunca foi confirmado**. Afeta todo o cálculo de distância e custo
- [ ] O concerto de 20/11 é na **Sala São Paulo**; o vínculo com o **Troféu Raça Negra** foi removido dos textos e não foi esclarecido se deve voltar
- [ ] Metas por naipe no Code.gs (constante `METAS`) foram inferidas do elenco: 14 violinos, 4 violas, 4 cellos, 2 baixos, 2 de cada sopro, 1 percussão = 37
- [ ] E-mail do **Dr. José Vicente** a ser adicionado na aba Admins quando for dar acesso a ele

### 6.3 Funcionalidades futuras
- [ ] Seção de repertório com **links para download das partes** (hoje há apenas o aviso "em breve")
- [ ] Aba Logística não é populada por nenhuma função
- [ ] Coluna "Inscrito?" da aba Pré-Convocados é preenchida manualmente — poderia cruzar automaticamente por telefone/nome

### 6.4 Direção de UX solicitada (parcialmente implementada)
Pedido explícito: **máximo de recursos para o usuário não digitar.** Mais arrastar e clicar, menos teclado. Gamificação onde couber. Interface que faça sentido para a Gen Z.

**Já aplicado:** 1 pergunta por tela (padrão Typeform), avanço automático nos sim/não, cards clicáveis, drag & drop no ranking, `inputmode` correto por campo, validação no momento certo, alvos de toque de 44px, fonte ≥16px nos inputs (evita zoom no iOS).

**Referência de método:** princípios de **Luke Wroblewski** ("Web Form Design", pesquisas do Google sobre input mobile) + padrão conversacional Typeform.

**Ainda digita-se:** e-mail (2x), nome, sobrenome, nome artístico, telefone, CEP. Campo para otimização futura.

**Avaliado e desaconselhado:** swipe estilo Tinder no ranking — swipe é binário (sim/não), ranking é ordinal; forçar a metáfora confundiria. Setas + drag é o padrão correto para ordenação.

---

## 7. ELENCO PRÉ-CONVOCADO (35 músicos, na aba Pré-Convocados)

Sopros (12): 2 flautas, 2 oboés, 2 clarinetes, 2 fagotes, 2 trompas, 2 trompetes
Cordas: 14 violinos (6 primeiros + 5 segundos mapeados), 4 violas, 6 violoncelos listados, 2 contrabaixos
Percussão: 1

Observações de disponibilidade registradas na aba (ex.: "Kaique — problema de horário de manhã", "Peppi — não pode sexta", "João Pedro — não pode durante a semana", "Matheus Maldonado — a partir das 19h").

**Decisão tomada:** o formulário **não** é pré-preenchido com esses dados. Pareamento por telefone é frágil (formatos variam) e o wizard leva 3 minutos; o custo de gravar dado errado supera o ganho. A aba serve como gabarito de conferência.

---

## 8. REPERTÓRIO CONFIRMADO

| Obra | Compositor |
|---|---|
| Sinfonia n.º 3 «Escocesa» — 1º mov. | Mendelssohn |
| Sinfonia n.º 40, K. 550 — 1º mov. | Mozart |
| Sinfonia n.º 5 — 1º mov. | Beethoven |
| Concerto para Violino | Joseph Bologne, Chevalier de Saint-Georges |

Editável na constante `REPERTORIO` no topo do `<script>` do `cadastro.html`.

---

## 9. DATAS

| Data | Evento |
|---|---|
| **16/08/2026** | Ensaio aberto — Universidade Zumbi dos Palmares, a partir das 18h, ~3h de duração |
| **20/11/2026** | Concerto — Sala São Paulo (sexta-feira, Dia da Consciência Negra) |
| Semana de 20/11 | Ensaios (seg a qui), local e horários a confirmar |

---

## 10. ARQUIVOS DESTE CHAT

| Arquivo | Onde vai |
|---|---|
| `Code.gs` | GAS |
| `index.html` | GAS (usa `<?= baseUrl ?>`) |
| `cadastro.html` | GAS |
| `admin.html` | GAS |
| `index_dominio.html` | versão com URL fixa (alternativa) |
| `site_camerata21/index.html` | Netlify (usa rotas `/inscricao` e `/admin`) |
| `site_camerata21/_redirects` | Netlify |

⚠️ **Existem duas versões do index.** A do GAS usa o template tag `<?= baseUrl ?>`. A do Netlify usa rotas relativas. Não misturar: o template tag em host estático aparece como texto cru na página.
