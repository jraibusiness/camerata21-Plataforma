// ============================================================
// CAMERATA 21 — Plataforma de Inscrição de Instrumentistas
// Backend Google Apps Script — v2.0 (consolidado e corrigido)
// ============================================================

// -------- CONFIGURAÇÃO --------
const SPREADSHEET_ID = "1T7zvDl_w8irOdk8VeIz2iMKlEO94Dv6G8_cHwTQSWSg";
const DESTINO_UZP = "Av. Santos Dumont, 843, São Paulo, SP, Brasil"; // Universidade Zumbi dos Palmares — CONFIRMAR
const OTP_VALIDADE_MIN = 10;


// Metas de quadro orquestral (base: elenco planejado)
const METAS = { "Violino":14, "Viola":4, "Violoncelo":4, "Contrabaixo":2,
  "Flauta":2, "Oboé":2, "Clarinete":2, "Fagote":2, "Trompa":2, "Trompete":2, "Percussão":1 };

// Repertório confirmado — Ensaio Aberto #1
const REPERTORIO = [
  "MENDELSSOHN, Felix — Sinfonia n.º 3 em Lá menor, Op. 56 (leitura completa)",
  "BEETHOVEN, Ludwig van — Sinfonia n.º 5 em Dó menor, Op. 67 (1º mov.)",
  "MOZART, Wolfgang Amadeus — Sinfonia n.º 40 em Sol menor, K. 550 (1º mov.)",
  "BOLOGNE, Joseph — Concerto para Violino e Orquestra n.º 2 em Lá Maior, Op. 2"
];

// Ensaio Aberto #1 — dados oficiais
const EVENTO = {
  titulo: "Ensaio Aberto #1 — Camerata 21 (Orq. Sinfônica da UZP)",
  data: "16 de Agosto de 2026 (Domingo)",
  recepcao: "16h30",
  inicio: "17h00",
  intervalo: "18h30 às 19h00",
  fim: "20h00",
  endereco: "Av. Santos Dumont, 843 — Luz (Ponte Pequena), São Paulo/SP, CEP 01101-000",
  refEndereco: "Junto à área do antigo Clube de Regatas Tietê",
  // Horários em UTC (BRT = UTC-3). Recepção 16h30 → 19:30Z | Fim 20h00 → 23:00Z
  icsInicio: "20260816T193000Z",
  icsFim: "20260816T230000Z"
};

const PASTA_PARTES = "https://drive.google.com/drive/folders/1UiqH5jkHcXi79-H7V6eeDxiwxaHq-wEj?usp=drive_link";
const NOME_OFICIAL = "Orquestra Sinfônica da Universidade Zumbi dos Palmares";

// -------- ROTEAMENTO (à prova de erro) --------
// URLs: .../exec           → landing page
//       .../exec?page=cadastro → formulário wizard
//       .../exec?page=admin    → dashboard admin
function doGet(e) {
  var page = (e && e.parameter && e.parameter.page) ? e.parameter.page : "home";
  var file = "index";
  var title = "Camerata 21 — Orquestra Afro-Brasileira";

  if (page === "cadastro") { file = "cadastro"; title = "Inscrição — Camerata 21"; }
  else if (page === "admin") { file = "admin"; title = "Dashboard — Camerata 21"; }

  var t = HtmlService.createTemplateFromFile(file);
  t.execUrl = ScriptApp.getService().getUrl();  // links internos funcionam dentro do GAS
  t.baseUrl = ScriptApp.getService().getUrl();
  return t.evaluate()
    .setTitle(title)
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ============================================================
// SETUP AUTOMÁTICO DA PLANILHA
// Execute UMA VEZ pelo editor: selecione "setupPlanilha" e clique em Executar.
// Cria todas as abas com cabeçalhos corretos. Elimina erro humano.
// ============================================================
function setupPlanilha() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var abas = {
    "Admins": ["Email", "Nome", "Tipo"],
    "Inscrições": ["Timestamp","Nome Completo","Nome Artístico","E-mail","Telefone","Instrumento","Piccolo","Corne Inglês","Clarone/Requinta","Disp. Ensaio 16/Ago","Aceite Repertório","Ranking Repertório","Material","Estante Própria","Disp. Concerto 20/Nov","Disp. Semana Concerto","CEP","Transporte","Oferece Carona","Distância","Tempo","Custo Estimado","Status"],
    "Pré-Convocados": ["Instrumento","Nome","Telefone","Observação","Inscrito?"],
    "Partituras": ["Obra","Compositor","Status","Link","Última Atualização","Responsável"],
    "Logística": ["ID Inscrição","Nome","CEP","Transporte","Distância (km)","Tempo (min)","Custo Estimado (R$)","Status Pagamento"],
    "TempOTP": ["Email","Código","Timestamp"]
  };
  for (var nome in abas) {
    var sh = ss.getSheetByName(nome);
    if (!sh) sh = ss.insertSheet(nome);
    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, abas[nome].length).setValues([abas[nome]]).setFontWeight("bold");
      sh.setFrozenRows(1);
    }
  }
  // Adiciona o dono da planilha como Super Admin automaticamente
  var admins = ss.getSheetByName("Admins");
  if (admins.getLastRow() < 2) {
    admins.appendRow([Session.getEffectiveUser().getEmail(), "João Rocha", "Super"]);
  }
  Logger.log("✅ Planilha configurada com sucesso. Abas: " + Object.keys(abas).join(", "));
  return "OK";
}

// ============================================================
// PRÉ-CONVOCADOS (elenco já mapeado — semear na planilha)
// Execute UMA VEZ pelo editor: selecione "seedPreCadastro" e Execute.
// A aba serve de gabarito de conferência no dashboard/planilha;
// o formulário permanece universal (cada músico se inscreve normalmente).
// ============================================================
function seedPreCadastro() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sh = ss.getSheetByName("Pré-Convocados");
  if (!sh) { setupPlanilha(); sh = ss.getSheetByName("Pré-Convocados"); }
  if (sh.getLastRow() > 1) { Logger.log("Aba já populada — nada feito."); return "JÁ POPULADA"; }
  var elenco = [
    ["Flauta","Christian Lavoretti","+55 35 9116-6528",""],
    ["Flauta","Ana Carolina","+55 14 99701-2433",""],
    ["Oboé","(vaga 1)","",""],
    ["Oboé","Henrique Bueno","+55 47 98871-5063",""],
    ["Clarinete","Kerollyn Rodrigues","+55 11 99508-8600",""],
    ["Clarinete","Kaique Iritsu","+55 11 96456-8577","Problema de horário de manhã"],
    ["Fagote","Dayvison Gabriel","+55 81 9384-7741","Confirmar dia 16"],
    ["Fagote","Samyr","+55 22 99704-7016",""],
    ["Trompa","Manu","+55 15 99243-0584",""],
    ["Trompa","André Ulysses","+55 13 99722-3127",""],
    ["Trompete","Giancarlo","+55 11 94848-8150",""],
    ["Trompete","Nicolas Damon","+55 11 97789-8657",""],
    ["Violino 1","Matheus Bazooka","+55 11 98319-2678",""],
    ["Violino 1","Matheus Fernandes","+55 11 99866-4034","Confirmar"],
    ["Violino 1","Gabriel Campos","+55 15 99123-7474",""],
    ["Violino 1","Felipe Alcântara","+55 11 98131-7624",""],
    ["Violino 1","Jhony Santos","+55 11 97038-0043",""],
    ["Violino 1","Vini Mendes","+55 13 99764-1244",""],
    ["Violino 2","Verônica Lopes","+55 22 99837-0740",""],
    ["Violino 2","Luan Araújo","+55 11 91056-8381",""],
    ["Violino 2","Lucas Vinicius","+55 11 97971-3312",""],
    ["Violino 2","Pedro Simão","+55 11 98465-9193",""],
    ["Violino 2","Henrique Ferreira","+55 11 97284-9218","Confirmar 16/08; novembro pode à tarde"],
    ["Viola","Leo Careca","+55 11 99488-3555","Confirmar horários de ensaio"],
    ["Viola","Ingrid Quintana","+55 11 94288-6201",""],
    ["Viola","Otávio Monteiro","","Terça e quinta; horários de novembro"],
    ["Violoncelo","Jeff Moura","+55 13 99131-4144","Novembro"],
    ["Violoncelo","Diego Alves","+55 11 98487-1489","Novembro"],
    ["Violoncelo","Matheus Maldonado","+55 11 91328-1388","A partir das 19h"],
    ["Violoncelo","Matheus Santos","+55 13 98836-1550","Confirmar data"],
    ["Violoncelo","Peppi Santos","","Não pode sexta; pode à noite"],
    ["Violoncelo","João Pedro (Estadualzinha)","","Não pode durante a semana"],
    ["Contrabaixo","Marcos","+55 13 99109-0990",""],
    ["Contrabaixo","Jhow","+55 11 91111-2470",""],
    ["Percussão","Gui (Academia)","","A confirmar"]
  ];
  var linhas = elenco.map(function(r){ return [r[0], r[1], r[2], r[3], "Não"]; });
  sh.getRange(2, 1, linhas.length, 5).setValues(linhas);
  Logger.log("✅ " + linhas.length + " pré-convocados semeados.");
  return "OK";
}

// Normalização de dados
function normalizeName(name) {
  if (!name) return "";
  var minus = ["de","da","do","das","dos","e","di","du","del"];
  return String(name).trim().replace(/\s+/g, " ").toLowerCase().split(" ").map(function(w, i) {
    return (i > 0 && minus.indexOf(w) !== -1) ? w : w.charAt(0).toUpperCase() + w.slice(1);
  }).join(" ");
}

function normalizeEmail(email) {
  if (!email) return "";
  return String(email).trim().toLowerCase();
}

function normalizePhone(phone) {
  if (!phone) return "";
  // Remover espaços e caracteres não numéricos, mas manter o formato para exibição
  var cleaned = String(phone).replace(/\D/g, "");
  if (cleaned.length === 11) {
    return "(" + cleaned.slice(0, 2) + ") " + cleaned.slice(2, 7) + "-" + cleaned.slice(7);
  }
  return phone; // Retorna original se não for brasileiro
}

// Checagem antecipada de duplicidade (chamada pela Tela 01)
function checkEmail(email) {
  try {
    email = normalizeEmail(email);
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName("Inscrições");
    if (!sheet || sheet.getLastRow() < 2) return { exists: false };
    var valores = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
    var cabecalho = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    for (var i = valores.length - 1; i >= 0; i--) {          // do mais recente para o mais antigo
      if (normalizeEmail(String(valores[i][3])) === email) {
        var reg = {};
        cabecalho.forEach(function (c, k) { reg[c] = String(valores[i][k]); });
        return { exists: true, linha: i + 2, registro: reg };
      }
    }
    return { exists: false };
  } catch (e) {
    Logger.log("Erro checkEmail: " + e);
    return { exists: false }; // não travar o fluxo por erro interno
  }
}


// Buscar pré-cadastro por telefone (para pré-preenchimento)
function findPreCadastroByPhone(phone) {
  try {
    phone = normalizePhone(phone);
    if (!phone || phone.length < 10) return null;

    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName("Pré-Convocados");
    if (!sheet || sheet.getLastRow() < 2) return null;

    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var rowPhone = normalizePhone(String(row[2] || ""));
      if (rowPhone === phone) {
        return {
          name: row[1] || "",
          instrument: row[0] || "",
          phone: row[2] || "",
          observation: row[3] || "",
          instrumentoPrincipal: row[0] || ""
        };
      }
    }
    return null;
  } catch (e) {
    Logger.log("Erro findPreCadastroByPhone: " + e);
    return null;
  }
}

// ============================================================
// INSCRIÇÃO
// ============================================================
function processRegistration(formData) {
  try {
    if (!validateFormData(formData)) {
      return { success: false, message: "Dados inválidos ou incompletos." };
    }
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName("Inscrições");
    if (!sheet) { setupPlanilha(); sheet = ss.getSheetByName("Inscrições"); }

    // Duplicidade: mesmo e-mail já inscrito?
    if (sheet.getLastRow() > 1) {
      var emails = sheet.getRange(2, 4, sheet.getLastRow() - 1, 1).getValues().flat()
        .map(function(x){ return normalizeEmail(String(x)); });
      if (emails.indexOf(normalizeEmail(formData.email)) !== -1) {
        return { success: false, message: "Este e-mail já possui uma inscrição registrada." };
      }
    }

    var logistics = calculateLogistics(formData.cep);
    var linhaNova = prepareSheetRow(formData, logistics);
    var existente = checkEmail(formData.email);
    if (existente.exists && existente.linha) {
      // Mesmo e-mail: atualiza o registro em vez de criar duplicata
      sheet.getRange(existente.linha, 1, 1, linhaNova.length).setValues([linhaNova]);
    } else {
      sheet.appendRow(linhaNova);
    }
    sendConfirmationEmail(formData, logistics);
    notifyAdmin(formData);

    return { success: true, message: "Inscrição realizada com sucesso!", logistics: logistics };
  } catch (error) {
    Logger.log("Erro processRegistration: " + error);
    return { success: false, message: "Erro interno. Tente novamente ou contate a organização." };
  }
}

function validateFormData(d) {
  if (!d) return false;
  var req = ["email", "firstName", "lastName", "phone", "instrument", "cep", "transport"];
  for (var i = 0; i < req.length; i++) {
    if (!d[req[i]] || String(d[req[i]]).trim() === "") return false;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return false;
  return true;
}

function prepareSheetRow(d, log) {
  var fullPhone = d.phone;
  if (d.ddd && d.phone) fullPhone = d.ddd + " " + d.phone;

  return [
    new Date(),
    normalizeName(d.firstName + " " + d.lastName),
    d.artisticName || "—",
    normalizeEmail(d.email),
    "'" + formatPhoneBR(fullPhone),   // apóstrofo força texto: evita #ERROR no Sheets
    getInstrumentName(d.instrument),
    d.piccolo || "—",
    d.corneIngles || "—",
    d.claroneRequinta || "—",
    d.dispEnsaio ? "Sim" : "Não",
    d.aceiteRepertorio ? "Sim" : "Não",
    "—",  // ordenação de repertório descontinuada
    d.material === "tablet" ? "Tablet" : "Impresso",
    d.estante ? "Sim" : "Não",
    d.dispConcerto ? "Sim" : "Não",
    d.dispSemana ? "Sim" : "Não",
    d.cep,
    getTransportName(d.transport),
    d.transport === "car" ? (d.carona === true ? "Sim" : (d.carona === false ? "Não" : "—")) : "—",
    log.distance,
    log.duration,
    calculateCost(log.distanceValue, d.transport),
    "Pendente"
  ];
}

// Telefone legível e à prova de planilha: +55 (11) 98765-4321
function formatPhoneBR(raw) {
  var s = String(raw || "").trim();
  var ddi = "+55";
  var m = s.match(/^\+(\d{1,3})/);
  if (m) { ddi = "+" + m[1]; s = s.slice(m[0].length); }
  var d = s.replace(/\D/g, "");
  if (ddi === "+55") {
    if (d.length === 11) return ddi + " (" + d.slice(0,2) + ") " + d.slice(2,7) + "-" + d.slice(7);
    if (d.length === 10) return ddi + " (" + d.slice(0,2) + ") " + d.slice(2,6) + "-" + d.slice(6);
  }
  return ddi + " " + d;
}

function getInstrumentName(k) {
  var n = { violin:"Violino", violin1:"Violino 1", violin2:"Violino 2",
    viola:"Viola", cello:"Violoncelo", bass:"Contrabaixo",
    flute:"Flauta", piccolo:"Flauta Piccolo", oboe:"Oboé", englishhorn:"Corne Inglês",
    clarinet:"Clarinete", clarion:"Clarinete Baixo", bassoon:"Fagote", timpani:"Tímpanos", harp:"Harpa", keyboard:"Teclado / Piano",
    horn:"Trompa", trumpet:"Trompete", trombone:"Trombone", tuba:"Tuba", percussion:"Percussão" };
  return n[k] || k;
}

function getTransportName(k) {
  var n = { public:"Transporte Público", uber:"Uber/App", car:"Carro Próprio", other:"Outro" };
  return n[k] || k;
}

// ============================================================
// LOGÍSTICA (Maps é serviço NATIVO do GAS — nada a habilitar)
// ============================================================
function calculateLogistics(cep) {
  try {
    var geo = Maps.newGeocoder().geocode(cep + ", Brasil");
    if (geo.results && geo.results.length > 0) {
      var o = geo.results[0].geometry.location;
      var dir = Maps.newDirectionFinder()
        .setOrigin(o.lat, o.lng)
        .setDestination(DESTINO_UZP)
        .setMode(Maps.DirectionFinder.Mode.DRIVING)
        .getDirections();
      if (dir.routes && dir.routes.length > 0) {
        var leg = dir.routes[0].legs[0];
        return { distance: leg.distance.text, duration: leg.duration.text,
                 distanceValue: leg.distance.value, durationValue: leg.duration.value };
      }
    }
    return { distance: "Não calculado", duration: "Não calculado", distanceValue: 0, durationValue: 0 };
  } catch (err) {
    Logger.log("Erro logística: " + err);
    return { distance: "Pendente", duration: "Pendente", distanceValue: 0, durationValue: 0 };
  }
}

function calculateCost(meters, transport) {
  if (!meters) return "A calcular";
  var v = 0;
  if (transport === "uber") v = (meters / 1000) * 2.5 + 5;       // R$2,50/km + base
  else if (transport === "public") v = 5.20 * 2;                  // ida e volta tarifa SP
  return "R$ " + v.toFixed(2).replace(".", ",");
}

// ============================================================
// E-MAILS (MailApp é serviço NATIVO — nada a habilitar)
// ============================================================
function buildICS(d) {
  var uid = "c21-ensaio1-" + Utilities.getUuid() + "@camerata21.com";
  var alarms = ["-P1W","-P3D","-P1D","-PT5H","-PT2H","-PT30M","-PT10M"].map(function(t){
    return "BEGIN:VALARM\r\nTRIGGER:" + t + "\r\nACTION:DISPLAY\r\nDESCRIPTION:" + EVENTO.titulo + "\r\nEND:VALARM";
  }).join("\r\n");
  var desc = "Recepcao " + EVENTO.recepcao + " | Inicio " + EVENTO.inicio +
             " | Intervalo " + EVENTO.intervalo + " | Fim " + EVENTO.fim +
             "\\nPartes da orquestra: " + PASTA_PARTES;
  return [
    "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Camerata 21//PT-BR","CALSCALE:GREGORIAN","METHOD:PUBLISH",
    "BEGIN:VEVENT","UID:" + uid,
    "DTSTAMP:" + Utilities.formatDate(new Date(), "UTC", "yyyyMMdd'T'HHmmss'Z'"),
    "DTSTART:" + EVENTO.icsInicio,"DTEND:" + EVENTO.icsFim,
    "SUMMARY:" + EVENTO.titulo,
    "LOCATION:" + EVENTO.endereco,
    "DESCRIPTION:" + desc,
    alarms,"END:VEVENT","END:VCALENDAR"
  ].join("\r\n");
}

function gcalLink() {
  return "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    "&text=" + encodeURIComponent(EVENTO.titulo) +
    "&dates=" + EVENTO.icsInicio + "/" + EVENTO.icsFim +
    "&location=" + encodeURIComponent(EVENTO.endereco) +
    "&details=" + encodeURIComponent(
      "Recepção " + EVENTO.recepcao + " · Início " + EVENTO.inicio +
      " · Intervalo " + EVENTO.intervalo + " · Fim " + EVENTO.fim +
      "\n\nPartes da orquestra: " + PASTA_PARTES);
}

function sendConfirmationEmail(d, log) {
  try {
    var INST = getInstrumentName(d.instrument);
    log = log || {};
    function linha(rot, val) {
      return '<tr><td style="padding:7px 10px;color:#FFB800;font-size:12px;letter-spacing:.08em;text-transform:uppercase;vertical-align:top;width:44%">' + rot +
             '</td><td style="padding:7px 10px;color:#F2EDE2;font-size:15px">' + val + '</td></tr>';
    }
    function extra(rot, val) { return (val && val !== "—") ? linha(rot, val) : ""; }

    var linhas =
      linha("Nome", normalizeName(d.firstName + " " + d.lastName)) +
      linha("E-mail", normalizeEmail(d.email)) +
      linha("WhatsApp", formatPhoneBR(d.phone)) +
      linha("Instrumento", INST) +
      extra("Flauta Piccolo", d.piccolo) +
      extra("Corne Inglês", d.corneIngles) +
      extra("Clarone/Requinta", d.claroneRequinta) +
      extra("Contrafagote", d.contrafagote) +
      linha("Ensaio aberto 16/Ago", d.dispEnsaio ? "Sim" : "Não") +
      linha("Ciência do repertório", d.aceiteRepertorio ? "Sim" : "Não") +
      linha("Material", d.material === "tablet" ? "Tablet próprio" : "Partitura impressa") +
      linha("Concerto final", d.dispConcerto ? "Sim" : "Não") +
      linha("Ensaios na semana do concerto", d.dispSemana ? "Sim" : "Não") +
      linha("CEP de partida", d.cep) +
      linha("Transporte", getTransportName(d.transport)) +
      (d.transport === "car" ? linha("Ofereceu carona", d.carona ? "Sim" : "Não") : "");

    var btn = 'display:inline-block;padding:14px 22px;border-radius:9px;font-family:Georgia,serif;font-size:15px;font-weight:700;text-decoration:none;margin:6px 4px';

    var agenda =
      '<div style="background:rgba(178,255,5,.07);border:1px solid rgba(178,255,5,.4);border-radius:10px;margin:22px 0;padding:18px">' +
      '<div style="font-family:Georgia,serif;color:#B2FF05;font-size:17px;font-weight:700;margin-bottom:10px">' + EVENTO.titulo + '</div>' +
      '<table style="width:100%;border-collapse:collapse;color:#F2EDE2;font-size:14px;line-height:1.7">' +
      '<tr><td style="padding:2px 0;width:34%;color:#FFB800">Data</td><td>' + EVENTO.data + '</td></tr>' +
      '<tr><td style="padding:2px 0;color:#FFB800">Recepção</td><td><strong>' + EVENTO.recepcao + '</strong></td></tr>' +
      '<tr><td style="padding:2px 0;color:#FFB800">Início</td><td><strong>' + EVENTO.inicio + '</strong></td></tr>' +
      '<tr><td style="padding:2px 0;color:#FFB800">Intervalo</td><td>' + EVENTO.intervalo + '</td></tr>' +
      '<tr><td style="padding:2px 0;color:#FFB800">Fim</td><td>' + EVENTO.fim + '</td></tr>' +
      '<tr><td style="padding:2px 0;color:#FFB800;vertical-align:top">Endereço</td><td>' + EVENTO.endereco + '<br><span style="opacity:.7;font-size:13px">' + EVENTO.refEndereco + '</span></td></tr>' +
      '</table></div>';

    var botoes =
      '<div style="text-align:center;margin:24px 0">' +
      '<a href="' + gcalLink() + '" style="' + btn + ';background:#FFB800;color:#17082A">Adicionar à minha agenda</a>' +
      '<a href="' + PASTA_PARTES + '" style="' + btn + ';background:transparent;color:#B2FF05;border:1px solid #B2FF05">Acessar as partes da orquestra</a>' +
      '</div>' +
      '<div style="background:rgba(255,184,0,.1);border-left:3px solid #FFB800;border-radius:6px;padding:14px 16px;margin:18px 0">' +
      '<p style="color:#F2EDE2;font-size:14px;line-height:1.7;margin:0"><strong style="color:#FFB800">Cordas, atenção:</strong> as partes com arcadas ainda receberão atualizações. Confira a pasta novamente na véspera do ensaio e baixe sempre a versão mais recente.</p>' +
      '</div>';

    var repHtml = REPERTORIO.map(function(o){
      return '<li style="margin-bottom:6px">' + o + '</li>';
    }).join("");

    var html =
      '<div style="background:#1F0A33;padding:32px 12px">' +
      '<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#2A1244;border:1px solid rgba(255,184,0,.35);border-radius:12px;overflow:hidden">' +
      '<div style="padding:36px 24px 20px;text-align:center">' +
      '<div style="font-family:Georgia,serif;font-weight:900;font-size:40px;color:#FFB800;letter-spacing:-1px">CAMERATA<span style="font-style:italic;font-size:.72em">21</span></div>' +
      '<div style="font-size:11px;letter-spacing:1.6px;color:#F2EDE2;opacity:.75;text-transform:uppercase;margin-top:6px;line-height:1.5;padding:0 12px">Orquestra Sinfônica da Universidade Zumbi dos Palmares</div>' +
      '</div>' +
      '<div style="padding:8px 24px 32px">' +
      '<h2 style="font-family:Georgia,serif;color:#FFB800;font-size:26px;margin:0 0 14px;text-align:center">Inscrição confirmada.</h2>' +
      '<p style="color:#F2EDE2;font-size:16px;line-height:1.7">Olá, <strong style="color:#B2FF05">' + normalizeName(d.firstName) + '</strong>! Sua vaga no Ensaio Aberto #1 está registrada.</p>' +
      agenda + botoes +
      '<div style="background:rgba(255,184,0,.08);border:1px solid rgba(255,184,0,.35);border-radius:10px;margin:22px 0;overflow:hidden">' +
      '<div style="background:#FFB800;color:#17082A;font-family:Georgia,serif;font-weight:700;padding:10px 16px;font-size:15px">Repertório</div>' +
      '<ul style="color:#F2EDE2;font-size:14px;line-height:1.6;margin:0;padding:16px 16px 16px 34px">' + repHtml + '</ul>' +
      '</div>' +
      '<div style="background:rgba(255,184,0,.08);border:1px solid rgba(255,184,0,.35);border-radius:10px;margin:22px 0;overflow:hidden">' +
      '<div style="background:#FFB800;color:#17082A;font-family:Georgia,serif;font-weight:700;padding:10px 16px;font-size:15px">Seus dados, exatamente como você nos enviou</div>' +
      '<table style="width:100%;border-collapse:collapse">' + linhas + '</table>' +
      '</div>' +
      '<p style="color:#F2EDE2;font-size:14px;line-height:1.7;opacity:.85">Notou algo errado? Responda este e-mail com a correção — este registro vale para você e para a nossa produção.</p>' +
      '<div style="text-align:center;margin-top:26px;padding-top:22px;border-top:1px dashed rgba(255,184,0,.4)">' +
      '<p style="color:#F2EDE2;font-size:12px;opacity:.65;line-height:1.7;margin:0">Camerata 21<br>' + NOME_OFICIAL + '</p>' +
      '</div></div></div></div>';

    MailApp.sendEmail({
      to: normalizeEmail(d.email),
      subject: "Inscrição confirmada — Camerata 21 · Ensaio Aberto #1 (16/Ago)",
      htmlBody: html,
      attachments: [Utilities.newBlob(buildICS(d), "text/calendar", "Ensaio-Aberto-1-Camerata21.ics")]
    });
  } catch (e) { Logger.log("Erro e-mail confirmação: " + e); }
}

function notifyAdmin(d) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sh = ss.getSheetByName("Admins");
    if (!sh || sh.getLastRow() < 2) return;
    var emails = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().flat().filter(String);
    if (emails.length === 0) return;
    function li(rot, val) {
      return '<tr><td style="padding:6px 10px;color:#FFB800;font-size:12px;letter-spacing:.08em;text-transform:uppercase;width:38%">' + rot +
             '</td><td style="padding:6px 10px;color:#F2EDE2;font-size:15px">' + val + '</td></tr>';
    }
    var html =
      '<div style="background:#1F0A33;padding:24px 12px">' +
      '<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#2A1244;border:1px solid rgba(255,184,0,.35);border-radius:12px;overflow:hidden">' +
      '<div style="background:#FFB800;color:#17082A;padding:14px 20px;font-weight:900;font-size:18px">CAMERATA 21 · Nova inscrição</div>' +
      '<table style="width:100%;border-collapse:collapse;margin:10px 0">' +
      li("Nome", normalizeName(d.firstName + " " + d.lastName) + (d.artisticName ? " («" + d.artisticName + "»)" : "")) +
      li("Instrumento", getInstrumentName(d.instrument)) +
      li("E-mail", normalizeEmail(d.email)) +
      li("WhatsApp", normalizePhone(d.phone)) +
      li("Ensaio 16/Ago", d.dispEnsaio ? "Sim" : "Não") +
      li("Concerto 20/Nov", d.dispConcerto ? "Sim" : "Não") +
      '</table>' +
      '<div style="padding:0 20px 20px"><a href="https://docs.google.com/spreadsheets/d/' + SPREADSHEET_ID + '/edit" ' +
      'style="display:inline-block;background:#FFB800;color:#17082A;text-decoration:none;padding:10px 22px;border-radius:6px;font-size:14px;font-weight:700">Abrir planilha completa</a></div>' +
      '</div></div>';
    MailApp.sendEmail({ to: emails.join(","), subject: "Nova inscrição — " + getInstrumentName(d.instrument) + " · " + normalizeName(d.firstName) + " " + normalizeName(d.lastName), htmlBody: html });
  } catch (e) { Logger.log("Erro notifyAdmin: " + e); }
}

// ============================================================
// ADMIN — OTP passwordless
// ============================================================
function requestOTP(email) {
  try {
    email = normalizeEmail(email);
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var admins = ss.getSheetByName("Admins");
    if (!admins || admins.getLastRow() < 2) return { success: false, message: "Nenhum admin cadastrado." };
    var lista = admins.getRange(2, 1, admins.getLastRow() - 1, 1).getValues().flat()
      .map(function(x){ return normalizeEmail(String(x)); });
    if (lista.indexOf(email) === -1) return { success: false, message: "E-mail não autorizado." };

    var code = Math.floor(100000 + Math.random() * 900000).toString();
    var otpSh = ss.getSheetByName("TempOTP") || ss.insertSheet("TempOTP");
    otpSh.appendRow([email, code, new Date()]);
    MailApp.sendEmail(email, "Seu código de acesso — Camerata 21",
      "Código: " + code + "\nVálido por " + OTP_VALIDADE_MIN + " minutos.");
    return { success: true, message: "Código enviado para " + email };
  } catch (e) {
    Logger.log("Erro requestOTP: " + e);
    return { success: false, message: "Erro ao gerar código." };
  }
}

function validateOTP(email, code) {
  try {
    email = normalizeEmail(email);
    code = String(code || "").trim();
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sh = ss.getSheetByName("TempOTP");
    if (!sh || sh.getLastRow() < 2) return { success: false };
    var data = sh.getRange(2, 1, sh.getLastRow() - 1, 3).getValues();
    var agora = new Date().getTime();
    for (var i = data.length - 1; i >= 0; i--) {
      var mail = normalizeEmail(String(data[i][0]));
      var c = String(data[i][1]).trim();
      var ts = new Date(data[i][2]).getTime();
      if (mail === email && c === code && (agora - ts) < OTP_VALIDADE_MIN * 60 * 1000) {
        sh.deleteRow(i + 2);
        return { success: true };
      }
    }
    return { success: false };
  } catch (e) {
    Logger.log("Erro validateOTP: " + e);
    return { success: false };
  }
}

function getDashboardData(email, code) {
  // Revalida sessão simples: exige e-mail admin válido (o front reenvia após login)
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName("Inscrições");
    var admins = ss.getSheetByName("Admins");
    if (!sheet || !admins || admins.getLastRow() < 2) return null;

    // Checa se e-mail é admin
    var lista = admins.getRange(2, 1, admins.getLastRow() - 1, 1).getValues().flat()
      .map(function(x){ return normalizeEmail(String(x)); });
    if (lista.indexOf(normalizeEmail(email)) === -1) return null;

    var total = sheet.getLastRow() - 1;
    var metas = {};
    var instrumentos = sheet.getRange(2, 6, total, 1).getValues().flat();
    var transporte = sheet.getRange(2, 17, total, 1).getValues().flat();

    // Contar por instrumento
    for (var inst in METAS) {
      metas[inst] = instrumentos.filter(function(i){ return i === inst; }).length;
    }

    // Custo total
    var custos = sheet.getRange(2, 21, total, 1).getValues().flat();
    var custoTotal = custos.reduce(function(sum, c){
      var match = String(c).match(/[\d,]+/);
      return sum + (match ? parseFloat(match[0].replace(',', '.')) : 0);
    }, 0);

    // Transportes
    var transpCount = {};
    transporte.forEach(function(t){
      transpCount[t] = (transpCount[t] || 0) + 1;
    });

    // Últimas 10 inscrições
    var recentes = sheet.getRange(sheet.getLastRow() - 9, 1, Math.min(10, total), 6).getValues();

    return {
      total: total,
      meta: METAS,
      metas: metas,
      custoTotal: "R$ " + custoTotal.toFixed(2).replace(".", ","),
      transporte: transpCount,
      recentes: recentes.map(function(r){
        return [r[0], r[1], r[2], r[3], r[4], r[5]];
      })
    };
  } catch (e) {
    Logger.log("Erro getDashboardData: " + e);
    return null;
  }
}

function exportToCSV() {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName("Inscrições");
    var data = sheet.getDataRange().getValues();
    var csv = data.map(function(row){
      return row.map(function(cell){
        return '"' + String(cell).replace(/"/g, '""') + '"';
      }).join(',');
    }).join('\n');

    var blob = Utilities.newBlob(csv, "text/csv", "inscricoes_camerata21.csv");
    return Utilities.base64Encode(blob.getBytes());
  } catch (e) {
    Logger.log("Erro exportToCSV: " + e);
    return null;
  }
}
