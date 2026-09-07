// Roda setupRadar() inteiro contra uma planilha falsa que respeita os limites
// reais do Sheets: aba nova com 26 colunas. Foi assim que apareceu o bug do
// cabecalho da RADAR, que precisa de 30 e estourava no setValues.
const H = require('./harness.js');
global.sheets = H.sheets; global.Sheet = H.Sheet;
const fs = require('fs'), path = require('path');
const REPO = path.resolve(__dirname, '..', 'radar');
const arquivos = fs.readdirSync(REPO).filter(f => f.endsWith('.gs')).sort();
const src = arquivos.map(f => fs.readFileSync(path.join(REPO, f), 'utf8')).join('\n');

const corpo = `
  var falhas = 0;
  // primeira execucao de verdade: sem PLANILHA_ID, para cair no SpreadsheetApp.create
  PropertiesService.getScriptProperties().setProperty('PLANILHA_ID', '');
  function erro(msg){ falhas++; console.log('  x ' + msg); }
  function ok(msg){ console.log('  ok ' + msg); }

  try { setupRadar(); ok('setupRadar rodou ate o fim'); }
  catch (e) { erro('setupRadar estourou: ' + e.message); }

  Object.keys(CABECALHOS).forEach(function (nome) {
    var sh = sheets[nome];
    if (!sh) { erro('aba ausente: ' + nome); return; }
    var cab = CABECALHOS[nome];
    if (sh.maxCols < cab.length) erro(nome + ': ' + sh.maxCols + ' colunas para ' + cab.length + ' cabecalhos');
    var lido = sh.getRange(1, 1, 1, cab.length).getValues()[0];
    for (var i = 0; i < cab.length; i++) {
      if (lido[i] !== cab[i]) { erro(nome + ' col ' + (i+1) + ': "' + lido[i] + '" != "' + cab[i] + '"'); break; }
    }
  });
  ok('8 abas com cabecalho correto');

  if (sheets['Página1']) erro('a aba padrao Página1 nao foi removida');

  var esperado = { 'RADAR': 23, 'CAMINHO CRITICO': 20, 'PROJETOS': 11, 'DOSSIE': 15, 'EQUIPE': 2, 'CONFIG': 15 };
  [['RADAR',23],['CAMINHO CRÍTICO',20],['PROJETOS',11],['DOSSIÊ',15],['EQUIPE',2]].forEach(function(par){
    var n = sheets[par[0]].getLastRow() - 1;
    if (n !== par[1]) erro(par[0] + ': semeou ' + n + ' linhas, esperado ' + par[1]);
  });
  ok('semeadura completa: 23 editais, 20 etapas, 11 projetos, 15 documentos, 2 pessoas');

  // as colunas calculadas tem de estar preenchidas depois do recalculo
  var cab = CABECALHOS['RADAR'];
  var l1 = sheets['RADAR'].getRange(2, 1, 1, cab.length).getValues()[0];
  ['SCORE','PRI','Semáforo','Dias p/ gatilho'].forEach(function(c){
    if (l1[cab.indexOf(c)] === '') erro('coluna calculada vazia apos setupRadar: ' + c);
  });
  ok('colunas calculadas preenchidas (' + l1[cab.indexOf('SCORE')] + '/15, prioridade ' + l1[cab.indexOf('PRI')] + ')');

  if (gatilhos.length !== 3) erro('esperados 3 gatilhos, criados ' + gatilhos.length);
  else ok('3 gatilhos: ' + gatilhos.map(function(g){ return g.fn + ' as ' + g.hora + 'h'; }).join(', '));

  // idempotencia: rodar de novo nao pode duplicar
  var antes = sheets['RADAR'].getLastRow();
  try { setupRadar(); } catch (e) { erro('segunda execucao estourou: ' + e.message); }
  if (sheets['RADAR'].getLastRow() !== antes) erro('rodar duas vezes duplicou linhas');
  else ok('idempotente: rodar de novo nao duplica');

  global.__falhas = falhas;
`;

try { (0, eval)(src + corpo); }
catch (e) { console.log('x FALHOU: ' + e.message); process.exit(1); }
console.log(global.__falhas ? '\nx ' + global.__falhas + ' falha(s)' : '\nok: setupRadar valido');
process.exit(global.__falhas ? 1 : 0);
