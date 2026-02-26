-- Migração para corrigir erro de coluna numero_orcamento nula e garantir novos campos
DO $$ 
BEGIN
    -- 1. Se existir a coluna numero_orcamento (que está causando erro de NOT NULL e não é usada pelo código), 
    -- removemos a restrição de NOT NULL.
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orcamentos' AND column_name='numero_orcamento') THEN
        ALTER TABLE public.orcamentos ALTER COLUMN numero_orcamento DROP NOT NULL;
    END IF;

    -- 2. Garantir que as novas colunas existam (repetindo por segurança caso migrações anteriores tenham falhado)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orcamentos' AND column_name='numero_manual') THEN
        ALTER TABLE public.orcamentos ADD COLUMN numero_manual TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orcamentos' AND column_name='endereco_entrega') THEN
        ALTER TABLE public.orcamentos ADD COLUMN endereco_entrega TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orcamentos' AND column_name='descricao_servico') THEN
        ALTER TABLE public.orcamentos ADD COLUMN descricao_servico TEXT;
    END IF;

END $$;

-- 3. Recarregar o schema do PostgREST
NOTIFY pgrst, 'reload schema';
