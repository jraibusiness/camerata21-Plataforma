// ============================================================
// RADAR DE FOMENTO — OS-UZP
// Code.gs · setup, motor de cálculo, API do web app, autenticação
// ============================================================

// ============================================================
// 1. SETUP  —  execute UMA VEZ no editor: selecione setupRadar ▶
// ============================================================
function setupRadar() {
  var p = props_();
  var id = p.getProperty('PLANILHA_ID') || PLANILHA_ID_PADRAO;
  var ss;
  if (id) {
    ss = SpreadsheetApp.openById(id);
  } else {
    ss = SpreadsheetApp.create('OS-UZP · Radar de Fomento — base de dados');
    p.setProperty('PLANILHA_ID', ss.getId());
    ss.setSpreadsheetTimeZone(APP.tz);
  }
  if (!p.getProperty('SEGREDO')) {
    p.setProperty('SEGREDO', Utilities.getUuid() + Utilities.getUuid());
  }

  // --- abas + cabeçalhos ---
  Object.keys(CABECALHOS).forEach(function (nome) {
    var sh = ss.getSheetByName(nome) || ss.insertSheet(nome);
    var cab = CABECALHOS[nome];
    // Aba nova nasce com 26 colunas; a RADAR precisa de 30. Sem isto, o
    // setValues do cabeçalho estoura com "coordenadas inválidas".
    if (sh.getMaxColumns() < cab.length) {
      sh.insertColumnsAfter(sh.getMaxColumns(), cab.length - sh.getMaxColumns());
    }
    sh.getRange(1, 1, 1, cab.length).setValues([cab])
      .setFontWeight('bold').setBackground('#1F0A33').setFontColor('#FFB800')
      .setVerticalAlignment('middle');
    sh.setFrozenRows(1);
    sh.setRowHeight(1, 34);
  });
  var def = ss.getSheetByName('Página1') || ss.getSheetByName('Sheet1');
  if (def && ss.getSheets().length > 1) ss.deleteSheet(def);

  // --- CONFIG ---
  var cSh = ss.getSheetByName(ABAS.config);
  if (cSh.getLastRow() < 2) cSh.getRange(2, 1, CONFIG_PADRAO.length, 3).setValues(CONFIG_PADRAO);
  CacheService.getScriptCache().remove('cfg');

  // --- semeadura (idempotente: só se a aba estiver vazia) ---
  semear_(ss, ABAS.radar,    'R', SEED_RADAR_(),    mapRadarSeed_);
  semear_(ss, ABAS.caminho,  'C', SEED_CAMINHO_(),  mapCaminhoSeed_);
  semear_(ss, ABAS.projetos, 'P', SEED_PROJETOS_(), mapProjetoSeed_);
  semear_(ss, ABAS.dossie,   'D', SEED_DOSSIE_(),   mapDossieSeed_);

  var eSh = ss.getSheetByName(ABAS.equipe);
  if (eSh.getLastRow() < 2) {
    var eq = SEED_EQUIPE_();
    eq[0][1] = Session.getEffectiveUser().getEmail() || '';
    eSh.getRange(2, 1, eq.length, eq[0].length).setValues(eq);
  }

  formatarPlanilha_(ss);
  recalcularTudo();
  instalarGatilhos();

  var url = ss.getUrl();
  Logger.log('✅ Radar configurado.\nPlanilha: ' + url +
    '\n\nPRÓXIMOS PASSOS:\n' +
    '1. Abra a aba EQUIPE e preencha e-mail + WhatsApp de João e Vitor.\n' +
    '2. Implantar → Nova implantação → App da Web → Executar como: Eu · Acesso: Qualquer pessoa.\n' +
    '3. Abra a URL /exec e faça login com um e-mail da aba EQUIPE.');
  return url;
}

function semear_(ss, aba, prefixo, dados, mapper) {
  var sh = ss.getSheetByName(aba);
  if (sh.getLastRow() > 1) return;                 // já tem dados: não sobrescreve
  var linhas = dados.map(function (d, i) { return mapper(d, prefixo + pad_(i + 1)); });
  if (linhas.length) sh.getRange(2, 1, linhas.length, linhas[0].length).setValues(linhas);
}

function pad_(n) { return (n < 10 ? '0' : '') + n; }

// ============================================================
// MIGRAÇÃO — quando as colunas mudam
// ------------------------------------------------------------
// setupRadar() só semeia aba vazia, de propósito: rodar duas vezes
// não pode duplicar nada. O efeito colateral é que, quando o esquema
// ganha colunas, uma planilha já criada continua no formato velho.
//
// Esta função reconstrói as QUATRO abas de conteúdo a partir do
// Seed.gs. Preserva EQUIPE, CONFIG, LOG, OTP e ANÁLISE.
//
// APAGA O QUE VOCÊ TIVER EDITADO NAS ABAS RADAR, CAMINHO CRÍTICO,
// PROJETOS E DOSSIÊ. Use quando o conteúdo ainda é o semeado —
// tipicamente logo depois de instalar. Depois disso, prefira
// acrescentar as colunas à mão.
// ============================================================
function ressemearConteudo() {
  var ss = ss_();
  [[ABAS.radar, 'R', SEED_RADAR_(), mapRadarSeed_],
   [ABAS.caminho, 'C', SEED_CAMINHO_(), mapCaminhoSeed_],
   [ABAS.projetos, 'P', SEED_PROJETOS_(), mapProjetoSeed_],
   [ABAS.dossie, 'D', SEED_DOSSIE_(), mapDossieSeed_]].forEach(function (t) {
    var nome = t[0], sh = ss.getSheetByName(nome), cab = CABECALHOS[nome];
    if (!sh) sh = ss.insertSheet(nome);
    sh.clear();
    if (sh.getMaxColumns() < cab.length) {
      sh.insertColumnsAfter(sh.getMaxColumns(), cab.length - sh.getMaxColumns());
    }
    sh.getRange(1, 1, 1, cab.length).setValues([cab])
      .setFontWeight('bold').setBackground('#0B1B3D').setFontColor('#FFB800');
    sh.setFrozenRows(1);
    var linhas = t[2].map(function (d, i) { return t[3](d, t[1] + pad_(i + 1)); });
    if (linhas.length) sh.getRange(2, 1, linhas.length, linhas[0].length).setValues(linhas);
    Logger.log('  ' + nome + ': ' + linhas.length + ' linhas, ' + cab.length + ' colunas');
  });
  formatarPlanilha_(ss);
  recalcularTudo();
  Logger.log('\n✅ Conteúdo reconstruído. EQUIPE, CONFIG, LOG, OTP e ANÁLISE intactas.');
  return 'ok';
}

// seed → linha completa da planilha (colunas calculadas ficam vazias)
function mapRadarSeed_(d, id) {
  // d[19] = gatilho manual (override), d[20] = notas,
  // d[21] = link da página oficial, d[22] = link do documento/PDF
  return [id, d[0], d[1], d[2], d[3], d[4], dt_(d[5]), '', d[6], d[7], d[8],
          d[9], d[10], d[11], d[12], d[13], '', '', d[14], dt_(d[19] || ''), '', '', '',
          d[15], d[16], d[17], d[20] || '', d[18], d[21] || '', d[22] || '', '', '', new Date()];
}
function mapCaminhoSeed_(d, id) {
  return [id, d[0], d[1], d[2], d[3], dt_(d[4]), dt_(d[5]), '', d[6], d[7], d[8],
          d[8] === 'Concluído' ? 100 : 0, '', '', new Date()];
}
function mapProjetoSeed_(d, id) {
  return [id, d[0], d[1], d[2], d[3], d[4], d[5], new Date()];
}
// [documento, titular, validade, onde está, onde emitir, responsável,
//  bloqueia submissão, observação]
function mapDossieSeed_(d, id) {
  return [id, d[0], d[1], dt_(d[2]), '', '', d[3], d[4], d[5], d[6], d[7], new Date()];
}

function formatarPlanilha_(ss) {
  var cinza = '#EEEEEE', creme = '#FFF8E7';
  var r = ss.getSheetByName(ABAS.radar);
  if (r.getMaxRows() > 1) {
    // colunas calculadas → fundo cinza, não editar à mão
    [8, 17, 18, 21, 22, 23].forEach(function (c) {
      r.getRange(2, c, r.getMaxRows() - 1, 1).setBackground(cinza);
    });
    // campos que o Vitor mantém semanalmente → fundo creme
    r.getRange(2, 24, r.getMaxRows() - 1, 4).setBackground(creme);
    r.setColumnWidth(2, 260); r.setColumnWidth(10, 300); r.setColumnWidth(26, 280);
  }
  var d = ss.getSheetByName(ABAS.dossie);
  if (d.getMaxRows() > 1) {
    d.getRange(2, 5, d.getMaxRows() - 1, 2).setBackground(cinza);
    d.setColumnWidth(2, 320);
  }
  var c = ss.getSheetByName(ABAS.caminho);
  if (c.getMaxRows() > 1) {
    c.getRange(2, 8, c.getMaxRows() - 1, 1).setBackground(cinza);
    c.getRange(2, 13, c.getMaxRows() - 1, 1).setBackground(cinza);
    c.setColumnWidth(4, 380); c.setColumnWidth(5, 380);
  }
}

// ============================================================
// 2. DATAS
// ============================================================
function hoje_() {
  var s = Utilities.formatDate(new Date(), APP.tz, 'yyyy-MM-dd').split('-');
  return new Date(Number(s[0]), Number(s[1]) - 1, Number(s[2]));
}
function meiaNoite_(v) {
  if (!v) return null;
  var d = (v instanceof Date) ? v : new Date(v);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function dias_(alvo) {                       // dias de hoje até alvo (negativo = passado)
  var a = meiaNoite_(alvo); if (!a) return null;
  return Math.round((a - hoje_()) / 86400000);
}
function somaDias_(d, n) {
  var x = meiaNoite_(d); if (!x) return null;
  return new Date(x.getFullYear(), x.getMonth(), x.getDate() + n);
}
function fmtBR_(d) {
  var x = meiaNoite_(d); if (!x) return '';
  return Utilities.formatDate(x, APP.tz, 'dd/MM/yyyy');
}
function iso_(d) {
  var x = meiaNoite_(d); if (!x) return '';
  return Utilities.formatDate(x, APP.tz, 'yyyy-MM-dd');
}

// semáforo a partir de dias restantes
function semaforo_(n) {
  if (n === null || n === undefined || n === '') return SEM.NA;
  if (n < 0)  return SEM.VENCIDO;
  if (n === 0) return SEM.HOJE;
  if (n <= 7)  return SEM.CRITICO;
  if (n <= 21) return SEM.ATENCAO;
  return SEM.OK;
}

// ============================================================
// 3. LEITURA + MOTOR DE CÁLCULO
//    As colunas cinza são derivadas aqui, sempre a partir de HOJE.
// ============================================================
function tabela_(aba) {
  var sh = aba_(aba);
  var n = sh.getLastRow();
  var cab = CABECALHOS[aba];
  if (n < 2) return { sh: sh, cab: cab, linhas: [] };
  var vals = sh.getRange(2, 1, n - 1, cab.length).getValues();
  var linhas = vals.map(function (v, i) {
    var o = { _linha: i + 2 };
    cab.forEach(function (c, j) { o[c] = v[j]; });
    return o;
  }).filter(function (o) { return String(o['ID']).trim() !== ''; });
  return { sh: sh, cab: cab, linhas: linhas };
}

function lerRadar_() {
  var corteA = cfgNum('score.corteA', 12), corteB = cfgNum('score.corteB', 8);
  return tabela_(ABAS.radar).linhas.map(function (o) {
    var s = ['Eleg.','Ader.','Valor','Facil.','Prob.']
      .reduce(function (a, k) { return a + (Number(o[k]) || 0); }, 0);
    var pri = s >= corteA ? 'A' : (s >= corteB ? 'B' : 'C');
    var prazo = meiaNoite_(o['Prazo']);
    var preparo = Number(o['Preparo (dias)']) || 0;
    // "Gatilho manual" vence o cálculo. É o que permite trazer para perto um edital
    // de fluxo contínuo cujo prazo é distante — a Funarte Aberta vai até abr/2027,
    // mas a decisão de ocupar a sala é deste semestre.
    var manual = meiaNoite_(o['Gatilho manual']);
    var gatilho = manual || (prazo ? somaDias_(prazo, -preparo) : null);
    var dR = prazo ? dias_(prazo) : null;
    var dG = gatilho ? dias_(gatilho) : null;
    var status = String(o['Status'] || '').toUpperCase();
    var dormente = STATUS_DORMENTE.some(function (x) { return status.indexOf(x) >= 0; });
    var adiado = meiaNoite_(o['Adiado até']);
    var emEspera = adiado ? dias_(adiado) > 0 : false;

    return {
      id: o['ID'], linha: o._linha,
      instrumento: o['Instrumento'], orgao: o['Órgão / Empresa'], tipo: o['Tipo'],
      periodicidade: o['Periodicidade'], janela: o['Janela típica'],
      prazo: iso_(prazo), prazoBR: fmtBR_(prazo), diasRestantes: dR,
      proponente: o['Proponente elegível'], prerequisito: o['Pré-requisito bloqueante'],
      match: o['Projeto-match'],
      eleg: Number(o['Eleg.']) || 0, ader: Number(o['Ader.']) || 0, valor: Number(o['Valor']) || 0,
      facil: Number(o['Facil.']) || 0, prob: Number(o['Prob.']) || 0,
      score: s, pri: pri,
      preparo: preparo, gatilho: iso_(gatilho), gatilhoBR: fmtBR_(gatilho), diasGatilho: dG,
      gatilhoManual: iso_(manual),
      semaforo: semaforo_(dG !== null ? dG : dR),
      responsavel: o['Responsável'], status: o['Status'],
      proximaAcao: o['Próxima ação'], notas: o['Notas'], fonte: o['Fonte'],
      link: String(o['Link'] || '').trim(), documento: String(o['Documento'] || '').trim(),
      leitura: String(o['Leitura'] || '').trim(),
      adiadoAte: iso_(adiado),
      bloqueado: Number(o['Eleg.']) === 0,
      dormente: dormente, emEspera: emEspera,
      cicloEncerrado: dR !== null && dR < 0,
      semDono: !String(o['Responsável'] || '').trim(),
      // Ordenação: ciclo encerrado e item adiado são reais, mas não competem
      // por atenção com o que ainda dá para fazer. Vão para o fim da fila.
      urgencia: (dR !== null && dR < 0) ? 90000 + Math.abs(dR)
              : (adiado && dias_(adiado) > 0) ? 80000 + dias_(adiado)
              : (dG !== null ? dG : (dR !== null ? dR : 70000))
    };
  });
}

function lerCaminho_() {
  return tabela_(ABAS.caminho).linhas.map(function (o) {
    var fim = meiaNoite_(o['Fim']), ini = meiaNoite_(o['Início']);
    var dF = fim ? dias_(fim) : null;
    var st = String(o['Status'] || '');
    var concluido = /conclu/i.test(st);
    return {
      id: o['ID'], linha: o._linha, fase: o['Fase'], ordem: Number(o['Ordem']) || 0,
      entregavel: o['Entregável'], porque: o['Por que existe'],
      inicio: iso_(ini), inicioBR: fmtBR_(ini), fim: iso_(fim), fimBR: fmtBR_(fim),
      diasFim: dF, responsavel: o['Responsável'], depende: o['Depende de'],
      status: st, pct: concluido ? 100 : (Number(o['% Concluído']) || 0),
      concluido: concluido,
      atrasado: !concluido && dF !== null && dF < 0,
      semaforo: concluido ? SEM.OK : semaforo_(dF),
      notas: o['Notas']
    };
  }).sort(function (a, b) { return a.ordem - b.ordem; });
}

function lerDossie_() {
  return tabela_(ABAS.dossie).linhas.map(function (o) {
    var v = meiaNoite_(o['Validade']);
    var d = v ? dias_(v) : null;
    return {
      id: o['ID'], linha: o._linha, documento: o['Documento'], titular: o['Titular'],
      validade: iso_(v), validadeBR: fmtBR_(v), diasVencer: d,
      semaforo: v ? semaforo_(d) : SEM.NA,
      onde: o['Onde está'], ondeEmitir: String(o['Onde emitir'] || '').trim(),
      responsavel: o['Responsável'], obs: o['Observação'],
      // Documento que bloqueia submissão e está vencido ou ausente trava o
      // edital inteiro: não adianta o projeto estar pronto.
      bloqueia: /^s/i.test(String(o['Bloqueia submissão'] || '')),
      ausente: !v && /ausente|pendente|não consta|nao consta|a confirmar/i.test(String(o['Observação'] || '') + String(o['Onde está'] || '')),
      semValidade: !v
    };
  });
}

function lerProjetos_() {
  return tabela_(ABAS.projetos).linhas.map(function (o) {
    return {
      id: o['ID'], linha: o._linha, projeto: o['Projeto / peça'], formacao: o['Formação'],
      estado: o['Estado'], reaproveitavel: o['Reaproveitável em'],
      titularidade: o['Titularidade'], obs: o['Observação']
    };
  });
}

function lerEquipe_() {
  var sh = aba_(ABAS.equipe);
  if (sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, 7).getValues()
    .filter(function (r) { return String(r[1]).trim(); })
    .map(function (r) {
      return {
        nome: String(r[0]).trim(), email: String(r[1]).trim().toLowerCase(),
        // destino = valor cru (o chat_id do Telegram pode ser negativo);
        // whatsapp = só dígitos, para os provedores de telefone.
        destino: String(r[2]).trim(),
        whatsapp: String(r[2]).replace(/\D/g, ''), papel: String(r[3]).trim(),
        digest: /^s/i.test(String(r[4])), pauta: /^s/i.test(String(r[5])),
        ativo: /^s/i.test(String(r[6]))
      };
    });
}

// -------- grava as colunas derivadas de volta na planilha --------
function recalcularTudo() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return 'ocupado';

  try {
    var sh = aba_(ABAS.radar);
    var r = lerRadar_();
    r.forEach(function (x) {
      sh.getRange(x.linha, 8).setValue(x.diasRestantes === null ? '—' : x.diasRestantes);
      sh.getRange(x.linha, 17).setValue(x.score);
      sh.getRange(x.linha, 18).setValue(x.pri);
      sh.getRange(x.linha, 21).setValue(x.gatilho ? meiaNoite_(x.gatilho + 'T12:00:00') : '—');
      sh.getRange(x.linha, 22).setValue(x.diasGatilho === null ? '—' : x.diasGatilho);
      sh.getRange(x.linha, 23).setValue(x.semaforo);
    });

    var cs = aba_(ABAS.caminho);
    lerCaminho_().forEach(function (x) {
      cs.getRange(x.linha, 8).setValue(x.diasFim === null ? '—' : x.diasFim);
      cs.getRange(x.linha, 13).setValue(x.atrasado ? 'ATRASADO' : x.semaforo);
    });

    var ds = aba_(ABAS.dossie);
    lerDossie_().forEach(function (x) {
      ds.getRange(x.linha, 5).setValue(x.diasVencer === null ? '—' : x.diasVencer);
      ds.getRange(x.linha, 6).setValue(x.semaforo);
    });
    return 'ok';
  } finally {
    lock.releaseLock();
  }
}

// ============================================================
// 4. A FILA — o coração da plataforma
//    Uma lista única, ordenada por urgência, do que precisa
//    de decisão HOJE. Se está aqui, tem dono e tem próximo passo.
// ============================================================
function montarFila_(opts) {
  opts = opts || {};
  var janelaGatilho = opts.gatilhoDias !== undefined ? opts.gatilhoDias : cfgNum('alerta.gatilhoDias', 7);
  var janelaPrazo   = opts.prazoDias   !== undefined ? opts.prazoDias   : cfgNum('alerta.prazoDias', 14);
  var janelaDossie  = opts.dossieDias  !== undefined ? opts.dossieDias  : cfgNum('alerta.dossieDias', 30);
  var itens = [];

  lerRadar_().forEach(function (x) {
    // Prazo vencido = ciclo encerrado: vira reprogramação para o ano seguinte,
    // não alarme diário. Fica visível no RADAR, fora da fila.
    if (x.dormente || x.emEspera || x.cicloEncerrado) return;
    var motivo = null, peso = 0;
    if (x.diasGatilho !== null && x.diasGatilho < 0)            { motivo = 'Gatilho vencido há ' + Math.abs(x.diasGatilho) + 'd'; peso = 0; }
    else if (x.diasGatilho !== null && x.diasGatilho === 0)     { motivo = 'O trabalho começa HOJE'; peso = 1; }
    else if (x.diasGatilho !== null && x.diasGatilho <= janelaGatilho) { motivo = 'Gatilho em ' + x.diasGatilho + 'd'; peso = 2; }
    else if (x.diasRestantes !== null && x.diasRestantes >= 0 && x.diasRestantes <= janelaPrazo) { motivo = 'Prazo em ' + x.diasRestantes + 'd'; peso = 2; }
    if (!motivo) return;
    itens.push({
      fonteAba: 'RADAR', id: x.id, titulo: x.instrumento, sub: x.orgao,
      motivo: motivo, peso: peso, pri: x.pri, score: x.score,
      responsavel: x.responsavel, acao: x.proximaAcao, status: x.status,
      prazoBR: x.prazoBR, gatilhoBR: x.gatilhoBR,
      dias: x.diasGatilho !== null ? x.diasGatilho : x.diasRestantes,
      semDono: x.semDono, link: x.link || x.documento || ''
    });
  });

  lerCaminho_().forEach(function (x) {
    if (x.concluido) return;
    if (!(x.atrasado || (x.diasFim !== null && x.diasFim <= janelaGatilho))) return;
    itens.push({
      fonteAba: 'CAMINHO', id: x.id, titulo: x.entregavel, sub: x.fase,
      motivo: x.atrasado ? 'ATRASADO há ' + Math.abs(x.diasFim) + 'd' : 'Vence em ' + x.diasFim + 'd',
      peso: x.atrasado ? 0 : 2, pri: 'A', score: 0,
      responsavel: x.responsavel, acao: x.porque, status: x.status,
      prazoBR: x.fimBR, gatilhoBR: x.inicioBR, dias: x.diasFim,
      semDono: !String(x.responsavel || '').trim(), link: ''
    });
  });

  lerDossie_().forEach(function (x) {
    var trava = x.bloqueia && x.ausente;
    if (!trava && (x.diasVencer === null || x.diasVencer > janelaDossie)) return;
    itens.push({
      fonteAba: 'DOSSIÊ', id: x.id, titulo: x.documento, sub: x.titular,
      motivo: trava ? 'AUSENTE — trava submissão'
            : (x.diasVencer < 0 ? 'VENCIDO há ' + Math.abs(x.diasVencer) + 'd' : 'Vence em ' + x.diasVencer + 'd'),
      peso: (trava || x.diasVencer < 0) ? 0 : 1, pri: 'A', score: 0,
      responsavel: x.responsavel, acao: x.bloqueia
        ? 'Emitir ou renovar — sem este documento nenhum edital pode ser submetido'
        : 'Renovar o documento',
      status: x.onde, prazoBR: x.validadeBR, gatilhoBR: '',
      dias: x.diasVencer === null ? -1 : x.diasVencer,
      semDono: !String(x.responsavel || '').trim(),
      link: x.ondeEmitir ? 'https://' + x.ondeEmitir.replace(/^https?:\/\//,'') : ''
    });
  });

  itens.sort(function (a, b) {
    if (a.peso !== b.peso) return a.peso - b.peso;
    if (a.dias !== b.dias) return a.dias - b.dias;
    return (a.pri > b.pri) ? 1 : -1;
  });
  return itens;
}

function kpis_(radar, caminho, dossie, fila) {
  var ativos = radar.filter(function (x) { return !x.dormente; });
  return {
    prioridadeA: ativos.filter(function (x) { return x.pri === 'A' && !x.bloqueado; }).length,
    bloqueados:  ativos.filter(function (x) { return x.bloqueado; }).length,
    gatilhosVencidos: ativos.filter(function (x) { return !x.emEspera && x.diasGatilho !== null && x.diasGatilho < 0; }).length,
    semDono:     ativos.filter(function (x) { return x.semDono && x.pri !== 'C'; }).length,
    reprogramar: ativos.filter(function (x) { return x.cicloEncerrado; }).length,
    // O número que manda no dossiê: quantos documentos impedem QUALQUER submissão hoje.
    travando: dossie.filter(function (x) {
      return x.bloqueia && ((x.diasVencer !== null && x.diasVencer < 0) || x.ausente);
    }).length,
    docsVencendo: dossie.filter(function (x) { return x.diasVencer !== null && x.diasVencer <= cfgNum('alerta.dossieDias', 30); }).length,
    etapasAtrasadas: caminho.filter(function (x) { return x.atrasado; }).length,
    caminhoPct: caminho.length ? Math.round(caminho.reduce(function (a, x) { return a + x.pct; }, 0) / caminho.length) : 0,
    filaHoje: fila.length,
    proxima: (function () {
      var f = ativos.filter(function (x) { return x.diasRestantes !== null && x.diasRestantes >= 0; })
                    .sort(function (a, b) { return a.diasRestantes - b.diasRestantes; })[0];
      return f ? { nome: f.instrumento, dias: f.diasRestantes, data: f.prazoBR } : null;
    })()
  };
}

// ============================================================
// 5. AUTENTICAÇÃO — OTP por e-mail + sessão assinada (HMAC)
// ============================================================
function hmac_(msg) {
  var sig = Utilities.computeHmacSha256Signature(msg, props_().getProperty('SEGREDO') || 'sem-segredo');
  return Utilities.base64EncodeWebSafe(sig).replace(/=+$/, '');
}

function emitirSessao_(email) {
  var exp = Date.now() + 12 * 3600 * 1000;      // 12 h
  var base = email + '|' + exp;
  return Utilities.base64EncodeWebSafe(base) + '.' + hmac_(base);
}

function sessao_(token) {
  if (!token) throw new Error('Sessão ausente. Faça login novamente.');
  var p = String(token).split('.');
  if (p.length !== 2) throw new Error('Sessão inválida.');
  var base = Utilities.newBlob(Utilities.base64DecodeWebSafe(p[0])).getDataAsString();
  if (hmac_(base) !== p[1]) throw new Error('Sessão inválida.');
  var q = base.split('|');
  if (Number(q[1]) < Date.now()) throw new Error('Sessão expirada. Faça login novamente.');
  var email = q[0];
  var eq = lerEquipe_().filter(function (m) { return m.email === email && m.ativo; });
  if (!eq.length) throw new Error('Acesso revogado.');
  return eq[0];
}

function pedirCodigo(email) {
  try {
    email = String(email || '').trim().toLowerCase();
    var m = lerEquipe_().filter(function (x) { return x.email === email && x.ativo; })[0];
    if (!m) return { ok: false, msg: 'E-mail não autorizado. Peça para ser incluído na aba EQUIPE.' };
    var code = String(Math.floor(100000 + Math.random() * 900000));
    aba_(ABAS.otp).appendRow([email, code, new Date()]);
    MailApp.sendEmail({
      to: email,
      subject: code + ' — seu código do Radar de Fomento',
      htmlBody: emailCodigo_(m.nome, code)
    });
    return { ok: true, msg: 'Código enviado para ' + email };
  } catch (e) {
    return { ok: false, msg: 'Erro ao enviar código: ' + e.message };
  }
}

function validarCodigo(email, code) {
  try {
    email = String(email || '').trim().toLowerCase();
    code = String(code || '').trim();
    var sh = aba_(ABAS.otp);
    if (sh.getLastRow() < 2) return { ok: false, msg: 'Nenhum código pendente.' };
    var vals = sh.getRange(2, 1, sh.getLastRow() - 1, 3).getValues();
    var limite = Date.now() - 10 * 60 * 1000;
    for (var i = vals.length - 1; i >= 0; i--) {
      if (String(vals[i][0]).trim().toLowerCase() === email &&
          String(vals[i][1]).trim() === code &&
          new Date(vals[i][2]).getTime() > limite) {
        sh.deleteRow(i + 2);
        var m = lerEquipe_().filter(function (x) { return x.email === email; })[0];
        return { ok: true, token: emitirSessao_(email), nome: m ? m.nome : email, papel: m ? m.papel : '' };
      }
    }
    return { ok: false, msg: 'Código inválido ou expirado.' };
  } catch (e) {
    return { ok: false, msg: 'Erro: ' + e.message };
  }
}

function limparOTPs_() {
  var sh = aba_(ABAS.otp);
  if (sh.getLastRow() < 2) return;
  var limite = Date.now() - 60 * 60 * 1000;
  var vals = sh.getRange(2, 1, sh.getLastRow() - 1, 3).getValues();
  for (var i = vals.length - 1; i >= 0; i--) {
    if (new Date(vals[i][2]).getTime() < limite) sh.deleteRow(i + 2);
  }
}

// ============================================================
// 6. API DO WEB APP  (chamada por google.script.run)
// ============================================================
function getEstado(token) {
  var u = sessao_(token);
  var radar = lerRadar_(), caminho = lerCaminho_(), dossie = lerDossie_(), projetos = lerProjetos_();
  var fila = montarFila_();
  return {
    usuario: { nome: u.nome, email: u.email, papel: u.papel },
    hoje: fmtBR_(hoje_()),
    diaSemana: ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'][hoje_().getDay()],
    kpis: kpis_(radar, caminho, dossie, fila),
    fila: fila, radar: radar, caminho: caminho, dossie: dossie, projetos: projetos,
    equipe: lerEquipe_().map(function (m) { return { nome: m.nome, email: m.email }; }),
    planilhaUrl: ss_().getUrl(),
    ritual: cfg('pauta.diaSemana', 'SEG')
  };
}

// NÃO transformar em constante de topo: o Apps Script avalia os arquivos .gs em
// ordem alfabética, então Code.gs carrega antes de Config.gs e ABAS ainda não
// existe. Dentro de função, só é lido na hora da chamada.
function abaDoId_(id) {
  return ({ R: ABAS.radar, C: ABAS.caminho, P: ABAS.projetos, D: ABAS.dossie })[String(id).charAt(0)];
}

function salvarCampo(token, id, campo, valor) {
  var u = sessao_(token);
  var aba = abaDoId_(id);
  if (!aba) throw new Error('ID desconhecido: ' + id);
  var t = tabela_(aba);
  var alvo = t.linhas.filter(function (o) { return o['ID'] === id; })[0];
  if (!alvo) throw new Error('Registro não encontrado: ' + id);
  var col = t.cab.indexOf(campo);
  if (col < 0) throw new Error('Campo inexistente: ' + campo);

  var antes = alvo[campo];
  var novo = valor;
  if (/^(Prazo|Início|Fim|Validade|Adiado até|Gatilho manual)$/.test(campo)) {
    novo = valor ? meiaNoite_(valor + 'T12:00:00') : '';
  } else if (/^(Eleg\.|Ader\.|Valor|Facil\.|Prob\.|Preparo \(dias\)|% Concluído|Ordem)$/.test(campo)) {
    novo = Number(valor) || 0;
  }
  t.sh.getRange(alvo._linha, col + 1).setValue(novo);
  var iAtu = t.cab.indexOf('Atualizado em');
  if (iAtu >= 0) t.sh.getRange(alvo._linha, iAtu + 1).setValue(new Date());

  log_(u.email, aba, id, campo, antes, novo);
  recalcularLinha_(aba, id);
  return { ok: true };
}

function recalcularLinha_(aba, id) {
  try {
    if (aba === ABAS.radar) {
      var x = lerRadar_().filter(function (r) { return r.id === id; })[0]; if (!x) return;
      var sh = aba_(ABAS.radar);
      sh.getRange(x.linha, 8).setValue(x.diasRestantes === null ? '—' : x.diasRestantes);
      sh.getRange(x.linha, 17).setValue(x.score);
      sh.getRange(x.linha, 18).setValue(x.pri);
      sh.getRange(x.linha, 21).setValue(x.gatilho ? meiaNoite_(x.gatilho + 'T12:00:00') : '—');
      sh.getRange(x.linha, 22).setValue(x.diasGatilho === null ? '—' : x.diasGatilho);
      sh.getRange(x.linha, 23).setValue(x.semaforo);
    } else if (aba === ABAS.caminho) {
      var c = lerCaminho_().filter(function (r) { return r.id === id; })[0]; if (!c) return;
      var cs = aba_(ABAS.caminho);
      cs.getRange(c.linha, 8).setValue(c.diasFim === null ? '—' : c.diasFim);
      cs.getRange(c.linha, 13).setValue(c.atrasado ? 'ATRASADO' : c.semaforo);
    } else if (aba === ABAS.dossie) {
      var d = lerDossie_().filter(function (r) { return r.id === id; })[0]; if (!d) return;
      var ds = aba_(ABAS.dossie);
      ds.getRange(d.linha, 5).setValue(d.diasVencer === null ? '—' : d.diasVencer);
      ds.getRange(d.linha, 6).setValue(d.semaforo);
    }
  } catch (e) { Logger.log('recalcularLinha_: ' + e); }
}

// Captura rápida — o POP manda: Vitor cria a linha com o mínimo, João pontua depois.
function novoEdital(token, d) {
  var u = sessao_(token);
  var sh = aba_(ABAS.radar);
  var ids = tabela_(ABAS.radar).linhas.map(function (o) { return Number(String(o['ID']).replace(/\D/g, '')) || 0; });
  var id = 'R' + pad_((ids.length ? Math.max.apply(null, ids) : 0) + 1);
  sh.appendRow([id, d.instrumento || '(sem nome)', d.orgao || '', d.tipo || '', d.periodicidade || '',
    d.janela || '', d.prazo ? meiaNoite_(d.prazo + 'T12:00:00') : '', '',
    d.proponente || '', d.prerequisito || '', d.match || '',
    0, 0, 0, 0, 0, '', '', Number(d.preparo) || 30, d.gatilho ? meiaNoite_(d.gatilho + 'T12:00:00') : '', '', '', '',
    d.responsavel || '', d.status || '0. Novo — pontuar', d.proximaAcao || 'Pontuar os 5 critérios',
    d.notas || '', d.fonte || '', d.link || '', d.documento || '', '', '', new Date()]);
  log_(u.email, ABAS.radar, id, 'NOVO', '', d.instrumento || '');
  recalcularLinha_(ABAS.radar, id);
  return { ok: true, id: id };
}

function adiar(token, id, dias) {
  var u = sessao_(token);
  return salvarCampo(token, id, 'Adiado até', iso_(somaDias_(hoje_(), Number(dias) || 7)));
}

function concluirEtapa(token, id) {
  var u = sessao_(token);
  salvarCampo(token, id, 'Status', 'Concluído');
  salvarCampo(token, id, '% Concluído', 100);
  return { ok: true };
}

function renovarDocumento(token, id, novaValidade) {
  return salvarCampo(token, id, 'Validade', novaValidade);
}

function log_(email, aba, id, campo, de, para) {
  try {
    aba_(ABAS.log).appendRow([new Date(), email, aba, id, campo,
      de instanceof Date ? fmtBR_(de) : String(de).slice(0, 200),
      para instanceof Date ? fmtBR_(para) : String(para).slice(0, 200)]);
  } catch (e) { Logger.log('log_: ' + e); }
}

// ============================================================
// 7. ROTEAMENTO DO WEB APP
// ============================================================
function doGet(e) {
  var p = (e && e.parameter) || {};

  // guarda a URL pública na primeira visita (usada nos e-mails e no WhatsApp)
  try {
    if (!cfg('app.url', '')) cfgSet('app.url', ScriptApp.getService().getUrl());
  } catch (err) {}

  if (p.a) return paginaAcaoRapida_(p);       // link de ação de 1 clique (e-mail/WhatsApp)

  var t = HtmlService.createTemplateFromFile('radar');
  t.baseUrl = ScriptApp.getService().getUrl();
  t.foco = p.foco || '';
  return t.evaluate()
    .setTitle('Radar de Fomento — OS-UZP')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// -------- ações de 1 clique (sem login, com token assinado e curto) --------
function tokenAcao_(acao, id) {
  var semana = Math.floor(Date.now() / (7 * 86400000));   // validade ~1 semana
  return hmac_(acao + '|' + id + '|' + semana).slice(0, 22);
}
function tokenAcaoValido_(acao, id, k) {
  var s = Math.floor(Date.now() / (7 * 86400000));
  return k === hmac_(acao + '|' + id + '|' + s).slice(0, 22) ||
         k === hmac_(acao + '|' + id + '|' + (s - 1)).slice(0, 22);
}
function linkAcao_(acao, id) {
  var base = cfg('app.url', '') || ScriptApp.getService().getUrl();
  return base + '?a=' + acao + '&id=' + encodeURIComponent(id) + '&k=' + tokenAcao_(acao, id);
}

function paginaAcaoRapida_(p) {
  var acao = p.a, id = p.id, k = p.k;
  var titulo = 'Ação não reconhecida', msg = '';
  if (!tokenAcaoValido_(acao, id, k)) {
    titulo = 'Link expirado';
    msg = 'Este link de ação já não é válido. Abra o Radar e faça a alteração por lá.';
  } else {
    try {
      if (acao === 'adiar7')      { forcarCampo_(id, 'Adiado até', somaDias_(hoje_(), 7)); titulo = 'Adiado por 7 dias'; msg = id + ' sai da fila até ' + fmtBR_(somaDias_(hoje_(), 7)) + '.'; }
      else if (acao === 'feito')  { forcarCampo_(id, 'Status', 'Concluído'); forcarCampo_(id, '% Concluído', 100); titulo = 'Marcado como concluído'; msg = id + ' foi concluído.'; }
      else if (acao === 'meu')    { titulo = 'Abra o Radar'; msg = 'Assumir responsabilidade exige login. Abra o Radar para atribuir.'; }
      else { msg = 'Ação desconhecida.'; }
      recalcularLinha_(abaDoId_(id), id);
      log_('link-rápido', abaDoId_(id), id, acao, '', '');
    } catch (err) {
      titulo = 'Não foi possível concluir'; msg = err.message;
    }
  }
  var url = cfg('app.url', '') || ScriptApp.getService().getUrl();
  return HtmlService.createHtmlOutput(
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<div style="font-family:system-ui,-apple-system,sans-serif;background:#1F0A33;color:#F2EDE2;' +
    'min-height:100vh;margin:0;display:flex;align-items:center;justify-content:center;padding:24px">' +
    '<div style="max-width:420px;text-align:center">' +
    '<div style="font-size:11px;letter-spacing:.26em;color:#FFB800;margin-bottom:18px">RADAR DE FOMENTO · OS-UZP</div>' +
    '<h1 style="font-size:26px;font-weight:600;margin:0 0 12px">' + titulo + '</h1>' +
    '<p style="opacity:.75;line-height:1.7;font-size:15px">' + msg + '</p>' +
    '<a href="' + url + '" target="_top" style="display:inline-block;margin-top:26px;padding:14px 26px;' +
    'background:#FFB800;color:#17082A;text-decoration:none;font-weight:600;letter-spacing:.08em">ABRIR O RADAR</a>' +
    '</div></div>')
    .setTitle(titulo)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function forcarCampo_(id, campo, valor) {
  var aba = abaDoId_(id);
  if (!aba) throw new Error('ID desconhecido.');
  var t = tabela_(aba);
  var alvo = t.linhas.filter(function (o) { return o['ID'] === id; })[0];
  if (!alvo) throw new Error('Registro não encontrado.');
  var col = t.cab.indexOf(campo);
  if (col < 0) throw new Error('Campo inexistente.');
  t.sh.getRange(alvo._linha, col + 1).setValue(valor);
}
