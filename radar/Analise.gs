// ============================================================
// RADAR DE FOMENTO — OS-UZP
// Analise.gs · leitura assistida dos editais
// ------------------------------------------------------------
// O QUE ESTA CAMADA FAZ E O QUE ELA NÃO FAZ
//
// FAZ: lê o texto do edital (página HTML ou PDF), extrai dez campos
//      factuais e cita o trecho que sustenta cada um.
//
// NÃO FAZ: pontuar. Os cinco critérios de score continuam humanos.
//      "O score é calculado, não opinado" é o princípio que sustenta
//      a planilha desde a v1.0 — deixar um modelo opinar afinidade
//      contradiz isso e corrói a confiança no número.
//
// REGRA ANTIALUCINAÇÃO: o modelo responde SÓ a partir do texto
//      recebido. Não achou? Escreve "NÃO ENCONTRADO NO TEXTO".
//      Num painel de prazos, invenção com confiança é o pior
//      resultado possível — pior que campo vazio.
// ============================================================

var IA_CAMPOS = [
  ['impedimentos',   'Impedimentos literais',
   'Exigências que ELIMINAM o proponente: sede em determinado estado ou município, ' +
   'CNAE ou finalidade cultural no objeto social, projeto já aprovado em lei de incentivo, ' +
   'tempo mínimo de existência, natureza jurídica. ATENÇÃO ESPECIAL: se o edital exigir ' +
   '"Certidão Negativa" em sentido literal, registre isso — certidão positiva com efeitos ' +
   'de negativa pode ser recusada por leitura formalista.'],
  ['proponente',     'Quem pode propor',
   'Pessoa física, MEI, pessoa jurídica com ou sem fins lucrativos, exigência de sede.'],
  ['objeto',         'Objeto e formação exigida',
   'O que o edital financia e que formação artística cabe: orquestra sinfônica, música de ' +
   'câmara, solista, compositor individual, ação formativa, palestra.'],
  ['valor',          'Valor e teto',
   'Teto por projeto, valor global, número de contemplados, faixas.'],
  ['contrapartida',  'Contrapartida obrigatória',
   'Contrapartidas sociais, gratuidades, percentual de recursos próprios, bens ou serviços ' +
   'exigidos do proponente. É o custo escondido que derruba orçamento.'],
  ['documentos',     'Documentos exigidos',
   'Lista de certidões e documentos para habilitação. Enumere um por linha.'],
  ['prazo',          'Prazo de inscrição no edital',
   'Data-limite conforme o TEXTO, no formato DD/MM/AAAA.'],
  ['vigencia',       'Vigência de execução',
   'Período em que o projeto precisa ser executado, e prazo de vigência do instrumento.'],
  ['contas',         'Prestação de contas',
   'Regime, prazos e exigências de prestação de contas.'],
  ['passo',          'Próximo passo concreto',
   'A primeira ação prática de quem vai submeter. Uma frase, verbo no infinitivo.']
];

// ============================================================
// 1. ENTRADA — chamada pela gaveta do Radar
// ============================================================
function analisarEdital(token, id, forcar) {
  sessao_(token);
  var r = lerRadar_().filter(function (x) { return x.id === id; })[0];
  if (!r) throw new Error('Edital não encontrado: ' + id);

  if (!forcar) {
    var guardada = lerAnalise_(id);
    if (guardada) return guardada;
  }

  var fonte = r.documento || r.link;
  if (!fonte) throw new Error('Este edital não tem link nem documento cadastrado. ' +
                              'Cole um na gaveta e tente de novo.');

  var doc = baixarDocumento_(fonte);
  var bruto = chamarIA_(promptExtracao_(r), doc);
  var dados = extrairJSON_(bruto);
  dados._fonte = fonte;
  dados._modelo = cfg('ia.modelo', IA_MODELO_PADRAO);
  dados._quando = fmtBR_(hoje_());
  dados._divergencias = conferirDivergencias_(r, dados);

  gravarAnalise_(r, dados);
  return dados;
}

// Pergunta livre, ancorada no mesmo texto.
function perguntarEdital(token, id, pergunta) {
  sessao_(token);
  var r = lerRadar_().filter(function (x) { return x.id === id; })[0];
  if (!r) throw new Error('Edital não encontrado.');
  var fonte = r.documento || r.link;
  if (!fonte) throw new Error('Sem link cadastrado para consultar.');
  if (!String(pergunta || '').trim()) throw new Error('Escreva a pergunta.');

  var doc = baixarDocumento_(fonte);
  var p = 'Você responde perguntas sobre um edital de fomento cultural brasileiro.\n\n' +
    'REGRAS ABSOLUTAS:\n' +
    '1. Responda SOMENTE com base no texto fornecido.\n' +
    '2. Se a resposta não estiver no texto, responda exatamente: ' +
    '"Não encontrei isso no texto do edital." e pare.\n' +
    '3. Cite entre aspas o trecho que sustenta a resposta.\n' +
    '4. Não opine sobre mérito, chance de aprovação ou afinidade do projeto.\n' +
    '5. Português do Brasil, direto, no máximo 150 palavras.\n\n' +
    'CONTEXTO DO REGISTRO (pode divergir do texto — se divergir, diga):\n' +
    '- Edital: ' + r.instrumento + ' (' + r.orgao + ')\n' +
    '- Prazo registrado: ' + (r.prazoBR || 'fluxo contínuo') + '\n\n' +
    'PERGUNTA: ' + String(pergunta).trim();
  return { resposta: chamarIA_(p, doc), fonte: fonte };
}

function promptExtracao_(r) {
  var campos = IA_CAMPOS.map(function (c, i) {
    return '  "' + c[0] + '": (' + (i + 1) + ') ' + c[1] + ' — ' + c[2];
  }).join('\n');
  return 'Você extrai dados factuais de editais de fomento cultural brasileiros.\n\n' +
    'REGRAS ABSOLUTAS:\n' +
    '1. Extraia SOMENTE o que está escrito no texto fornecido.\n' +
    '2. Campo que não constar no texto recebe exatamente: "NÃO ENCONTRADO NO TEXTO".\n' +
    '3. NÃO pontue, NÃO avalie mérito, NÃO estime chance de aprovação e NÃO opine ' +
    'sobre a afinidade do projeto com o edital. Isso é decisão humana.\n' +
    '4. Em cada campo, quando houver, cite entre aspas o trecho de origem.\n' +
    '5. Português do Brasil. Cada campo com no máximo 60 palavras, menos ' +
    '"documentos", que pode listar.\n\n' +
    'CONTEXTO DO REGISTRO — o que já está anotado na nossa planilha.\n' +
    'Se o texto do edital contradisser, aponte no campo correspondente:\n' +
    '- Edital: ' + r.instrumento + '\n' +
    '- Órgão: ' + r.orgao + '\n' +
    '- Prazo registrado: ' + (r.prazoBR || 'fluxo contínuo') + '\n' +
    '- Proponente pretendido: ' + (r.proponente || '—') + '\n\n' +
    'RESPONDA APENAS COM UM OBJETO JSON, sem cercas de código, com estas chaves:\n' +
    campos;
}

function conferirDivergencias_(r, d) {
  var out = [];
  var noTexto = String(d.prazo || '');
  var m = noTexto.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (m && r.prazoBR && m[0] !== r.prazoBR) {
    out.push('PRAZO DIVERGE: planilha diz ' + r.prazoBR + ', o edital diz ' + m[0] + '. Conferir.');
  }
  if (/certid(ã|a)o negativa/i.test(String(d.impedimentos) + String(d.documentos))) {
    out.push('O edital menciona "Certidão Negativa". A federal da Faculdade é CPEN ' +
             '(positiva com efeitos de negativa) — consultar a comissão antes de submeter.');
  }
  var v = String(d.vigencia || '');
  if (/202[7-9]|20[3-9]\d/.test(v)) {
    out.push('Execução alcança 2027 ou depois. O mandato da representante legal termina ' +
             'em 20/03/2027 — verificar recondução ou signatário alternativo.');
  }
  return out.join(' · ');
}

// ============================================================
// 2. O DOCUMENTO — página HTML ou PDF
// ============================================================
function baixarDocumento_(url) {
  var r = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true, followRedirects: true,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RadarOSUZP/1.0)' }
  });
  if (r.getResponseCode() >= 400) {
    throw new Error('Não consegui abrir o documento (HTTP ' + r.getResponseCode() +
                    '). Alguns sites bloqueiam acesso automático — nesse caso, ' +
                    'baixe o PDF, jogue no Drive e cole o link no campo Documento.');
  }
  var tipo = String(r.getHeaders()['Content-Type'] || r.getHeaders()['content-type'] || '');
  var pareceePdf = /\.pdf($|\?)/i.test(url);

  if (/pdf/i.test(tipo)) {
    var bytes = r.getBlob().getBytes();
    if (bytes.length > 8 * 1024 * 1024) {
      throw new Error('PDF muito grande (' + Math.round(bytes.length / 1048576) + ' MB). Limite de 8 MB.');
    }
    return { tipo: 'pdf', dados: Utilities.base64Encode(bytes), tamanho: bytes.length };
  }

  var texto = limparHTML_(r.getContentText());

  // A URL termina em .pdf mas voltou HTML: o site interpôs uma casca ou um
  // portal de acesso. É o caso do proac.sp.gov.br, que devolve a mesma página
  // de 1 KB para qualquer endereço.
  if (pareceePdf) {
    throw new Error('O endereço termina em .pdf, mas o servidor devolveu uma página HTML — ' +
      'o site interpôs uma casca de acesso. Baixe o arquivo no navegador, suba no Drive ' +
      'e cole o link de compartilhamento no campo Documento.');
  }

  // Página montada por JavaScript: o HTML chega quase vazio. Mandar 85
  // caracteres ao modelo produziria um resumo inventado com ar de verdade,
  // que é o pior resultado possível num painel de prazos.
  if (texto.length < LIMIAR_TEXTO) {
    throw new Error('A página devolveu só ' + texto.length + ' caracteres de texto — ' +
      'não dá para ler. Ela é montada por JavaScript, e o conteúdo não vem no HTML. ' +
      'Prefiro parar a inventar: baixe o PDF do edital, suba no Google Drive e cole ' +
      'o link no campo Documento, logo acima. A leitura aceita PDF direto.');
  }
  return { tipo: 'texto', dados: texto, tamanho: texto.length };
}

// Abaixo disto uma página não tem edital nenhum — tem menu e rodapé.
var LIMIAR_TEXTO = 3000;

// ============================================================
// CONFERÊNCIA DE LEITURA — a mitigação para os próximos editais
// ------------------------------------------------------------
// Toda vez que um edital novo entra, a pergunta "esse link dá para
// ler?" só apareceria na hora errada: com o prazo em cima. Esta
// varredura antecipa a resposta e escreve o veredicto na coluna
// Leitura. Roda sob demanda e todo dia às 23h.
// ============================================================
function conferirLinks() {
  var sh = aba_(ABAS.radar);
  var cab = CABECALHOS[ABAS.radar];
  var col = cab.indexOf('Leitura') + 1;
  var linhas = lerRadar_();
  var resumo = { ok: 0, fraca: 0, erro: 0, sem: 0 };

  linhas.forEach(function (r) {
    if (r.dormente) { sh.getRange(r.linha, col).setValue(''); return; }
    var v = veredictoLeitura_(r);
    sh.getRange(r.linha, col).setValue(v.texto);
    resumo[v.classe]++;
  });

  Logger.log('Leitura dos ' + linhas.length + ' editais:');
  Logger.log('  ' + resumo.ok + ' prontos para ler');
  Logger.log('  ' + resumo.fraca + ' com página fraca — precisam de PDF anexado');
  Logger.log('  ' + resumo.erro + ' com link com erro');
  Logger.log('  ' + resumo.sem + ' sem link cadastrado');
  if (resumo.fraca || resumo.erro) {
    Logger.log('\nOs marcados aparecem com aviso na gaveta, antes de você tentar ler.');
  }
  return resumo;
}

function veredictoLeitura_(r) {
  var alvo = r.documento || r.link;
  if (!alvo) return { texto: '—  sem link', classe: 'sem' };
  try {
    var d = baixarDocumento_(alvo);
    if (d.tipo === 'pdf') {
      return { texto: 'PDF · ' + Math.round(d.tamanho / 1024) + ' KB', classe: 'ok' };
    }
    return { texto: 'ok · ' + Math.round(d.tamanho / 1000) + ' mil car.', classe: 'ok' };
  } catch (e) {
    var m = String(e.message);
    if (/caracteres de texto|casca de acesso/.test(m)) {
      return { texto: 'FRACA — anexar PDF', classe: 'fraca' };
    }
    var http = m.match(/HTTP (\d+)/);
    return { texto: 'ERRO' + (http ? ' ' + http[1] : '') , classe: 'erro' };
  }
}

function limparHTML_(html) {
  var t = String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  return t.length > 60000 ? t.slice(0, 60000) + '\n\n[...texto truncado em 60 mil caracteres]' : t;
}

// ============================================================
// 3. O MODELO — Gemini por padrão, com alternativas
// ============================================================
// Sem padrão fixo de propósito: em 07/09/2026 o melhor disponível era
// gemini-3.8-flash, enquanto qualquer nome que eu tivesse escrito meses antes
// já estaria velho. Quem escolhe é usarModeloRecomendado(), perguntando à API.
var IA_MODELO_PADRAO = '';

function chamarIA_(prompt, doc) {
  var prov = String(cfg('ia.provedor', 'gemini')).toLowerCase();
  if (prov === 'gemini') return iaGemini_(prompt, doc);
  if (prov === 'glm')    return iaGLM_(prompt, doc);
  if (prov === 'claude') return iaClaude_(prompt, doc);
  throw new Error('Provedor de IA não configurado. Ajuste ia.provedor na aba CONFIG.');
}

function iaGemini_(prompt, doc) {
  var key = segredo_('GEMINI_API_KEY') || segredo_('GEMINI_API');
  if (!key) throw new Error('Falta a propriedade GEMINI_API_KEY nas Propriedades do script.');
  var modelo = cfg('ia.modelo', IA_MODELO_PADRAO);
  if (!modelo) throw new Error('Nenhum modelo escolhido. Rode usarModeloRecomendado() ' +
                               'no editor do Apps Script — ele consulta a API e grava sozinho.');

  var partes = [{ text: prompt }];
  if (doc) {
    partes.push(doc.tipo === 'pdf'
      ? { inline_data: { mime_type: 'application/pdf', data: doc.dados } }
      : { text: '\n\n===== TEXTO DO EDITAL =====\n' + doc.dados });
  }
  var r = UrlFetchApp.fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/' + modelo + ':generateContent',
    { method: 'post', contentType: 'application/json',
      headers: { 'x-goog-api-key': key },
      payload: JSON.stringify({
        contents: [{ parts: partes }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 4096 }
      }),
      muteHttpExceptions: true });

  var corpo = r.getContentText();
  if (r.getResponseCode() >= 400) {
    var dica = '';
    if (/not found|NOT_FOUND/i.test(corpo)) {
      dica = ' O nome do modelo pode ter mudado — rode listarModelosIA() no editor ' +
             'para ver quais a sua chave alcança, e ajuste ia.modelo na aba CONFIG.';
    }
    throw new Error('Gemini respondeu ' + r.getResponseCode() + ': ' +
                    corpo.slice(0, 300) + dica);
  }
  var d = JSON.parse(corpo);
  var c = d.candidates && d.candidates[0];
  if (!c) throw new Error('Gemini não devolveu resposta: ' + corpo.slice(0, 300));
  return (c.content.parts || []).map(function (p) { return p.text || ''; }).join('');
}

function iaGLM_(prompt, doc) {
  var key = segredo_('GLM_API_KEY');
  if (!key) throw new Error('Falta GLM_API_KEY nas Propriedades do script.');
  if (doc && doc.tipo === 'pdf') throw new Error('O caminho do GLM aqui não lê PDF. ' +
    'Use o Gemini para PDF, ou cadastre a página HTML do edital.');
  var r = UrlFetchApp.fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'post', contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + key },
    payload: JSON.stringify({
      model: cfg('ia.modelo', 'glm-4-plus'),
      temperature: 0.1,
      messages: [{ role: 'user', content: prompt + (doc ? '\n\n===== TEXTO =====\n' + doc.dados : '') }]
    }), muteHttpExceptions: true });
  if (r.getResponseCode() >= 400) throw new Error('GLM respondeu ' + r.getResponseCode() + ': ' + r.getContentText().slice(0, 300));
  return JSON.parse(r.getContentText()).choices[0].message.content;
}

function iaClaude_(prompt, doc) {
  var key = segredo_('ANTHROPIC_API_KEY');
  if (!key) throw new Error('Falta ANTHROPIC_API_KEY nas Propriedades do script.');
  var conteudo = [{ type: 'text', text: prompt }];
  if (doc) {
    conteudo.push(doc.tipo === 'pdf'
      ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: doc.dados } }
      : { type: 'text', text: '\n\n===== TEXTO DO EDITAL =====\n' + doc.dados });
  }
  var r = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post', contentType: 'application/json',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    payload: JSON.stringify({
      model: cfg('ia.modelo', 'claude-sonnet-5'),
      max_tokens: 4096, temperature: 0.1,
      messages: [{ role: 'user', content: conteudo }]
    }), muteHttpExceptions: true });
  if (r.getResponseCode() >= 400) throw new Error('Claude respondeu ' + r.getResponseCode() + ': ' + r.getContentText().slice(0, 300));
  return JSON.parse(r.getContentText()).content.map(function (b) { return b.text || ''; }).join('');
}

// ============================================================
// ESCOLHA DO MODELO
// ------------------------------------------------------------
// Nome de modelo muda com frequência. Em vez de fixar um no código
// e quebrar meses depois, a plataforma pergunta à API e escolhe.
//
// O que esta tarefa exige, e que descarta a maioria dos modelos:
//   · aceitar PDF como entrada (as famílias flash e pro aceitam);
//   · contexto longo — edital passa de 50 mil caracteres;
//   · devolver JSON com fidelidade, em temperatura baixa;
//   · responder rápido, porque é interação de gaveta, não lote;
//   · caber na camada gratuita.
// Isso aponta para FLASH: pro é caro e lento demais para o ganho,
// lite erra mais em extração de texto jurídico longo.
// ============================================================

// Famílias que não servem para ler edital, por mais capazes que sejam.
var IA_FAMILIAS_FORA = /tts|robotics|computer-use|lyria|imagen|veo|embedding|aqa|deep-research|antigravity|image|audio|native-audio|live/i;

function pontuarModelo_(nome) {
  if (IA_FAMILIAS_FORA.test(nome)) return -1000;
  var p = 0;
  if (/flash/i.test(nome) && !/lite/i.test(nome)) p += 100;   // o ponto ideal
  else if (/flash.*lite|lite.*flash/i.test(nome)) p += 45;
  else if (/pro/i.test(nome)) p += 60;
  else if (/gemma/i.test(nome)) p += 10;
  // Versão: maior manda. O minor pesa menos que o major, senão 2.5
  // empata com 3.1 — e o minor vai capado, porque "gemma-3-27b" traria 27.
  var v = nome.match(/(\d+)(?:[.-](\d+))?/);
  if (v) p += Math.min(Number(v[1]), 9) * 10 + Math.min(v[2] ? Number(v[2]) : 0, 9);
  if (/preview|exp|experimental/i.test(nome)) p -= 12;        // estável primeiro
  if (/\d{2}-\d{4}|\d{4}-\d{2}/.test(nome)) p -= 4;         // apelido datado
  return p;
}

function modelosDisponiveis_() {
  var key = segredo_('GEMINI_API_KEY') || segredo_('GEMINI_API');
  if (!key) throw new Error('Falta a propriedade GEMINI_API_KEY (ou GEMINI_API).');
  var r = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200',
    { headers: { 'x-goog-api-key': key }, muteHttpExceptions: true });
  if (r.getResponseCode() >= 400) {
    throw new Error('A API respondeu ' + r.getResponseCode() + ': ' + r.getContentText().slice(0, 300));
  }
  var d = JSON.parse(r.getContentText());
  return (d.models || [])
    .filter(function (m) { return (m.supportedGenerationMethods || []).indexOf('generateContent') >= 0; })
    .map(function (m) {
      var nome = m.name.replace('models/', '');
      return { nome: nome, rotulo: m.displayName || '', entrada: m.inputTokenLimit || 0,
               pontos: pontuarModelo_(nome) };
    })
    .sort(function (a, b) { return b.pontos - a.pontos; });
}

// Lista os modelos com a recomendação no topo, já explicada.
function listarModelosIA() {
  var lista;
  try { lista = modelosDisponiveis_(); }
  catch (e) { Logger.log('✗ ' + e.message); return; }

  var bons = lista.filter(function (m) { return m.pontos > -1000; });
  if (!bons.length) { Logger.log('Nenhum modelo de texto disponível para esta chave.'); return; }

  var top = bons[0];
  Logger.log('╔══════════════════════════════════════════════════════════╗');
  Logger.log('  RECOMENDADO:  ' + top.nome);
  Logger.log('  ' + (top.rotulo || '') +
             (top.entrada ? '  ·  contexto de ' + top.entrada.toLocaleString('pt-BR') + ' tokens' : ''));
  Logger.log('╚══════════════════════════════════════════════════════════╝');
  Logger.log('');
  Logger.log('Por quê: ler edital pede PDF na entrada, contexto longo, JSON fiel e');
  Logger.log('resposta rápida, dentro da camada gratuita. A família flash atende os');
  Logger.log('cinco; pro custa caro para o ganho e lite erra mais em texto jurídico.');
  Logger.log('');
  Logger.log('Para aplicar sem digitar nada, rode:  usarModeloRecomendado');
  Logger.log('');
  Logger.log('─── outras opções, da melhor para a pior nesta tarefa ───');
  bons.slice(1, 12).forEach(function (m, i) {
    Logger.log('  ' + String(i + 2).padStart(2) + '. ' + m.nome +
               (m.rotulo ? '   ' + m.rotulo : ''));
  });
  var fora = lista.length - bons.length;
  if (fora) Logger.log('\n(' + fora + ' modelos de voz, imagem, música, robótica e pesquisa ' +
                       'foram omitidos: não servem para ler edital.)');
}

// Escreve o modelo recomendado direto na aba CONFIG.
function usarModeloRecomendado() {
  var lista;
  try { lista = modelosDisponiveis_(); }
  catch (e) { Logger.log('✗ ' + e.message); return; }
  var bons = lista.filter(function (m) { return m.pontos > -1000; });
  if (!bons.length) { Logger.log('Nenhum modelo adequado disponível.'); return; }
  var antes = cfg('ia.modelo', '(vazio)');
  cfgSet('ia.modelo', bons[0].nome);
  cfgSet('ia.provedor', 'gemini');
  Logger.log('✅ ia.modelo: ' + antes + '  →  ' + bons[0].nome);
  Logger.log('   ia.provedor: gemini');
  Logger.log('\nPode abrir o Radar e usar o botão "Ler agora" numa linha qualquer.');
  return bons[0].nome;
}

function extrairJSON_(txt) {
  var t = String(txt).replace(/```json/gi, '').replace(/```/g, '').trim();
  var i = t.indexOf('{'), f = t.lastIndexOf('}');
  if (i < 0 || f < 0) throw new Error('O modelo não devolveu JSON. Resposta: ' + t.slice(0, 200));
  try { return JSON.parse(t.slice(i, f + 1)); }
  catch (e) { throw new Error('JSON inválido do modelo: ' + t.slice(0, 200)); }
}

// ============================================================
// 4. GUARDAR — a análise fica na planilha, legível e auditável
// ============================================================
function colunasAnalise_() {
  return ['ID', 'Edital', 'Analisado em', 'Modelo', 'Fonte lida']
    .concat(IA_CAMPOS.map(function (c, i) { return (i + 1) + '. ' + c[1]; }))
    .concat(['Divergências']);
}

function lerAnalise_(id) {
  var sh = ss_().getSheetByName(ABAS.analise);
  if (!sh || sh.getLastRow() < 2) return null;
  var cab = colunasAnalise_();
  var vals = sh.getRange(2, 1, sh.getLastRow() - 1, cab.length).getValues();
  for (var i = 0; i < vals.length; i++) {
    if (String(vals[i][0]).trim() !== id) continue;
    var o = { _quando: vals[i][2], _modelo: vals[i][3], _fonte: vals[i][4],
              _divergencias: vals[i][cab.length - 1], _cache: true };
    IA_CAMPOS.forEach(function (c, j) { o[c[0]] = vals[i][5 + j]; });
    return o;
  }
  return null;
}

function gravarAnalise_(r, d) {
  var ss = ss_();
  var sh = ss.getSheetByName(ABAS.analise);
  var cab = colunasAnalise_();
  if (!sh) {
    sh = ss.insertSheet(ABAS.analise);
    if (sh.getMaxColumns() < cab.length) {
      sh.insertColumnsAfter(sh.getMaxColumns(), cab.length - sh.getMaxColumns());
    }
    sh.getRange(1, 1, 1, cab.length).setValues([cab])
      .setFontWeight('bold').setBackground('#0B1B3D').setFontColor('#FFB800');
    sh.setFrozenRows(1);
  }
  var linha = [r.id, r.instrumento, d._quando, d._modelo, d._fonte]
    .concat(IA_CAMPOS.map(function (c) { return String(d[c[0]] || ''); }))
    .concat([d._divergencias || '']);

  var achou = 0;
  if (sh.getLastRow() > 1) {
    var ids = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]).trim() === r.id) { achou = i + 2; break; }
    }
  }
  if (achou) sh.getRange(achou, 1, 1, linha.length).setValues([linha]);
  else sh.appendRow(linha);
  log_('ia', ABAS.analise, r.id, 'ANÁLISE', '', d._modelo);
}

// Analisa em lote os que ainda não têm leitura. Use com parcimônia:
// a camada gratuita do Gemini tem limite por minuto e por dia.
function analisarPendentes() {
  var feitos = 0, erros = 0;
  lerRadar_().forEach(function (r) {
    if (r.dormente || (!r.link && !r.documento)) return;
    if (lerAnalise_(r.id)) return;
    if (feitos >= 8) return;                 // respeita o limite por minuto
    try {
      var doc = baixarDocumento_(r.documento || r.link);
      var d = extrairJSON_(chamarIA_(promptExtracao_(r), doc));
      d._fonte = r.documento || r.link;
      d._modelo = cfg('ia.modelo', IA_MODELO_PADRAO);
      d._quando = fmtBR_(hoje_());
      d._divergencias = conferirDivergencias_(r, d);
      gravarAnalise_(r, d);
      feitos++;
      Utilities.sleep(7000);
    } catch (e) { erros++; Logger.log(r.id + ' — ' + e.message); }
  });
  Logger.log('Analisados: ' + feitos + ' · falhas: ' + erros);
  return { feitos: feitos, erros: erros };
}

// Devolve a análise já guardada, sem gastar chamada de modelo.
// A gaveta chama isto ao abrir; só chama o modelo quando você pede.
function analisarEditalSeExistir(token, id) {
  sessao_(token);
  return lerAnalise_(id);
}
