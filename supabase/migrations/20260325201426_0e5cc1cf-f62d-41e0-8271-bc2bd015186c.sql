-- Mark real documents as curated (non-slides)
UPDATE documents SET is_curated = TRUE WHERE category IN ('research', 'protocols', 'multimedia', 'cases', 'protocolo_clinico', 'ai-documents');

-- Remove one duplicate Nascimento_Noa_Esperanza.pdf (keep the newest)
DELETE FROM documents WHERE id = 'eca2dbd5-c7dc-4878-a332-4a0fbb49e642';