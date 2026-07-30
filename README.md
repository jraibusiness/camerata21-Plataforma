# 🎼 Camerata 21 - Plataforma de Inscrição

> Sistema de inscrição para instrumentistas da Camerata 21 — Orquestra Afro-Brasileira da Universidade Zumbi dos Palmares

![Status](https://img.shields.io/badge/status-em%20produção-brightgreen) ![Stack](https://img.shields.io/badge/stack-GAS%20%2B%20Netlify-blue)

## 📋 Sobre

A Camerata 21 é uma orquestra afro-brasileira que nasce da colaboração entre a Universidade Zumbi dos Palmares e regentes de excelência, com foco na valorização da música erudita com identidade negra.

Esta plataforma foi desenvolvida para captar inscrições de músicos de forma ágil e eficiente, com foco total na experiência mobile e design acessível para a geração Z.

## 🎯 Recursos

### ✅ Implementados
- **Formulário de inscrição wizard** (13 telas otimizadas)
- **Dashboard administrativo** com login OTP
- **Design totalmente responsivo** (mobile-first)
- **Sistema de logística integrado** (Google Maps)
- **E-mails personalizados** com identidade visual
- **Normalização automática de dados**
- **Menu responsivo** com navegação suave
- **Drag & drop** para ranking de preferências
- **Exportação CSV** dos dados de inscrição

### 🚧 Futuro
- [ ] Multi-língue (6 idiomas)
- [ ] Sistema de car pooling
- [ ] Gráficos mais sofisticados no dashboard
- [ ] Download de partituras
- [ ] Integração com pagamento

## 🏗️ Arquitetura

- **Backend:** Google Apps Script
- **Frontend:** HTML/CSS/JavaScript vanilla
- **Banco de dados:** Google Sheets
- **Landing:** Netlify
- **Domínio:** camerata21.com

## 📁 Estrutura do Projeto

```
├── backend/
│   └── Code.gs              # Backend GAS: roteamento, gravação, logística, e-mails, OTP
├── frontend/
│   ├── index.html           # Landing institucional
│   ├── cadastro.html        # Formulário de inscrição (wizard)
│   └── admin.html           # Dashboard administrativo (login OTP)
├── reference/
│   ├── editais/              # PDFs de editais e regulamentos (Rouanet, Petrobras, Caixa)
│   └── branding/              # Brandkit e pesquisa de branding
├── assets/
│   └── fotos/                # Fotos institucionais (reserva para uso gráfico futuro)
├── docs/
│   ├── HANDOFF.md            # Documento técnico de handoff (arquitetura, planilha, pendências)
│   └── ARQUITETURA_E_ESCOPO.md
├── _redirects                # Redirecionamentos Netlify (aponta para o deployment GAS ativo)
└── README.md                 # Este arquivo
```

## 🚀 Guia de Deployment

### 1. Google Apps Script

1. Acesse o projeto GAS "Inscrições Camerata 21"
2. Cole o conteúdo de `backend/Code.gs` no `Code.gs` do editor
3. Cole `frontend/index.html`, `frontend/cadastro.html`, `frontend/admin.html` como arquivos HTML no mesmo projeto (nomes em minúsculas: `index`, `cadastro`, `admin`)
4. Publique → New deployment → Web app → Execute as: Me → Who has access: Anyone
5. Copie a nova URL

### 2. Netlify

1. Atualize `_redirects` com a nova URL, mantendo o formato:
   ```
   /inscricao   [NOVA_URL]/exec?page=cadastro   302
   /admin       [NOVA_URL]/exec?page=admin      302
   ```

### 3. Testes

- [ ] Fluxo completo de inscrição
- [ ] Dashboard admin
- [ ] Dispositivos móveis
- [ ] E-mails de confirmação

Para detalhes técnicos completos (estrutura da planilha, funções do backend, pendências conhecidas), veja `docs/HANDOFF.md`.

## 📊 Metas Orquestrais

| Instrumento | Meta | Atual |
|-------------|------|-------|
| Violino | 14 | - |
| Viola | 4 | - |
| Violoncelo | 4 | - |
| Contrabaixo | 2 | - |
| Flauta | 2 | - |
| Oboé | 2 | - |
| Clarinete | 2 | - |
| Fagote | 2 | - |
| Trompa | 2 | - |
| Trompete | 2 | - |
| Percussão | 1 | - |

**Total:** 37 músicos

## 🗓️ Cronograma

- **16/08/2026** - Ensaio aberto (UZP, 18h)
- **20/11/2026** - Concerto (Sala São Paulo)
- Semana de 20/11 - Ensaios finais

## 🎵 Repertório Confirmado

1. Sinfonia n.º 3 «Escocesa» — 1º mov. (Mendelssohn)
2. Sinfonia n.º 40, K. 550 — 1º mov. (Mozart)
3. Sinfonia n.º 5 — 1º mov. (Beethoven)
4. Concerto para Violino (Joseph Bologne, Chevalier de Saint-Georges)

## 🎨 Identidade Visual

- **Cores principais:** Meia-noite (#1F0A33), Farol (#FFB800), Ácido (#B2FF05)
- **Tipografia:** Fraunces + Space Grotesk
- **Estilo:** Elegante moderno, inspirado NuBank

## 👥 Equipe

- **João Rocha** - Regente e direção artística
- **Dr. José Vicente** - Reitor da UZP
- **Equipe técnica** - Desenvolvimento da plataforma

## 📧 Contato

- **E-mail:** contato@camerata21.com
- **Website:** https://camerata21.com

## 📄 Licença

[MIT License](LICENSE)

---

_"Música é a única universal. A música fala a todos nós, pois o ritmo e a harmonia residem em nós."_ — Pythagoras