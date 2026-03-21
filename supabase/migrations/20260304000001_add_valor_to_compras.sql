-- Migration: Add valor column to os_compra_itens
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='os_compra_itens' AND column_name='valor') THEN
        ALTER TABLE public.os_compra_itens ADD COLUMN valor NUMERIC(10,2) NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Recarregar o schema do PostgREST
NOTIFY pgrst, 'reload schema';
