# Testes

O Radar roda em Google Apps Script, que não tem executor de testes. Estes
arquivos rodam em Node e servem para pegar, antes do `clasp push`, as duas
classes de erro que só apareceriam depois de publicar.

```bash
node testes/tudo.js        # roda tudo — use antes de cada clasp push
```

## ordem-de-carga.js

O Apps Script avalia os arquivos `.gs` em **ordem alfabética** — `Code.gs` antes
de `Config.gs`. Qualquer avaliação no topo de um arquivo que dependa de uma
constante declarada em outro estoura `ReferenceError` no carregamento, antes de
qualquer função rodar. Foi o que aconteceu com
`var ABA_POR_PREFIXO_ = { R: ABAS.radar, ... }` no topo do `Code.gs`.

A regra: **constante de topo só pode conter literais**. Tudo que cruza arquivos
vai dentro de função, que só executa depois da carga completa.

Este teste carrega os `.gs` nessa ordem e exercita as funções que atravessam
arquivos.

## setup.js

Roda o `setupRadar()` inteiro contra uma planilha falsa que respeita os limites
reais do Sheets: **aba nova nasce com 26 colunas**. A aba RADAR precisa de 30, e
o `setValues` do cabeçalho estourava com "coordenadas inválidas" — erro que só
aparecia depois de publicar, na primeira execução.

Verifica ainda: as oito abas com o cabeçalho certo, a aba padrão `Página1`
removida, a semeadura completa (23 editais, 20 etapas, 11 projetos, 15
documentos), as colunas calculadas preenchidas, os três gatilhos instalados, e
que rodar duas vezes não duplica nada.

## harness.js

Stubs das APIs do Apps Script — `SpreadsheetApp`, `Utilities`,
`PropertiesService`, `CacheService`, `MailApp`, `ScriptApp` — com uma planilha
falsa em memória. Permite rodar o motor de cálculo (data-gatilho, score,
semáforo, fila) e o próprio setup sem tocar no Google.

O harness **reproduz os limites reais** em vez de aceitar tudo: aba nova com 26
colunas, `getRange` lançando exceção fora do intervalo, `SpreadsheetApp.create`
devolvendo uma única aba `Página1` como o Sheets em pt-BR. Um stub permissivo
teria deixado o bug das 30 colunas passar.
