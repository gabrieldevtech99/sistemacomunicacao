-- Migration to fix budget deletion constraints
-- Sets foreign keys to ON DELETE SET NULL instead of RESTRICT

DO $$ 
BEGIN
    -- 1. Fix pedidos_producao relationship to orcamentos
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'pedidos_producao_orcamento_id_fkey' 
        AND table_name = 'pedidos_producao'
    ) THEN
        ALTER TABLE public.pedidos_producao DROP CONSTRAINT pedidos_producao_orcamento_id_fkey;
    END IF;

    ALTER TABLE public.pedidos_producao 
    ADD CONSTRAINT pedidos_producao_orcamento_id_fkey 
    FOREIGN KEY (orcamento_id) 
    REFERENCES public.orcamentos(id) 
    ON DELETE SET NULL;

    -- 2. Fix ordens_servico relationship to orcamentos
    -- Note: one migration used orcamento_id and another used orcamento_origem_id
    
    -- Fix orcamento_id in ordens_servico if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'ordens_servico_orcamento_id_fkey' 
        AND table_name = 'ordens_servico'
    ) THEN
        ALTER TABLE public.ordens_servico DROP CONSTRAINT ordens_servico_orcamento_id_fkey;
    END IF;

    -- Check if column exists before adding constraint (some migrations might have failed)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ordens_servico' AND column_name='orcamento_id') THEN
        ALTER TABLE public.ordens_servico 
        ADD CONSTRAINT ordens_servico_orcamento_id_fkey 
        FOREIGN KEY (orcamento_id) 
        REFERENCES public.orcamentos(id) 
        ON DELETE SET NULL;
    END IF;

    -- Fix orcamento_origem_id in ordens_servico
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'ordens_servico_orcamento_origem_id_fkey' 
        AND table_name = 'ordens_servico'
    ) THEN
        ALTER TABLE public.ordens_servico DROP CONSTRAINT ordens_servico_orcamento_origem_id_fkey;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ordens_servico' AND column_name='orcamento_origem_id') THEN
        ALTER TABLE public.ordens_servico 
        ADD CONSTRAINT ordens_servico_orcamento_origem_id_fkey 
        FOREIGN KEY (orcamento_origem_id) 
        REFERENCES public.orcamentos(id) 
        ON DELETE SET NULL;
    END IF;

END $$;

-- Reload schema
NOTIFY pgrst, 'reload schema';
