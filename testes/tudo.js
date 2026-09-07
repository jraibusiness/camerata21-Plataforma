// Roda todos os testes. Use antes de cada `clasp push`.
const { execFileSync } = require('child_process');
const testes = ['ordem-de-carga.js', 'setup.js'];
let falhou = 0;
testes.forEach(t => {
  console.log('\n━━━ ' + t + ' ━━━');
  try { console.log(execFileSync(process.execPath, [__dirname + '/' + t], { encoding: 'utf8' })); }
  catch (e) { falhou++; console.log(e.stdout || '', e.stderr || ''); }
});
console.log(falhou ? '✗ ' + falhou + ' teste(s) falharam' : '✓ tudo passou — pode dar clasp push');
process.exit(falhou ? 1 : 0);
