// ============================================================
// RADAR DE FOMENTO — Orquestra Sinfônica da UZP (OS-UZP)
// Config.gs · constantes, identidade, acesso a configuração
// ------------------------------------------------------------
// Centro de controle de editais, leis de incentivo, prazos,
// caminho crítico e dossiê documental.
//
// PRINCÍPIO FUNDADOR (herdado da planilha v1.0):
//   Prazo em calendário não funciona — ninguém age em D-0.
//   O que funciona é DATA-GATILHO: a data em que o trabalho começa.
//   Toda a plataforma é ordenada por gatilho, não por prazo.
// ============================================================

const APP = {
  nome:   'Radar de Fomento',
  org:    'Orquestra Sinfônica da Universidade Zumbi dos Palmares',
  sigla:  'OS-UZP',
  versao: '2.0',
  tz:     'America/Sao_Paulo'
};

// Deixe vazio para o setup criar uma planilha nova e guardar o ID
// automaticamente nas Propriedades do Script.
const PLANILHA_ID_PADRAO = '';

const ABAS = {
  radar:    'RADAR',
  caminho:  'CAMINHO CRÍTICO',
  projetos: 'PROJETOS',
  dossie:   'DOSSIÊ',
  equipe:   'EQUIPE',
  config:   'CONFIG',
  log:      'LOG',
  otp:      'OTP'
};

const CABECALHOS = {
  'RADAR': ['ID','Instrumento','Órgão / Empresa','Tipo','Periodicidade','Janela típica',
            'Prazo','Dias rest.','Proponente elegível','Pré-requisito bloqueante','Projeto-match',
            'Eleg.','Ader.','Valor','Facil.','Prob.','SCORE','PRI',
            'Preparo (dias)','Gatilho manual','DATA-GATILHO','Dias p/ gatilho','Semáforo',
            'Responsável','Status','Próxima ação','Notas','Fonte',
            'Link','Documento','Adiado até','Atualizado em'],

  'CAMINHO CRÍTICO': ['ID','Fase','Ordem','Entregável','Por que existe','Início','Fim','Dias p/ fim',
                      'Responsável','Depende de','Status','% Concluído','Semáforo','Notas','Atualizado em'],

  'PROJETOS': ['ID','Projeto / peça','Formação','Estado','Reaproveitável em','Titularidade',
               'Observação','Atualizado em'],

  'DOSSIÊ': ['ID','Documento','Titular','Validade','Dias p/ vencer','Semáforo','Onde está',
             'Onde emitir','Responsável','Bloqueia submissão','Observação','Atualizado em'],

  'EQUIPE': ['Nome','E-mail','WhatsApp / chat Telegram','Papel','Digest diário','Pauta semanal','Ativo'],

  'CONFIG': ['Chave','Valor','Descrição'],

  'LOG': ['Timestamp','Usuário','Aba','ID','Campo','De','Para'],

  'OTP': ['E-mail','Código','Timestamp']
};

// -------- Configuração padrão (gravada na aba CONFIG no setup) --------
// Tudo aqui é editável na planilha sem tocar em código.
const CONFIG_PADRAO = [
  ['digest.hora',            '7',    'Hora (0-23, BRT) do disparo do report diário'],
  ['digest.dias',            'SEG,TER,QUA,QUI,SEX', 'Dias em que o report diário é enviado'],
  ['digest.silencioSemAcao', 'SIM',  'SIM = não envia e-mail quando não há nenhuma ação para o dia'],
  ['digest.maxWhatsApp',     '6',    'Máximo de itens no resumo de WhatsApp (o e-mail traz todos)'],
  ['pauta.diaSemana',        'SEG',  'Dia do ritual semanal de 20 minutos (POP)'],
  ['pauta.hora',             '8',    'Hora do envio da pauta semanal'],
  ['alerta.gatilhoDias',     '7',    'Antecedência (dias) para alertar sobre a DATA-GATILHO'],
  ['alerta.prazoDias',       '14',   'Antecedência (dias) para alertar sobre o PRAZO final'],
  ['alerta.dossieDias',      '30',   'Antecedência (dias) para alertar sobre validade de documento'],
  ['score.corteA',           '12',   'SCORE mínimo para prioridade A (atacar)'],
  ['score.corteB',           '8',    'SCORE mínimo para prioridade B (avaliar)'],
  ['whatsapp.provedor',      'nenhum','nenhum | textmebot | telegram | callmebot | meta | twilio (ver docs/RADAR_FOMENTO.md §4)'],
  ['calendar.sincronizar',   'NAO',  'SIM = cria eventos de DATA-GATILHO no Google Calendar'],
  ['calendar.id',            '',     'ID do calendário dedicado (deixe vazio para criar no setup)'],
  ['app.url',                '',     'URL /exec do web app — preenchida automaticamente no 1º acesso']
];

// -------- Semáforo: vocabulário único em toda a plataforma --------
const SEM = {
  VENCIDO:  'VENCIDO',   // gatilho/prazo já passou
  HOJE:     'HOJE',      // é hoje
  CRITICO:  'CRÍTICO',   // <= 7 dias
  ATENCAO:  'ATENÇÃO',   // <= 21 dias
  OK:       'OK',
  NA:       '—'
};

// Status que saem do radar operacional (não geram alerta nem entram na fila)
const STATUS_DORMENTE = ['INELEGÍVEL','FORA DE PERFIL','ARQUIVADO','CONCLUÍDO','PERDIDO'];

// ============================================================
// PLANILHA
// ============================================================
function props_() { return PropertiesService.getScriptProperties(); }

function getPlanilhaId_() {
  var id = props_().getProperty('PLANILHA_ID') || PLANILHA_ID_PADRAO;
  if (!id) throw new Error('Planilha ainda não criada. Execute setupRadar() uma vez no editor.');
  return id;
}

function ss_() { return SpreadsheetApp.openById(getPlanilhaId_()); }

function aba_(nome) {
  var sh = ss_().getSheetByName(nome);
  if (!sh) throw new Error('Aba não encontrada: ' + nome + '. Rode setupRadar().');
  return sh;
}

// ============================================================
// CONFIG (aba CONFIG → cache de 5 min)
// ============================================================
function cfg(chave, padrao) {
  var mapa = cfgTudo_();
  var v = mapa[chave];
  return (v === undefined || v === '') ? padrao : v;
}

function cfgNum(chave, padrao) {
  var v = Number(cfg(chave, padrao));
  return isNaN(v) ? padrao : v;
}

function cfgBool(chave, padrao) {
  var v = String(cfg(chave, padrao ? 'SIM' : 'NAO')).trim().toUpperCase();
  return v === 'SIM' || v === 'S' || v === 'TRUE' || v === '1';
}

function cfgTudo_() {
  var cache = CacheService.getScriptCache();
  var raw = cache.get('cfg');
  if (raw) return JSON.parse(raw);
  var sh = ss_().getSheetByName(ABAS.config);
  var mapa = {};
  if (sh && sh.getLastRow() > 1) {
    sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues().forEach(function (r) {
      if (r[0]) mapa[String(r[0]).trim()] = String(r[1]).trim();
    });
  }
  cache.put('cfg', JSON.stringify(mapa), 300);
  return mapa;
}

function cfgSet(chave, valor) {
  var sh = aba_(ABAS.config);
  var vals = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), 1).getValues();
  for (var i = 0; i < vals.length; i++) {
    if (String(vals[i][0]).trim() === chave) {
      sh.getRange(i + 2, 2).setValue(valor);
      CacheService.getScriptCache().remove('cfg');
      return;
    }
  }
  sh.appendRow([chave, valor, '']);
  CacheService.getScriptCache().remove('cfg');
}

// -------- Segredos: sempre em Propriedades do Script, nunca na planilha --------
function segredo_(chave) { return props_().getProperty(chave) || ''; }
