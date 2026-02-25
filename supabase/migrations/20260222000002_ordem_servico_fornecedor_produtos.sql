-- ============================================================
-- AJUSTE: Compatibilidade com coluna 'nome' legada
-- ============================================================
DO $$
BEGIN
  -- Se existe a coluna 'nome' e não existe 'razao_social', renomeia
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fornecedores' AND column_name='nome') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fornecedores' AND column_name='razao_social') THEN
    ALTER TABLE public.fornecedores RENAME COLUMN nome TO razao_social;
  END IF;

  -- Se ambas existem, remove a obrigatoriedade de 'nome'
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fornecedores' AND column_name='nome') THEN
    ALTER TABLE public.fornecedores ALTER COLUMN nome DROP NOT NULL;
  END IF;

  -- Compatibilidade para Contas a Pagar (vencimento -> data_vencimento)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contas_pagar' AND column_name='vencimento') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contas_pagar' AND column_name='data_vencimento') THEN
    ALTER TABLE public.contas_pagar RENAME COLUMN vencimento TO data_vencimento;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contas_pagar' AND column_name='vencimento') THEN
    ALTER TABLE public.contas_pagar ALTER COLUMN vencimento DROP NOT NULL;
  END IF;

  -- Compatibilidade para Contas a Receber (vencimento -> data_vencimento)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contas_receber' AND column_name='vencimento') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contas_receber' AND column_name='data_vencimento') THEN
    ALTER TABLE public.contas_receber RENAME COLUMN vencimento TO data_vencimento;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contas_receber' AND column_name='vencimento') THEN
    ALTER TABLE public.contas_receber ALTER COLUMN vencimento DROP NOT NULL;
  END IF;
END $$;

-- Garantir que razao_social exista
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fornecedores' AND column_name='razao_social') THEN
    ALTER TABLE public.fornecedores ADD COLUMN razao_social TEXT NOT NULL DEFAULT '';
  END IF;
END $$;

-- ENUMs novos
DO $$ BEGIN CREATE TYPE public.status_os AS ENUM ('aberta', 'em_andamento', 'pausada', 'concluida', 'cancelada'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.prioridade_os AS ENUM ('baixa', 'normal', 'alta', 'urgente'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- TABELA: ordens_servico
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ordens_servico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  numero SERIAL,
  titulo TEXT NOT NULL DEFAULT '',
  descricao TEXT,
  cliente_id UUID,
  orcamento_id UUID,
  status public.status_os NOT NULL DEFAULT 'aberta',
  prioridade public.prioridade_os NOT NULL DEFAULT 'normal',
  data_abertura DATE NOT NULL DEFAULT CURRENT_DATE,
  data_previsao DATE,
  data_conclusao DATE,
  responsavel TEXT,
  maquinarios TEXT,
  observacoes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABELA: os_checklist_itens
-- ============================================================
CREATE TABLE IF NOT EXISTS public.os_checklist_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  os_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL DEFAULT '',
  concluido BOOLEAN NOT NULL DEFAULT false,
  ordem INTEGER NOT NULL DEFAULT 0,
  concluido_em TIMESTAMPTZ,
  concluido_por TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABELA: fornecedor_produtos (itens/materiais por fornecedor)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.fornecedor_produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fornecedor_id UUID NOT NULL REFERENCES public.fornecedores(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL,
  nome TEXT NOT NULL DEFAULT '',
  descricao TEXT,
  unidade TEXT NOT NULL DEFAULT 'un',
  preco_atual NUMERIC NOT NULL DEFAULT 0,
  preco_minimo NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABELA: fornecedor_produto_historico (histórico de preços)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.fornecedor_produto_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fornecedor_produto_id UUID NOT NULL REFERENCES public.fornecedor_produtos(id) ON DELETE CASCADE,
  preco NUMERIC NOT NULL DEFAULT 0,
  data_compra DATE NOT NULL DEFAULT CURRENT_DATE,
  quantidade NUMERIC,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_checklist_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedor_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedor_produto_historico ENABLE ROW LEVEL SECURITY;

-- Políticas OS
DROP POLICY IF EXISTS "ordens_servico_all" ON public.ordens_servico;
CREATE POLICY "ordens_servico_all" ON public.ordens_servico FOR ALL
  USING (public.user_belongs_to_empresa(empresa_id));

DROP POLICY IF EXISTS "os_checklist_itens_all" ON public.os_checklist_itens;
CREATE POLICY "os_checklist_itens_all" ON public.os_checklist_itens FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.ordens_servico os WHERE os.id = os_id AND public.user_belongs_to_empresa(os.empresa_id))
  );

DROP POLICY IF EXISTS "fornecedor_produtos_all" ON public.fornecedor_produtos;
CREATE POLICY "fornecedor_produtos_all" ON public.fornecedor_produtos FOR ALL
  USING (public.user_belongs_to_empresa(empresa_id));

DROP POLICY IF EXISTS "fornecedor_produto_historico_all" ON public.fornecedor_produto_historico;
CREATE POLICY "fornecedor_produto_historico_all" ON public.fornecedor_produto_historico FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.fornecedor_produtos fp WHERE fp.id = fornecedor_produto_id AND public.user_belongs_to_empresa(fp.empresa_id))
  );

-- ============================================================
-- TRIGGERS updated_at
-- ============================================================
DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['ordens_servico', 'fornecedor_produtos'])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON public.%s', tbl, tbl);
    EXECUTE format(
      'CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON public.%s FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()',
      tbl, tbl
    );
  END LOOP;
END $$;

-- Adicionar campo numero_manual aos orçamentos (para número manual)
DO $$
BEGIN
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

NOTIFY pgrst, 'reload schema';
