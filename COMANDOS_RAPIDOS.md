# Comandos Rápidos - Deploy Camerata 21

## 🚀 Checklist Rápido

### 1. Planilha ✅ (ID já configurado)
```bash
# Acesse a planilha:
https://docs.google.com/spreadsheets/d/1T7zvDl_w8irOdk8VeIz2iMKlEO94Dv6G8_cHwTQSWSg/edit

# Crie 5 abas:
1. Admins
2. Inscrições  
3. Partituras
4. Logística
5. TempOTP
```

### 2. Google Apps Script
```bash
# Acesse:
script.google.com

# Crie novo projeto

# Cole backend.gs (já com ID correto!)

# Adicione serviços:
- Google Maps API
- Gmail API  
- Google Drive API
```

### 3. Deploy Web App
```bash
# Configurações do deploy:
- Descrição: "Camerata 21 Web App"
- Executar como: "Me"
- Acesso: "Qualquer pessoa, mesmo não conectada ao Google"
```

### 4. Atualizar Frontend
```bash
# No arquivo frontend/cadastro.html:
const DEPLOYMENT_URL = "URL_DO_WEB_APP";
```

---

## 📞 Se precisar de ajuda:

1. **Verifique erros** no menu "Execuções" do GAS
2. **Permissões** devem ser concedidas na primeira autorização
3. **URL pública** do Web App é essencial para o frontend

---

## ✅ Status: Pronto para deploy!

O backend.gs já está configurado com o ID correto da sua planilha. Basta seguir os passos acima! 🎉