// Regressão: o Apps Script avalia os .gs em ordem ALFABÉTICA (Code antes de Config).
// Foi isso que quebrou com "ReferenceError: ABAS is not defined".
const H = require('./harness.js');
global.sheets = H.sheets; global.Sheet = H.Sheet;
global.FS = require('fs'); global.DIR = __dirname;
const fs = require('fs'), path = require('path');
const REPO = path.resolve(__dirname, '..');

const arquivos = fs.readdirSync(REPO).filter(f => f.endsWith('.gs')).sort();
console.log('ordem de carga (como no Apps Script): ' + arquivos.join(' → ') + '\n');
const src = arquivos.map(f => fs.readFileSync(path.join(REPO, f), 'utf8')).join('\n');

const checagens = `
  var falhas = 0;
  [['abaDoId_("R01")', function(){ return abaDoId_('R01'); }],
   ['abaDoId_("C05")', function(){ return abaDoId_('C05'); }],
   ['abaDoId_("D09")', function(){ return abaDoId_('D09'); }],
   ['abaDoId_("P02")', function(){ return abaDoId_('P02'); }],
   ['abaDoId_("X01")', function(){ return String(abaDoId_('X01')); }],
   ['semaforo_(-1)',   function(){ return semaforo_(-1); }],
   ['CABECALHOS.RADAR', function(){ return CABECALHOS['RADAR'].length + ' colunas'; }],
   ['SEED_RADAR_()',   function(){ return SEED_RADAR_().length + ' editais'; }],
   ['STATUS_DORMENTE', function(){ return STATUS_DORMENTE.length + ' status'; }],
   ['APP.tz',          function(){ return APP.tz; }],
   ['CORES.sirene',    function(){ return CORES.sirene; }]
  ].forEach(function(c){
    try { console.log('  ' + c[0].padEnd(20) + ' = ' + c[1]()); }
    catch (e) { falhas++; console.log('  x ' + c[0] + ' -> ' + e.message); }
  });
  global.__falhas = falhas;
`;

try { (0, eval)(src + checagens); }
catch (e) { console.log('x FALHOU NA CARGA: ' + e.message); process.exit(1); }
console.log(global.__falhas ? '\nx ' + global.__falhas + ' falha(s)' : '\nok: carrega e resolve na ordem do Apps Script');
process.exit(global.__falhas ? 1 : 0);
