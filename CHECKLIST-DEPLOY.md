# CHECKLIST DEPLOY - CAMERATA 21
> Versão 1.0 - 20/07/2026

## ✅ ARQUIVOS PRONTOS
- [x] `Code.gs` - Atualizado com todas as funcionalidades
- [x] `Code.gs.final` - Versão final de backup
- [x] `frontend/index.html` - Landing institucional
- [x] `frontend/cadastro.html` - Formulário responsivo
- [x] `frontend/admin.html` - Dashboard administrativo
- [x] `_redirects` - Redirecionamentos configurados
- [x] Script de deploy automático criado

## 🚀 PASSO 1: GOOGLE APPS SCRIPT

### Acessar o projeto
- URL: https://script.google.com/u/0/home/projects/1Bggk25qYr4sd6qdIkiK2cTIqIMFqLnXtO0LDCveTRTwoofGKbXoZb7cQ

### Verificar se Code.gs está atualizado
- [ ] Código já está atualizado (mesmo tamanho que Code.gs.final)

### Importante: Logo UZP
- [ ] Substituir placeholder na linha 13 de Code.gs:
  ```javascript
  const LOGO_UZP_B64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
  ```

### Publicar novo deployment
1. Clique em **Deploy** > **New deployment**
2. Selecione **Web app**
3. **Execute as**: Me
4. **Who has access**: Anyone
5. Clique em **Deploy**
6. **Copie a nova URL**

## 🌐 PASSO 2: NETFLY

### Atualizar _redirects
- [ ] Executar `UPDATE-URLS.ps1` e colar a nova URL
- [ ] Ou editar manualmente `_redirects`:
  ```
  /inscricao   [NOVA_URL]/exec?page=cadastro   302
  /admin       [NOVA_URL]/exec?page=admin      302
  ```

### Upload dos arquivos
- [ ] `frontend/index.html`
- [ ] `frontend/cadastro.html`  
- [ ] `frontend/admin.html`
- [ ] `_redirects`

## 🧪 PASSO 3: TESTES OBRIGATÓRIOS

### Testar fluxo completo
- [ ] Acessar: https://camerata21.com
- [ ] Clicar em "Inscrição"
- [ ] Preencher formulário completo
- [ ] Verificar e-mail de confirmação
- [ ] Acessar área administrativa

### Testes mobile
- [ ] Menu hamburguer funciona
- [ ] Drag & drop no ranking mobile
- [ ] Formulário responsivo
- [ ] Touch targets adequados

### Dashboard admin
- [ ] Login com OTP
- [ ] Visualização de estatísticas
- [ ] Exportação CSV

## 📝 PASSO 4: CONFIGURAÇÃO FINAL

### Adicionar Dr. José Vicente como admin
- [ ] Executar `setupPlanilha()` no GAS
- [ ] Verificar se email foi adicionado na aba "Admins"

### Confirmar configurações
- [ ] Endereço UZP correto: Av. Santos Dumont, 843
- [ ] Metas de instrumentos atualizadas
- [ ] Repertório confirmado

## 🎯 ESTADO ATUAL
- **Status**: ✅ Pronta para deploy
- **Última atualização**: 20/07/2026
- **Próximo passo**: Publicar no GAS e atualizar Netlify

---
*Se encontrar qualquer problema durante os testes, verificar console do navegador e logs do Google Apps Script.*