# ✅ Checklist de Deploy - Camerata 21

Use este checklist para acompanhar seu progresso no deploy do projeto.

## 📋 Fase 1: Preparação

### [ ] 1. Criar a Planilha Google Sheets
- [ ] Acessar sheets.google.com
- [ ] Criar nova planilha em branco
- [ ] Nomear como "Inscrições Camerata 21"
- [ ] Criar as 5 abas necessárias
- [ ] Preencher aba Admins com dados iniciais
- [ ] Copiar o ID da planilha

### [ ] 2. Configurar o Google Apps Script
- [ ] Acessar script.google.com
- [ ] Criar novo projeto
- [ ] Colar conteúdo do backend.gs
- [ ] Substituir SPREADSHEET_ID
- [ ] Habilitar as 3 APIs necessárias
- [ ] Salvar o projeto

## 🚀 Fase 2: Implantação

### [ ] 3. Implementar como Web App
- [ ] Acessar menu "Implantar" → "Novo implante"
- [ ] Configurar descrição: "Camerata 21 Web App"
- [ ] Definir "Executar como": "Me"
- [ ] Definir "Acesso": "Qualquer pessoa, mesmo não conectada ao Google"
- [ ] Clicar em "Implantar"
- [ ] Copiar a URL de deploy

### [ ] 4. Atualizar Frontends
- [ ] Abrir frontend/cadastro.html
- [ ] Substituir DEPLOYMENT_URL
- [ ] Salvar o arquivo
- [ ] (Opcional) Hospedar em servidor estático

## 🧪 Fase 3: Testes

### [ ] 5. Testar Integração
- [ ] Abrir o formulário de cadastro
- [ ] Preencher um teste completo
- [ ] Verificar dados na planilha
- [ ] Confirmar recebimento de e-mail
- [ ] Testar dashboard admin (com OTP)

## 🎯 Fase 4: Validação Final

### [ ] 6. Verificar Funcionalidades
- [ ] [ ] Formulário wizard funciona
- [ ] [ ] Validação de campos
- [ ] [ ] Cálculo de distância/tempo
- [ ] [ ] Envio de e-mails
- [ ] [ ] Dashboard admin acessível
- [ ] [ ] Sistema OTP funcionando

## 📝 Registros

### 📝 Dados Importantes (Preencha aqui)
```
ID da Planilha: __________________________
URL do Web App: __________________________
E-mail do Admin: _________________________
Data do Deploy: _________________________
```

### 🐩 Relatório de Testes
```
Teste de formulário:
✅ / ✅ / ✅ / ✅ / ✅

Problemas encontrados:
__________________________________________________
__________________________________________________

Soluções aplicadas:
__________________________________________________
__________________________________________________
```

## 📞 Suporte

Se encontrar algum problema:
1. Verifique o checklist de erros comuns
2. Consulte o arquivo DEPLOY_INSTRUCTIONS.md
3. Revise as permissões do Google Cloud
4. Teste em modo de depuração no GAS

## 🎉 Conclusão

[ ] Todos os passos concluídos
[ ] Sistema funcionando 100%
[ ] Pronto para lançamento oficial!

---
*Última atualização: 17/07/2026*
*Versão: 1.0*