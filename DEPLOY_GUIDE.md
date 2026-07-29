# 🚀 Guia de Deployment - Camerata 21

## Passo 1: Atualizar Google Apps Script

### 1.1 Acessar o GAS
- URL: https://script.google.com/u/0/home/projects/1Bggk25qYr4sd6qdIkiK2cTIqIMFqLnXtO0LDCveTRTwoofGKbXoZb7cQ
- Selecione o arquivo `Code.gs`

### 1.2 Substituir código completo
Copie todo o conteúdo do arquivo `Código C21.md` e substitua o conteúdo do `Code.gs`.

### 1.3 Adicionar logo UZP
Procure pela linha:
```javascript
const LOGO_UZP_B64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
```

**IMPORTANTE:** Substituir pelo base64 real do logo da UZP. Atualmente está um placeholder.

### 1.4 Publicar
1. Clique em **Deploy** > **New deployment**
2. Selecione **Web app**
3. **Execute as**: Me
4. **Who has access**: Anyone
5. Clique em **Deploy**
6. Copiar a nova URL do Web App

### 1.5 Atualizar implantação existente
1. Vá em **Deploy** > **Manage deployments**
2. Selecione a implantação existente
3. Clique no lápis ✏️ ao lado
4. Clique em **New version**
5. Salve a nova URL

## Passo 2: Atualizar Netlify

### 2.1 Atualizar _redirects
Substituir o conteúdo do arquivo `_redirects` pela nova URL do GAS:

```
/inscricao   [NOVA_URL_GAS]/exec?page=cadastro   302
/admin       [NOVA_URL_GAS]/exec?page=admin      302
```

### 2.2 Deploy no Netlify
1. Fazer upload dos arquivos atualizados:
   - `frontend/index.html`
   - `frontend/cadastro.html`
   - `frontend/admin.html`
   - `_redirects`

## Passo 3: Testes obrigatórios

### 3.1 Fluxo completo
1. Acessar `camerata21.com`
2. Clicar em "Inscrição"
3. Preencher formulário completo
4. Verificar e-mail de confirmação
5. Acessar dashboard admin

### 3.2 Testes mobile
- Menu hamburguer
- Drag & drop no ranking
- Botão voltar à homepage
- Formulário responsivo

### 3.3 Dashboard admin
- Login com OTP
- Visualização de dados
- Exportação CSV

## Passo 4: Configuração pós-deployment

### 4.1 Adicionar Dr. José Vicente
No GAS, executar `setupPlanilha()` novamente para adicionar seu email na aba Admins.

### 4.2 Confirmar destino UZP
Verificar se o endereço `Av. Santos Dumont, 843` está correto.

### 4.3 Metas por naipe
Validar se as metas no Code.gs correspondem às necessidades reais.

## URLs Importantes

- **Plataforma:** camerata21.com
- **GAS:** https://script.google.com/u/0/home/projects/1Bggk25qYr4sd6qdIkiK2cTIqIMFqLnXtO0LDCveTRTwoofGKbXoZb7cQ
- **Planilha:** https://docs.google.com/spreadsheets/d/1T7zvDl_w8irOdk8VeIz2iMKlEO94Dv6G8_cHwTQSWSg/edit

## Checklist Final

- [ ] Code.gs atualizado
- [ ] Logo UZP adicionado
- [ ] Nova URL do GAS copiada
- [ ] _redirects atualizado
- [ ] Netlify deployado
- [ ] Fluxo de inscrição testado
- [ ] Dashboard admin testado
- [ ] Mobile testado
- [ ] Dr. José Vicente adicionado
- [ ] Destino UZP confirmado