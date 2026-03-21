-- Adicionar coluna vendedor_nome e migrar dados existentes
ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS vendedor_nome TEXT;

-- Migrar dados de vendedor_id (UUID) para vendedor_nome (TEXT) usando a tabela profiles
UPDATE orcamentos o
SET vendedor_nome = p.full_name
FROM profiles p
WHERE o.vendedor_id = p.id
AND o.vendedor_nome IS NULL;

-- Remover a FK e a coluna vendedor_id antiga
ALTER TABLE orcamentos DROP COLUMN IF EXISTS vendedor_id;
