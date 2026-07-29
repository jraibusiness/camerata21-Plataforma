# ==========================================================
# SCRIPT DEPLOY AUTOMATICO - CAMERATA 21
# PowerShell v7+ necessário
# ==========================================================

param(
    [string]$NewUrl = "",
    [switch]$TestOnly = $false,
    [switch]$BackupFirst = $false
)

# Configurações
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ProjectPath = $ScriptPath
$CodeGsFile = Join-Path $ProjectPath "Code.gs"
$CodeGsFinalFile = Join-Path $ProjectPath "Code.gs.final"
$RedirectsFile = Join-Path $ProjectPath "_redirects"
$BackupDir = Join-Path $ProjectPath "backups"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# Cores para output
$ColorSuccess = [System.ConsoleColor]::Green
$ColorError = [System.ConsoleColor]::Red
$ColorWarning = [System.ConsoleColor]::Yellow
$ColorInfo = [System.ConsoleColor]::Cyan

function Write-Log {
    param([string]$Message, [System.ConsoleColor]$Color = $ColorInfo)
    Write-Host $Message -ForegroundColor $Color
}

function Test-Connection {
    param([string]$Url)
    try {
        $response = Invoke-WebRequest -Uri $Url -Method Head -TimeoutSec 10
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

# Criar backup se necessário
if ($BackupFirst) {
    Write-Log "Criando backup dos arquivos..." $ColorInfo
    if (!(Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir | Out-Null
    }

    Copy-Item $CodeGsFile -Destination (Join-Path $BackupDir "Code.gs_$timestamp.bak") -Force
    Copy-Item $RedirectsFile -Destination (Join-Path $BackupDir "_redirects_$timestamp.bak") -Force
    Write-Log "Backup criado em: $BackupDir" $ColorSuccess
}

# Verificar arquivos necessários
Write-Log "Verificando arquivos necessários..." $ColorInfo

if (!(Test-Path $CodeGsFinalFile)) {
    Write-Log "ERRO: Arquivo Code.gs.final não encontrado!" $ColorError
    exit 1
}

if (!(Test-Path $RedirectsFile)) {
    Write-Log "ERRO: Arquivo _redirects não encontrado!" $ColorError
    exit 1
}

# Se modo teste, apenas verificar URLs
if ($TestOnly) {
    Write-Log "MODO TESTE - Verificando URLs existentes..." $ColorWarning

    # Ler _redirects atual
    $currentRedirects = Get-Content $RedirectsFile
    Write-Log "Redirecionamentos atuais:" $ColorInfo
    Write-Log $currentRedirects $ColorInfo

    # Testar se as URLs atuais respondem
    foreach ($line in $currentRedirects) {
        if ($line -match "^/(\w+)\s+(.+?)\s+(\d+)$") {
            $path = $matches[1]
            $url = $matches[2]
            $status = $matches[3]

            Write-Log "Testando: $path -> $url" $ColorInfo

            if (Test-Connection $url) {
                Write-Log "  ✅ OK" $ColorSuccess
            } else {
                Write-Log "  ❌ ERRO" $ColorError
            }
        }
    }
    exit
}

# Se não foi fornecida nova URL, pedir ao usuário
if ([string]::IsNullOrEmpty($NewUrl)) {
    Write-Log "URL do novo Google Apps Script:" $ColorInfo
    $NewUrl = Read-Host "Cole a URL do Web App aqui"

    if ([string]::IsNullOrEmpty($NewUrl)) {
        Write-Log "ERRO: URL não pode ser vazia!" $ColorError
        exit 1
    }
}

# Validar URL
if ($NewUrl -notmatch "^https://script\.google\.com/macros/s/") {
    Write-Log "AVISO: A URL parece não ser do Google Apps Script." $ColorWarning
    $continue = Read-Host "Contin mesmo assim? (s/n)"
    if ($continue -ne "s") {
        exit
    }
}

# Testar nova URL
Write-Log "Testando nova URL..." $ColorInfo
if (Test-Connection "$NewUrl/exec?page=home") {
    Write-Log "✅ Nova URL respondendo corretamente!" $ColorSuccess
} else {
    Write-Log "❌ Nova URL não respondeu!" $ColorError
    $continue = Read-Host "Continuar mesmo assim? (s/n)"
    if ($continue -ne "s") {
        exit
    }
}

# Atualizar Code.gs se necessário
Write-Log "Verificando se Code.gs precisa ser atualizado..." $ColorInfo

$codeGsContent = Get-Content $CodeGsFile -Raw
$codeGsFinalContent = Get-Content $CodeGsFinalFile -Raw

if ($codeGsContent -eq $codeGsFinalContent) {
    Write-Log "✅ Code.gs já está atualizado." $ColorSuccess
} else {
    Write-Log "Atualizando Code.gs..." $ColorWarning
    Set-Content -Path $CodeGsFile -Value $codeGsFinalContent -Force
    Write-Log "✅ Code.gs atualizado!" $ColorSuccess
}

# Atualizar _redirects
Write-Log "Atualizando _redirects..." $ColorInfo

$newRedirects = @"
/inscricao   $NewUrl/exec?page=cadastro   302
/admin       $NewUrl/exec?page=admin      302
"@

Set-Content -Path $RedirectsFile -Value $newRedirects -Force
Write-Log "✅ _redirects atualizado!" $ColorSuccess

# Verificar se o logo UZP é o placeholder
Write-Log "Verificando logo UZP..." $ColorInfo
$logoLine = Select-String -Path $CodeGsFile -Pattern "const LOGO_UZP_B64" -SimpleMatch
if ($logoLine -match '"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5\+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="') {
    Write-Log "⚠️  Logo UZP ainda é placeholder!" $ColorWarning
    Write-Log "Lembre-se de substituir o placeholder pelo base64 real do logo da UZP" $ColorWarning
} else {
    Write-Log "✅ Logo UZP parece ser personalizado." $ColorSuccess
}

# Mostrar resumo
Write-Log ""
Write-Log "========================================================" $ColorSuccess
Write-Log "DEPLOY PREPARADO! ✅" $ColorSuccess
Write-Log "========================================================" $ColorSuccess
Write-Log ""
Write-Log "Próximos passos:" $ColorInfo
Write-Log "1. Publique o Code.gs no Google Apps Script" $ColorInfo
Write-Log "   - Acesse: https://script.google.com/u/0/home/projects/1Bggk25qYr4sd6qdIkiK2cTIqIMFqLnXtO0LDCveTRTwoofGKbXoZb7cQ" $ColorInfo
Write-Log "   - Publique → New deployment → Web app" $ColorInfo
Write-Log "   - Copie a nova URL (já deve ser: $NewUrl)" $ColorInfo
Write-Log ""
Write-Log "2. Atualize o Netlify com os arquivos:" $ColorInfo
Write-Log "   - $ProjectPath\frontend\*.html" $ColorInfo
Write-Log "   - $ProjectPath\_redirects" $ColorInfo
Write-Log ""
Write-Log "3. Testes obrigatórios:" $ColorInfo
Write-Log "   - https://camerata21.com" $ColorInfo
Write-Log "   - Fluxo completo de inscrição" $ColorInfo
Write-Log "   - Dashboard admin com OTP" $ColorInfo
Write-Log "   - Responsividade mobile" $ColorInfo
Write-Log ""
Write-Log "4. Adicione Dr. José Vicente como admin:" $ColorInfo
Write-Log "   - Execute setupPlanilha() no GAS" $ColorInfo
Write-Log ""
Write-Log "Lembre-se de substituir o logo UZP se ainda for placeholder!" $ColorWarning
Write-Log ""
Write-Log "Pressione Enter para abrir a plataforma..."
Read-Host
Start-Process "https://camerata21.com"