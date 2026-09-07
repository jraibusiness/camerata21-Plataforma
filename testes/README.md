# Testes

O Radar roda em Google Apps Script, que não tem executor de testes. Estes
arquivos rodam em Node e servem para pegar, antes do `clasp push`, as duas
classes de erro que só apareceriam depois de publicar.

```bash
node testes/ordem-de-carga.js
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

## harness.js

Stubs mínimos das APIs do Apps Script — `SpreadsheetApp`, `Utilities`,
`PropertiesService`, `CacheService`, `MailApp`, `ScriptApp` — com uma planilha
falsa em memória. Permite rodar o motor de cálculo (data-gatilho, score,
semáforo, fila) sem tocar no Google.
