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
// ============================================================

var CORES = {
  meianoite: '#1F0A33', meianoite2: '#2A1244', farol: '#FFB800', acido: '#B2FF05',
  pergaminho: '#F2EDE2', tinta: '#17082A', erro: '#FF3D5A', cobalto: '#2E4BFF'
};

function corSemaforo_(peso) {
  return peso === 0 ? CORES.erro : (peso === 1 ? CORES.farol : CORES.acido);
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

    if (m.whatsapp) {
      try { enviarWhatsApp(m.whatsapp, textoWhatsApp_(m, fila, minhas, k)); }
      catch (e) { Logger.log('whatsapp ' + m.whatsapp + ': ' + e); }
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
  if (venc) return '🔴 ' + venc + ' item(ns) vencido(s) · Radar OS-UZP · ' + d;
  if (fila.length) return '🟡 ' + fila.length + ' ação(ões) hoje · Radar OS-UZP · ' + d;
  return '🟢 Sem pendências · Radar OS-UZP · ' + d;
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
        to: m.email, subject: '📋 Pauta da semana · Radar OS-UZP · ' + fmtBR_(hoje_()),
        htmlBody: html, name: 'Radar de Fomento · OS-UZP'
      });
    } catch (e) { Logger.log('pauta ' + m.email + ': ' + e); }
    if (m.whatsapp) {
      try {
        enviarWhatsApp(m.whatsapp,
          '*RITUAL DE SEGUNDA · 20 MIN*\n' +
          'Radar OS-UZP — ' + fmtBR_(hoje_()) + '\n\n' +
          '1. RADAR: ' + k.gatilhosVencidos + ' gatilho(s) vencido(s), ' + k.prioridadeA + ' prioridade A ativa(s)\n' +
          '2. DOSSIÊ: ' + k.docsVencendo + ' documento(s) vencendo em 30d\n' +
          '3. CAMINHO: ' + k.etapasAtrasadas + ' etapa(s) atrasada(s) · ' + k.caminhoPct + '% do plano\n' +
          '4. SEM DONO: ' + k.semDono + ' linha(s) A/B sem responsável\n\n' +
          'Pauta completa: ' + urlApp_());
      } catch (e) { Logger.log('pauta whatsapp: ' + e); }
    }
  });
  return 'pauta enviada';
}

// ============================================================
// 3. E-MAILS (HTML com a identidade visual da orquestra)
// ============================================================
function urlApp_() {
  return cfg('app.url', '') || (function () { try { return ScriptApp.getService().getUrl(); } catch (e) { return ''; } })();
}

function esc_(s) {
  return String(s === null || s === undefined ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function cascaEmail_(titulo, subtitulo, miolo) {
  return '' +
  '<div style="margin:0;padding:0;background:' + CORES.meianoite + ';">' +
  '<div style="max-width:640px;margin:0 auto;background:' + CORES.meianoite + ';' +
  'font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;' +
  'color:' + CORES.pergaminho + ';padding:28px 22px 44px;">' +

    '<div style="font-size:10px;letter-spacing:.3em;color:' + CORES.farol + ';font-weight:600;">' +
      'RADAR DE FOMENTO' +
    '</div>' +
    '<div style="font-size:10px;letter-spacing:.18em;color:rgba(242,237,226,.45);margin-top:5px;">' +
      'ORQUESTRA SINFÔNICA DA UZP' +
    '</div>' +
    '<hr style="border:none;border-top:2px dashed ' + CORES.farol + ';opacity:.5;margin:18px 0 26px;">' +

    '<h1 style="font-size:26px;line-height:1.2;font-weight:700;margin:0 0 8px;color:' + CORES.pergaminho + ';">' +
      titulo + '</h1>' +
    '<div style="font-size:13px;color:rgba(242,237,226,.6);margin-bottom:26px;">' + subtitulo + '</div>' +

    miolo +

    '<hr style="border:none;border-top:1px solid rgba(255,184,0,.25);margin:34px 0 16px;">' +
    '<div style="font-size:11px;line-height:1.7;color:rgba(242,237,226,.42);">' +
      'Você recebe este report porque está na aba EQUIPE do Radar.<br>' +
      'Regra de ouro: <b style="color:rgba(242,237,226,.7)">nada entra no Radar sem responsável e sem data-gatilho.</b><br>' +
      '<a href="' + urlApp_() + '" style="color:' + CORES.acido + ';text-decoration:none;">Abrir o centro de controle →</a>' +
    '</div>' +
  '</div></div>';
}

function kpiTile_(n, rot, cor) {
  return '<td style="padding:0 6px 0 0;width:25%;vertical-align:top;">' +
    '<div style="background:' + CORES.meianoite2 + ';border-top:3px solid ' + cor + ';padding:12px 10px;">' +
      '<div style="font-size:26px;font-weight:700;line-height:1;color:' + cor + ';">' + n + '</div>' +
      '<div style="font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:rgba(242,237,226,.55);margin-top:6px;line-height:1.4;">' + rot + '</div>' +
    '</div></td>';
}

function cartaoItem_(i, comAcoes) {
  var cor = corSemaforo_(i.peso);
  var acoes = '';
  if (comAcoes) {
    acoes = '<div style="margin-top:12px;font-size:11px;">' +
      '<a href="' + linkAcao_('feito', i.id) + '" style="color:' + CORES.acido + ';text-decoration:none;margin-right:16px;">✓ Concluído</a>' +
      '<a href="' + linkAcao_('adiar7', i.id) + '" style="color:rgba(242,237,226,.5);text-decoration:none;margin-right:16px;">↷ Adiar 7d</a>' +
      (i.link ? '<a href="' + esc_(linkExterno_(i.link)) + '" style="color:rgba(242,237,226,.5);text-decoration:none;">↗ Fonte</a>' : '') +
      '</div>';
  }
  return '' +
  '<div style="background:' + CORES.meianoite2 + ';border-left:4px solid ' + cor + ';padding:14px 16px;margin-bottom:10px;">' +
    '<div style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:' + cor + ';font-weight:600;">' +
      esc_(i.motivo) + ' · ' + esc_(i.fonteAba) + (i.pri ? ' · PRI ' + esc_(i.pri) : '') + '</div>' +
    '<div style="font-size:15.5px;font-weight:600;margin:7px 0 3px;line-height:1.35;">' + esc_(i.titulo) + '</div>' +
    '<div style="font-size:12px;color:rgba(242,237,226,.55);">' + esc_(i.sub) +
      (i.prazoBR ? ' · prazo ' + esc_(i.prazoBR) : '') + '</div>' +
    '<div style="font-size:12.5px;margin-top:9px;line-height:1.55;">' +
      '<span style="color:' + CORES.farol + ';">▸ ' + esc_(i.acao || 'Definir o próximo passo') + '</span></div>' +
    '<div style="font-size:11px;color:' + (i.semDono ? CORES.erro : 'rgba(242,237,226,.5)') + ';margin-top:7px;">' +
      (i.semDono ? '⚠ SEM RESPONSÁVEL — atribuir hoje' : 'Responsável: ' + esc_(i.responsavel)) + '</div>' +
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

function emailDigest_(m, fila, minhas, k) {
  var venc = fila.filter(function (i) { return i.peso === 0; });
  var outras = fila.filter(function (i) { return minhas.indexOf(i) < 0; });

  var miolo =
    '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:26px;"><tr>' +
      kpiTile_(k.gatilhosVencidos, 'Gatilhos vencidos', k.gatilhosVencidos ? CORES.erro : CORES.acido) +
      kpiTile_(k.prioridadeA, 'Prioridade A ativa', CORES.farol) +
      kpiTile_(k.docsVencendo, 'Docs vencendo 30d', k.docsVencendo ? CORES.farol : CORES.acido) +
      kpiTile_(k.etapasAtrasadas, 'Etapas atrasadas', k.etapasAtrasadas ? CORES.erro : CORES.acido) +
    '</tr></table>';

  if (k.proxima) {
    miolo += '<div style="border:1px dashed rgba(255,184,0,.4);padding:12px 14px;margin-bottom:26px;font-size:12.5px;">' +
      '<span style="color:' + CORES.farol + ';letter-spacing:.1em;font-size:10px;">PRÓXIMO PRAZO ABSOLUTO</span><br>' +
      '<b>' + esc_(k.proxima.nome) + '</b> — ' + esc_(k.proxima.data) + ' (' + k.proxima.dias + ' dias)</div>';
  }

  if (minhas.length) {
    miolo += secao_('SUA FILA · ' + esc_(m.nome).toUpperCase(), minhas.length + ' item(ns) sob sua responsabilidade');
    minhas.forEach(function (i) { miolo += cartaoItem_(i, true); });
  }
  if (outras.length) {
    miolo += secao_('DEMAIS ITENS DO DIA', outras.length + ' item(ns) — visão compartilhada');
    outras.forEach(function (i) { miolo += cartaoItem_(i, true); });
  }
  if (!fila.length) {
    miolo += '<div style="background:' + CORES.meianoite2 + ';border-left:4px solid ' + CORES.acido + ';padding:18px;">' +
      '<b style="color:' + CORES.acido + ';">Nada vence hoje.</b><br>' +
      '<span style="font-size:13px;color:rgba(242,237,226,.6);">Nenhum gatilho, prazo ou documento na janela de alerta. ' +
      'Bom dia para adiantar a Fase 1.</span></div>';
  }

  miolo += '<div style="text-align:center;margin-top:30px;">' +
    '<a href="' + urlApp_() + '" style="display:inline-block;background:' + CORES.farol + ';color:' + CORES.tinta +
    ';padding:15px 32px;text-decoration:none;font-weight:700;font-size:12px;letter-spacing:.14em;">ABRIR O RADAR</a></div>';

  return cascaEmail_('Bom dia, ' + esc_(m.nome.split(' ')[0]) + '.',
    ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'][hoje_().getDay()] +
    ', ' + fmtBR_(hoje_()) + ' · ' + fila.length + ' ação(ões) na fila' +
    (venc.length ? ' · <b style="color:' + CORES.erro + '">' + venc.length + ' vencida(s)</b>' : ''),
    miolo);
}

function secao_(titulo, sub) {
  return '<div style="margin:30px 0 14px;">' +
    '<div style="font-size:10.5px;letter-spacing:.24em;color:' + CORES.farol + ';font-weight:600;">' + titulo + '</div>' +
    '<div style="font-size:11.5px;color:rgba(242,237,226,.45);margin-top:4px;">' + sub + '</div></div>';
}

function emailPauta_(fila, radar, caminho, dossie, k) {
  var ativos = radar.filter(function (r) { return !r.dormente; });
  var semDono = ativos.filter(function (r) { return r.semDono && r.pri !== 'C'; });
  var atrasadas = caminho.filter(function (c) { return c.atrasado; });
  var docs = dossie.filter(function (d) { return d.diasVencer !== null && d.diasVencer <= 30; })
                   .sort(function (a, b) { return a.diasVencer - b.diasVencer; });

  var miolo =
    '<div style="background:' + CORES.meianoite2 + ';border-left:4px solid ' + CORES.farol + ';padding:16px 18px;margin-bottom:28px;font-size:13px;line-height:1.7;">' +
      '<b style="color:' + CORES.farol + ';">20 minutos. Sem pauta livre. Só a tela.</b><br>' +
      'Vitor conduz. João participa. O que passar de 20 minutos vira tarefa, não discussão.' +
    '</div>';

  miolo += secao_('PASSO 1 · RADAR', 'Tratar tudo com gatilho vencido ou vencendo em 7 dias');
  if (fila.filter(function (i) { return i.fonteAba === 'RADAR'; }).length) {
    fila.filter(function (i) { return i.fonteAba === 'RADAR'; }).forEach(function (i) { miolo += cartaoItem_(i, false); });
  } else { miolo += vazio_('Nenhum gatilho na janela.'); }

  miolo += secao_('PASSO 2 · DOSSIÊ', 'Renovar tudo abaixo de 30 dias');
  if (docs.length) {
    miolo += '<table cellpadding="0" cellspacing="0" width="100%" style="font-size:12.5px;">';
    docs.forEach(function (d) {
      var cor = d.diasVencer < 0 ? CORES.erro : (d.diasVencer <= 15 ? CORES.farol : CORES.pergaminho);
      miolo += '<tr><td style="padding:9px 0;border-bottom:1px solid rgba(255,184,0,.15);">' + esc_(d.documento) +
        '<div style="font-size:11px;color:rgba(242,237,226,.45);">' + esc_(d.responsavel) + ' · ' + esc_(d.onde) + '</div></td>' +
        '<td align="right" style="padding:9px 0;border-bottom:1px solid rgba(255,184,0,.15);color:' + cor + ';white-space:nowrap;font-weight:600;">' +
        (d.diasVencer < 0 ? 'venceu' : d.diasVencer + 'd') + '<div style="font-size:10.5px;font-weight:400;opacity:.6;">' + esc_(d.validadeBR) + '</div></td></tr>';
    });
    miolo += '</table>';
  } else { miolo += vazio_('Nenhum documento vencendo em 30 dias.'); }

  miolo += secao_('PASSO 3 · CAMINHO CRÍTICO', k.caminhoPct + '% do plano concluído · ' + atrasadas.length + ' etapa(s) atrasada(s)');
  if (atrasadas.length) {
    atrasadas.forEach(function (c) {
      miolo += '<div style="background:' + CORES.meianoite2 + ';border-left:4px solid ' + CORES.erro + ';padding:12px 15px;margin-bottom:8px;">' +
        '<div style="font-size:10px;letter-spacing:.14em;color:' + CORES.erro + ';">' + esc_(c.fase) + ' · ATRASADA ' + Math.abs(c.diasFim) + 'd</div>' +
        '<div style="font-size:14px;font-weight:600;margin-top:5px;">' + esc_(c.entregavel) + '</div>' +
        '<div style="font-size:11.5px;color:rgba(242,237,226,.5);margin-top:4px;">' + esc_(c.responsavel) + ' · fim previsto ' + esc_(c.fimBR) + '</div></div>';
    });
  } else { miolo += vazio_('Nenhuma etapa atrasada.'); }

  miolo += secao_('PASSO 4 · LINHAS SEM DONO', 'Linha sem dono é linha que se perde');
  if (semDono.length) {
    miolo += '<div style="font-size:13px;line-height:1.9;">';
    semDono.forEach(function (r) {
      miolo += '• <b>' + esc_(r.instrumento) + '</b> <span style="color:rgba(242,237,226,.45);">(' + esc_(r.orgao) + ' · PRI ' + r.pri + ')</span><br>';
    });
    miolo += '</div>';
  } else { miolo += vazio_('Todas as linhas A/B têm responsável.'); }

  miolo += '<div style="text-align:center;margin-top:32px;">' +
    '<a href="' + urlApp_() + '" style="display:inline-block;background:' + CORES.farol + ';color:' + CORES.tinta +
    ';padding:15px 32px;text-decoration:none;font-weight:700;font-size:12px;letter-spacing:.14em;">CONDUZIR O RITUAL</a></div>';

  return cascaEmail_('Pauta da semana', 'Ritual de 20 minutos · ' + fmtBR_(hoje_()), miolo);
}

function vazio_(txt) {
  return '<div style="font-size:13px;color:' + CORES.acido + ';padding:10px 0 4px;">✓ ' + esc_(txt) + '</div>';
}

function emailCodigo_(nome, code) {
  return cascaEmail_('Seu código de acesso',
    'Válido por 10 minutos · ' + fmtBR_(hoje_()),
    '<div style="background:' + CORES.meianoite2 + ';padding:28px;text-align:center;">' +
      '<div style="font-size:42px;letter-spacing:.22em;font-weight:700;color:' + CORES.farol + ';">' + code + '</div>' +
    '</div>' +
    '<p style="font-size:13px;color:rgba(242,237,226,.6);line-height:1.7;margin-top:20px;">' +
    'Olá, ' + esc_(String(nome).split(' ')[0]) + '. Digite este código no Radar para entrar. ' +
    'Se não foi você que pediu, ignore este e-mail.</p>');
}

// ============================================================
// 4. WHATSAPP — três provedores atrás de uma única função
//    Configure em CONFIG › whatsapp.provedor e guarde as chaves
//    em Projeto → Configurações → Propriedades do script.
// ============================================================
function enviarWhatsApp(numero, texto) {
  var prov = String(cfg('whatsapp.provedor', 'nenhum')).toLowerCase();
  numero = String(numero).replace(/\D/g, '');
  if (!numero) return { ok: false, msg: 'sem número' };

  if (prov === 'callmebot') return waCallMeBot_(numero, texto);
  if (prov === 'meta')      return waMeta_(numero, texto);
  if (prov === 'twilio')    return waTwilio_(numero, texto);
  Logger.log('WhatsApp desativado (whatsapp.provedor = nenhum).');
  return { ok: false, msg: 'provedor não configurado' };
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
  var m = lerEquipe_().filter(function (x) { return x.ativo && x.whatsapp; })[0];
  if (!m) { Logger.log('Nenhum WhatsApp cadastrado na aba EQUIPE.'); return; }
  var r = enviarWhatsApp(m.whatsapp, '✅ Teste do Radar de Fomento OS-UZP. Se você recebeu isto, o canal está ativo.');
  Logger.log(JSON.stringify(r));
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
