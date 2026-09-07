# RADAR DE FOMENTO — OS-UZP
**Centro de controle de editais, leis de incentivo, caminho crítico e dossiê documental**
Google Apps Script + Google Sheets · custo zero · v2.0

---

## 1. O QUE MUDA EM RELAÇÃO À PLANILHA

A planilha v1.0 (`OS-UZP - Radar Fomento_20260821.xlsx`) já tinha a tese certa:
**não se age em D-0; age-se na DATA-GATILHO.** O que ela não faz é *chegar até você*.
Uma planilha só funciona quando alguém lembra de abrir — e é exatamente isso que falha
na semana em que a agenda aperta.

Esta plataforma preserva integralmente o modelo de dados e a lógica de score, e acrescenta
as três coisas que uma planilha não faz:

| | Planilha | Radar |
|---|---|---|
| Cálculo de dias/gatilho | fórmula, recalcula ao abrir | recalculado a cada leitura e às 23h, mesmo com todo mundo offline |
| Chegada da informação | você abre | e-mail às 7h + WhatsApp, com dono e próximo passo |
| Edição | célula | tela desenhada por tipo de decisão (pontuar ≠ renovar certidão) |
| Ação de fora do sistema | — | link de 1 clique no e-mail: ✓ concluído / ↷ adiar 7d |
| Rastro | — | aba LOG: quem mudou o quê, quando |
| Data-gatilho na agenda | — | evento no Google Calendar |

**O que não mudou de propósito:** a planilha continua sendo o banco de dados. Você pode
abrir, ordenar, filtrar e editar direto nela a qualquer momento — o Radar lê e escreve
nas mesmas abas. Ninguém fica refém da interface.

---

## 2. AS DECISÕES DE DESIGN (e por que elas são assim)

**2.1 A tela inicial é uma fila, não um dashboard.**
Centro de controle bom não mostra tudo — mostra o que exige decisão agora, em ordem.
A aba HOJE é uma lista única que mistura editais, etapas do caminho crítico e certidões
vencendo, ordenada por urgência do gatilho. Se está lá, tem dono e tem um único próximo
passo. Um dashboard que mostra 23 editais de uma vez não é controle, é decoração.

**2.2 Prazo vencido sai da fila, não vira alarme eterno.**
O PROMAC-SP encerrou em 26/05. Um sistema ingênuo gritaria "vencido há 103 dias" todo dia
até alguém arquivar na mão. Aqui ele é marcado como **ciclo encerrado**, sai da fila e
entra no KPI "reprogramar para 2027". Alarme que não some é alarme que se aprende a ignorar.

**2.3 Silêncio é uma funcionalidade.**
`digest.silencioSemAcao = SIM`: em dia sem nada na janela, nenhum e-mail é enviado.
Um report que chega todo dia sem exigir nada perde a autoridade em três semanas.
Quando ele chega, é porque tem coisa.

**2.4 O WhatsApp é resumo; o e-mail é o registro.**
No WhatsApp vão no máximo 6 itens (configurável), priorizando os **seus**. O e-mail traz
tudo, com botões de ação. Mensagem de WhatsApp longa não é lida — é rolada.

**2.5 Sem dono é vermelho.**
"Linha sem dono é linha que se perde" está no POP e virou regra da interface: item sem
responsável aparece em vermelho na fila, tem botão **É meu** de um toque, e alimenta um
KPI próprio. É o Passo 4 do ritual de segunda, automatizado.

**2.6 Nada de senha.**
Código de 6 dígitos por e-mail, sessão de 12h assinada. Uma senha a mais é uma senha a
esquecer — e o acesso é controlado por uma linha na aba EQUIPE, que você mesmo edita.

**2.7 Acessibilidade e mobile primeiro.**
Semáforo nunca é *só* cor: cada estado também tem rótulo em texto ("vencido", "4d").
Tabelas viram cartões abaixo de 940px. Alvos de toque de 44px+. Fonte 16px nos campos
(evita o zoom automático do iOS). No celular os quatro KPIs informativos somem — a fila
tem de caber na primeira tela. Você vai usar isso entre um ensaio e outro.

**2.8 Ciclo encerrado não lidera a lista.**
Um prazo que já passou tem gatilho vencido há meses. Se a ordenação fosse ingênua, o
PROMAC-SP (encerrado em 26/05) apareceria eternamente no topo, acima do que ainda dá para
fazer. Ele vai para o fim da ordenação e para o KPI de reprogramação. O mesmo vale para
item adiado: sai da disputa por atenção até a data voltar.

---

## 3. IMPLANTAÇÃO (20 minutos, uma vez)

### 3.1 Criar o projeto
1. [script.google.com](https://script.google.com) → **Novo projeto** → renomeie para
   `OS-UZP — Radar de Fomento`.
2. Crie os arquivos e cole o conteúdo de cada um:

   | Arquivo no GAS | Arquivo deste repositório |
   |---|---|
   | `Config.gs` | `radar/Config.gs` |
   | `Seed.gs` | `radar/Seed.gs` |
   | `Code.gs` | `radar/Code.gs` |
   | `Notificacoes.gs` | `radar/Notificacoes.gs` |
   | `radar.html` | `radar/radar.html` |

   ⚠️ O nome do HTML tem de ser **minúsculo** e sem extensão ao criar (o GAS anexa `.html`).
   `HtmlService` é *case-sensitive* — foi assim que quebrou a plataforma de inscrição.

3. **Configurações do projeto** → marque *Mostrar o arquivo de manifesto `appsscript.json`*
   e substitua pelo conteúdo de `radar/appsscript.json` (define fuso e escopos).

### 3.2 Rodar o setup
No editor, selecione a função **`setupRadar`** e clique em ▶. Autorize os escopos.
Ela cria a planilha, todas as abas, os cabeçalhos, semeia os 23 editais, as 20 etapas do
caminho crítico, os 11 projetos e os 15 documentos do dossiê, e instala os gatilhos de tempo.
O link da planilha aparece no log de execução.

**A semeadura é idempotente:** rodar de novo não duplica nada (só preenche aba vazia).

### 3.3 Preencher a equipe
Abra a planilha criada → aba **EQUIPE** → preencha e-mail e WhatsApp de João e Vitor.

```
Nome    | E-mail            | WhatsApp        | Papel   | Digest | Pauta | Ativo
João    | joao@…            | 5511999999999   | Maestro | SIM    | SIM   | SIM
Vitor   | vitor@…           | 5511888888888   | Gestão  | SIM    | SIM   | SIM
```

WhatsApp em formato internacional, **só dígitos**: `55` + DDD + número.

### 3.4 Publicar o web app
**Implantar → Nova implantação → App da Web**
- Executar como: **Eu**
- Quem tem acesso: **Qualquer pessoa**

Copie a URL `/exec`. É o endereço do centro de controle.

> **Armadilha conhecida:** colar código novo **não** republica. Para atualizar sem trocar
> a URL: *Implantar → Gerenciar implantações → ✏️ → Versão: Nova versão → Implantar.*

### 3.5 Alternativa ao copiar e colar: clasp

O `clasp` publica direto do repositório. **Rode na sua máquina** — não é preciso
passar credencial a ninguém.

```powershell
# 1. habilite a Apps Script API — sem isto o clasp falha com "User has not enabled"
#    https://script.google.com/home/usersettings

npm install -g @google/clasp@2.4.2
clasp login

# 2. traga o repositório. Se a pasta já existir de antes, NÃO clone de novo:
#    entre nela e busque a branch, senão o checkout não acha nada.
git clone https://github.com/jraibusiness/camerata21-Plataforma.git
cd camerata21-Plataforma
git fetch origin
git checkout claude/os-uzp-editais-platform-taibpk

# 3. crie o .clasp.json na RAIZ do repositório, apontando para radar/
@'
{ "scriptId": "COLE_O_SCRIPT_ID", "rootDir": "radar" }
'@ | Set-Content .clasp.json -Encoding ascii

# 4. envie, da raiz do repositório
clasp push
```

Para um projeto novo, `clasp create --title "OS-UZP - Radar de Fomento" --type webapp`
dentro de `radar/` — e depois mova o `.clasp.json` gerado para a raiz, acrescentando
`"rootDir": "radar"`. O `scriptId` também está na URL do editor:
`script.google.com/d/<SCRIPT_ID>/edit`.

**Nunca use `--rootDir` no `clasp create`.** No clasp 2.4.2 essa opção não diz "os
fontes estão em tal pasta": ela move o próprio `.clasp.json` para dentro dela.
Rodar `clasp create --rootDir radar` de uma pasta onde `radar/` não existe faz o
clasp criar o projeto no Drive e **em seguida** falhar com
`ENOENT ... \radar\.clasp.json`, deixando um projeto órfão. Se isso acontecer,
não rode `create` de novo — pegue o `scriptId` da URL que ele imprimiu.

O campo `rootDir` **dentro** do `.clasp.json` é outra coisa, e é o que queremos:
o `push` o lê de lá e procura o manifesto em `<rootDir>/appsscript.json`.

O `.clasp.json` é configuração de máquina e está no `.gitignore`; há um
`.clasp.json.exemplo` na raiz como modelo.

**O que sobe.** Só o que o Apps Script aceita: `appsscript.json` e arquivos `.gs`
e `.html`. Com `rootDir: "radar"`, são exatamente os seis do projeto. O próprio
`.clasp.json` não é enviado.

**Duas armadilhas do clasp neste projeto:**

1. **`clasp push` sobrescreve o remoto.** Se alguém editou pelo navegador, a
   edição se perde. Rode `clasp pull` antes se houver dúvida. Na primeira vez ele
   pergunta se pode sobrescrever o manifesto — responda `y`.
2. **`clasp deploy` sem argumento cria uma implantação NOVA, com URL nova.** Toda
   a arquitetura de links depende de a URL `/exec` ser estável — é o que permite
   trocar o deploy sem invalidar o link já mandado no WhatsApp. Para atualizar
   mantendo a URL:
   ```powershell
   clasp deployments                      # anote o deploymentId
   clasp deploy -i <deploymentId> -d "descrição da versão"
   ```

Depois do primeiro `push`, ainda faltam dois passos que o clasp não faz: rodar
**`setupRadar`** uma vez pelo editor (ele envia código, não executa função) e
publicar em **Implantar → Nova implantação → App da Web**.

### 3.6 Link no domínio próprio (Netlify)

**No ar desde 07/09/2026:** `camerata21.com/radar` → o web app do Radar.
Alternativa: `camerata21.com/fomento`. As duas apontam para a mesma implantação.

**Por que não divulgar a URL do Google.** Trocar a implantação do Apps Script
troca a URL `/exec`. Se os links divulgados apontarem para o Google, cada
redeploy invalida tudo que já foi mandado no WhatsApp. Apontando para o domínio
próprio, edita-se uma linha do `_redirects` e os links continuam valendo.

**Como está montado.** O site `camerata21.com` é servido pelo Netlify a partir da
pasta `frontend/` deste repositório, por deploy manual (arrastar a pasta). O
arquivo `frontend/_redirects` define as rotas:

```
/inscricao   <URL_GAS_CAMERATA>/exec?page=cadastro   302
/admin       <URL_GAS_CAMERATA>/exec?page=admin      302
/radar       <URL_GAS_RADAR>/exec                    302
/fomento     <URL_GAS_RADAR>/exec                    302
```

Há uma cópia idêntica em `_redirects`, na raiz, só para referência — **a que vale
é `frontend/_redirects`**, dentro da pasta publicada.

**O `!` no fim de cada regra é obrigatório.** Por padrão o Netlify serve um
arquivo existente antes de aplicar o redirecionamento. A pasta `frontend/`
guarda também `admin.html` e `cadastro (1).html`, que são fontes do Apps Script
e não páginas do site — sem o `!`, `/admin` devolvia o template cru, com
chamadas `google.script.run` que só funcionam dentro do Google. Foi exatamente
o que aconteceu ao trocar o deploy manual pela publicação da pasta inteira.

**Para publicar uma mudança de rota:**

1. Edite `frontend/_redirects`.
2. Abra o site no Netlify (`warm-custard-e097e1.netlify.app`) → **Deploys** →
   **Deploy manually**.
3. Arraste a pasta `frontend/` inteira. O Netlify substitui o site todo, então a
   pasta precisa conter também o `index.html` — e contém.
4. Confira: `curl -I https://camerata21.com/radar` tem de responder `302`.

**O `index.html` funciona nos dois lugares** — no Netlify e servido pelo Apps
Script. Ele traz um `<?= execUrl ?>` dentro de um `<script>`, com guarda: no
Netlify a string fica literal, não contém `script.google.com`, e a função sai na
primeira linha. Não mexa nessa guarda.

**Sobre expor o Radar num domínio público.** A rota é pública, o conteúdo não: o
Radar exige código de seis dígitos enviado por e-mail, e só aceita endereços
listados na aba EQUIPE. Quem abrir `camerata21.com/radar` sem estar na lista vê
a tela de login e nada mais.

**Alternativa, se quiser deploy automático:** ligar o site do Netlify a este
repositório (publish directory `frontend`, branch a definir). Aí cada push
publica sozinho, sem arrastar pasta. Exige configurar uma vez no Netlify.

## 4. NOTIFICAÇÕES INSTANTÂNEAS — qual canal

O e-mail já funciona sozinho e não depende de nada disto. Esta seção é sobre o
canal instantâneo, que é opcional e complementar.

O código traz cinco provedores atrás de uma única função (`enviarWhatsApp`).
Troque em **CONFIG › `whatsapp.provedor`**. As chaves ficam em
*Projeto → Configurações do projeto → Propriedades do script* — **nunca** na
planilha nem no código versionado.

### Situação verificada em 07/09/2026

| | Custo | Setup | Estado hoje |
|---|---|---|---|
| **CallMeBot** | grátis | 2 min | ❌ **bot lotado**, não aceita novos cadastros. O número saiu do ar da página |
| **TextMeBot** | demo 2 dias, depois US$ 10/ano por destinatário ou US$ 60/ano ilimitado | 10 min | ✅ funcionando |
| **Telegram** | grátis para sempre | 5 min | ✅ funcionando — mas não é WhatsApp |
| **Meta Cloud API** | grátis até 1.000 conversas de serviço/mês | 1–2 h | ✅ oficial, porém exige número dedicado e template aprovado |
| **Twilio** | pago por mensagem | 30 min | ✅ funcionando |

O CallMeBot continua implementado: quando abrir vaga, é trocar uma linha.

### Recomendação

**Comece pela demo grátis do TextMeBot.** Ela prova o caminho inteiro — o
gatilho das 7h, a montagem do texto, a entrega no celular — sem gastar nada. Se
a mensagem chegar e for útil, US$ 10 por ano por pessoa é ruído no orçamento de
uma orquestra que persegue Rouanet. Se não for útil, você descobriu de graça.

**A Meta Cloud API é o destino certo quando escalar** — quando o report passar a
ir para o Reitor ou para patrocinadores. Aí o número oficial e o template
aprovado deixam de ser burocracia e viram credibilidade. Migrar é trocar o valor
de `whatsapp.provedor`.

**O Telegram é a saída honesta se não quiser pagar nada.** Grátis, oficial,
sem template, sem limite prático. O custo não é técnico, é comportamental: no
Brasil as pessoas não abrem o Telegram. Um alerta que ninguém vê não é alerta.

### TextMeBot

1. Cadastre-se em [textmebot.com](https://textmebot.com/) e peça a chave de demo.
2. A chave chega por e-mail, junto com um link para vincular o WhatsApp.
3. No GAS → *Propriedades do script* → adicione
   `TEXTMEBOT_5511999999999` = a chave daquela pessoa
   (ou `TEXTMEBOT_KEY` se uma chave servir para todos).
4. Em **CONFIG**, ponha `whatsapp.provedor` = `textmebot`.
5. Rode **`testarWhatsApp`** no editor. Ele tenta enviar para todo mundo da aba
   EQUIPE e escreve no log quem recebeu e quem falhou.

### Telegram

1. No Telegram, fale com **@BotFather** → `/newbot` → guarde o token.
2. *Propriedades do script* → `TELEGRAM_TOKEN` = o token.
3. **Cada pessoa manda uma mensagem qualquer para o bot.** Sem isso o Telegram
   não deixa o bot escrever primeiro — é regra da plataforma.
4. Rode **`descobrirChatsTelegram`** no editor: ele lista o `chat_id` de quem
   escreveu.
5. Ponha o `chat_id` de cada pessoa na coluna **WhatsApp / chat Telegram** da aba
   EQUIPE, no lugar do número.
6. Em **CONFIG**, `whatsapp.provedor` = `telegram`. Rode `testarWhatsApp`.

### Meta Cloud API

Propriedades `META_TOKEN`, `META_PHONE_ID` e `META_TEMPLATE`. O report diário é
mensagem **iniciada pelo sistema**, fora da janela de 24 h — então precisa de um
template aprovado, com o corpo em um único parâmetro (`{{1}}`), que recebe o
texto montado. Sem `META_TEMPLATE` o código envia texto livre, que só funciona
dentro da janela de 24 h.

### Twilio

Propriedades `TWILIO_SID`, `TWILIO_TOKEN`, `TWILIO_FROM`
(ex.: `whatsapp:+14155238886`).

### Quando nada está configurado

Com `whatsapp.provedor = nenhum`, o Radar não tenta enviar nada e registra isso
no log. **O e-mail continua saindo normalmente** — nenhuma falha de canal
instantâneo derruba o report.

## 4-bis. LEITURA ASSISTIDA DOS EDITAIS

### O que faz e o que não faz

A plataforma abre o edital — página HTML ou PDF — lê o texto e extrai **dez campos
factuais**, citando o trecho de origem. O resultado fica guardado na aba
**ANÁLISE**, então relê só quando você pedir.

**Não pontua.** Os cinco critérios de score continuam humanos. *"O score é
calculado, não opinado"* é o princípio que sustenta a planilha desde a v1.0;
deixar um modelo opinar afinidade contradiz isso e corrói a confiança no número.
O modelo entrega os insumos que hoje só se obtêm lendo o PDF — quem decide é João.

**Regra antialucinação:** o modelo responde só a partir do texto recebido. Campo
que não constar vem como *"NÃO ENCONTRADO NO TEXTO"*. Num painel de prazos,
invenção com confiança é pior que campo vazio.

### Os dez campos, e por que estes

Os seis primeiros vieram da lista de João. Os quatro últimos entraram por
inversão do problema: o desperdício mais caro da operação não é perder um edital
bom — é **escrever proposta para edital em que se é inelegível**. Então o resumo
começa pelo que desqualifica.

| # | Campo | Por que existe |
|---|---|---|
| 1 | **Impedimentos literais** | Sede, CNAE, projeto já aprovado. Captura o problema da CPEN: edital que exija "Certidão Negativa" ao pé da letra é risco real, e só o texto revela |
| 2 | Quem pode propor | O portão binário |
| 3 | Objeto e formação exigida | Sinfônica, câmara, compositor individual, palestra |
| 4 | Valor e teto | — |
| 5 | **Contrapartida obrigatória** | Custo escondido na letra miúda que derruba orçamento |
| 6 | **Documentos exigidos** | Cruza com o DOSSIÊ e diz o que falta |
| 7 | Prazo no edital | Não substitui o registrado: **confere** e avisa se divergir |
| 8 | **Vigência de execução** | O mandato da representante legal termina em 20/03/2027 |
| 9 | Prestação de contas | Há três PRONACs em aberto limitando a carteira |
| 10 | Próximo passo | — |

Três verificações automáticas rodam sobre a extração: divergência de prazo entre
planilha e edital; menção a "Certidão Negativa" quando a nossa federal é CPEN; e
execução que ultrapasse 20/03/2027.

### Quando a página não dá para ler

Nem todo site entrega o edital para um robô. Alguns montam o conteúdo por
JavaScript e devolvem um HTML quase vazio; outros interpõem uma casca de acesso
que responde a mesma página de 1 KB para qualquer endereço — é o caso do
`proac.sp.gov.br`, que faz isso **inclusive na URL do próprio PDF**.

Mandar 85 caracteres ao modelo produziria um resumo inventado com cara de
verdade. Então a plataforma **para** em vez de inventar, e explica o que fazer.

Isso é tratado em três camadas, para valer também nos editais que ainda virão:

1. **No download.** Abaixo de 3.000 caracteres de texto útil, ou quando a URL
   termina em `.pdf` mas volta HTML, a leitura falha com instrução — não com
   erro técnico.
2. **Na varredura.** `conferirLinks()` percorre o RADAR, mede cada link e
   escreve o veredicto na coluna **Leitura**: `ok · 80 mil car.`, `PDF · 420 KB`,
   `FRACA — anexar PDF` ou `ERRO 404`. Roda sob demanda e toda noite às 23h.
3. **Na gaveta.** Edital marcado como fraco mostra o aviso **antes** de você
   clicar em Ler agora, com o caminho: baixe o PDF, suba no Drive, cole o link
   no campo Documento.

Assim a pergunta "esse link dá para ler?" é respondida quando o edital entra, e
não com o prazo em cima.

### Configurar

1. Gere uma chave em [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
2. GAS → ⚙️ *Configurações do projeto* → *Propriedades do script* →
   `GEMINI_API_KEY` = a chave.
3. Em **CONFIG**, confira `ia.provedor` = `gemini`.
4. Rode **`usarModeloRecomendado()`** no editor. Ele consulta a API, ranqueia o
   que a sua chave alcança e grava a escolha na aba CONFIG. Para ver o
   raciocínio e as alternativas antes, rode `listarModelosIA()`.

O passo 4 existe porque nome de modelo muda. **Não há padrão fixo no código**, e
isso não é omissão: em 07/09/2026 o melhor disponível era `gemini-3.8-flash`, e
qualquer nome escrito meses antes já estaria obsoleto. A plataforma pergunta.

O ranqueamento descarta por família o que não serve para ler edital — voz,
imagem, música, robótica, uso de computador, pesquisa profunda — e ordena o
resto por: aceitar PDF, contexto longo, JSON fiel, latência baixa e camada
gratuita. Isso aponta para **flash**; pro custa caro para o ganho e lite erra
mais em texto jurídico longo.

**Alternativas:** `ia.provedor` aceita `glm` (você tem créditos; não lê PDF por
este caminho) e `claude` (`ANTHROPIC_API_KEY`). A camada gratuita do Gemini tem
limite por minuto e por dia — por isso `analisarPendentes()` para em oito por
execução e espera entre chamadas.

---

## 5. A ROTINA

### Todo dia útil, 7h — report diário
Chega e-mail (e WhatsApp) com: KPIs do dia, **sua fila** primeiro, depois a fila comum.
Cada item traz motivo, prazo, dono e um único próximo passo, com dois links de ação:
**✓ Concluído** e **↷ Adiar 7d** — funcionam sem login, por token assinado válido por
~uma semana.

Sem nada na janela, não chega nada.

### Segunda-feira, 8h — pauta do ritual
O e-mail vem montado na ordem exata do POP:
1. RADAR — gatilhos vencidos ou vencendo em 7 dias
2. DOSSIÊ — tudo abaixo de 30 dias de validade
3. CAMINHO CRÍTICO — o que está atrasado
4. LINHAS SEM DONO

Vinte minutos, só a tela. O que passar de 20 minutos vira tarefa, não discussão.

### Quando entra um edital novo
Botão **+** no topo do Radar. Preencha só nome, órgão, prazo e pré-requisito — Vitor faz
isso em 30 segundos. Entra com status `0. Novo — pontuar`. João depois abre a linha,
move os cinco seletores de 0 a 3 e o score/prioridade se calculam sozinhos.

**Regra de corte, antes de escrever a primeira linha do projeto:** confirmar as três
exigências que mais eliminam — **sede do proponente, CNAE compatível e pré-requisito de
projeto já aprovado.**

---

## 6. CONFIGURAÇÃO (aba CONFIG)

Tudo é editável sem tocar em código. As mudanças valem em até 5 minutos (cache).

| Chave | Padrão | O que faz |
|---|---|---|
| `digest.hora` | `7` | Hora do report diário (BRT) |
| `digest.dias` | `SEG,TER,QUA,QUI,SEX` | Dias de envio |
| `digest.silencioSemAcao` | `SIM` | Não envia quando não há ação |
| `digest.maxWhatsApp` | `6` | Máximo de itens no WhatsApp |
| `pauta.diaSemana` / `pauta.hora` | `SEG` / `8` | Ritual semanal |
| `alerta.gatilhoDias` | `7` | Antecedência do alerta de gatilho |
| `alerta.prazoDias` | `14` | Antecedência do alerta de prazo |
| `alerta.dossieDias` | `30` | Antecedência do alerta de validade |
| `score.corteA` / `score.corteB` | `12` / `8` | Régua de prioridade |
| `whatsapp.provedor` | `nenhum` | `nenhum` · `callmebot` · `meta` · `twilio` |
| `calendar.sincronizar` | `NAO` | `SIM` cria eventos de gatilho no Calendar |

Se você alterar `digest.hora` ou `pauta.hora`, rode **`instalarGatilhos`** de novo.

---

## 7. MODELO DE DADOS

Cinco abas de conteúdo, três de infraestrutura. **Coluna cinza é calculada — não sobrescrever.**

**RADAR** — o mapa. 23 linhas, 32 colunas.
`ID · Instrumento · Órgão · Tipo · Periodicidade · Janela · Prazo · ⟨Dias rest.⟩ ·
Proponente · Pré-requisito bloqueante · Projeto-match · Eleg. · Ader. · Valor · Facil. ·
Prob. · ⟨SCORE⟩ · ⟨PRI⟩ · Preparo · Gatilho manual · ⟨DATA-GATILHO⟩ · ⟨Dias p/ gatilho⟩ ·
⟨Semáforo⟩ · Responsável · Status · Próxima ação · Notas · Fonte · **Link** ·
**Documento** · Adiado até · Atualizado em`

- `SCORE` = Eleg. + Ader. + Valor + Facil. + Prob. (máx. 15)
- `PRI` = A (≥12, atacar) · B (8–11, avaliar) · C (<8, arquivar)
- `DATA-GATILHO` = Prazo − Preparo. Calculada, não editar.
- **`Gatilho manual` vence o cálculo.** Dois casos pedem essa coluna:
  1. **Fluxo contínuo sem prazo** — não há o que subtrair. Sem uma data aqui, a linha
     nunca entra na fila. É o caso do ProAC ICMS.
  2. **Prazo distante, decisão de agora** — a Funarte Aberta vai até 30/04/2027, então o
     cálculo joga o gatilho para abril e a oportunidade some por sete meses. Preencher
     aqui traz a linha de volta para o semestre em que a decisão realmente cabe.
- `Link` é a **página oficial** da chamada e `Documento` é o **PDF/regulamento**.
  Os dois viram botões no topo da gaveta, abrindo em nova aba — inclusive no
  celular. Também aparecem como `↗` na tabela e como botão nos cartões da fila e
  do e-mail. Sem isso a plataforma diz o que fazer mas não deixa fazer: era
  preciso abrir outra aba e caçar o edital de novo a cada consulta.
  Os 19 links semeados foram verificados um a um em 07/09/2026; `Documento`
  aceita link do Google Drive, para o caso de vocês já terem o PDF baixado.
- `Adiado até` tira a linha da fila até a data, sem apagar nada.
- `Eleg. = 0` marca **bloqueado**: não é falta de mérito, é pré-requisito faltando.
  São as cinco filas de patrocínio que esperam o PRONAC ou o ProAC. É o pipeline de 2027.

**CAMINHO CRÍTICO** — 20 etapas, Fase 0 → META. `% Concluído` alimenta as barras por fase.
**PROJETOS** — 11 peças reutilizáveis. Nada se escreve do zero.
**DOSSIÊ** — 20 documentos, 12 colunas. Validade vazia = permanente; preenchida =
entra na fila 30 dias antes.

- `Bloqueia submissão` é a coluna que muda o jogo. Documento marcado `SIM` que
  esteja **vencido ou ausente** trava qualquer submissão — não adianta o projeto
  estar pronto. Esses itens sobem ao topo do dossiê, ganham selo vermelho e
  alimentam o KPI **Travando submissão**.
- `Onde emitir` vira um botão *Emitir agora ↗*. Certidão vencida se resolve em
  minutos, online e de graça: o atrito era não ter o link à mão.
- O **mandato da representante legal** entra como documento com validade
  (20/03/2027). Usa a mesma máquina de vencimento e avisa com antecedência que
  todo edital assinado ou executado depois dessa data precisa de recondução.
- **Números de controle, códigos de autenticidade, CNPJ, RG e CPF ficam fora do
  `Seed.gs`.** Este repositório é público; esses campos vão preenchidos à mão na
  planilha, que é privada e protegida por código de acesso.
**EQUIPE** — quem acessa e quem recebe o quê.
**CONFIG · LOG · OTP** — infraestrutura. O LOG guarda toda alteração: quem, o quê, quando, de → para.

---

## 8. FUNÇÕES DE MANUTENÇÃO

Rode pelo editor do Apps Script quando precisar:

| Função | Quando |
|---|---|
| `setupRadar()` | uma vez, na instalação (idempotente) |
| `ressemearConteudo()` | depois de uma atualização que mude colunas — reconstrói RADAR, CAMINHO, PROJETOS e DOSSIÊ a partir do código. **Apaga edições manuais nessas quatro abas**; preserva EQUIPE, CONFIG, LOG, OTP e ANÁLISE |
| `listarModelosIA()` | ver quais modelos a sua chave do Gemini alcança |
| `analisarPendentes()` | ler em lote os editais ainda sem análise (máx. 8 por execução) |
| `instalarGatilhos()` | depois de mudar `digest.hora` ou `pauta.hora` |
| `recalcularTudo()` | forçar recálculo das colunas cinza agora |
| `testarDigestAgora()` | ver o report do dia sem esperar as 7h |
| `testarWhatsApp()` | validar o canal de WhatsApp |
| `sincronizarCalendario()` | jogar as datas-gatilho na agenda |
| `rotinaNoturna()` | manutenção completa (roda sozinha às 23h) |

---

## 9. A IDENTIDADE APLICADA

Fonte: **Sistema de Marca OS-UZP v5**, em `reference/branding/osuzp/`. A plataforma segue
o documento; onde precisou estendê-lo, está declarado abaixo.

### 9.1 O que veio direto do sistema

| Elemento | Aplicação no Radar |
|---|---|
| **Noturno `#0B1B3D`** | fundo de toda a plataforma |
| **Roxo `#1F0A33`** | atmosfera — degradê no login e na gaveta, nunca campo chapado |
| **Farol `#FFB800`** | o **Z** da sigla, o arco principal, o itálico dos títulos, o botão primário |
| **Marfim `#EFD5B4`** | todo o texto corrido e todos os números |
| **Latão `#A69773`** | rótulos, filetes, cabeçalhos de tabela, metadados |
| **Cena `#3B56A6`** | segunda voz dos arcos e filete de KPI informativo. **Nunca texto** (2,48:1) |
| **Verde `#128743`** | terceira voz dos arcos, barra de progresso, filete de "tudo certo". Só massa gráfica |
| **Instrument Serif** | títulos de seção, nomes de edital, números de KPI |
| **Roboto Condensed 700 · `.24em`** | rótulos, datas, status, botões |
| **Roboto 300** | texto corrido |
| **Os três arcos** | geometria idêntica à do brandkit (4a/4b para a marca, 4g/4i para o quadrante do login) |

O símbolo é desenhado em SVG a partir das mesmas coordenadas do kit — não é imagem
rasterizada, então escala de 30 px no cabeçalho a 820 px no login sem perda.

### 9.2 A regra do acento, num painel com muitos estados

O sistema diz: *"se duas coisas estão em Farol na mesma peça, uma delas está errada."*
Um centro de controle mostra oito indicadores ao mesmo tempo — a regra não sobrevive
literalmente. A leitura que a plataforma adota:

- **Farol continua sendo acento de marca**, não sinal de estado. Aparece no Z, no arco,
  no itálico do título da seção e no botão primário. **Nunca em número de KPI** — no tile
  de atenção ele fica só no filete de 3px, que é massa gráfica.
- **Latão faz o trabalho silencioso** que o amarelo faria mal: todo rótulo, toda data
  secundária, todo metadado.

### 9.3 A extensão declarada: Sirene `#FF5C63`

Não existe vermelho no sistema de marca, e é correto que não exista — a paleta é de
concerto, não de painel de alarme. Mas "gatilho vencido" e "sem responsável" precisam ser
inconfundíveis num relance, e usar Farol para isso destruiria a regra do acento (o vencido
e o "vence em 4 dias" ficariam do mesmo matiz, que é justamente a distinção mais
importante da ferramenta).

Então o Radar declara uma **camada de estado**, separada da paleta expressiva:

| Estado | Cor | Contraste sobre Noturno |
|---|---|---|
| Vencido / sem dono | **Sirene `#FF5C63`** | 5,62 : 1 — passa em AA para qualquer corpo |
| É hoje / crítico (≤7d) | Farol (só como filete e borda) | 9,78 : 1 |
| Atenção (≤21d) | Latão | 5,89 : 1 |
| No prazo | Verde, só como ponto ou barra | 3,69 : 1 — por isso nunca em texto |

**Status: aprovado por João em 06/09/2026.** O Sirene é parte do sistema — como extensão
declarada, não como oitava cor da paleta.

**Escopo:** só nesta plataforma e só em marcador de estado — ponto de semáforo, borda
esquerda de cartão, filete e número de KPI em alerta, rótulo "sem responsável". **Nunca**
em cartaz, programa, ofício, edital, capa, selo ou qualquer peça institucional, e nunca
como campo cheio. Quem herdar este código deve tratá-lo como cor de instrumento, não de
marca.

**Onde vive:** `--sirene` no topo de `radar.html` e `CORES.sirene` em `Notificacoes.gs`.
Duas linhas — se um dia a decisão mudar, muda em dois lugares.

### 9.4 E-mail

O Gmail bloqueia SVG e não carrega webfont. Então, nos e-mails:

- **Instrument Serif → Georgia**, que é o fallback previsto no próprio brandkit;
  Roboto Condensed → Arial Narrow; Roboto → Helvetica.
- **Os três arcos viram três filetes em defasagem** — largura e espessura decrescentes,
  entrando em atraso, Farol → Cena → Verde. Mesma leitura de contraponto, em HTML que
  sobrevive a qualquer cliente.
- A sigla vai por tipografia, com o **Z em itálico Farol**, como manda o nível 1.

### 9.5 Assinatura

A plataforma é ferramenta interna, então usa o **nível 1** do brandkit: sigla `UZP` com
o Z em acento, mais o rótulo "Orquestra Sinfônica". O nome da universidade por extenso e
a assinatura da regência ficam para os níveis 2 e 3 — cartaz, programa, ofício.

O favicon é o **monograma Z**: campo roxo, filete e Z em Farol.

---

## 10. PROVENIÊNCIA DOS PRAZOS

A planilha v1.0 avisava: *"prazos e regras verificados em 21/08/2026 nas fontes oficiais.
Editais são alterados e prorrogados: reconfirmar no site do órgão antes de qualquer
submissão."* Em **06/09/2026** os itens de janela curta foram reconferidos em fonte
primária. O que cada linha traz na coluna `Notas`:

| Instrumento | Situação em 06/09/2026 |
|---|---|
| **Rouanet nas Favelas 2** | Confirmado: 15/08 a **13/10/2026**. R$ 10 mi, mín. 50 propostas, teto de R$ 200 mil. São Paulo está entre as oito cidades. Submissão pelo Salic, tipicidade "Editais Compartilhados", tipologia "Programa Rouanet nas Favelas - 2026". **O portão de elegibilidade continua aberto** — falta ler o edital e decidir se "localidade" é o município ou o território de favela |
| **Ibermúsicas** | Confirmado: **01/10/2026** em todas as chamadas, menos a do Arts Council England (encerrou em 31/07). Prêmio de USD 2.500, estreia por orquestra nacional, circulação nos países membros. A edição tem **15 chamadas**; o RADAR mapeou cinco |
| **ProAC ICMS** | Confirmado: inscrição **ininterrupta**, sem prazo. R$ 100 mi em 2026 (Resolução SFP-06, DOE 11/05/2026) |
| **Funarte Aberta** | Confirmado: fluxo contínuo até **30/04/2027**, ou enquanto houver pauta. Elegíveis PF, PJ com ou sem fins lucrativos, MEI e EI. Sem cachê, mas **bilheteria integral ao proponente** (teto R$ 100/ingresso). Salas do Complexo SP são de câmara — não cabe sinfônica. Inscrição pelo Prosas, edital 17666 |
| **São Caetano nº 020/2026** | **Submetido**, em nome da Faculdade. Datas de resultado (14/09 preliminar, 28/09 final) informadas pelo Vitor a partir do edital: o portal da prefeitura estava fora do ar e não deu para reconfirmar. **Conferir no dia** |

Seguem marcados `VERIFICAR`, sem urgência de janela: PNAB Cultura Vicentina, cadastro do
Petrobras Circuitos, requisitos de MAPFRE e Claro, e a Lei Estadual do RJ (já inelegível
por sede, então a verificação é formalidade).

---

## 11. LIMITES E ARMADILHAS

| Item | Realidade |
|---|---|
| **Cota de e-mail** | `MailApp`: 100/dia em conta gratuita, 1.500 no Workspace. Com 2 destinatários e 2 disparos, folga enorme |
| **Republicar** | Colar código não publica. *Gerenciar implantações → ✏️ → Nova versão* |
| **Nome de arquivo HTML** | Minúsculo. `HtmlService` é case-sensitive |
| **Links dentro do GAS** | O app roda em iframe: todo link externo precisa de `target="_blank"` ou `_top` |
| **Fuso** | Definido em `appsscript.json` como `America/Sao_Paulo`. Se mudar, os cálculos de dias mudam |
| **Sessão** | 12 horas. Depois disso, novo código por e-mail |
| **Links de ação do e-mail** | Válidos ~1 semana. Depois, abrem uma página pedindo para usar o Radar |
| **Segredos** | Só em Propriedades do Script. Nada de token no repositório |
| **Datas "VERIFICAR"** | A planilha original marca prazos não confirmados em fonte primária. Continuam marcados. **Reconfirme no site do órgão antes de qualquer submissão** |

---

## 12. O QUE FALTA DECIDIR

- [x] ~~E-mail e WhatsApp do Vitor~~ — no seed. **Falta o WhatsApp do João** na
      aba EQUIPE da planilha; o e-mail dele foi preenchido sozinho no setup
- [ ] **Escolher o canal instantâneo.** O CallMeBot, que era a recomendação,
      está com o bot lotado e não aceita cadastro. Alternativas verificadas em
      §4: TextMeBot (demo grátis, depois US$ 10/ano por pessoa), Telegram
      (grátis, mas ninguém abre no Brasil) ou Meta Cloud API (oficial, setup
      maior). O e-mail funciona independentemente disso
- [x] ~~Credenciamento São Caetano~~ — **submetido em nome da Faculdade**, não pelo MEI.
      Gatilho em 14/09 (resultado preliminar); final em 28/09
- [x] ~~Confirmar regulamento da Funarte Aberta~~ — fluxo contínuo até 30/04/2027,
      confirmado em fonte primária
- [x] ~~Data-gatilho do ProAC ICMS~~ — 15/09, herdada da etapa 11 do caminho crítico
- [ ] **Funarte Aberta: escolher a sala e a data.** O cálculo joga o gatilho para
      10/04/2027; assim que houver uma data pretendida, preencher `Gatilho manual`
- [ ] **Funarte Aberta: repontuar `Valor`.** Está em 1 porque a planilha registrava só
      "sem cachê". A bilheteria é integralmente repassada ao proponente — há receita.
      Decisão do João, um clique na gaveta
- [ ] **Ibermúsicas: varrer as outras dez chamadas** antes de 01/10. A edição de 15 anos
      tem 15 convocatórias; o RADAR mapeou cinco
- [ ] Rodar `setupRadar()` **antes** de qualquer edição manual na planilha — a semeadura
      só preenche aba vazia, então mudanças no `Seed.gs` não alcançam uma base já criada
- [x] ~~Aprovar ou vetar o vermelho **Sirene** da camada de estado~~ — aprovado em
      06/09/2026, com o escopo fechado descrito em §9.3
