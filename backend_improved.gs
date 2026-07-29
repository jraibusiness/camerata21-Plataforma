// Camerata 21 - Plataforma de Inscrição de Instrumentistas - Versão Aprimorada
// Baseada nos padrões do Conservatório Cubatão e COB Conectando Orquestras

// Configuração da planilha
const SPREADSHEET_ID = "COLOQUE_AQUI_O_ID_DA_PLANILHA_GOOGLE";
const SPREADSHEET_NAME = "Inscrições Camerata 21";

// Token de segurança para webhooks
let WEBHOOK_TOKEN = PropertiesService.getScriptProperties().getProperty('WEBHOOK_TOKEN') || gerarTokenWebhook();

// Configurações do sistema
const CONFIG = {
  limiteInstrumentos: {
    'Violino': 20,
    'Viola': 8,
    'Violoncelo': 6,
    'Contrabaixo': 4,
    'Flauta': 3,
    'Oboé': 2,
    'Clarinete': 4,
    'Fagote': 2,
    'Trompa': 4,
    'Trompete': 3,
    'Trombone': 3,
    'Tuba': 2
  },
  taxaInscricao: 0, // Gratuito para a Camerata 21
  prazoConfirmacao: 3 * 60 * 60 * 1000, // 3 horas
  aceitouTermos: false
};

// Função principal para lidar com requisições web
function doGet(e) {
  const action = e.parameter.action;

  // Verificar token de segurança
  const authToken = e.parameter.token;
  if (authToken !== WEBHOOK_TOKEN) {
    return ContentService.createTextOutput(JSON.stringify({error: "Unauthorized"}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  switch(action) {
    case "cadastro":
      return HtmlService.createHtmlOutputFromFile('cadastro')
        .setTitle('Inscrição Camerata 21')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    case "admin":
      return createAdminInterface();
    case "checkInstrument":
      return checkInstrumentAvailability(e.parameter.instrument);
    case "calculateRanking":
      return calculateRanking();
    case "exportPDF":
      return generateReportPDF();
    default:
      return HtmlService.createHtmlOutputFromFile('index');
  }
}

// Função para processar formulário de inscrição com validações avançadas
function processRegistrationAdvanced(formData) {
  try {
    // Validações avançadas
    const validation = validateAdvancedData(formData);
    if (!validation.valid) {
      return { success: false, message: validation.error };
    }

    // Verificar duplicidade
    const duplicate = checkDuplicate(formData.email, formData.phone);
    if (duplicate) {
      return { success: false, message: "Já existe uma inscrição com este e-mail ou telefone" };
    }

    // Verificar limite por instrumento
    const instrumentLimit = checkInstrumentLimit(formData.instrument);
    if (instrumentLimit.limited) {
      return { success: false, message: instrumentLimit.message };
    }

    // Calcular distância e tempo
    const logisticsData = calculateLogistics(formData.cep);

    // Preparar linha para planilha com dados aprimorados
    const rowData = prepareEnhancedSheetRow(formData, logisticsData);

    // Adicionar à planilha
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName("Inscrições");
    sheet.appendRow(rowData);

    // Calcular e salvar ranking
    updateRanking();

    // Enviar e-mails de confirmação
    sendConfirmationEmail(formData);
    notifyAdmin(formData);

    // Agendar confirmação
    scheduleConfirmationReminder(formData);

    return {
      success: true,
      message: "Inscrição realizada com sucesso!",
      ranking: getRankingPosition(formData.instrument),
      logistics: logisticsData
    };
  } catch (error) {
    Logger.log("Erro ao processar inscrição: " + error.toString());
    return { success: false, message: "Erro ao processar inscrição: " + error.message };
  }
}

// Validação avançada dos dados
function validateAdvancedData(data) {
  // Validação de e-mail
  if (!isValidEmail(data.email)) {
    return { valid: false, error: "E-mail inválido" };
  }

  // Validação de telefone
  if (!isValidPhone(data.phone)) {
    return { valid: false, error: "Telefone inválido" };
  }

  // Validação de instrumento
  if (!CONFIG.limiteInstrumentos[data.instrument]) {
    return { valid: false, error: "Instrumento inválido" };
  }

  // Validação de CEP
  if (!isValidCEP(data.cep)) {
    return { valid: false, error: "CEP inválido" };
  }

  // Validação de disponibilidade
  if (!data.availabilityEnsaio && !data.availabilityFinal) {
    return { valid: false, error: "É necessário confirmar disponibilidade para pelo menos um evento" };
  }

  return { valid: true };
}

// Verificar duplicidade por e-mail ou telefone
function checkDuplicate(email, phone) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Inscrições");
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[2] === email || row[3] === phone) {
      return true;
    }
  }
  return false;
}

// Verificar limite por instrumento
function checkInstrumentLimit(instrument) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Inscrições");
  const data = sheet.getDataRange().getValues();

  let count = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i][5] === instrument && data[i][15] === 'Aprovado') {
      count++;
    }
  }

  const limit = CONFIG.limiteInstrumentos[instrument];
  if (count >= limit) {
    return {
      limited: true,
      message: `Limite de ${limit} vagas para ${instrument} já atingido`
    };
  }

  return { limited: false };
}

// Função de autocomplete de endereço
function getAddressByCEP(cep) {
  try {
    // Simulação de API de CEP
    const url = `https://viacep.com.br/ws/${cep}/json/`;
    const response = UrlFetchApp.fetch(url);
    const data = JSON.parse(response.getContentText());

    if (!data.erro) {
      return {
        logradouro: data.logradouro,
        bairro: data.bairro,
        cidade: data.localidade,
        estado: data.uf
      };
    }
    return null;
  } catch (error) {
    Logger.log("Erro ao buscar CEP: " + error.toString());
    return null;
  }
}

// Sistema de ranking
function calculateRanking() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Inscrições");
  const data = sheet.getDataRange().getValues();

  // Ordenar por data de inscrição e status
  const sortedData = data.slice(1).sort((a, b) => {
    if (a[15] !== b[15]) {
      return a[15] === 'Aprovado' ? -1 : 1;
    }
    return new Date(a[0]) - new Date(b[0]);
  });

  // Calcular posições
  const ranking = {};
  let position = 1;

  sortedData.forEach(row => {
    if (row[15] === 'Aprovado') {
      const instrument = row[5];
      if (!ranking[instrument]) {
        ranking[instrument] = [];
      }
      ranking[instrument].push({
        name: row[1],
        email: row[2],
        timestamp: row[0],
        position: position++
      });
    }
  });

  return ranking;
}

// Obter posição no ranking
function getRankingPosition(instrument) {
  const ranking = calculateRanking();
  if (ranking[instrument]) {
    return ranking[instrument].length;
  }
  return 0;
}

// Atualizar ranking na planilha
function updateRanking() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const rankingSheet = ss.getSheetByName("Ranking") || ss.insertSheet("Ranking");

  rankingSheet.clear();
  rankingSheet.appendRow(["Instrumento", "Posição", "Nome", "E-mail", "Data Inscrição"]);

  const ranking = calculateRanking();
  Object.keys(ranking).forEach(instrument => {
    ranking[instrument].forEach(entry => {
      rankingSheet.appendRow([instrument, entry.position, entry.name, entry.email, entry.timestamp]);
    });
  });
}

// Gerar relatório PDF
function generateReportPDF() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Inscrições");
  const data = sheet.getDataRange().getValues();

  // Criar PDF temporário
  const pdf = DriveApp.getFileById(
    DriveApp.createFile('Report.pdf', createPDFContent(data), 'application/pdf')
  ).getId();

  return { pdfUrl: `https://drive.google.com/file/d/${pdf}/view` };
}

// Criar conteúdo do PDF
function createPDFContent(data) {
  // Implementar criação de PDF com dados
  // Usar biblioteca como jsPDF ou similar
  return "PDF Content";
}

// Agendar lembrete de confirmação
function scheduleConfirmationReminder(formData) {
  const triggerTime = new Date(new Date().getTime() + 24 * 60 * 60 * 1000); // 24 horas depois
  ScriptApp.newTrigger('sendConfirmationReminder')
    .timeBased()
    .at(triggerTime)
    .create();
}

// Enviar lembrete de confirmação
function sendConfirmationReminder() {
  // Implementar envio de lembretes
}

// Sistema de upload de documentos
function uploadDocument(fileData, fileName, email) {
  try {
    const folder = DriveApp.getFolderById('COLOQUE_AQUI_O_ID_DA_PASTA');
    const file = folder.createFile(fileName, fileData, 'application/pdf');

    // Salvar referência na planilha
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName("Documentos");
    sheet.appendRow([new Date(), email, file.getId()]);

    return { success: true, fileId: file.getId() };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Interface administrativa aprimorada
function createAdminInterface() {
  const template = HtmlService.createTemplateFromFile('adminDashboardEnhanced');
  template.isAdmin = true;
  template.stats = getDashboardStats();
  template.ranking = calculateRanking();

  return template.evaluate()
    .setTitle('Dashboard Camerata 21 - V2')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Obter estatísticas do dashboard
function getDashboardStats() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Inscrições");
  const data = sheet.getDataRange().getValues();

  const stats = {
    total: data.length - 1,
    aprovados: data.filter(row => row[15] === 'Aprovado').length - 1,
    pendentes: data.filter(row => row[15] === 'Pendente').length - 1,
    porInstrument: {}
  };

  // Contar por instrumento
  data.slice(1).forEach(row => {
    const instrument = row[5];
    if (!stats.porInstrument[instrument]) {
      stats.porInstrument[instrument] = { total: 0, aprovados: 0 };
    }
    stats.porInstrument[instrument].total++;
    if (row[15] === 'Aprovado') {
      stats.porInstrument[instrument].aprovados++;
    }
  });

  return stats;
}

// Funções utilitárias
function gerarTokenWebhook() {
  const token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  PropertiesService.getScriptProperties().setProperty('WEBHOOK_TOKEN', token);
  return token;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  return /^\+?\d[\d\s-]{8,}$/.test(phone);
}

function isValidCEP(cep) {
  return /^\d{5}-?\d{3}$/.test(cep);
}

// Integração com webhook de pagamento (futuro)
function handlePaymentWebhook(payload) {
  // Validar token
  if (payload.token !== WEBHOOK_TOKEN) {
    return { error: "Unauthorized" };
  }

  // Processar pagamento
  // Atualizar status na planilha
  return { success: true };
}

// Funções de manutenção
function cleanupOldData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // Limpar pendentes com mais de 7 dias
  const sheet = ss.getSheetByName("Inscrições");
  const data = sheet.getDataRange().getValues();
  const now = new Date();

  data.forEach((row, index) => {
    if (row[15] === 'Pendente') {
      const daysDiff = (now - new Date(row[0])) / (1000 * 60 * 60 * 24);
      if (daysDiff > 7) {
        sheet.getRange(index + 1, 16).setValue('Expirado');
      }
    }
  });
}

// Agendar tarefas de manutenção
function scheduleMaintenance() {
  // Cleanup diário
  ScriptApp.newTrigger('cleanupOldData')
    .timeBased()
    .everyDays(1)
    .atHour(3)
    .create();
}