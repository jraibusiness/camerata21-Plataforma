// ============================================================
// RADAR DE FOMENTO — OS-UZP
// Notificacoes.gs · report diário, pauta semanal, WhatsApp,
//                   Google Calendar e gatilhos de tempo
// ------------------------------------------------------------
// REGRA DE OURO DA NOTIFICAÇÃO:
//   Um alerta que chega todo dia sem exigir nada vira ruído,
//   e ruído é ignorado em três semanas. Por isso:
//   · o report só é enviado quando existe ação;
//   · o WhatsApp traz no máximo N itens — o resto fica no e-mail;
//   · cada item chega com dono, prazo e UM próximo passo.
//
// IDENTIDADE (Sistema de Marca OS-UZP v5):
//   Fundo Noturno, atmosfera Roxo, texto Marfim, rótulo Latão.
//   Farol é acento ÚNICO — no Z da sigla, no arco principal e em
//   um só ponto de leitura por peça. Cena nunca é texto; Verde só
//   como massa gráfica. Nada de SVG: o Gmail bloqueia, então os
//   três arcos entram como três filetes em defasagem, que
//   sobrevivem a qualquer cliente de e-mail.
// ============================================================

var CORES = {
  noturno:  '#0B1B3D',   // fundo
  noturno2: '#101F44',   // cartão
  roxo:     '#1F0A33',   // atmosfera
  farol:    '#FFB800',   // acento único
  marfim:   '#EFD5B4',   // texto
  latao:    '#A69773',   // rótulo e filete
  cena:     '#3B56A6',   // massa gráfica — nunca texto
  verde:    '#128743',   // terceira voz — só massa gráfica
  zumbi:    '#13387F',   // assinatura sobre claro
  sirene:   '#FF5C63'    // camada de estado — só nesta plataforma
};

// Instrument Serif não carrega em e-mail; Georgia é o fallback do brandkit.
var FT_DISPLAY = "Georgia,'Instrument Serif','Times New Roman',serif";
var FT_ROTULO  = "'Arial Narrow',Arial,Helvetica,sans-serif";
var FT_TEXTO   = "Roboto,Helvetica,Arial,sans-serif";

function corSemaforo_(peso) {
  // peso 0 = vencido · 1 = é hoje · 2 = está chegando
  return peso === 0 ? CORES.sirene : (peso === 1 ? CORES.farol : CORES.latao);
}

// ============================================================
// 1. REPORT DIÁRIO
// ============================================================
function enviarDigestDiario() {
  var dias = String(cfg('digest.dias', 'SEG,TER,QUA,QUI,SEX')).toUpperCase();
  var hojeSigla = ['DOM','SEG','TER','QUA','QUI','SEX','SAB'][hoje_().getDay()];
  if (dias.indexOf(hojeSigla) < 0) return 'fora do calendário de envio';

  recalcularTudo();
  var fila = montarFila_();
  var radar = lerRadar_(), caminho = lerCaminho_(), dossie = lerDossie_();
  var k = kpis_(radar, caminho, dossie, fila);

  if (!fila.length && cfgBool('digest.silencioSemAcao', true)) {
    Logger.log('Sem ações hoje — nenhum envio (silêncio configurado).');
    return 'silencio';
  }

  var equipe = lerEquipe_().filter(function (m) { return m.ativo && m.digest; });
  var assunto = assuntoDigest_(fila, k);

  equipe.forEach(function (m) {
    var minhas = fila.filter(function (i) { return ehDe_(i.responsavel, m.nome); });
    try {
      MailApp.sendEmail({
        to: m.email, subject: assunto, htmlBody: emailDigest_(m, fila, minhas, k),
        name: 'Radar de Fomento · OS-UZP'
      });
    } catch (e) { Logger.log('e-mail ' + m.email + ': ' + e); }

    if (m.destino) {
      try { enviarWhatsApp(m.destino, textoWhatsApp_(m, fila, minhas, k)); }
      catch (e) { Logger.log('mensagem para ' + m.nome + ': ' + e); }
    }
  });
  return 'enviado para ' + equipe.length + ' pessoa(s) · ' + fila.length + ' item(ns)';
}

function ehDe_(responsavel, nome) {
  if (!responsavel || !nome) return false;
  return String(responsavel).toLowerCase().indexOf(String(nome).split(' ')[0].toLowerCase()) >= 0;
}

function assuntoDigest_(fila, k) {
  var venc = fila.filter(function (i) { return i.peso === 0; }).length;
  var d = fmtBR_(hoje_());
  if (venc) return venc + ' vencido(s) · Radar OS-UZP · ' + d;
  if (fila.length) return fila.length + ' ação(ões) hoje · Radar OS-UZP · ' + d;
  return 'Sem pendências · Radar OS-UZP · ' + d;
}

// ============================================================
// 2. PAUTA SEMANAL (o ritual de 20 minutos do POP)
// ============================================================
function enviarPautaSemanal() {
  var alvo = String(cfg('pauta.diaSemana', 'SEG')).toUpperCase();
  var hojeSigla = ['DOM','SEG','TER','QUA','QUI','SEX','SAB'][hoje_().getDay()];
  if (alvo !== hojeSigla) return 'não é o dia do ritual';

  recalcularTudo();
  var radar = lerRadar_(), caminho = lerCaminho_(), dossie = lerDossie_();
  var fila = montarFila_({ gatilhoDias: 7, prazoDias: 21, dossieDias: 30 });
  var k = kpis_(radar, caminho, dossie, fila);

  var equipe = lerEquipe_().filter(function (m) { return m.ativo && m.pauta; });
  var html = emailPauta_(fila, radar, caminho, dossie, k);
  equipe.forEach(function (m) {
    try {
      MailApp.sendEmail({
        to: m.email, subject: 'Pauta da semana · Radar OS-UZP · ' + fmtBR_(hoje_()),
        htmlBody: html, name: 'Radar de Fomento · OS-UZP'
      });
    } catch (e) { Logger.log('pauta ' + m.email + ': ' + e); }
    if (m.destino) {
      try {
        enviarWhatsApp(m.destino,
          '*RITUAL DE SEGUNDA · 20 MIN*\n' +
          'Radar OS-UZP — ' + fmtBR_(hoje_()) + '\n\n' +
          '1. RADAR: ' + k.gatilhosVencidos + ' gatilho(s) vencido(s), ' + k.prioridadeA + ' prioridade A ativa(s)\n' +
          '2. DOSSIÊ: ' + k.docsVencendo + ' documento(s) vencendo em 30d\n' +
          '3. CAMINHO: ' + k.etapasAtrasadas + ' etapa(s) atrasada(s) · ' + k.caminhoPct + '% do plano\n' +
          '4. SEM DONO: ' + k.semDono + ' linha(s) A/B sem responsável\n\n' +
          'Pauta completa: ' + urlApp_());
      } catch (e) { Logger.log('pauta, mensagem para ' + m.nome + ': ' + e); }
    }
  });
  return 'pauta enviada';
}

// ============================================================
// 3. E-MAILS — Sistema de Marca OS-UZP v5 em HTML de e-mail
// ============================================================
function urlApp_() {
  return cfg('app.url', '') || (function () { try { return ScriptApp.getService().getUrl(); } catch (e) { return ''; } })();
}

function esc_(s) {
  return String(s === null || s === undefined ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Os três arcos em defasagem, traduzidos para e-mail: três filetes de
// largura e espessura decrescentes, entrando em atraso. Farol, Cena, Verde,
// sempre nesta ordem. Lê-se como contraponto — três vozes em imitação.
function arcosEmail_() {
  function voz(cor, larg, alt, recuo) {
    return '<tr><td style="padding:0 0 3px ' + recuo + 'px;">' +
      '<div style="width:' + larg + 'px;height:' + alt + 'px;background:' + cor + ';font-size:0;line-height:0;">&nbsp;</div>' +
      '</td></tr>';
  }
  return '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tbody>' +
    voz(CORES.farol, 124, 8, 0) + voz(CORES.cena, 92, 5, 18) + voz(CORES.verde, 60, 3, 36) +
    '</tbody></table>';
}

// Assinatura nível 1 do brandkit: a sigla manda, o Z é sempre o acento.
function siglaEmail_(tamanho, corTexto, corZ) {
  return '<span style="font-family:' + FT_DISPLAY + ';font-size:' + tamanho + 'px;line-height:.9;color:' + corTexto + ';">' +
    'U<i style="color:' + corZ + ';">Z</i>P</span>';
}

function cascaEmail_(titulo, subtitulo, miolo) {
  return '' +
  '<div style="margin:0;padding:0;background:' + CORES.noturno + ';">' +
  '<div style="max-width:640px;margin:0 auto;background:' + CORES.noturno + ';' +
  'font-family:' + FT_TEXTO + ';font-weight:300;color:' + CORES.marfim + ';padding:30px 22px 46px;">' +

    // ── cabeçalho: arcos + sigla + rótulo ──
    arcosEmail_() +
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:18px;"><tr>' +
      '<td style="padding-right:14px;vertical-align:bottom;">' + siglaEmail_(38, CORES.marfim, CORES.farol) + '</td>' +
      '<td style="vertical-align:bottom;padding-bottom:3px;">' +
        '<div style="font-family:' + FT_ROTULO + ';font-size:9.5px;letter-spacing:.26em;' +
        'text-transform:uppercase;color:' + CORES.latao + ';">Orquestra Sinfônica</div>' +
        '<div style="font-family:' + FT_ROTULO + ';font-size:9.5px;letter-spacing:.26em;' +
        'text-transform:uppercase;color:' + CORES.marfim + ';margin-top:4px;">Radar de Fomento</div>' +
      '</td>' +
    '</tr></table>' +
    '<div style="height:1px;background:' + CORES.latao + ';opacity:.5;margin:22px 0 28px;font-size:0;line-height:0;">&nbsp;</div>' +

    '<h1 style="font-family:' + FT_DISPLAY + ';font-weight:400;font-size:30px;line-height:1.1;' +
      'margin:0 0 10px;color:' + CORES.marfim + ';">' + titulo + '</h1>' +
    '<div style="font-family:' + FT_ROTULO + ';font-size:10px;letter-spacing:.2em;text-transform:uppercase;' +
      'color:' + CORES.latao + ';margin-bottom:30px;line-height:1.7;">' + subtitulo + '</div>' +

    miolo +

    '<div style="height:1px;background:' + CORES.latao + ';opacity:.3;margin:38px 0 18px;font-size:0;line-height:0;">&nbsp;</div>' +
    '<div style="font-size:11.5px;line-height:1.8;color:rgba(239,213,180,.45);">' +
      'Você recebe este report porque está na aba EQUIPE do Radar.<br>' +
      'Regra de ouro: <span style="color:' + CORES.marfim + ';">nada entra no Radar sem responsável e sem data-gatilho.</span><br>' +
      '<a href="' + urlApp_() + '" style="color:' + CORES.farol + ';text-decoration:none;">Abrir o centro de controle</a>' +
    '</div>' +
  '</div></div>';
}

// Disciplina do acento: só o tile com problema recebe cor quente.
// Tile zerado fica com filete Verde (massa gráfica) e número em Marfim.
function kpiTile_(n, rot, estado) {
  var filete = estado === 'alerta' ? CORES.sirene : (estado === 'atencao' ? CORES.farol : CORES.verde);
  // Disciplina do acento: Farol nunca vira número de KPI — fica só no filete.
  // O vermelho Sirene é camada de estado, não acento de marca.
  var corNum = estado === 'alerta' ? CORES.sirene : CORES.marfim;
  return '<td style="padding:0 6px 0 0;width:25%;vertical-align:top;">' +
    '<div style="background:' + CORES.noturno2 + ';border-top:3px solid ' + filete + ';padding:13px 11px;">' +
      '<div style="font-family:' + FT_DISPLAY + ';font-size:30px;line-height:1;color:' + corNum + ';">' + n + '</div>' +
      '<div style="font-family:' + FT_ROTULO + ';font-size:8.5px;letter-spacing:.16em;text-transform:uppercase;' +
      'color:' + CORES.latao + ';margin-top:8px;line-height:1.5;">' + rot + '</div>' +
    '</div></td>';
}
function estadoKpi_(n, severo) { return !n ? 'calmo' : (severo ? 'alerta' : 'atencao'); }

function cartaoItem_(i, comAcoes) {
  var cor = corSemaforo_(i.peso);
  var acoes = '';
  if (comAcoes) {
    acoes = '<div style="margin-top:14px;font-family:' + FT_ROTULO + ';font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;">' +
      '<a href="' + linkAcao_('feito', i.id) + '" style="color:' + CORES.marfim + ';text-decoration:none;margin-right:18px;">Concluído</a>' +
      '<a href="' + linkAcao_('adiar7', i.id) + '" style="color:' + CORES.latao + ';text-decoration:none;margin-right:18px;">Adiar 7d</a>' +
      (i.link ? '<a href="' + esc_(i.link) + '" style="color:' + CORES.farol + ';text-decoration:none;">Abrir edital ↗</a>' : '') +
      '</div>';
  }
  return '' +
  '<div style="background:' + CORES.noturno2 + ';border-left:4px solid ' + cor + ';padding:15px 17px;margin-bottom:8px;">' +
    '<div style="font-family:' + FT_ROTULO + ';font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:' + cor + ';">' +
      esc_(i.motivo) + '<span style="color:' + CORES.latao + ';"> · ' + esc_(i.fonteAba) +
      (i.fonteAba === 'RADAR' ? ' · ' + esc_(i.pri) + ' · ' + i.score + '/15' : '') + '</span></div>' +
    '<div style="font-family:' + FT_DISPLAY + ';font-size:19px;line-height:1.2;margin:9px 0 4px;color:' + CORES.marfim + ';">' +
      esc_(i.titulo) + '</div>' +
    '<div style="font-size:12px;color:rgba(239,213,180,.42);">' + esc_(i.sub) +
      (i.prazoBR ? ' · prazo ' + esc_(i.prazoBR) : '') + '</div>' +
    '<div style="font-size:13px;margin-top:11px;line-height:1.6;color:rgba(239,213,180,.66);">' +
      '<span style="color:' + CORES.latao + ';">▸</span> ' + esc_(i.acao || 'Definir o próximo passo') + '</div>' +
    '<div style="font-family:' + FT_ROTULO + ';font-size:9px;letter-spacing:.14em;text-transform:uppercase;' +
      'color:' + (i.semDono ? CORES.sirene : CORES.latao) + ';margin-top:9px;">' +
      (i.semDono ? 'Sem responsável — atribuir hoje' : esc_(i.responsavel)) + '</div>' +
    acoes +
  '</div>';
}

function linkExterno_(f) {
  var s = String(f || '').split('›')[0].trim();
  if (!s || s === '—' || /^VERIFICAR/i.test(s)) return '';
  if (/^https?:/i.test(s)) return s;
  if (/@/.test(s)) return 'mailto:' + s;
  return 'https://' + s.replace(/\s+/g, '');
}

function botao_(texto, url) {
  return '<div style="margin-top:32px;">' +
    '<a href="' + url + '" style="display:inline-block;background:' + CORES.farol + ';color:' + CORES.roxo +
    ';padding:15px 34px;text-decoration:none;font-family:' + FT_ROTULO + ';font-weight:bold;font-size:11px;' +
    'letter-spacing:.2em;text-transform:uppercase;">' + texto + '</a></div>';
}

function emailDigest_(m, fila, minhas, k) {
  var venc = fila.filter(function (i) { return i.peso === 0; });
  var outras = fila.filter(function (i) { return minhas.indexOf(i) < 0; });

  var miolo =
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;"><tr>' +
      kpiTile_(k.gatilhosVencidos, 'Gatilhos vencidos', estadoKpi_(k.gatilhosVencidos, true)) +
      kpiTile_(k.semDono, 'Sem responsável', estadoKpi_(k.semDono, true)) +
      kpiTile_(k.etapasAtrasadas, 'Etapas atrasadas', estadoKpi_(k.etapasAtrasadas, true)) +
      kpiTile_(k.docsVencendo, 'Docs vencendo 30d', estadoKpi_(k.docsVencendo, false)) +
    '</tr></table>';

  if (k.proxima) {
    miolo += '<div style="border-left:2px solid ' + CORES.latao + ';padding:4px 0 4px 15px;margin-bottom:30px;">' +
      '<div style="font-family:' + FT_ROTULO + ';font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:' + CORES.latao + ';">Próximo prazo absoluto</div>' +
      '<div style="font-family:' + FT_DISPLAY + ';font-size:19px;color:' + CORES.marfim + ';margin-top:6px;">' +
      esc_(k.proxima.nome) + '</div>' +
      '<div style="font-size:12.5px;color:rgba(239,213,180,.5);">' + esc_(k.proxima.data) + ' · ' + k.proxima.dias + ' dias</div></div>';
  }

  if (minhas.length) {
    miolo += secao_('Sua fila', minhas.length + ' item(ns) sob sua responsabilidade');
    minhas.forEach(function (i) { miolo += cartaoItem_(i, true); });
  }
  if (outras.length) {
    miolo += secao_('Demais itens do dia', outras.length + ' item(ns) — visão compartilhada');
    outras.forEach(function (i) { miolo += cartaoItem_(i, true); });
  }
  if (!fila.length) {
    miolo += '<div style="background:' + CORES.noturno2 + ';border-left:4px solid ' + CORES.verde + ';padding:20px;">' +
      '<div style="font-family:' + FT_DISPLAY + ';font-size:22px;color:' + CORES.marfim + ';">Nada vence hoje.</div>' +
      '<div style="font-size:13px;color:rgba(239,213,180,.6);margin-top:6px;line-height:1.7;">Nenhum gatilho, prazo ou documento ' +
      'na janela de alerta. Bom dia para adiantar a Fase 1.</div></div>';
  }

  miolo += botao_('Abrir o Radar', urlApp_());

  return cascaEmail_('Bom dia, ' + esc_(m.nome.split(' ')[0]) + '.',
    ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'][hoje_().getDay()] +
    ' · ' + fmtBR_(hoje_()) + ' · ' + fila.length + ' na fila' +
    (venc.length ? ' · <span style="color:' + CORES.sirene + '">' + venc.length + ' vencida(s)</span>' : ''),
    miolo);
}

function secao_(titulo, sub) {
  return '<div style="margin:34px 0 15px;">' +
    '<div style="font-family:' + FT_DISPLAY + ';font-size:21px;color:' + CORES.marfim + ';">' + titulo + '</div>' +
    '<div style="font-family:' + FT_ROTULO + ';font-size:9px;letter-spacing:.18em;text-transform:uppercase;' +
    'color:' + CORES.latao + ';margin-top:6px;">' + sub + '</div></div>';
}

function emailPauta_(fila, radar, caminho, dossie, k) {
  var ativos = radar.filter(function (r) { return !r.dormente; });
  var semDono = ativos.filter(function (r) { return r.semDono && r.pri !== 'C'; });
  var atrasadas = caminho.filter(function (c) { return c.atrasado; });
  var docs = dossie.filter(function (d) { return d.diasVencer !== null && d.diasVencer <= 30; })
                   .sort(function (a, b) { return a.diasVencer - b.diasVencer; });

  var miolo =
    '<div style="background:' + CORES.noturno2 + ';border-left:4px solid ' + CORES.farol + ';padding:17px 19px;margin-bottom:30px;">' +
      '<div style="font-family:' + FT_DISPLAY + ';font-size:20px;color:' + CORES.marfim + ';">Vinte minutos. Só a tela.</div>' +
      '<div style="font-size:13px;line-height:1.7;color:rgba(239,213,180,.62);margin-top:7px;">Vitor conduz, João participa. ' +
      'Sem pauta livre. O que passar de vinte minutos vira tarefa, não discussão.</div>' +
    '</div>';

  miolo += secao_('Passo 1 · Radar', 'Tratar tudo com gatilho vencido ou vencendo em sete dias');
  var doRadar = fila.filter(function (i) { return i.fonteAba === 'RADAR'; });
  if (doRadar.length) { doRadar.forEach(function (i) { miolo += cartaoItem_(i, false); }); }
  else { miolo += vazio_('Nenhum gatilho na janela.'); }

  miolo += secao_('Passo 2 · Dossiê', 'Renovar tudo abaixo de trinta dias');
  if (docs.length) {
    miolo += '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size:12.5px;">';
    docs.forEach(function (d) {
      var cor = d.diasVencer < 0 ? CORES.sirene : (d.diasVencer <= 15 ? CORES.farol : CORES.marfim);
      miolo += '<tr><td style="padding:10px 0;border-bottom:1px solid rgba(166,151,115,.2);color:' + CORES.marfim + ';">' +
        esc_(d.documento) +
        '<div style="font-family:' + FT_ROTULO + ';font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:' + CORES.latao + ';margin-top:4px;">' +
        esc_(d.responsavel) + ' · ' + esc_(d.onde) + '</div></td>' +
        '<td align="right" style="padding:10px 0;border-bottom:1px solid rgba(166,151,115,.2);color:' + cor +
        ';white-space:nowrap;font-family:' + FT_ROTULO + ';font-weight:bold;letter-spacing:.06em;">' +
        (d.diasVencer < 0 ? 'venceu' : d.diasVencer + 'd') +
        '<div style="font-size:10.5px;font-weight:normal;color:' + CORES.latao + ';margin-top:3px;">' + esc_(d.validadeBR) + '</div></td></tr>';
    });
    miolo += '</table>';
  } else { miolo += vazio_('Nenhum documento vencendo em trinta dias.'); }

  miolo += secao_('Passo 3 · Caminho crítico', k.caminhoPct + '% do plano concluído · ' + atrasadas.length + ' etapa(s) atrasada(s)');
  if (atrasadas.length) {
    atrasadas.forEach(function (c) {
      miolo += '<div style="background:' + CORES.noturno2 + ';border-left:4px solid ' + CORES.sirene + ';padding:13px 16px;margin-bottom:7px;">' +
        '<div style="font-family:' + FT_ROTULO + ';font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:' + CORES.sirene + ';">' +
        esc_(c.fase) + ' · atrasada ' + Math.abs(c.diasFim) + 'd</div>' +
        '<div style="font-family:' + FT_DISPLAY + ';font-size:17px;margin-top:6px;color:' + CORES.marfim + ';">' + esc_(c.entregavel) + '</div>' +
        '<div style="font-family:' + FT_ROTULO + ';font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:' + CORES.latao + ';margin-top:6px;">' +
        esc_(c.responsavel) + ' · fim previsto ' + esc_(c.fimBR) + '</div></div>';
    });
  } else { miolo += vazio_('Nenhuma etapa atrasada.'); }

  miolo += secao_('Passo 4 · Linhas sem dono', 'Linha sem dono é linha que se perde');
  if (semDono.length) {
    miolo += '<div style="font-size:13.5px;line-height:2;color:' + CORES.marfim + ';">';
    semDono.forEach(function (r) {
      miolo += '<span style="color:' + CORES.latao + ';">—</span> ' + esc_(r.instrumento) +
        '<span style="color:rgba(239,213,180,.42);"> · ' + esc_(r.orgao) + ' · ' + r.pri + '</span><br>';
    });
    miolo += '</div>';
  } else { miolo += vazio_('Todas as linhas A e B têm responsável.'); }

  miolo += botao_('Conduzir o ritual', urlApp_());

  return cascaEmail_('Pauta da semana', 'Ritual de vinte minutos · ' + fmtBR_(hoje_()), miolo);
}

function vazio_(txt) {
  return '<div style="font-size:13px;color:rgba(239,213,180,.6);padding:10px 0 4px;">' +
    '<span style="color:' + CORES.verde + ';">✓</span> ' + esc_(txt) + '</div>';
}

function emailCodigo_(nome, code) {
  return cascaEmail_('Seu código de acesso',
    'Válido por dez minutos · ' + fmtBR_(hoje_()),
    '<div style="background:' + CORES.noturno2 + ';border-top:3px solid ' + CORES.farol + ';padding:30px;text-align:center;">' +
      '<div style="font-family:' + FT_ROTULO + ';font-size:42px;letter-spacing:.24em;font-weight:bold;color:' + CORES.farol + ';">' +
      code + '</div>' +
    '</div>' +
    '<p style="font-size:13.5px;color:rgba(239,213,180,.62);line-height:1.75;margin-top:22px;">' +
    'Olá, ' + esc_(String(nome).split(' ')[0]) + '. Digite este código no Radar para entrar. ' +
    'Se não foi você que pediu, ignore este e-mail.</p>');
}

// ============================================================
// 4. MENSAGEM INSTANTÂNEA — vários provedores, uma função
//    Configure em CONFIG › whatsapp.provedor e guarde as chaves
//    em Projeto → Configurações → Propriedades do script.
//
//    Situação em 07/09/2026:
//      callmebot  · GRÁTIS, mas o bot está LOTADO e não aceita
//                   novos cadastros. Volta a funcionar quando abrir vaga.
//      textmebot  · demo de 2 dias, depois US$ 10/ano por destinatário
//                   ou US$ 60/ano ilimitado. Funciona hoje.
//      telegram   · grátis, oficial, sem template, cadastro em 5 minutos.
//                   Não é WhatsApp — é a troca honesta.
//      meta       · oficial do WhatsApp, grátis até 1.000 conversas de
//                   serviço/mês, mas exige número dedicado e template
//                   aprovado para mensagem iniciada pelo sistema.
//      twilio     · pago por mensagem.
// ============================================================
function enviarWhatsApp(destino, texto) {
  var prov = String(cfg('whatsapp.provedor', 'nenhum')).toLowerCase();
  var bruto = String(destino || '').trim();
  var numero = bruto.replace(/\D/g, '');
  if (!bruto) return { ok: false, msg: 'sem destino' };

  if (prov === 'callmebot') return waCallMeBot_(numero, texto);
  if (prov === 'textmebot') return waTextMeBot_(numero, texto);
  if (prov === 'telegram')  return tgEnviar_(bruto, texto);
  if (prov === 'meta')      return waMeta_(numero, texto);
  if (prov === 'twilio')    return waTwilio_(numero, texto);
  Logger.log('Mensagem instantânea desativada (whatsapp.provedor = nenhum).');
  return { ok: false, msg: 'provedor não configurado' };
}

// --- TextMeBot · funciona hoje, pago depois da demo de 2 dias ---
// Cadastre-se em textmebot.com, vincule o WhatsApp pelo link que chega por
// e-mail, e guarde a chave como TEXTMEBOT_<NÚMERO> (uma por pessoa) ou
// TEXTMEBOT_KEY (uma para todos).
function waTextMeBot_(numero, texto) {
  var key = segredo_('TEXTMEBOT_' + numero) || segredo_('TEXTMEBOT_KEY');
  if (!key) return { ok: false, msg: 'sem apikey TextMeBot para ' + numero };
  var url = 'https://api.textmebot.com/send.php?recipient=%2B' + numero +
            '&apikey=' + encodeURIComponent(key) +
            '&text=' + encodeURIComponent(texto);
  var r = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  var corpo = r.getContentText();
  // O TextMeBot responde 200 mesmo em erro; a palavra "Success" é o sinal real.
  var ok = r.getResponseCode() < 300 && !/error|invalid|expired/i.test(corpo);
  return { ok: ok, msg: corpo.slice(0, 200) };
}

// --- Telegram · grátis, oficial, sem template ---
// 1. No Telegram, fale com @BotFather → /newbot → guarde o token.
// 2. Cada pessoa manda uma mensagem qualquer para o bot (senão ele não pode
//    escrever primeiro — regra do Telegram, não nossa).
// 3. Rode descobrirChatsTelegram() no editor para ver os IDs.
// 4. Ponha o ID de cada pessoa na coluna WhatsApp da aba EQUIPE.
// Propriedade: TELEGRAM_TOKEN
function tgEnviar_(chatId, texto) {
  var token = segredo_('TELEGRAM_TOKEN');
  if (!token) return { ok: false, msg: 'TELEGRAM_TOKEN ausente' };
  var r = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
    method: 'post', contentType: 'application/json',
    payload: JSON.stringify({ chat_id: chatId, text: texto, parse_mode: 'Markdown' }),
    muteHttpExceptions: true
  });
  return { ok: r.getResponseCode() < 300, msg: r.getContentText().slice(0, 300) };
}

// Descobre o chat_id de quem já mandou mensagem para o bot.
function descobrirChatsTelegram() {
  var token = segredo_('TELEGRAM_TOKEN');
  if (!token) { Logger.log('Falta a propriedade TELEGRAM_TOKEN.'); return; }
  var r = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/getUpdates',
                            { muteHttpExceptions: true });
  var d = JSON.parse(r.getContentText());
  if (!d.ok) { Logger.log('Erro: ' + r.getContentText()); return; }
  if (!d.result.length) {
    Logger.log('Ninguém escreveu para o bot ainda. Cada pessoa precisa mandar ' +
               'uma mensagem qualquer para ele antes de aparecer aqui.');
    return;
  }
  var vistos = {};
  d.result.forEach(function (u) {
    var c = (u.message && u.message.chat) || (u.channel_post && u.channel_post.chat);
    if (c && !vistos[c.id]) {
      vistos[c.id] = true;
      Logger.log('chat_id ' + c.id + '  ·  ' +
                 [c.first_name, c.last_name, c.username && '@' + c.username]
                   .filter(function (x) { return x; }).join(' '));
    }
  });
  Logger.log('\nCopie o chat_id para a coluna WhatsApp da aba EQUIPE.');
}

// --- A) CallMeBot · grátis, 2 minutos de setup, ideal para 2–5 pessoas ---
// Cada pessoa manda "I allow callmebot to send me messages" para +34 644 51 95 23
// e recebe uma apikey. Guarde como propriedade CALLMEBOT_<NÚMERO>.
function waCallMeBot_(numero, texto) {
  var key = segredo_('CALLMEBOT_' + numero) || segredo_('CALLMEBOT_KEY');
  if (!key) return { ok: false, msg: 'sem apikey CallMeBot para ' + numero };
  var url = 'https://api.callmebot.com/whatsapp.php?phone=' + numero +
            '&text=' + encodeURIComponent(texto) + '&apikey=' + key;
  var r = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  return { ok: r.getResponseCode() < 300, msg: r.getContentText().slice(0, 200) };
}

// --- B) Meta WhatsApp Cloud API · oficial, escalável, template aprovado ---
// Propriedades: META_TOKEN, META_PHONE_ID, (opcional) META_TEMPLATE
function waMeta_(numero, texto) {
  var token = segredo_('META_TOKEN'), phoneId = segredo_('META_PHONE_ID');
  if (!token || !phoneId) return { ok: false, msg: 'META_TOKEN/META_PHONE_ID ausentes' };
  var tpl = segredo_('META_TEMPLATE');
  var corpo = tpl
    ? { messaging_product: 'whatsapp', to: numero, type: 'template',
        template: { name: tpl, language: { code: 'pt_BR' },
          components: [{ type: 'body', parameters: [{ type: 'text', text: texto.slice(0, 1000) }] }] } }
    : { messaging_product: 'whatsapp', to: numero, type: 'text',
        text: { preview_url: false, body: texto } };
  var r = UrlFetchApp.fetch('https://graph.facebook.com/v21.0/' + phoneId + '/messages', {
    method: 'post', contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify(corpo), muteHttpExceptions: true
  });
  return { ok: r.getResponseCode() < 300, msg: r.getContentText().slice(0, 300) };
}

// --- C) Twilio · pago por mensagem, útil se já houver conta ---
// Propriedades: TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM (ex.: whatsapp:+14155238886)
function waTwilio_(numero, texto) {
  var sid = segredo_('TWILIO_SID'), tok = segredo_('TWILIO_TOKEN'), from = segredo_('TWILIO_FROM');
  if (!sid || !tok || !from) return { ok: false, msg: 'credenciais Twilio ausentes' };
  var r = UrlFetchApp.fetch('https://api.twilio.com/2010-04-01/Accounts/' + sid + '/Messages.json', {
    method: 'post',
    headers: { Authorization: 'Basic ' + Utilities.base64Encode(sid + ':' + tok) },
    payload: { From: from, To: 'whatsapp:+' + numero, Body: texto },
    muteHttpExceptions: true
  });
  return { ok: r.getResponseCode() < 300, msg: r.getContentText().slice(0, 300) };
}

function testarWhatsApp() {
  var prov = cfg('whatsapp.provedor', 'nenhum');
  var equipe = lerEquipe_().filter(function (x) { return x.ativo && x.destino; });
  if (!equipe.length) { Logger.log('Ninguém com destino preenchido na aba EQUIPE.'); return; }
  Logger.log('Provedor configurado: ' + prov);
  equipe.forEach(function (m) {
    var r = enviarWhatsApp(m.destino,
      '✅ Teste do Radar de Fomento OS-UZP.\n' +
      'Se você recebeu isto, o canal está ativo e o report das 7h vem por aqui.');
    Logger.log(m.nome + ' (' + m.destino + '): ' + (r.ok ? 'ENVIADO' : 'FALHOU') + ' — ' + r.msg);
  });
}

function corta_(s, n) {
  s = String(s || '');
  return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s;
}

function textoWhatsApp_(m, fila, minhas, k) {
  var max = cfgNum('digest.maxWhatsApp', 6);
  var lista = (minhas.length ? minhas : fila).slice(0, max);
  var t = '*RADAR OS-UZP* · ' + fmtBR_(hoje_()) + '\n' +
          'Bom dia, ' + String(m.nome).split(' ')[0] + '.\n\n';
  if (!fila.length) return t + '✅ Nada vence hoje. Bom dia para adiantar a Fase 1.\n\n' + urlApp_();

  t += '🔴 ' + k.gatilhosVencidos + ' gatilho(s) vencido(s) · 🟡 ' + fila.length + ' na fila\n';
  t += '───────────────\n';
  lista.forEach(function (i, n) {
    var ico = i.peso === 0 ? '🔴' : (i.peso === 1 ? '🟠' : '🟡');
    t += ico + ' *' + i.titulo + '*\n' +
         '   ' + i.motivo + (i.prazoBR ? ' · prazo ' + i.prazoBR : '') + '\n' +
         '   ▸ ' + corta_(i.acao || 'definir próximo passo', 110) + '\n' +
         '   👤 ' + (i.responsavel || '⚠ SEM DONO') + '\n';
    if (n < lista.length - 1) t += '\n';
  });
  var resto = (minhas.length ? minhas : fila).length - lista.length;
  if (resto > 0) t += '\n+ ' + resto + ' item(ns) no e-mail.\n';
  t += '───────────────\n' + urlApp_();
  return t;
}

// ============================================================
// 5. GOOGLE CALENDAR — a data-gatilho vira compromisso real
// ============================================================
function sincronizarCalendario() {
  if (!cfgBool('calendar.sincronizar', false)) return 'desativado';
  var id = cfg('calendar.id', '');
  var cal;
  if (id) { cal = CalendarApp.getCalendarById(id); }
  if (!cal) {
    cal = CalendarApp.createCalendar('OS-UZP · Radar de Fomento');
    cal.setColor(CalendarApp.Color.ORANGE);
    cfgSet('calendar.id', cal.getId());
  }
  var criados = 0;
  lerRadar_().forEach(function (x) {
    if (x.dormente || !x.gatilho) return;
    var d = meiaNoite_(x.gatilho + 'T12:00:00');
    if (dias_(d) < -30) return;
    var titulo = '⚡ GATILHO · ' + x.instrumento;
    var jaTem = cal.getEventsForDay(d).some(function (ev) { return ev.getTitle() === titulo; });
    if (jaTem) return;
    cal.createAllDayEvent(titulo, d, {
      description: 'Começa o preparo de "' + x.instrumento + '" (' + x.orgao + ').\n' +
        'Prazo final: ' + (x.prazoBR || 'fluxo contínuo') + ' · Preparo: ' + x.preparo + ' dias\n' +
        'Responsável: ' + (x.responsavel || 'SEM DONO') + '\n' +
        'Próximo passo: ' + (x.proximaAcao || '—') + '\n\n' + urlApp_()
    });
    criados++;
  });
  lerCaminho_().forEach(function (c) {
    if (c.concluido || !c.fim) return;
    var d = meiaNoite_(c.fim + 'T12:00:00');
    if (dias_(d) < -30) return;
    var titulo = '◆ ' + c.fase + ' · ' + c.entregavel;
    if (cal.getEventsForDay(d).some(function (ev) { return ev.getTitle() === titulo; })) return;
    cal.createAllDayEvent(titulo, d, {
      description: c.porque + '\nResponsável: ' + (c.responsavel || 'SEM DONO') + '\n\n' + urlApp_()
    });
    criados++;
  });
  return criados + ' evento(s) criado(s)';
}

// ============================================================
// 6. GATILHOS DE TEMPO
// ============================================================
function instalarGatilhos() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (['enviarDigestDiario','enviarPautaSemanal','rotinaNoturna'].indexOf(t.getHandlerFunction()) >= 0) {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('enviarDigestDiario').timeBased()
    .atHour(cfgNum('digest.hora', 7)).nearMinute(5).everyDays(1).inTimezone(APP.tz).create();
  ScriptApp.newTrigger('enviarPautaSemanal').timeBased()
    .atHour(cfgNum('pauta.hora', 8)).nearMinute(10).everyDays(1).inTimezone(APP.tz).create();
  ScriptApp.newTrigger('rotinaNoturna').timeBased()
    .atHour(23).everyDays(1).inTimezone(APP.tz).create();
  Logger.log('✅ Gatilhos instalados: report diário ' + cfgNum('digest.hora', 7) + 'h, pauta ' +
             cfgNum('pauta.hora', 8) + 'h, manutenção 23h.');
}

function rotinaNoturna() {
  recalcularTudo();
  limparOTPs_();
  try { sincronizarCalendario(); } catch (e) { Logger.log('calendário: ' + e); }
}

// -------- atalhos para testar manualmente no editor --------
function testarDigestAgora() { Logger.log(enviarDigestDiarioForcado_()); }
function enviarDigestDiarioForcado_() {
  var orig = cfg('digest.dias', '');
  cfgSet('digest.dias', 'DOM,SEG,TER,QUA,QUI,SEX,SAB');
  cfgSet('digest.silencioSemAcao', 'NAO');
  var r = enviarDigestDiario();
  cfgSet('digest.dias', orig || 'SEG,TER,QUA,QUI,SEX');
  cfgSet('digest.silencioSemAcao', 'SIM');
  return r;
}
