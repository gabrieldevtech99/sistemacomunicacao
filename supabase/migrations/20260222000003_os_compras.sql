-- Migração para incluir as funcionalidades de Painel de OS e Compras

-- 1. Criar tabelas para o módulo de Compras vinculado às OS
CREATE TABLE IF NOT EXISTS public.os_compras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  os_id UUID REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.os_compra_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  compra_id UUID NOT NULL REFERENCES public.os_compras(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente', -- pendente, comprado, entregue
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE public.os_compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_compra_itens ENABLE ROW LEVEL SECURITY;

-- 3. Criar Políticas de RLS
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'os_compras_all') THEN
        CREATE POLICY "os_compras_all" ON public.os_compras FOR ALL
        USING (public.user_belongs_to_empresa(empresa_id));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'os_compra_itens_all') THEN
        CREATE POLICY "os_compra_itens_all" ON public.os_compra_itens FOR ALL
        USING (public.user_belongs_to_empresa(empresa_id));
    END IF;
END $$;

-- 4. Gatilhos para updated_at
CREATE OR REPLACE TRIGGER set_updated_at_os_compras
BEFORE UPDATE ON public.os_compras
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_os_compra_itens
BEFORE UPDATE ON public.os_compra_itens
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
