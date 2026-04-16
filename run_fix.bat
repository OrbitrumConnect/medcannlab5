@echo off
echo Running SQL Fix...
npx supabase db query "ALTER TABLE clinical_reports DROP CONSTRAINT IF EXISTS clinical_reports_status_check; ALTER TABLE clinical_reports ADD CONSTRAINT clinical_reports_status_check CHECK (status IN ('generated', 'completed', 'shared', 'initial_assessment', 'nft_minted', 'saved_to_records', 'pending', 'active'));"
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao executar SQL.
) else (
    echo [SUCESSO] SQL executado com sucesso!
)
pause
