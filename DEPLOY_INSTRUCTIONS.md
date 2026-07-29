# Instruções de Deploy - Google Apps Script

## 🚀 Guia Completo para Configurar e Implantar o Projeto

### Passo 1: Criar a Planilha (Google Sheets)

1. Acesse [sheets.google.com](https://sheets.google.com)
2. Clique em "**+ Em branco**"
3. Nomeie: "**Inscrições Camerata 21**"
4. Crie 5 abas:
   - **Admins**
   - **Inscrições** 
   - **Partituras**
   - **Logística**
   - **TempOTP**

5. Preencha a aba **Admins** com:
   ```
   Email,Nome,Tipo
   seu-email@exemplo.com,Seu Nome,Super
   ```

6. Copie o ID da planilha da URL (ex: `1AbC123eFgH456IjK789LmN0pQ123rS4t`)

### Passo 2: Criar o Google Apps Script

1. Acesse [script.google.com](https://script.google.com)
2. Clique em "**Novo projeto**"
3. Delete o conteúdo padrão (`function myFunction() {}`)
4. Copie TODO o conteúdo do arquivo `backend.gs` e cole no editor

### Passo 3: Configurar o Script

1. Substitua esta linha no código:
   ```javascript
   const SPREADSHEET_ID = "COLOQUE_AQUI_O_ID_DA_PLANILHA_GOOGLE";
   ```
   Pelo ID que você copiou:
   ```javascript
   const SPREADSHEET_ID = "1AbC123eFgH456IjK789LmN0pQ123rS4t";
   ```

### Passo 4: Habilitar as APIs

1. No menu esquerdo, clique em "**Serviços**"
2. Clique em "**+ Adicionar um serviço**"
3. Adicione estes serviços:
   - **Google Maps API**
   - **Gmail API**
   - **Google Drive API**

### Passo 5: Salvar e Testar

1. Clique em "**Salvar projeto**" (ícone de disquete)
2. Aguarde alguns segundos para salvar
3. Teste se o script funciona clicando em "**Executar**"

### Passo 6: Autorizar o Projeto

1. Na primeira execução, pedirá autorização
2. Clique em "**Revisar permissões**"
3. Escolha sua conta Google
4. Clique em "**Avançado**" → "**Acessar [nome do projeto] (não seguro)**"
5. Clique em "**Permitir**"

### Passo 7: Implementar como Web App

1. No menu, clique em "**Implantar**" → "**Novo implante**"
2. Configurações:
   - **Descrição do implante**: "Camerata 21 Web App"
   - **Executar como**: "Me"
   - **Acesso quem possui o app**: "**Qualquer pessoa, mesmo não conectada ao Google**"
3. Clique em "**Implantar**"
4. Copie a URL fornecida

### Passo 8: Atualizar os Frontends

1. Abra o arquivo `frontend/cadastro.html`
2. Substitua:
   ```javascript
   const DEPLOYMENT_URL = "https://script.google.com/...";
   ```
   Pela URL que você acabou de copiar

### Passo 9: Configurar as URLs

1. No Gas, clique em "**Configurações do projeto**" (engrenagem)
2. Copie o ID do projeto (ex: `1AbC123eFgH456IjK789LmN0pQ`)
3. Atualize no arquivo `confirmationEmail.html` (se necessário)

### Passo 10: Testar o Sistema Completo

1. Abra o formulário: `frontend/cadastro.html`
2. Preencha um teste completo
3. Verifique se:
   - Os dados aparecem na planilha
   - Você recebe o e-mail de confirmação
   - Os administradores são notificados

## 🐛 Solução de Problemas Comuns

### Problema: "Não é possível acessar a planilha"
- Verifique se o ID está correto
- Verifique as permissões da planilha
- Certifique-se de que você é o proprietário

### Problema: "API do Google Maps não está habilitada"
- Vá em Serviços e adicione "Google Maps API"
- Talvez precise ativar no [Google Cloud Console](https://console.cloud.google.com/)

### Problema: "E-mail não enviado"
- Verifique se o Gmail API está habilitado
- Verifique a caixa de spam
- Teste manualmente com MailApp.sendEmail

### Problema: "Erro de autenticação"
- Re-implemente o web app
- Verifique as configurações de acesso
- Limpe o cache do navegador

## 📋 Checklist Final

- [ ] Planilha criada com 5 abas
- [ ] ID da planilha copiado e colocado no código
- [ ] APIs habilitadas (Maps, Gmail, Drive)
- [ ] Web App implantado com acesso público
- [ ] URLs atualizadas nos frontends
- [ ] Teste de inscrição realizado
- [ ] E-mail de confirmação recebido
- [ ] Dashboard acessível (com OTP)

## 🎉 Pronto para Usar!

Após seguir todos esses passos, sua plataforma Camerata 21 estará funcionando e pronta para receber inscrições!

## 🔗 Links Úteis

- [Documentação Google Apps Script](https://developers.google.com/apps-script)
- [Google Maps API](https://developers.google.com/maps)
- [Guia de Web Apps](https://developers.google.com/apps-script/guides/webapps)