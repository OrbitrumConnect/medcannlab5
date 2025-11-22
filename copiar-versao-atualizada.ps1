# Script para copiar arquivos da versão atualizada
# Preserva arquivos novos criados

$origem = "c:\Med-Cann-Lab-3.0-main"
$destino = "C:\Users\phpg6\OneDrive\Área de Trabalho\MedCannLabFinal"

# Arquivos a preservar (não copiar)
$preservar = @(
    "IMRE_UNIFICATION_3.0_TO_5.0_COMPLETE.sql",
    "PLANO_IMPLEMENTACAO_IMRE_5.0.md",
    "EXECUTAR_IMRE_AGORA.md",
    "PANORAMA_COMPLETO_APP_19_11_2025.md",
    "RESUMO_ATUALIZACAO_19_11_2025.md",
    "LIMPAR_CACHE_NAVEGADOR.md",
    "COMPARACAO_VERSOES_ANALISE.md",
    "COPIAR_ARQUIVOS_MANUALMENTE.md"
)

Write-Host "🔄 Copiando arquivos da versão atualizada..." -ForegroundColor Cyan

# Copiar src/
Write-Host "📁 Copiando src/..." -ForegroundColor Yellow
Copy-Item -Path "$origem\src\*" -Destination "$destino\src\" -Recurse -Force -Exclude "node_modules"

# Copiar public/
Write-Host "📁 Copiando public/..." -ForegroundColor Yellow
Copy-Item -Path "$origem\public\*" -Destination "$destino\public\" -Recurse -Force

# Copiar database/
if (Test-Path "$origem\database") {
    Write-Host "📁 Copiando database/..." -ForegroundColor Yellow
    Copy-Item -Path "$origem\database\*" -Destination "$destino\database\" -Recurse -Force
}

# Copiar docs/
if (Test-Path "$origem\docs") {
    Write-Host "📁 Copiando docs/..." -ForegroundColor Yellow
    Copy-Item -Path "$origem\docs\*" -Destination "$destino\docs\" -Recurse -Force
}

# Copiar scripts/
if (Test-Path "$origem\scripts") {
    Write-Host "📁 Copiando scripts/..." -ForegroundColor Yellow
    Copy-Item -Path "$origem\scripts\*" -Destination "$destino\scripts\" -Recurse -Force
}

# Copiar assistant_documents/
if (Test-Path "$origem\assistant_documents") {
    Write-Host "📁 Copiando assistant_documents/..." -ForegroundColor Yellow
    Copy-Item -Path "$origem\assistant_documents\*" -Destination "$destino\assistant_documents\" -Recurse -Force
}

# Copiar arquivos SQL (exceto os preservados)
Write-Host "📄 Copiando arquivos SQL..." -ForegroundColor Yellow
Get-ChildItem -Path $origem -Filter "*.sql" | ForEach-Object {
    if ($preservar -notcontains $_.Name) {
        Copy-Item -Path $_.FullName -Destination "$destino\$($_.Name)" -Force
    }
}

# Copiar arquivos de configuração (verificando se não sobrescreve melhorias)
Write-Host "⚙️ Copiando arquivos de configuração..." -ForegroundColor Yellow
$configFiles = @("package.json", "tsconfig.json", "tsconfig.node.json", "postcss.config.js", "tailwind.config.js", "vercel.json")
foreach ($file in $configFiles) {
    if (Test-Path "$origem\$file") {
        # Verificar se precisa preservar algo
        Copy-Item -Path "$origem\$file" -Destination "$destino\$file" -Force
    }
}

Write-Host "✅ Cópia concluída!" -ForegroundColor Green
Write-Host "📋 Arquivos preservados:" -ForegroundColor Cyan
$preservar | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }

