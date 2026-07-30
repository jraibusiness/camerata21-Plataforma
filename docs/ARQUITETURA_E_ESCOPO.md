# Documento de Arquitetura e Escopo: Plataforma Camerata 21
**Tecnologia Base:** Google Apps Script (GAS) + Google Sheets (Backend/DB) + HTML/CSS/JS (Frontend SPA)
**Data Alvo Principal:** 20 de Novembro de 2026 (Troféu Raça Negra - Arlindo Cruz)
**Ensaio de Abertura:** 16 de Agosto de 2026 (Universidade Zumbi dos Palmares)
## 1. Fundamentação Metodológica (Filtros de Validação)
 * **First Principles (Aristóteles):** O problema fundamental não é "fazer um formulário", é **recrutar e balancear um corpo orquestral mitigando gargalos logísticos e de evasão**. Portanto, a interface não pode ter atrito (daí a decisão de 1 pergunta por tela) e os dados logísticos (CEP/Distância) devem ser automatizados, não calculados manualmente.
 * **Systems Thinking:** A orquestra é um ecossistema. A escolha do instrumento afeta o repertório, que afeta a necessidade de partituras (papel vs tablet), que afeta o orçamento. O sistema precisa retroalimentar o *Dashboard* em tempo real para que a regência tome decisões baseadas na lei de oferta e demanda de naipes.
 * **Lean Six Sigma (Black Belt):** * *Redução de Defeitos (Poka-Yoke):* Confirmação dupla de e-mail, validação de formato de WhatsApp, API para validar o CEP antes de avançar.
   * *Redução de Desperdício (Muda):* Estímulo direto ao uso de tablets (reduz custo de impressão/papel).
   * *Controle de Variação (Mura):* Fluxo engessado e guiado (Wizard), impedindo que o usuário pule etapas ou preencha dados ambíguos.
## 2. Interface Pública (Home Page)
A página inicial deve ser uma "Landing Page" focada em conversão, com design responsivo e comunicação clara.
 * **Aviso de Transitoriedade (Disclaimer):** Banner fixo informando: *"Esta é uma plataforma provisória de recrutamento e logística da Camerata 21."*
 * **Sessão 1: A Orquestra:** Breve manifesto/texto sobre a criação da Camerata 21 e a parceria com a Zumbi dos Palmares.
 * **Sessão 2: O Ensaio Aberto:** Informações sobre o dia 16 de Agosto de 2026.
 * **Sessão 3: O Grande Concerto:** Informações sobre o dia 20 de Novembro de 2026 (Espaço Unimed, Troféu Raça Negra, Homenagem a Arlindo Cruz).
 * **Call to Action (CTA):** Botão central e destacado (ex: "Inscreva-se como Instrumentista"). Oculto do menu superior para focar a atenção do usuário no centro da tela.
## 3. Fluxo de Cadastro do Instrumentista (Frontend Wizard)
**Regras de Negócio do Fluxo:**
 * Formato "Step-by-Step" (1 pergunta/interação por tela).
 * Barra de Progresso visual no topo ou rodapé (ex: 10%... 50%... 100%).
 * Design limpo, sem distrações.
**Mapeamento das Telas (Value Stream):**
 * **Tela 00 (Poka-Yoke de Abandono):** Aviso antes de começar: *"Atenção: Este cadastro não salva o progresso pela metade. Reserve 3 minutos para ir até o final, caso contrário, seus dados serão perdidos."* -> Botão [Iniciar Cadastro].
 * **Tela 01 (Autenticação Primária):** Coleta de E-mail + Confirmação de E-mail (Prevenção de Erros).
 * **Tela 02 (Identidade):** Nome (Campo 1) + Sobrenome (Campo 2).
 * **Tela 03 (Contato):** WhatsApp. (Inclusão de DDI/Bandeira do País via Dropdown, padrão Brasil +55).
 * **Tela 04 (Naipe/Instrumento principal):** Seleção do instrumento em cards ou lista clara.
   * *Lógica Condicional (Ramificação):*
     * **Violino:** Entra como "Violinista" genérico (a divisão 1 e 2 será feita internamente depois).
     * **Viola, Violoncelo, Contrabaixo:** Cadastro direto.
     * **Trompa, Trompete, Trombone, Tuba:** Cadastro direto.
     * **Flauta:** Pergunta adicional imediata -> *"Você possui/toca Flauta Piccolo?"* (Sim/Não).
     * **Oboé:** Pergunta adicional -> *"Você possui/toca Corne Inglês?"* (Sim/Não).
     * **Clarinete:** Pergunta adicional -> *"Você possui/toca Clarone ou Requinta?"* (Sim/Não).
     * **Fagote:** Cadastro direto.
 * **Tela 05 (Disponibilidade Ensaio 1):** *"Você tem disponibilidade para estar na Zumbi dos Palmares dia 16/Ago/2026 entre 17h00 e 20h00?"* (Sim/Não).
   * *Nota de rodapé explicativa:* "Este é apenas um intervalo de segurança. O ensaio em si ocorrerá sem intervalos, provavelmente entre 19h00 e 20h30. Detalhes futuros."
 * **Tela 06 (Ciência do Repertório):** Exibição da lista de músicas. Checkbox obrigatório: *"Li e compreendo a proposta de repertório."*
 * **Tela 07 (Votação de Repertório):** O usuário deve ordenar/escolher suas músicas favoritas da lista (Input vital para engajamento e para caso o tempo de ensaio exija cortes).
 * **Tela 08 (Material de Apoio - Sustentabilidade):** *"Para a leitura das partituras, como você prefere atuar?"*
   * Opção A: Uso Tablet/iPad próprio (Recomendado).
   * Opção B: Preciso de partitura impressa.
   * *Nota de rodapé:* "Priorizamos o uso de tablets por consciência ambiental e redução de custos, mas providenciaremos impressões com o maior prazer caso seja sua necessidade."
 * **Tela 09 (Ponte de Retenção):** Mensagem de transição: *"Em breve enviaremos um e-mail/WhatsApp quando a plataforma for atualizada com o link para download das partituras editadas. Vamos falar agora sobre o concerto final!"* -> Botão [Continuar].
 * **Tela 10 (Disponibilidade Concerto Final):** *"Você tem disponibilidade para o concerto do Troféu Raça Negra (Espaço Unimed) na sexta-feira, 20/Nov/2026?"*
   * *Nota:* Horário a confirmar, premissa de período noturno.
 * **Tela 11 (Disponibilidade Semana do Concerto):** *"Você tem disponibilidade para os ensaios na semana do concerto (Segunda, Terça, Quarta e Quinta)?"* (Local e horários a confirmar, provável noite).
 * **Tela 12 (Logística e Custos):** *"Qual o CEP de onde você provavelmente sairá para o ensaio do dia 16/Ago?"* (Apenas CEP, sem endereço completo).
   * *Pergunta complementar:* "Como pretende ir?" (Transporte Público, Uber/App, Carro Próprio).
   * *Ação de Backend Oculta:* O GAS pegará o CEP, fará uma chamada à API do Google Maps em relação ao endereço da Zumbi dos Palmares, calculando a distância (km) e tempo (Metrô/Carro).
 * **Tela 13 (Revisão e Confirmação):** Resumo de todos os dados preenchidos. Botão final [ENVIAR MINHA INSCRIÇÃO].
**Gatilhos Pós-Submissão (Automação):**
 1. Salvar na planilha do Google (Google Sheets).
 2. Disparar e-mail de recibo/boas-vindas para o instrumentista.
 3. Disparar e-mail de notificação para a administração (opcional, pode ser agrupado para não gerar spam).
## 4. Área do Administrador (Backoffice)
**Autenticação (Sistema Passwordless):**
 * Tela de Login pedindo apenas E-mail.
 * Se o e-mail estiver na aba "Admins" da planilha (Ex: Você, Marcos, Reitor), o sistema gera um código de 6 dígitos (OTP), grava na planilha temporariamente e envia por e-mail.
 * O usuário digita os 6 dígitos na tela seguinte. Sucesso = Acesso ao Dashboard.
**O Dashboard (Centro de Comando Sistêmico):**
 * **Módulo 1: Visão Geral (Cronograma):**
   * Contadores regressivos: Dias/Semanas para o Ensaio Aberto e para o Concerto de Novembro.
 * **Módulo 2: Ocupação e Metas (Gráficos/KPIs):**
   * Status do quadro orquestral (Progresso de metas).
   * Exemplo: Violinos (Precisa de 20, temos 15 -> 75%).
   * Visão clara do balanceamento dos naipes (Cordas, Madeiras, Metais).
 * **Módulo 3: Central de Partituras:**
   * Status das edições do material.
   * Ligação com o banco de dados do IMSLP (Links de referência para as obras de domínio público a serem adaptadas).
 * **Módulo 4: Gestão de Ativos (Equipamentos):**
   * Controle de eventual aluguel de equipamentos (Ex: Estantes, Percussão, Cadeiras específicas, Amplificação).
 * **Módulo 5: Inteligência Logística e Financeira (O Algoritmo):**
   * Cálculo automático de Distância: Filtro destacando músicos que moram a mais de 10km da Zumbi dos Palmares.
   * Estimativa Financeira Automática: Algoritmo interno que cruza a distância (Km) com uma tarifa média do Uber (Ex: R$ 2,50 por Km + Taxa Base) e o valor da passagem de transporte público.
   * Output: Projeção do custo total de "Ajuda de Custo" necessária, segmentada por tipo de transporte escolhido pelos músicos na Tela 12.
## 5. Análise Crítica e Recomendações (Lean Six Sigma / Systems Thinking)
Ao estruturar este processo, observei os seguintes pontos críticos que a arquitetura deve cobrir na hora da codificação:
 1. **Fuga de Dados (CEP):** O usuário pode digitar um CEP inválido. O desenvolvedor (Claude) deve ser instruído a implementar uma validação via API pública (como ViaCEP no Brasil) assim que o usuário tira o foco do campo, antes de liberar o botão de avançar da Tela 12. Isso evita que o Google Maps trave no Backend.
 2. **Particionamento de Violinos:** A lógica de separar Violino 1 e Violino 2 não deve estar no formulário para não gerar "Muri" (sobrecarga cognitiva/ego) no músico. Isso deve ser um *dropdown* na própria planilha do administrador, onde a regência ou a chefia de naipe designa quem é 1 e quem é 2 após a inscrição.
 3. **Abandono de Carrinho:** No limite do Lean, se um músico fechar a aba na Tela 10, perder todos os dados é seguro para evitar banco sujo, mas cria frustração. Como o App Script é Stateless, a instrução inicial (Tela 00) que sugerimos cumpre a função do "Poka-Yoke" preventivo.
 4. **Assimetria de Informação:** A obrigatoriedade de votação de repertório (Tela 07) é uma excelente aplicação de *Systems Thinking*, pois gera o efeito "IKEA" (o músico se sente dono do projeto por ter ajudado a montar o programa), diminuindo as chances de falta (No-show) nos ensaios.
