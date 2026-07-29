// Camerata 21 - Plataforma de Inscrição de Instrumentistas
// Google Apps Script para backend e automação

// Configuração da planilha
const SPREADSHEET_ID = "1T7zvDl_w8irOdk8VeIz2iMKlEO94Dv6G8_cHwTQSWSg";
const SPREADSHEET_NAME = "Inscrições Camerata 21";

// Estrutura da planilha:
// 1. Admins - E-mails de administradores
// 2. Inscrições - Dados dos inscritos
// 3. Partituras - Status das partituras
// 4. Logística - Cálculos de distância e custos

// Função principal para lidar com requisições web
function doGet(e) {
  if (e.pathInfo === "/cadastro") {
    return HtmlService.createHtmlOutputFromFile('cadastro')
      .setTitle('Inscrição Camerata 21')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } else if (e.pathInfo === "/admin") {
    return createAdminInterface();
  } else {
    return HtmlService.createHtmlOutputFromFile('index')
      .setTitle('Camerata 21 - Inscrição de Instrumentistas');
  }
}

// Função para processar formulário de inscrição
function processRegistration(formData) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName("Inscrições");

    // Validar campos obrigatórios
    if (!validateFormData(formData)) {
      return { success: false, message: "Dados inválidos ou incompletos" };
    }

    // Calcular distância e tempo
    const logisticsData = calculateLogistics(formData.cep);

    // Preparar linha para planilha
    const rowData = prepareSheetRow(formData, logisticsData);

    // Adicionar à planilha
    sheet.appendRow(rowData);

    // Enviar e-mails de confirmação
    sendConfirmationEmail(formData);
    notifyAdmin(formData);

    return {
      success: true,
      message: "Inscrição realizada com sucesso!",
      logistics: logisticsData
    };
  } catch (error) {
    Logger.log("Erro ao processar inscrição: " + error.toString());
    return { success: false, message: "Erro ao processar inscrição" };
  }
}

// Validar dados do formulário
function validateFormData(data) {
  const required = ['email', 'firstName', 'lastName', 'phone', 'instrument'];
  return required.every(field => data[field] && data[field].trim() !== '');
}

// Calcular distância e tempo usando Google Maps
function calculateLogistics(cep) {
  try {
    // Endereço fixo da Zumbi dos Palmares
    const destination = "Av. André Cavalcanti, 90, Cidade Universitária, São Paulo, SP, Brazil";

    // Converter CEP para endereço
    const geocoder = Maps.newGeocoder();
    const location = geocoder.geocode(cep + ", São Paulo, Brazil");

    if (location.results && location.results.length > 0) {
      const origin = location.results[0].geometry.location;

      // Calcular rota
      const directions = Maps.newDirectionFinder()
        .setOrigin(origin)
        .setDestination(destination)
        .setMode(Maps.DirectionFinder.Mode.DRIVING)
        .getDirections();

      if (directions.routes && directions.routes.length > 0) {
        const route = directions.routes[0];
        const leg = route.legs[0];

        return {
          distance: leg.distance.text,
          duration: leg.duration.text,
          distanceValue: leg.distance.value,
          durationValue: leg.duration.value
        };
      }
    }

    // Fallback caso não consiga calcular
    return {
      distance: "15 km",
      duration: "45 min",
      distanceValue: 15000,
      durationValue: 2700
    };
  } catch (error) {
    Logger.log("Erro ao calcular logística: " + error.toString());
    return null;
  }
}

// Preparar linha para planilha
function prepareSheetRow(formData, logistics) {
  const timestamp = new Date();
  const fullName = formData.firstName + " " + formData.lastName;

  return [
    timestamp,
    fullName,
    formData.email,
    formData.phone,
    formData.instrument,
    formData.instrumentAdditional || "",
    formData.availabilityEnsaio ? "Sim" : "Não",
    formData.availabilityFinal ? "Sim" : "Não",
    formData.availabilityWeek ? "Sim" : "Não",
    formData.materialPreference || "Não especificado",
    formData.ranking ? formData.ranking.join(", ") : "",
    formData.cep,
    formData.transport,
    logistics ? logistics.distance : "Não calculado",
    logistics ? logistics.duration : "Não calculado",
    "Pendente"
  ];
}

// Enviar e-mail de confirmação
function sendConfirmationEmail(formData) {
  const template = HtmlService.createTemplateFromFile('confirmationEmail');
  template.name = formData.firstName;
  template.email = formData.email;

  const html = template.evaluate();
  const subject = "Confirmação de Inscrição - Camerata 21";

  MailApp.sendEmail({
    to: formData.email,
    subject: subject,
    htmlBody: html.getContent()
  });
}

// Notificar administradores
function notifyAdmin(formData) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const adminSheet = ss.getSheetByName("Admins");
  const admins = adminSheet.getRange(2, 1, adminSheet.getLastRow() - 1, 1).getValues();

  const subject = "Nova Inscrição na Camerata 21";
  const message = `Nova inscrição recebida:

Nome: ${formData.firstName} ${formData.lastName}
E-mail: ${formData.email}
Instrumento: ${formData.instrument}
Telefone: ${formData.phone}`;

  admins.forEach(([adminEmail]) => {
    if (adminEmail) {
      MailApp.sendEmail(adminEmail, subject, message);
    }
  });
}

// Autenticação de administrador
function authenticateAdmin(email) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const adminSheet = ss.getSheetByName("Admins");
  const admins = adminSheet.getRange(2, 1, adminSheet.getLastRow() - 1, 1).getValues();

  return admins.some(([adminEmail]) => adminEmail === email);
}

// Gerar código OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Salvar código temporário
function saveOTP(email, code) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const tempSheet = ss.getSheetByName("TempOTP") || ss.insertSheet("TempOTP");

  // Limpar OTPs antigos
  const data = tempSheet.getDataRange().getValues();
  const now = new Date();
  const newData = data.filter(row => {
    const timestamp = new Date(row[0]);
    return (now - timestamp) < 5 * 60 * 1000; // 5 minutos
  });

  tempSheet.clear();
  tempSheet.appendRow(["Timestamp", "Email", "OTP"]);
  if (newData.length > 0) {
    tempSheet.getRange(2, 1, newData.length, newData[0].length).setValues(newData);
  }

  // Adicionar novo OTP
  tempSheet.appendRow([new Date(), email, code]);

  return code;
}

// Validar OTP
function validateOTP(email, code) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const tempSheet = ss.getSheetByName("TempOTP");

  if (!tempSheet) return false;

  const data = tempSheet.getDataRange().getValues();
  const now = new Date();

  for (let i = data.length - 1; i >= 1; i--) {
    const [timestamp, userEmail, userCode] = data[i];
    if (userEmail === email && userCode === code) {
      const timeDiff = now - new Date(timestamp);
      if (timeDiff < 5 * 60 * 1000) { // 5 minutos
        return true;
      }
    }
  }

  return false;
}

// Interface de administrador
function createAdminInterface() {
  const template = HtmlService.createTemplateFromFile('adminDashboard');
  template.isAdmin = true;

  return template.evaluate()
    .setTitle('Dashboard Camerata 21')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Obter dados para dashboard
function getDashboardData() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName("Inscrições");

    if (!sheet) return { error: "Planilha não encontrada" };

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const registrations = data.slice(1);

    // Calcular estatísticas
    const total = registrations.length;
    const byInstrument = {};
    const byAvailability = {};

    registrations.forEach(row => {
      const instrument = row[5] || "Não especificado";
      const availability = row[7] || "Não";

      byInstrument[instrument] = (byInstrument[instrument] || 0) + 1;
      byAvailability[availability] = (byAvailability[availability] || 0) + 1;
    });

    return {
      total: total,
      byInstrument: byInstrument,
      byAvailability: byAvailability,
      recentRegistrations: registrations.slice(-5).reverse()
    };
  } catch (error) {
    Logger.log("Erro ao obter dados do dashboard: " + error.toString());
    return { error: error.toString() };
  }
}

// API para atualizar status das partituras
function updateSheetStatus(rowId, status) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName("Inscrições");

    if (sheet) {
      sheet.getRange(rowId + 1, 16).setValue(status);
      return { success: true };
    }

    return { success: false, error: "Planilha não encontrada" };
  } catch (error) {
    Logger.log("Erro ao atualizar status: " + error.toString());
    return { success: false, error: error.toString() };
  }
}

// Função para criar estrutura da planilha
function createSpreadsheet() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    // Criar sheet de Admins se não existir
    let sheet = ss.getSheetByName("Admins");
    if (!sheet) {
      sheet = ss.insertSheet("Admins");
      sheet.appendRow(["Email", "Nome", "Tipo"]);
      sheet.appendRow(["contato@camerata21.org", "Admin Principal", "Super"]);
    }

    // Criar sheet de Inscrições
    sheet = ss.getSheetByName("Inscrições");
    if (!sheet) {
      sheet = ss.insertSheet("Inscrições");
      const headers = [
        "Timestamp", "Nome Completo", "E-mail", "Telefone",
        "Instrumento Principal", "Instrumento Adicional",
        "Disponibilidade Ensaio 16/Ago", "Disponibilidade Concerto Final",
        "Disponibilidade Semana", "Preferência Material",
        "Ranking Repertório", "CEP", "Transporte",
        "Distância", "Tempo", "Status"
      ];
      sheet.appendRow(headers);
    }

    // Criar sheet de Partituras
    sheet = ss.getSheetByName("Partituras");
    if (!sheet) {
      sheet = ss.insertSheet("Partituras");
      const partituraHeaders = [
        "Obra", "Compositor", "Status", "Link", "Última Atualização", "Responsável"
      ];
      sheet.appendRow(partituraHeaders);
    }

    // Criar sheet de Logística
    sheet = ss.getSheetByName("Logística");
    if (!sheet) {
      sheet = ss.insertSheet("Logística");
      const logisticaHeaders = [
        "ID Inscrição", "Nome", "CEP", "Transporte",
        "Distância", "Custo Estimado", "Status Pagamento"
      ];
      sheet.appendRow(logisticaHeaders);
    }

    return { success: true, message: "Planilha criada com sucesso" };
  } catch (error) {
    Logger.log("Erro ao criar planilha: " + error.toString());
    return { success: false, error: error.toString() };
  }
}

// Funções utilitárias
function testAPI() {
  return {
    status: "ok",
    timestamp: new Date(),
    message: "API da Camerata 21 está funcionando"
  };
}

function getSpreadsheetInfo() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    return {
      name: ss.getName(),
      sheetNames: ss.getSheets().map(sheet => sheet.getName()),
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    return { error: error.toString() };
  }
}

// Configuração de trigger (opcional - para limpeza diária)
function createDailyCleanup() {
  ScriptApp.newTrigger('cleanupOldOTPs')
    .timeBased()
    .everyDays(1)
    .atHour(3)
    .create();
}

function cleanupOldOTPs() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const tempSheet = ss.getSheetByName("TempOTP");

  if (tempSheet) {
    const data = tempSheet.getDataRange().getValues();
    const now = new Date();
    const newData = data.filter(row => {
      const timestamp = new Date(row[0]);
      return (now - timestamp) < 24 * 60 * 60 * 1000; // 24 horas
    });

    tempSheet.clear();
    tempSheet.appendRow(["Timestamp", "Email", "OTP"]);
    if (newData.length > 0) {
      tempSheet.getRange(2, 1, newData.length, newData[0].length).setValues(newData);
    }
  }
}