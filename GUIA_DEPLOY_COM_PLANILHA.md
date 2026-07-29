# 🚀 Guia de Deploy - Com sua planilha já criada!

## ✅ Passo 1: Preparar a Planilha (Já acessível via link)

Acesse: https://docs.google.com/spreadsheets/d/1T7zvDl_w8irOdk8VeIz2iMKlEO94Dv6G8_cHwTQSWSg/edit?usp=sharing

### 1.1 Verificar e criar as abas necessárias
Crie estas 5 abas na planilha:

#### Aba: **Admins**
| A | B | C |
|---|---|---|
| **Email** | **Nome** | **Tipo** |
| seu-email@exemplo.com | Seu Nome | Super |

#### Aba: **Inscrições**
| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Timestamp | Nome Completo | E-mail | Telefone | Instrumento | Instrumento Adicional | Disp. Ensaio 1 | Disp. Final | Disp. Semana | Material | Ranking Repertório | CEP | Transporte | Distância | Tempo | Custo Estimado | Status |

#### Aba: **Partituras**
| A | B | C | D | E | F |
|---|---|---|---|---|---|
| Obra | Compositor | Status | Link | Última Atualização | Responsável |

#### Aba: **Logística**
| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| ID Inscrição | Nome | CEP | Transporte | Distância (km) | Tempo (min) | Custo Estimado (R$) | Status Pagamento |

#### Aba: **TempOTP** (Pode deixar oculta)
| A | B | C |
|---|---|---|
| Email | Código OTP | Expiração |

### 1.2 Compartilhar a planilha
- Clique em "Compartilhar" (canto superior direito)
- Certifique-se de que o endereço do Google Apps Script terá acesso
- Pode manter como "Quem tiver o link" → "Visualizador"

---

## ✅ Passo 2: Configurar o Google Apps Script

### 2.1 Criar o projeto
1. Acesse [script.google.com](https://script.google.com)
2. Clique em "**Novo projeto**"
3. Delete o conteúdo padrão (`function myFunction() {}`)

### 2.2 Colar o código backend
1. Copie TODO o conteúdo do arquivo `backend.gs`
2. Cole no editor do Apps Script
3. ✅ **O ID da planilha já está configurado!**

### 2.3 Habilitar as APIs
1. No menu esquerdo, clique em "**Serviços**"
2. Clique em "**+ Adicionar um serviço**"
3. Adicione estes serviços:
   - **Google Maps API** ✅
   - **Gmail API** ✅
   - **Google Drive API** ✅

### 2.4 Salvar o projeto
- Clique no ícone de disquete "**Salvar projeto**"

---

## ✅ Passo 3: Implantar como Web App

### 3.1 Fazer o primeiro deploy
1. No menu, clique em "**Implantar**" → "**Novo implante**"
2. Configure:
   - **Descrição do implante**: "Camerata 21 Web App"
   - **Executar como**: "Me"
   - **Acesso quem possui o app**: "**Qualquer pessoa, mesmo não conectada ao Google**"
3. Clique em "**Implantar**"

### 3.2 Autorizar o projeto
1. Na primeira execução, pedirá autorização
2. Clique em "**Revisar permissões**"
3. Escolha sua conta Google
4. Clique em "**Avançado**" → "**Acessar [nome do projeto] (não seguro)**"
5. Clique em "**Permitir**"

### 3.3 Copiar a URL
- Após o deploy, copie a URL fornecida (ex: `https://script.google.com/macros/s/ABC123/exec`)

---

## ✅ Passo 4: Configurar os Frontends

### 4.1 Atualizar o formulário
1. Abra o arquivo `frontend/cadastro.html`
2. Procure por:
   ```javascript
   const DEPLOYMENT_URL = "https://script.google.com/...";
   ```
3. Substitua pela URL que você copiou no passo 3.3

### 4.2 Testar o sistema
1. Abra o formulário `frontend/cadastro.html` no navegador
2. Preencha um teste completo
3. Verifique se:
   - Os dados aparecem na planilha (aba "Inscrições")
   - Você recebe o e-mail de confirmação
   - Os administradores são notificados

---

## 🐛 Solução de Problemas

### Problema: "Não é possível acessar a planilha"
- Verifique se a planilha está compartilhada corretamente
- Verifique o ID está correto no backend.gs

### Problema: "API não habilitada"
- Vá em "Serviços" e adicione a API faltante
- Talvez precise ativar no [Google Cloud Console](https://console.cloud.google.com/)

### Problema: "Erro de execução"
- Verifique o console de erros no Apps Script (menu "Execuções")
- Leia a mensagem de erro para entender o problema

---

## ✅ Checklist Final

- [ ] Planilha com 5 abas criadas
- [ ] Apps Script criado com backend.gs
- [ ] 3 APIs habilitadas
- [ ] Web App implantado
- [ ] URL copiada e atualizada no frontend
- [ ] Teste de inscrição realizado com sucesso

🎉 **Pronto! Sua plataforma Camerata 21 está funcionando!**

---

*Última atualização: 17/07/2026*
*ID da planilha: 1T7zvDl_w8irOdk8VeIz2iMKlEO94Dv6G8_cHwTQSWSg*