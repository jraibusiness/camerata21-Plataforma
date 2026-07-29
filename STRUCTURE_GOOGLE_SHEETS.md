# Estrutura da Planilha Google Sheets - Camerata 21

## Passo 1: Criar a Planilha

1. Acesse [sheets.google.com](https://sheets.google.com)
2. Clique em "+ Em branco" para criar uma nova planilha
3. Nomeie a planilha como "Inscrições Camerata 21"

## Passo 2: Configurar as Abas

### Aba 1: Admins
Esta aba contém os e-mails dos administradores terão acesso ao dashboard.

| A | B | C |
|---|---|---|
| **Email** | **Nome** | **Tipo** |
| contato@camerata21.org | Admin Principal | Super |
| marcos@camerata21.org | Marcos Rossi | Admin |
| reitor@zumbi.br | Reitor Zumbi | Coordenador |

### Aba 2: Inscrições
Esta armazena todos os dados dos inscritos.

| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Timestamp** | **Nome Completo** | **E-mail** | **Telefone** | **Instrumento** | **Instrumento Adicional** | **Disp. Ensaio 1** | **Disp. Final** | **Disp. Semana** | **Material** | **Ranking Repertório** | **CEP** | **Transporte** | **Distância** | **Tempo** | **Custo Estimado** | **Status** |

### Aba 3: Partituras
Controle do status das partituras editadas.

| A | B | C | D | E | F |
|---|---|---|---|---|---|
| **Obra** | **Compositor** | **Status** | **Link** | **Última Atualização** | **Responsável** |
| Sinfonia n.º 5 | Beethoven | Em edição | | | |
| Concerto para piano | Tchaikovsky | Pendente | | | |

### Aba 4: Logística
Cálculos detalhados de distância e custos.

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| **ID Inscrição** | **Nome** | **CEP** | **Transporte** | **Distância (km)** | **Tempo (min)** | **Custo Estimado (R$)** | **Status Pagamento** |

### Aba 5: TempOTP
(OCULTA - Sistema de autenticação temporária)

| A | B | C |
|---|---|---|
| **Email** | **Código OTP** | **Expiração** |

## Passo 3: Copiar o ID da Planilha

1. Com a planilha aberta, copie o ID da URL:
   ```
   https://docs.google.com/spreadsheets/d/[ID_AQUI]/edit
   ```
2. O ID é a parte entre `/d/` e `/edit`

## Passo 4: Atualizar o Backend

1. Abra o arquivo `backend.gs`
2. Substitua a linha:
   ```javascript
   const SPREADSHEET_ID = "COLOQUE_AQUI_O_ID_DA_PLANILHA_GOOGLE";
   ```
   Pelo ID copiado:
   ```javascript
   const SPREADSHEET_ID = "1AbC123eFgH456IjK789LmN0pQ123rS4t";
   ```

## Passo 5: Configurar Permissões

### Permissões da Planilha
1. Clique em "Compartilhar" (canto superior direito)
2. Certifique-se de que o endereço de e-mail do projeto Google Apps Script tenha acesso
3. Defina como "Quem tiver o link" → "Visualizador" (pode ser alterado depois)

### Permissões do Google Apps Script
Ao implantar, o sistema pedirá permissões para:
- Acessar o Google Sheets
- Acessar o Gmail
- Acessar o Google Maps

## Passo 6: Criar a Aba TempOTP

1. Na planilha, clique em "+" para adicionar nova aba
2. Nomeie como "TempOTP" (esta aba será criada automaticamente pelo sistema, mas é bom criar manualmente primeiro)

## Modelo de Dados Iniciais

### Admins - Dados de Exemplo
```csv
Email,Nome,Tipo
contato@camerata21.org,Admin Principal,Super
marcos@camerata21.org,Marcos Rossi,Admin
reitor@zumbi.br,Reitor Zumbi,Coordenador
```

### Inscrições - Cabeçalho
```csv
Timestamp,Nome Completo,E-mail,Telefone,Instrumento,Instrumento Adicional,Disp. Ensaio 1,Disp. Final,Disp. Semana,Material,Ranking Repertório,CEP,Transporte,Distância,Tempo,Custo Estimado,Status
```

## Testar a Planilha

1. Verifique se todas as abas existem
2. Confirme o formato das colunas
3. Teste com alguns dados de exemplo
4. Valide se o backend consegue acessar cada aba

## Próximos Passos

1. Criar a planilha
2. Copiar o ID
3. Atualizar o backend.gs
4. Configurar permissões
5. Testar o formulário

Esta estrutura completa é essencial para o funcionamento do sistema de inscrições.