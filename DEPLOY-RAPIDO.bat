@echo off
echo ==========================================================
echo DEPLOY RÁPIDO - CAMERATA 21
echo ==========================================================
echo.
echo Passo 1: Atualizando arquivos locais...
echo.

xcopy "Code.gs.final" "Code.gs" /Y
echo ✓ Code.gs atualizado

echo.
echo Passo 2: Instruções para Google Apps Script...
echo.
echo 1. Acesse: https://script.google.com/u/0/home/projects/1Bggk25qYr4sd6qdIkiK2cTIqIMFqLnXtO0LDCveTRTwoofGKbXoZb7cQ
echo 2. Verifique se LOGO_UZP_B64 tem o base64 real do logo
echo 3. Publique → Nova versão
echo 4. Copie a nova URL
echo.

echo Passo 3: Atualize _redirects no Netlify...
echo.
echo /inscricao   [NOVA_URL]/exec?page=cadastro   302
echo /admin       [NOVA_URL]/exec?page=admin      302
echo.

echo Passo 4: Testes recomendados...
echo.
echo - Testar em mobile (menu, drag & drop, formulário)
echo - Validar e-mail de confirmação
echo - Verificar dashboard admin com OTP
echo - Checar planilha para novos registros
echo.

echo ==========================================================
echo DEPLOY CONCLUÍDO!
echo ==========================================================
echo.
echo Abra: https://camerata21.com
echo.
pause