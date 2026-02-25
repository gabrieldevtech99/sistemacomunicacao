
-- Garantir que as tabelas de compras existam e estejam configuradas corretamente
DO $$
BEGIN
    -- 1. Tabela de Compras
    CREATE TABLE IF NOT EXISTS public.os_compras (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
        os_id UUID REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'pendente',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- 2. Tabela de Itens de Compra
    CREATE TABLE IF NOT EXISTS public.os_compra_itens (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
        compra_id UUID NOT NULL REFERENCES public.os_compras(id) ON DELETE CASCADE,
        descricao TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pendente',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

END $$;

-- 3. Habilitar RLS
ALTER TABLE public.os_compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_compra_itens ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de RLS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'os_compras' AND policyname = 'os_compras_all') THEN
        CREATE POLICY "os_compras_all" ON public.os_compras FOR ALL USING (public.user_belongs_to_empresa(empresa_id));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'os_compra_itens' AND policyname = 'os_compra_itens_all') THEN
        CREATE POLICY "os_compra_itens_all" ON public.os_compra_itens FOR ALL USING (public.user_belongs_to_empresa(empresa_id));
    END IF;
END $$;

-- 5. Função de Updated At (Garantir que usamos a correta)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Gatilhos
DROP TRIGGER IF EXISTS update_os_compras_updated_at ON public.os_compras;
CREATE TRIGGER update_os_compras_updated_at BEFORE UPDATE ON public.os_compras FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_os_compra_itens_updated_at ON public.os_compra_itens;
CREATE TRIGGER update_os_compra_itens_updated_at BEFORE UPDATE ON public.os_compra_itens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Forçar recarregamento do PostgREST
NOTIFY pgrst, 'reload schema';
