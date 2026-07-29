@echo off
echo Configurando Git...

cd /d "C:\Users\elisa\OneDrive\Área de Trabalho\Camerata 21\C21"

"C:\Program Files\Git\bin\git.exe" config user.name "João Rocha"
"C:\Program Files\Git\bin\git.exe" config user.email "joao.rocha@studiokephra.org"

echo Git configurado com sucesso!
pause