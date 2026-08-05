// ============================================================
// CAMERATA 21 — Plataforma de Inscrição de Instrumentistas
// Backend Google Apps Script — v2.0 (consolidado e corrigido)
// ============================================================

// -------- CONFIGURAÇÃO --------
const SPREADSHEET_ID = "1T7zvDl_w8irOdk8VeIz2iMKlEO94Dv6G8_cHwTQSWSg";
const DESTINO_UZP = "Av. Santos Dumont, 843, São Paulo, SP, Brasil"; // Universidade Zumbi dos Palmares — CONFIRMAR
const OTP_VALIDADE_MIN = 10;

// Logo da Universidade Zumbi dos Palmares (base64 encoded)
// Placeholder - substituir por base64 real quando disponível
const LOGO_UZP_B64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

// Metas de quadro orquestral (base: elenco planejado)
const METAS = { "Violino":14, "Viola":4, "Violoncelo":4, "Contrabaixo":2,
  "Flauta":2, "Oboé":2, "Clarinete":2, "Fagote":2, "Trompa":2, "Trompete":2, "Percussão":1 };

// Repertório confirmado
const REPERTORIO = [
  "Sinfonia n.º 3 «Escocesa» — 1º mov. (Mendelssohn)",
  "Sinfonia n.º 40, K. 550 — 1º mov. (Mozart)",
  "Sinfonia n.º 5 — 1º mov. (Beethoven)",
  "Concerto para Violino (Joseph Bologne, Chevalier de Saint-Georges)"
];

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
    "Inscrições": ["Timestamp","Nome Completo","Nome Artístico","E-mail","Telefone","Instrumento","Piccolo","Corne Inglês","Clarone/Requinta","Disp. Ensaio 16/Ago","Aceite Repertório","Ranking Repertório","Material","Estante Própria","Disp. Concerto 20/Nov","Disp. Semana Concerto","CEP","Transporte","Distância","Tempo","Custo Estimado","Status"],
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
    var emails = sheet.getRange(2, 4, sheet.getLastRow() - 1, 1).getValues().flat()
      .map(function(x){ return normalizeEmail(String(x)); });
    return { exists: emails.indexOf(email) !== -1 };
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
    sheet.appendRow(prepareSheetRow(formData, logistics));
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
  // Construir telefone completo se vier separado
  var fullPhone = d.phone;
  if (d.ddd && d.phone) {
    fullPhone = d.ddd + " " + d.phone;
  }

  return [
    new Date(),
    normalizeName(d.firstName + " " + d.lastName),
    d.artisticName || "—",
    normalizeEmail(d.email),
    normalizePhone(fullPhone),
    getInstrumentName(d.instrument),
    d.piccolo || "—",
    d.corneIngles || "—",
    d.claroneRequinta || "—",
    d.dispEnsaio ? "Sim" : "Não",
    d.aceiteRepertorio ? "Sim" : "Não",
    (d.ranking || []).join(" > "),
    d.material === "tablet" ? "Tablet" : "Impresso",
    d.estante ? "Sim" : "Não",
    d.dispConcerto ? "Sim" : "Não",
    d.dispSemana ? "Sim" : "Não",
    d.cep,
    getTransportName(d.transport),
    log.distance,
    log.duration,
    calculateCost(log.distanceValue, d.transport),
    "Pendente"
  ];
}

function getInstrumentName(k) {
  var n = { violin:"Violino", violin1:"Violino 1", violin2:"Violino 2",
    viola:"Viola", cello:"Violoncelo", bass:"Contrabaixo",
    flute:"Flauta", piccolo:"Flauta Piccolo", oboe:"Oboé", englishhorn:"Corne Inglês",
    clarinet:"Clarinete", clarion:"Clarinete Baixo", bassoon:"Fagote",
    horn:"Trompa", trumpet:"Trompete", trombone:"Trombone", tuba:"Tuba", percussion:"Percussão" };
  return n[k] || k;
}

function getTransportName(k) {
  var n = { public:"Transporte Público", uber:"Uber/App", car:"Carro Próprio" };
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
function sendConfirmationEmail(d, log) {
  try {
    var INST = getInstrumentName(d.instrument);
    log = log || {};
    function linha(rot, val) {
      return '<tr><td style="padding:7px 10px;color:#FFB800;font-size:12px;letter-spacing:.08em;text-transform:uppercase;vertical-align:top;width:44%">' + rot +
             '</td><td style="padding:7px 10px;color:#F2EDE2;font-size:15px">' + val + '</td></tr>';
    }
    var linhas =
      linha("Nome", normalizeName(d.firstName + " " + d.lastName)) +
      linha("Nome artístico", d.artisticName || "—") +
      linha("E-mail", normalizeEmail(d.email)) +
      linha("WhatsApp", normalizePhone(d.phone)) +
      linha("Instrumento", INST) +
      (d.piccolo ? linha("Flauta Piccolo", d.piccolo) : "") +
      (d.corneIngles ? linha("Corne Inglês", d.corneIngles) : "") +
      (d.claroneRequinta ? linha("Clarone/Requinta", d.claroneRequinta) : "") +
      linha("Ensaio aberto 16/Ago (UZP)", d.dispEnsaio ? "Sim" : "Não") +
      linha("Ciência do repertório", d.aceiteRepertorio ? "Sim" : "Não") +
      linha("Ordem de preferência", (d.ranking || []).map(function(o,i){return (i+1)+"º "+o;}).join("<br>")) +
      linha("Material", d.material === "tablet" ? "Tablet próprio" : "Partitura impressa") +
      linha("Estante própria", d.estante ? "Sim" : "Não") +
      linha("Concerto 20/Nov (Sala São Paulo)", d.dispConcerto ? "Sim" : "Não") +
      linha("Ensaios na semana do concerto", d.dispSemana ? "Sim" : "Não") +
      linha("CEP de partida", d.cep) +
      linha("Transporte", getTransportName(d.transport)) +
      (log.distance ? linha("Distância estimada até a UZP", log.distance + " · " + log.duration) : "");

    var html =
      '<div style="background:#1F0A33;padding:32px 12px">' +
      '<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#2A1244;border:1px solid rgba(255,184,0,.35);border-radius:12px;overflow:hidden">' +
      '<div style="padding:36px 32px 20px;text-align:center">' +
      '<div style="font-family:Georgia,serif;font-weight:900;font-size:40px;color:#FFB800;letter-spacing:-1px">CAMERATA<span style="font-style:italic;font-size:.72em">21</span></div>' +
      '<div style="font-size:11px;letter-spacing:3px;color:#F2EDE2;opacity:.75;text-transform:uppercase;margin-top:4px">Orquestra Afro-Brasileira</div>' +
      '</div>' +
      '<div style="padding:8px 32px 32px">' +
      '<h2 style="font-family:Georgia,serif;color:#FFB800;font-size:26px;margin:0 0 14px;text-align:center">Inscrição confirmada.</h2>' +
      '<p style="color:#F2EDE2;font-size:16px;line-height:1.7">Olá, <strong style="color:#B2FF05">' + normalizeName(d.firstName) + '</strong>! Que bom ter você na construção da Camerata 21. Sua vaga na primeira leitura está registrada — em breve chegam por aqui o cronograma detalhado e os links das partituras.</p>' +
      '<div style="background:rgba(255,184,0,.08);border:1px solid rgba(255,184,0,.35);border-radius:10px;margin:22px 0;overflow:hidden">' +
      '<div style="background:#FFB800;color:#17082A;font-family:Georgia,serif;font-weight:700;padding:10px 16px;font-size:15px">Seus dados, exatamente como você nos enviou</div>' +
      '<table style="width:100%;border-collapse:collapse">' + linhas + '</table>' +
      '</div>' +
      '<p style="color:#F2EDE2;font-size:14px;line-height:1.7;opacity:.85">Notou algo errado? Responda este e-mail com a correção — este registro vale para você e para a nossa produção.</p>' +
      '<div style="text-align:center;margin-top:26px;padding-top:22px;border-top:1px dashed rgba(255,184,0,.4)">' +
      '<div style="background:#F2EDE2;border-radius:10px;padding:16px;display:inline-block"><img src="cid:logoUzp" width="260" style="display:block" alt="Universidade Zumbi dos Palmares"></div>' +
      '<p style="color:#F2EDE2;font-size:12px;opacity:.65;margin-top:14px">Camerata 21 — Orquestra Afro-Brasileira · Universidade Zumbi dos Palmares<br>São Paulo &#8594; Mundo</p>' +
      '</div></div></div></div>';

    var logoBlob = Utilities.newBlob(Utilities.base64Decode(LOGO_UZP_B64), "image/jpeg", "logo_uzp.jpg");
    MailApp.sendEmail({
      to: normalizeEmail(d.email),
      subject: "Inscrição confirmada — Camerata 21 · Ensaio 16/Ago",
      htmlBody: html,
      inlineImages: { logoUzp: logoBlob }
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
