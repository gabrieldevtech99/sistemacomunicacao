-- Adicionar coluna orcamento_origem_id à tabela ordens_servico
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ordens_servico' AND column_name='orcamento_origem_id') THEN
        ALTER TABLE public.ordens_servico ADD COLUMN orcamento_origem_id UUID REFERENCES public.orcamentos(id) ON DELETE SET NULL;
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
