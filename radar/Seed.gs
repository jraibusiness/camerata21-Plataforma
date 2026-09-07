// ============================================================
// RADAR DE FOMENTO — OS-UZP
// Seed.gs · carga inicial de dados
// Fonte: "OS-UZP - Radar Fomento_20260821.xlsx" (v1.0, 21/08/2026)
// ------------------------------------------------------------
// Colunas calculadas (Dias rest., SCORE, PRI, DATA-GATILHO,
// Dias p/ gatilho, Semáforo) NÃO são semeadas: são recalculadas
// por recalcularTudo() a cada leitura, disparo e edição.
// ============================================================

function dt_(br) {                       // '13/10/2026' -> Date
  if (!br) return '';
  var p = String(br).split('/');
  if (p.length !== 3) return '';
  return new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0]));
}

// ---- RADAR ----------------------------------------------------------------
// [instrumento, órgão, tipo, periodicidade, janela, prazo, proponente,
//  pré-requisito, projeto-match, eleg, ader, valor, facil, prob,
//  preparo, responsável, status, próxima ação, fonte,
//  (opcional) data-gatilho manual, (opcional) notas]
// Prazos reconfirmados em fonte primária em 06/09/2026 — ver as notas linha a linha.
function SEED_RADAR_() { return [
['Rouanet nas Favelas 2','MinC / Vale / CUFA','Incentivo c/ patrocinador garantido','Edições esparsas (2023, 2026)','Ago–Out','13/10/2026','Faculdade ZP',
 "Execução obrigatória em favela/comunidade urbana (Censo 2022). Verificar se 'localidade' = município ou território",
 'OS-UZP em território periférico de SP + coral',3,3,2,2,3,30,'João','1. Verificar elegibilidade',
 'Ler o edital nº 6/2026 e fechar o portão binário de elegibilidade','gov.br/cultura › editais › rouanet-nas-favelas-2','',
 'CONFIRMADO 06/09/2026: janela 15/08 a 13/10/2026. R$ 10 mi para no mínimo 50 propostas, teto de R$ 200 mil por projeto. ' +
 'São Paulo está entre as oito cidades contempladas (Belém, BH, DF, Recife, Rio, São Luís, SP, Vitória). ' +
 'Inscrição pelo Salic: tipicidade "Editais Compartilhados", tipologia "Programa Rouanet nas Favelas - 2026". ' +
 'O portão continua aberto: confirmar se "localidade" é o município ou o território de favela.',
 'https://www.gov.br/cultura/pt-br/assuntos/editais/inscricoes-abertas/programa-rouanet-nas-favelas-2/programa-rouanet-nas-favelas-2',''],

['Lei Rouanet — plano plurianual','MinC','Incentivo fiscal federal','Anual','01/02 a 31/10','31/10/2026','Faculdade ZP (Assoc. Privada)',
 'Decisão pendente: PRONAC no CNPJ da IES ou aguardar PJ própria. Checar 3 prestações de contas abertas',
 'Temporada 2027–2029 OS-UZP',3,3,3,1,2,60,'João','2. Decisão estratégica',
 'Levantar prestações de contas abertas no Salic e decidir a proponência','salic.cultura.gov.br · IN MinC 29/26','','',
 'https://www.gov.br/cultura/pt-br/assuntos/lei-rouanet/textos/apresente-seu-projeto','https://www.gov.br/participamaisbrasil/lei-rouanet-instrucao-normativa-do-mecanismo-incentivo-a-projetos-culturais-2026'],

['ProAC ICMS','SEC-SP','Incentivo fiscal estadual','FLUXO CONTÍNUO','Ininterrupto','','Faculdade ZP',
 'Comprovante de endereço em SP há 2+ anos. Limite de projetos por proponente',
 'Temporada 2027 OS-UZP (módulo)',3,3,3,2,2,45,'Vitor','3. Cadastrar proponente',
 'Cadastrar a Faculdade ZP como proponente — destrava Ambev, Renner e MAPFRE','proac-icms.cultura.sp.gov.br','15/09/2026',
 'CONFIRMADO 06/09/2026: inscrição ininterrupta, não há prazo a subtrair. Limite global de R$ 100 mi em 2026 ' +
 '(Resolução SFP-06, DOE de 11/05/2026). A data-gatilho de 15/09 não é arbitrária: é o início da etapa 11 do ' +
 'CAMINHO CRÍTICO (submeter projeto ao ProAC, 15/09 a 31/10). Se aquela etapa mudar de data, mude esta também.',
 'https://www.cultura.sp.gov.br/sec_cultura/Fomento/ProAC_ICMS','https://fomentocultsp.sp.gov.br/'],

['Ibermúsicas — Prêmio composição Orquestra Sinfônica','SEGIB / Funarte','Prêmio de criação','Anual','15/06 a 01/10','01/10/2026','João (PF, compositor)',
 'Perfil completo no Catálogo do Setor. Um único projeto por chamada',
 'Obra sinfônica de João',3,3,1,3,2,20,'João','4. Selecionar obra',
 'Completar perfil no Catálogo do Setor Musical e escolher a obra','ibermusicas.org › convocatorias','',
 'CONFIRMADO 06/09/2026: janela de 15/06 a 01/10/2026 em todas as chamadas, exceto a do Arts Council England ' +
 '(encerrou em 31/07). Prêmio de USD 2.500, uma obra premiada por país, estreia pela Orquestra Sinfônica Nacional ' +
 'de Cuba ou pela Filarmônica Nacional da Venezuela, com circulação posterior nos países membros. ' +
 'A edição de 15 anos tem 15 chamadas — o RADAR mapeou cinco. Vale varrer as outras dez antes de 01/10.',
 'https://www.ibermusicas.org/',''],

['Ibermúsicas — Repertório ibero-americano','SEGIB / Funarte','Apoio à gravação','Anual','15/06 a 01/10','01/10/2026','OS-UZP / Faculdade ZP',
 'Obra precisa constar do Catálogo Ibero-Americano de Partituras',
 'Gravação OS-UZP (resolve direitos)',3,3,2,2,2,25,'João','4. Mapear obras do Catálogo',
 'Mapear obras elegíveis no Catálogo Ibero-Americano','ibermusicas.org › convocatorias','','',
 'https://www.ibermusicas.org/',''],

['Ibermúsicas — Programação musical','SEGIB / Funarte','Apoio a convite de artista','Anual','15/06 a 01/10','01/10/2026','OS-UZP / Faculdade ZP',
 'Convite formal a profissional ibero-americano',
 'Regente ou solista convidado 2027',3,2,1,2,2,25,'','5. Avaliar (capacidade)',
 'Decidir se há banda de capacidade neste ciclo','ibermusicas.org › convocatorias','','',
 'https://www.ibermusicas.org/',''],

['Ibermúsicas — Projetos virtuais','SEGIB / Funarte','Apoio a gravação/streaming','Anual','15/06 a 01/10','01/10/2026','OS-UZP / Faculdade ZP',
 'Projeto de base digital (álbum, videoclipe, podcast, streaming)',
 'Registro audiovisual / mini-doc da OS-UZP',3,2,1,2,2,25,'','5. Avaliar (capacidade)',
 'Decidir se há banda de capacidade neste ciclo','ibermusicas.org › convocatorias','','',
 'https://www.ibermusicas.org/',''],

['Ibermúsicas — Mid Atlantic Arts (EUA)','SEGIB / Mid Atlantic Arts','Circulação internacional','Anual','15/06 a 15/09','15/09/2026','OS-UZP / João',
 'Carta-convite assinada de instituição nos EUA',
 'Ponte Sphinx — NÃO ATIVAR ANTES DE 20/11',1,3,2,1,1,60,'','6. Adiar para ciclo 2027',
 'Retomar apenas depois do concerto de 20/11, com material na mão','ibermusicas.org › convocatorias','','',
 'https://www.ibermusicas.org/',''],

['PNAB Cultura Vicentina 01/2026','Pref. São Vicente','Fomento direto (PNAB)','Ciclo PNAB','Ago–Nov','12/11/2026','MEI Studio Kephra',
 'Comprovar residência/atuação em São Vicente. VERIFICAR edital',
 'Formação de câmara na Baixada Santista',3,2,1,2,2,30,'João','7. Ler edital',
 'Ler o edital e confirmar o critério de vínculo territorial','prosas.com.br › edital 17385','','',
 'https://prosas.com.br/editais/17385',''],

['Credenciamento São Caetano nº 020/2026','SECULT São Caetano','Credenciamento 36 meses','Único (36 meses)','18/08 a 01/09/2026','','Faculdade ZP',
 'SUBMETIDO. Habilita apresentações remuneradas nas escolas da rede municipal por 36 meses',
 'Propostas de câmara nas escolas da rede',3,2,2,2,2,0,'Vitor','SUBMETIDO — resultado preliminar 14/09',
 'Conferir o resultado preliminar em 14/09 e, havendo o que contestar, protocolar recurso antes do final em 28/09',
 'portais.saocaetanodosul.sp.gov.br › secult › editais','14/09/2026',
 'Inscrito em nome da Faculdade — não pelo MEI, como se previa. Linguagens aceitas: música, teatro, dança, circo ' +
 'e cultura popular; inscrições encerradas em 01/09/2026. Resultado preliminar 14/09 e final 28/09, datas ' +
 'informadas pelo Vitor a partir do edital: o portal da prefeitura estava fora do ar em 06/09/2026 e não deu ' +
 'para reconfirmar em fonte primária. Conferir no dia.',
 'https://portais.saocaetanodosul.sp.gov.br/secult/Programas',''],

['PROMAC-SP (ISS/IPTU)','Pref. São Paulo','Incentivo fiscal municipal','Anual','Mar–Mai','26/05/2026','Faculdade ZP',
 'Sede em SP há 2+ anos. PRAZO 2026 ENCERRADO',
 'Temporada 2027 (módulo municipal)',3,3,2,2,2,45,'Vitor','9. Agendar ciclo 2027',
 'Agendar a preparação para a abertura do ciclo 2027 (Mar–Mai)','prefeitura.sp.gov.br › promac','','',
 'https://smcpromac.prefeitura.sp.gov.br/','https://prefeitura.sp.gov.br/web/cultura/w/promac2025'],

['BNDES — Espetáculos Espaço Cultural','BNDES','Contratação direta (cachê)','Anual (temporada bienal)','Jun–Ago','','Faculdade ZP ou MEI',
 'CNPJ ativo. Categoria Música Erudita. Apresentação no RJ',
 'Programa de concerto OS-UZP',3,3,1,2,2,30,'Vitor','9. Agendar ciclo 2027',
 'Monitorar a abertura da próxima temporada bienal','bndes.gov.br › espaco-cultural-bndes','','',
 'https://www.bndes.gov.br/wps/portal/site/home/onde-atuamos/cultura-e-economia-criativa/espaco-cultural-bndes/concursos-espetaculos-musicais/concurso-espetaculos-2026-2027',''],

['Funarte Aberta 2026 — Complexo SP','Funarte','Ocupação de espaço','Fluxo contínuo','30/03/2026 a 30/04/2027','30/04/2027','Faculdade ZP · MEI · PF',
 'Sem cachê: a Funarte cede o espaço. Mas a bilheteria vai integralmente ao proponente (teto de R$ 100 por ingresso, meia-entrada obrigatória)',
 'Concerto de câmara / recital comentado',3,2,1,2,2,20,'Vitor','10. Escolher sala e data',
 'Escolher a sala, fechar a data e submeter pelo Prosas','prosas.com.br › editais › 17666-funarte-aberta-2026-complexo-funarte-sp','',
 'CONFIRMADO 06/09/2026: fluxo contínuo até 30/04/2027, ou enquanto houver pauta. Elegíveis PF, PJ com ou sem ' +
 'fins lucrativos, MEI e EI. Salas do Complexo SP: Sala 38, Ateliê Alex Vallauri, Sala Carlos Miranda, ' +
 'Sala Renée Gumiel, Galeria Mário Schenberg, Espaço Waly Salomão e Pátio — são espaços de câmara, não cabe sinfônica. ' +
 'ATENÇÃO: a nota de Valor está em 1 porque a planilha registrava só "sem cachê". Com bilheteria integral há ' +
 'receita real. Repontuar é decisão do João.',
 'https://prosas.com.br/editais/17666-funarte-aberta-2026-complexo-funarte-sp','https://www.gov.br/funarte/pt-br/editais-1/2026/programa-funarte-aberta/programa-funarte-aberta-2026-2013-ocupacao-dos-espacos-culturais-da-funarte-complexo-funarte-sao-paulo'],

['Petrobras Cultural — Circuitos','Petrobras','Patrocínio direto','Anual','VERIFICAR','','Faculdade ZP',
 'SUBMETIDO. Corrigir cadastro (Raphael Vicente / classificação)',
 '30 apresentações, 5 cidades',3,3,3,3,2,0,'João','SUBMETIDO — aguardando',
 'Corrigir o cadastro do responsável e a classificação','petrobras.com.br › petrobras-cultural','','',
 'https://petrobras.com.br/patrocinios',''],

['Interno Ambev Brasilidades','Ambev','Fila de patrocínio incentivado','Anual','Nov–Set','30/09/2026','Faculdade ZP',
 'Exige projeto aprovado em lei ESTADUAL (ProAC). Não aceita Rouanet',
 'Temporada 2027 via ProAC',0,3,3,2,2,30,'','BLOQUEADO até ProAC',
 'Só depois do projeto aprovado no ProAC ICMS','prosas.com.br › edital 16452','','',
 'https://prosas.com.br/editais/16452',''],

['MAPFRE Projetos Incentivados','MAPFRE','Fila de patrocínio incentivado','Anual','Mai–Set','30/09/2026','Faculdade ZP',
 'Exige projeto aprovado e apto a captar',
 'Temporada 2027',0,2,2,2,2,20,'','BLOQUEADO até PRONAC',
 'Só depois do PRONAC apto a captar','VERIFICAR — fundacionmapfre.org','','',
 '',''],

['Fundação Sicredi','Fundação Sicredi','Fila de patrocínio incentivado','Anual','Até 30/09','30/09/2026','Faculdade ZP',
 'Exige PRONAC captando + ABRANGÊNCIA NACIONAL + ações gratuitas',
 'Temporada com itinerância nacional',0,2,2,2,1,20,'','BLOQUEADO até PRONAC',
 'Amarrar com o Petrobras Circuitos para provar abrangência nacional','leisdeincentivo@sicredi.com.br','','',
 '',''],

['Lojas Renner S.A.','Lojas Renner','Fila de patrocínio incentivado','Fluxo contínuo','Ano todo','','Faculdade ZP',
 'Exige PRONAC ou ProAC aprovado. Máx. 80% do projeto. Mín. 150 dias de antecedência',
 'Temporada 2027',0,2,2,2,2,20,'','BLOQUEADO até PRONAC',
 'Respeitar os 150 dias de antecedência no planejamento','prosas.com.br › edital 14253','','',
 'https://prosas.com.br/editais/14253',''],

['Patrocínios Claro','Claro','Fila de patrocínio incentivado','Fluxo contínuo','Ano todo','','Faculdade ZP',
 'Exige projeto aprovado. VERIFICAR requisitos',
 'Temporada 2027',0,2,2,2,1,15,'','BLOQUEADO até PRONAC',
 'Verificar requisitos exatos','prosas.com.br › patrocinios-claro','','',
 '',''],

['Shell Brasil','Shell','Portfólio fechado','Anual','—','','Faculdade ZP',
 'Portfólio curado por convite. Porta pública é o Rouanet da Juventude (N/NE/CO)',
 '',0,1,2,1,1,0,'','FORA DE PERFIL',
 'Sem ação — reavaliar apenas se abrir chamada pública','shell.com.br › patrocinios-e-parcerias','','',
 'https://www.shell.com.br/sobre-a-shell/patrocinios-e-parcerias.html',''],

['Firjan SESI — Mosaico Rio 2027','Firjan SESI','Compra de programação','Anual','Ago–Set','08/09/2026','—',
 'ELIMINADO: exige sede no estado do RJ + finalidade cultural nos atos constitutivos',
 '',0,3,2,2,0,0,'','INELEGÍVEL',
 'Arquivado com motivo escrito','firjan.com.br/editaisculturais','','',
 'https://www.firjan.com.br/editaisculturais/',''],

['Lei Estadual de Incentivo RJ / Mobilidades RJ','Sec. Cultura RJ','Incentivo fiscal estadual','Anual','Até 30/11','30/11/2026','—',
 'ELIMINADO: exige proponente sediado no RJ. Co-proponência de terceiro viola o invariante',
 'O Almirante Negro (rota fechada)',0,3,3,1,0,0,'','INELEGÍVEL',
 'Arquivado com motivo escrito','VERIFICAR — cultura.rj.gov.br','','',
 'https://www.cultura.rj.gov.br/',''],

['RioFilme / FSA-BRDE / BNDES Cinema','Diversos','Fomento audiovisual','Anual','Variável','','—',
 'ELIMINADO: exige produtora audiovisual registrada. Doc da orquestra é RUBRICA do PRONAC, não projeto autônomo',
 '',0,1,1,1,0,0,'','INELEGÍVEL',
 'Arquivado com motivo escrito','—','','',
 '','']
];}

// ---- CAMINHO CRÍTICO ------------------------------------------------------
// [fase, ordem, entregável, por que existe, início, fim, responsável, depende de, status]
function SEED_CAMINHO_() { return [
['FASE 0 — Destravar',1,'Cadastrar a Faculdade ZP como proponente no ProAC ICMS',
 'O prazo NÃO foi perdido: o ProAC ICMS tem inscrição ininterrupta. É o cadastro que destrava Ambev, Renner e MAPFRE em 2027',
 '25/08/2026','05/09/2026','Vitor','Comprovante de endereço 2+ anos','Em andamento'],

['FASE 0 — Destravar',2,'Verificar CNAEs 94.93-6-00 e 90.01-9-99 no cartão CNPJ',
 'A IN da Rouanet exige CNAE compatível com a área do projeto. Erro aqui inabilita sem análise de mérito',
 '25/08/2026','29/08/2026','Vitor','Tatiane Couto','Em andamento'],

['FASE 0 — Destravar',3,'Ler o edital nº 6/2026 e decidir elegibilidade no Rouanet nas Favelas',
 "Portão binário. Se 'localidade' = território de favela, encerramos e não gastamos mais nenhuma hora",
 '22/08/2026','26/08/2026','João','—','Em andamento'],

['FASE 0 — Destravar',4,'Levantar as 3 prestações de contas abertas e o limite de carteira no Salic',
 'Define o teto do pedido plurianual. Sem isso o orçamento é chute',
 '25/08/2026','10/09/2026','Vitor','Acesso Salic','Em andamento'],

['FASE 0 — Destravar',5,'DECISÃO: PRONAC 2026 no CNPJ da IES ou aguardar PJ própria em 2027',
 'Antecipa a temporada em um ano, mas coloca o PRONAC fora do seu CNPJ. Só você decide',
 '01/09/2026','12/09/2026','João','Etapa 4','Em andamento'],

['FASE 1 — Submeter',6,'Completar perfil no Catálogo do Setor Musical (Ibermúsicas)',
 'Os júris avaliam pelo perfil. Não se faz na véspera',
 '25/08/2026','05/09/2026','João','Portfólio e CV','Em andamento'],

['FASE 1 — Submeter',7,'Submeter Prêmio Ibermúsicas de composição para Orquestra Sinfônica',
 'Assimetria máxima: custo de uma partitura, prêmio é estreia por orquestra nacional e circulação em 16 países',
 '05/09/2026','28/09/2026','João','Etapa 6','A fazer'],

['FASE 1 — Submeter',8,'Submeter Ibermúsicas — Repertório Ibero-Americano',
 'Financia gravação e resolve o problema de direitos que travava o repertório',
 '05/09/2026','28/09/2026','João + Vitor','Etapa 6','A fazer'],

['FASE 1 — Submeter',9,'Submeter Rouanet nas Favelas 2 (se elegível)',
 'Único instrumento com patrocinador já comprometido. Elimina o risco de captação',
 '01/09/2026','08/10/2026','João + Vitor','Etapa 3','A fazer'],

['FASE 1 — Submeter',10,'Submeter plano plurianual na Lei Rouanet (se a decisão for sim)',
 'Concerto sinfônico e corpo artístico estável têm teto de R$ 6 mi e liberação modular (1/12, 1/24, 1/36)',
 '15/09/2026','27/10/2026','João + Vitor','Etapa 5','A fazer'],

['FASE 1 — Submeter',11,'Submeter projeto ao ProAC ICMS',
 'Módulo estadual da temporada. Abre a fila Ambev em 2027',
 '15/09/2026','31/10/2026','Vitor','Etapa 1','A fazer'],

['FASE 1 — Submeter',12,'Avaliar e, se couber, submeter PNAB Cultura Vicentina',
 'Único edital em que o MEI é o proponente natural. Não compete com o CNPJ da Faculdade',
 '01/10/2026','08/11/2026','João','Leitura do edital','A fazer'],

['FASE 2 — Provar',13,'Concerto do Dia da Consciência Negra + Prêmio Raça',
 'O dossiê que sustenta toda a captação de 2027: público, registro, imprensa, base de PF',
 '16/11/2026','20/11/2026','João + Marcos','Ensaios 16–19/11','A fazer'],

['FASE 2 — Provar',14,'Fechar o dossiê 2026: relatório, fotos, vídeo, números de público, base de doadores PF',
 'Lição OSESP: a base de pessoas físicas é o ativo mais defensável que existe',
 '21/11/2026','15/12/2026','Vitor','Etapa 13','A fazer'],

['FASE 2 — Provar',15,'Retomar formalmente a relação com a Sphinx',
 'Só depois de 20/11 e com material na mão. Nada de promessas antes de captação confirmada',
 '25/11/2026','20/12/2026','João','Etapa 13','A fazer'],

['FASE 3 — Captar',16,'Resultado Rouanet nas Favelas 2 e cadastro na plataforma Vale (04–15/01/27)',
 'Se aprovado, execução entre 01/05/2027 e 31/12/2028',
 '28/12/2026','15/01/2027','Vitor','Etapa 9','A fazer'],

['FASE 3 — Captar',17,'Abordagem top-down aos patrocinadores via Reitor: Bradesco, Fundação BB, Santander, Itaú',
 'Presidentes, não departamentos de marketing. Só funciona com PRONAC aprovado na mão',
 '15/01/2027','30/04/2027','João + Reitor','Etapas 10 e 14','A fazer'],

['FASE 3 — Captar',18,'Entrar nas filas: Ambev (ProAC), Renner, MAPFRE, Sicredi, Claro',
 'Todas exigem projeto aprovado e captando. Antes disso é desperdício de tempo',
 '01/03/2027','30/09/2027','Vitor','Etapas 10 e 11','A fazer'],

['FASE 3 — Captar',19,'Ibermúsicas ciclo 2027, incluindo Mid Atlantic Arts com carta-convite Sphinx',
 'A ponte para os EUA, agora com lastro',
 '15/06/2027','15/09/2027','João','Etapa 15','A fazer'],

['META',20,'Temporada 2027 financiada e remuneração recorrente estabelecida',
 'O objetivo. Só o plano plurianual (Rouanet ou ProAC) produz renda recorrente — o resto é ponte',
 '01/05/2027','31/12/2027','João','Todas','A fazer']
];}

// ---- PROJETOS -------------------------------------------------------------
function SEED_PROJETOS_() { return [
['Temporada sinfônica 2027 OS-UZP','Orquestra completa','A escrever','Rouanet plurianual · ProAC ICMS · PROMAC','João + Faculdade ZP',
 'Núcleo de tudo. Orçar em módulos para que captação parcial ainda entregue temporada completa'],
['Arquitetura CAIXA Eixo 1 (30 meses, R$ 2,5 mi)','Orquestra completa','Pronta, não submetida','Rouanet plurianual · editais de grande porte','João + Faculdade ZP',
 'Ativo pago e reaproveitável — não recomeçar do zero'],
['Petrobras Circuitos (30 apresentações, 5 cidades)','Sinfônica + câmara','Submetido','Base para qualquer proposta de itinerância nacional','Faculdade ZP',
 'Atende o critério de abrangência nacional do Sicredi'],
['Ponto e Contraponto','Sinfônica + convidados','Conceito','Rouanet nas Favelas · ProAC · editais de cultura negra','João',
 'Diálogos rapper × orquestra, spalla × pagodeiro. Roda de samba pós-concerto'],
['Concerto-meditação / introspecção','Câmara','Conceito','Editais de saúde, neurodiversidade, bem-estar','João',
 'Mesma produção física do concerto sensorial neuroinclusivo'],
['Repertório coral-sinfônico sacro','Orquestra + coral','Conceito','Rouanet · ProAC','João',
 'José Maurício Nunes Garcia: compositor negro e ponte com público evangélico'],
['O Almirante Negro (ópera)','Orquestra + vozes','Libreto pronto','Rouanet plurianual (versão concertante)','João + Dione Carlos',
 'Rota RJ fechada por exigência de sede. Entra como produto do PRONAC da OS-UZP'],
['Obra sinfônica de João (a definir)','Orquestra','A selecionar','Prêmio Ibermúsicas · Catálogo Ibero-Americano','João (Studio Kephra)',
 'Candidatura pessoal, identidade Studio Kephra'],
['Propostas de câmara','Câmara','A escrever','São Caetano (credenciado) · PNAB São Vicente · Funarte Aberta','Faculdade ZP e MEI Studio Kephra',
 'São Caetano foi submetido pela Faculdade. PNAB São Vicente e Funarte Aberta seguem cabendo ao MEI'],
['Registro audiovisual da OS-UZP','—','Material bruto 16/08','Rubrica dentro do PRONAC · Ibermúsicas projetos virtuais','Faculdade ZP',
 'NÃO perseguir editais de audiovisual: exigem produtora com registro'],
['Base de doadores PF','—','34 contatos (Brevo)','Todo pedido de patrocínio e prestação de contas','Faculdade ZP',
 'Lição OSESP: é o ativo mais defensável. Cadastrar público a cada evento']
];}

// ---- DOSSIÊ ---------------------------------------------------------------
// [documento, titular, validade, onde está, responsável, observação]
function SEED_DOSSIE_() { return [
['Portaria nº 017/2026 (criação da OS-UZP)','Faculdade ZP','','Drive OS-UZP','Vitor',
 'Assinada 24/07/2026. Documento fundador — anexo obrigatório em toda submissão'],
['Cartão CNPJ com CNAEs 94.93-6-00 e 90.01-9-99','Faculdade ZP','','Tatiane Couto','Vitor',
 'VERIFICAR: a IN da Rouanet exige CNAE compatível com a área do projeto'],
['CND Federal','Faculdade ZP','','Drive OS-UZP','Vitor','Renovar antes de cada submissão'],
['CRF / FGTS','Faculdade ZP','08/10/2026','Drive OS-UZP','Vitor','Validade curta — é o que mais vence sem ninguém notar'],
['Certidão Estadual (inscritos e não inscritos)','Faculdade ZP','','Drive OS-UZP','Vitor',''],
['Certidão de Tributos Mobiliários','Faculdade ZP','31/12/2026','Drive OS-UZP','Vitor',''],
['Certidão de Tributos Imobiliários','Faculdade ZP','30/01/2027','Drive OS-UZP','Vitor',''],
['Certidão Negativa Correcional de Entes Privados','Faculdade ZP','','Drive OS-UZP','Vitor',''],
['Declaração de Experiência em Projetos Socioculturais','Faculdade ZP','','Drive OS-UZP','Vitor',''],
['Estatuto social e ata da diretoria','Faculdade ZP','','Tatiane Couto','Vitor','Exigido por Sicredi e pela maioria das filas de patrocínio'],
['RG e CPF de dois representantes legais','Vivian Vicente + 1','','Vivian Vicente','Vitor','Vivian é a signatária. Confirmar o segundo nome'],
['Comprovante de endereço em SP há 2+ anos','Faculdade ZP','','Tatiane Couto','Vitor','Exigência específica do ProAC ICMS e do PROMAC'],
['Portfólio e CV do maestro (jan/2026)','João','','Drive OS-UZP','João','Atualizar após 20/11 com o concerto da Consciência Negra'],
['Perfil no Catálogo do Setor Musical (Ibermúsicas)','João','','ibermusicas.org','João','Os júris avaliam por ele. Completar até 05/09'],
['Certidões do MEI Studio Kephra','João','','João','João','Necessárias para PNAB São Vicente e Funarte Aberta. São Caetano foi pela Faculdade']
];}

// ---- EQUIPE ---------------------------------------------------------------
// Preencha e-mail e WhatsApp na planilha. WhatsApp em formato internacional:
// 5511999999999 (sem +, sem espaços, sem traços).
// O e-mail do João fica em branco de propósito: setupRadar() preenche com a conta
// que executar o script, que é a mesma que vai receber os avisos. Falta o WhatsApp dele.
function SEED_EQUIPE_() { return [
['João Rocha','','',                     'Maestro · decide prioridade e mérito artístico','SIM','SIM','SIM'],
['Vitor','vitor.a.m.lopes@gmail.com','5513974145085','Gestão · mantém RADAR e DOSSIÊ, controla prazos','SIM','SIM','SIM']
];}
