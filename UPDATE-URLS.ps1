# ==========================================================
# ATUALIZAR URLS - CAMERATA 21
# Script simples para atualizar _redirects com nova URL do GAS
# ==========================================================

# Configurações
$RedirectsFile = "_redirects"
$NewUrl = Read-Host "Cole a nova URL do Google Apps Script (Web App)"

# Validar URL
if ($NewUrl -notmatch "^https://script\.google\.com/macros/s/") {
    Write-Host "❌ URL inválida! Deve ser do tipo https://script.google.com/macros/s/..." -ForegroundColor Red
    exit 1
}

# Criar novo conteúdo
$newContent = @"
/inscricao   $NewUrl/exec?page=cadastro   302
/admin       $NewUrl/exec?page=admin      302
"@

# Salvar arquivo
Set-Content -Path $RedirectsFile -Value $newContent

Write-Host "✅ _redirects atualizado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:"
Write-Host "1. Publique o Code.gs no Google Apps Script"
Write-Host "2. Faça upload dos arquivos no Netlify"
Write-Host "3. Teste em: https://camerata21.com"
Write-Host ""
Read-Host "Pressione Enter para abrir a plataforma..."
Start-Process "https://camerata21.com"