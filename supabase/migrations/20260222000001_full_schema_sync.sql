-- ============================================================
-- SCRIPT DEFINITIVO DE SINCRONIZAÇÃO DO BANCO DE DADOS
-- Este script usa exclusivamente ALTER TABLE ADD COLUMN
-- para garantir que TODAS as colunas existam, mesmo em
-- tabelas que já foram criadas com um schema diferente.
-- ============================================================

-- ============================================================
-- 1. ENUMS (criar se não existirem)
-- ============================================================
DO $$ BEGIN CREATE TYPE public.tipo_pessoa AS ENUM ('pf', 'pj'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.tipo_categoria AS ENUM ('entrada', 'saida'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.forma_pagamento AS ENUM ('dinheiro', 'pix', 'cartao', 'transferencia', 'boleto', 'outros'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.status_orcamento AS ENUM ('rascunho', 'enviado', 'aprovado', 'rejeitado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.status_pedido AS ENUM ('aguardando', 'em_producao', 'acabamento', 'pronto_entrega', 'entregue'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.status_conta AS ENUM ('pendente', 'pago', 'recebido', 'vencido', 'cancelado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.recorrencia AS ENUM ('mensal', 'semanal', 'quinzenal', 'anual'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.app_role AS ENUM ('admin', 'usuario'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 2. TABELAS (criar se não existirem — estrutura básica)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  nome TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.empresas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.empresa_usuarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.categorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subcategorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria_id UUID NOT NULL,
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fornecedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  nome TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orcamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orcamento_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orcamento_id UUID NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pedidos_producao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contas_pagar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  valor NUMERIC NOT NULL DEFAULT 0,
  data_vencimento DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contas_receber (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  valor NUMERIC NOT NULL DEFAULT 0,
  data_vencimento DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.entradas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  valor_venda NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.saidas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  valor NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.movimentacoes_estoque (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  produto_id UUID NOT NULL,
  tipo TEXT NOT NULL DEFAULT '',
  quantidade NUMERIC NOT NULL DEFAULT 0,
  quantidade_anterior NUMERIC NOT NULL DEFAULT 0,
  quantidade_nova NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orcamento_financeiro (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  mes INTEGER NOT NULL DEFAULT 1,
  ano INTEGER NOT NULL DEFAULT 2026,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. ADICIONAR TODAS AS COLUNAS (ADD COLUMN IF NOT EXISTS)
-- Este é o bloco PRINCIPAL que corrige tabelas já existentes.
-- ============================================================
DO $$
BEGIN
    -- ==================== PROFILES ====================
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='avatar_url') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
    END IF;

    -- ==================== EMPRESAS ====================
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='empresas' AND column_name='sigla') THEN
        ALTER TABLE public.empresas ADD COLUMN sigla TEXT NOT NULL DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='empresas' AND column_name='cnpj') THEN
        ALTER TABLE public.empresas ADD COLUMN cnpj TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='empresas' AND column_name='telefone') THEN
        ALTER TABLE public.empresas ADD COLUMN telefone TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='empresas' AND column_name='email') THEN
        ALTER TABLE public.empresas ADD COLUMN email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='empresas' AND column_name='endereco') THEN
        ALTER TABLE public.empresas ADD COLUMN endereco TEXT;
    END IF;

    -- ==================== EMPRESA_USUARIOS ====================
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='empresa_usuarios' AND column_name='role') THEN
        ALTER TABLE public.empresa_usuarios ADD COLUMN role public.app_role NOT NULL DEFAULT 'usuario';
    END IF;

    -- ==================== CATEGORIAS ====================
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='categorias' AND column_name='tipo') THEN
        ALTER TABLE public.categorias ADD COLUMN tipo public.tipo_categoria NOT NULL DEFAULT 'entrada';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='categorias' AND column_name='cor') THEN
        ALTER TABLE public.categorias ADD COLUMN cor TEXT NOT NULL DEFAULT '#6366f1';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='categorias' AND column_name='descricao') THEN
        ALTER TABLE public.categorias ADD COLUMN descricao TEXT;
    END IF;

    -- ==================== SUBCATEGORIAS ====================
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='subcategorias' AND column_name='descricao') THEN
        ALTER TABLE public.subcategorias ADD COLUMN descricao TEXT;
    END IF;

    -- ==================== CLIENTES ====================
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clientes' AND column_name='empresa_id') THEN
        ALTER TABLE public.clientes ADD COLUMN empresa_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clientes' AND column_name='tipo_pessoa') THEN
        ALTER TABLE public.clientes ADD COLUMN tipo_pessoa public.tipo_pessoa NOT NULL DEFAULT 'pf';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clientes' AND column_name='cpf_cnpj') THEN
        ALTER TABLE public.clientes ADD COLUMN cpf_cnpj TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clientes' AND column_name='telefone') THEN
        ALTER TABLE public.clientes ADD COLUMN telefone TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clientes' AND column_name='email') THEN
        ALTER TABLE public.clientes ADD COLUMN email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clientes' AND column_name='cep') THEN
        ALTER TABLE public.clientes ADD COLUMN cep TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clientes' AND column_name='logradouro') THEN
        ALTER TABLE public.clientes ADD COLUMN logradouro TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clientes' AND column_name='numero') THEN
        ALTER TABLE public.clientes ADD COLUMN numero TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clientes' AND column_name='complemento') THEN
        ALTER TABLE public.clientes ADD COLUMN complemento TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clientes' AND column_name='bairro') THEN
        ALTER TABLE public.clientes ADD COLUMN bairro TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clientes' AND column_name='cidade') THEN
        ALTER TABLE public.clientes ADD COLUMN cidade TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clientes' AND column_name='uf') THEN
        ALTER TABLE public.clientes ADD COLUMN uf TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clientes' AND column_name='observacoes') THEN
        ALTER TABLE public.clientes ADD COLUMN observacoes TEXT;
    END IF;

    -- ==================== FORNECEDORES ====================
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fornecedores' AND column_name='empresa_id') THEN
        ALTER TABLE public.fornecedores ADD COLUMN empresa_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fornecedores' AND column_name='razao_social') THEN
        ALTER TABLE public.fornecedores ADD COLUMN razao_social TEXT NOT NULL DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fornecedores' AND column_name='nome_fantasia') THEN
        ALTER TABLE public.fornecedores ADD COLUMN nome_fantasia TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fornecedores' AND column_name='cnpj') THEN
        ALTER TABLE public.fornecedores ADD COLUMN cnpj TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fornecedores' AND column_name='telefone') THEN
        ALTER TABLE public.fornecedores ADD COLUMN telefone TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fornecedores' AND column_name='email') THEN
        ALTER TABLE public.fornecedores ADD COLUMN email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fornecedores' AND column_name='cep') THEN
        ALTER TABLE public.fornecedores ADD COLUMN cep TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fornecedores' AND column_name='logradouro') THEN
        ALTER TABLE public.fornecedores ADD COLUMN logradouro TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fornecedores' AND column_name='numero') THEN
        ALTER TABLE public.fornecedores ADD COLUMN numero TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fornecedores' AND column_name='complemento') THEN
        ALTER TABLE public.fornecedores ADD COLUMN complemento TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fornecedores' AND column_name='bairro') THEN
        ALTER TABLE public.fornecedores ADD COLUMN bairro TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fornecedores' AND column_name='cidade') THEN
        ALTER TABLE public.fornecedores ADD COLUMN cidade TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fornecedores' AND column_name='uf') THEN
        ALTER TABLE public.fornecedores ADD COLUMN uf TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fornecedores' AND column_name='tipo_material') THEN
        ALTER TABLE public.fornecedores ADD COLUMN tipo_material TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fornecedores' AND column_name='contato_nome') THEN
        ALTER TABLE public.fornecedores ADD COLUMN contato_nome TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fornecedores' AND column_name='contato_telefone') THEN
        ALTER TABLE public.fornecedores ADD COLUMN contato_telefone TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fornecedores' AND column_name='observacoes') THEN
        ALTER TABLE public.fornecedores ADD COLUMN observacoes TEXT;
    END IF;

    -- ==================== PRODUTOS ====================
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='produtos' AND column_name='empresa_id') THEN
        ALTER TABLE public.produtos ADD COLUMN empresa_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='produtos' AND column_name='categoria_id') THEN
        ALTER TABLE public.produtos ADD COLUMN categoria_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='produtos' AND column_name='subcategoria_id') THEN
        ALTER TABLE public.produtos ADD COLUMN subcategoria_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='produtos' AND column_name='descricao') THEN
        ALTER TABLE public.produtos ADD COLUMN descricao TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='produtos' AND column_name='unidade') THEN
        ALTER TABLE public.produtos ADD COLUMN unidade TEXT NOT NULL DEFAULT 'un';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='produtos' AND column_name='quantidade') THEN
        ALTER TABLE public.produtos ADD COLUMN quantidade NUMERIC NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='produtos' AND column_name='quantidade_minima') THEN
        ALTER TABLE public.produtos ADD COLUMN quantidade_minima NUMERIC NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='produtos' AND column_name='valor_custo') THEN
        ALTER TABLE public.produtos ADD COLUMN valor_custo NUMERIC NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='produtos' AND column_name='valor_venda') THEN
        ALTER TABLE public.produtos ADD COLUMN valor_venda NUMERIC NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='produtos' AND column_name='status') THEN
        ALTER TABLE public.produtos ADD COLUMN status TEXT DEFAULT 'em_aberto';
    END IF;

    -- ==================== ORCAMENTOS ====================
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orcamentos' AND column_name='empresa_id') THEN
        ALTER TABLE public.orcamentos ADD COLUMN empresa_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orcamentos' AND column_name='cliente_id') THEN
        ALTER TABLE public.orcamentos ADD COLUMN cliente_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orcamentos' AND column_name='numero') THEN
        ALTER TABLE public.orcamentos ADD COLUMN numero SERIAL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orcamentos' AND column_name='status') THEN
        ALTER TABLE public.orcamentos ADD COLUMN status public.status_orcamento NOT NULL DEFAULT 'rascunho';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orcamentos' AND column_name='prazo_entrega') THEN
        ALTER TABLE public.orcamentos ADD COLUMN prazo_entrega TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orcamentos' AND column_name='dias_uteis') THEN
        ALTER TABLE public.orcamentos ADD COLUMN dias_uteis INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orcamentos' AND column_name='valor_total') THEN
        ALTER TABLE public.orcamentos ADD COLUMN valor_total NUMERIC NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orcamentos' AND column_name='desconto') THEN
        ALTER TABLE public.orcamentos ADD COLUMN desconto NUMERIC NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orcamentos' AND column_name='valor_final') THEN
        ALTER TABLE public.orcamentos ADD COLUMN valor_final NUMERIC NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orcamentos' AND column_name='observacoes') THEN
        ALTER TABLE public.orcamentos ADD COLUMN observacoes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orcamentos' AND column_name='validade') THEN
        ALTER TABLE public.orcamentos ADD COLUMN validade TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orcamentos' AND column_name='garantia_servico') THEN
        ALTER TABLE public.orcamentos ADD COLUMN garantia_servico TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orcamentos' AND column_name='requisitos') THEN
        ALTER TABLE public.orcamentos ADD COLUMN requisitos TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orcamentos' AND column_name='formas_pagamento') THEN
        ALTER TABLE public.orcamentos ADD COLUMN formas_pagamento TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orcamentos' AND column_name='chave_pix') THEN
        ALTER TABLE public.orcamentos ADD COLUMN chave_pix TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orcamentos' AND column_name='banco') THEN
        ALTER TABLE public.orcamentos ADD COLUMN banco TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orcamentos' AND column_name='vendedor_nome') THEN
        ALTER TABLE public.orcamentos ADD COLUMN vendedor_nome TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orcamentos' AND column_name='numero_manual') THEN
        ALTER TABLE public.orcamentos ADD COLUMN numero_manual TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orcamentos' AND column_name='endereco_entrega') THEN
        ALTER TABLE public.orcamentos ADD COLUMN endereco_entrega TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orcamentos' AND column_name='descricao_servico') THEN
        ALTER TABLE public.orcamentos ADD COLUMN descricao_servico TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orcamentos' AND column_name='created_by') THEN
        ALTER TABLE public.orcamentos ADD COLUMN created_by UUID;
    END IF;

    -- ==================== ORCAMENTO_ITENS ====================
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orcamento_itens' AND column_name='produto_id') THEN
        ALTER TABLE public.orcamento_itens ADD COLUMN produto_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orcamento_itens' AND column_name='quantidade') THEN
        ALTER TABLE public.orcamento_itens ADD COLUMN quantidade NUMERIC NOT NULL DEFAULT 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orcamento_itens' AND column_name='unidade') THEN
        ALTER TABLE public.orcamento_itens ADD COLUMN unidade TEXT NOT NULL DEFAULT 'un';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orcamento_itens' AND column_name='valor_unitario') THEN
        ALTER TABLE public.orcamento_itens ADD COLUMN valor_unitario NUMERIC NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orcamento_itens' AND column_name='valor_total') THEN
        ALTER TABLE public.orcamento_itens ADD COLUMN valor_total NUMERIC NOT NULL DEFAULT 0;
    END IF;

    -- ==================== PEDIDOS_PRODUCAO ====================
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pedidos_producao' AND column_name='empresa_id') THEN
        ALTER TABLE public.pedidos_producao ADD COLUMN empresa_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pedidos_producao' AND column_name='orcamento_id') THEN
        ALTER TABLE public.pedidos_producao ADD COLUMN orcamento_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pedidos_producao' AND column_name='cliente_id') THEN
        ALTER TABLE public.pedidos_producao ADD COLUMN cliente_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pedidos_producao' AND column_name='numero') THEN
        ALTER TABLE public.pedidos_producao ADD COLUMN numero SERIAL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pedidos_producao' AND column_name='status') THEN
        ALTER TABLE public.pedidos_producao ADD COLUMN status public.status_pedido NOT NULL DEFAULT 'aguardando';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pedidos_producao' AND column_name='data_entrada') THEN
        ALTER TABLE public.pedidos_producao ADD COLUMN data_entrada DATE NOT NULL DEFAULT CURRENT_DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pedidos_producao' AND column_name='data_previsao') THEN
        ALTER TABLE public.pedidos_producao ADD COLUMN data_previsao DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pedidos_producao' AND column_name='data_entrega') THEN
        ALTER TABLE public.pedidos_producao ADD COLUMN data_entrega DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pedidos_producao' AND column_name='observacoes') THEN
        ALTER TABLE public.pedidos_producao ADD COLUMN observacoes TEXT;
    END IF;

    -- ==================== CONTAS_PAGAR ====================
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contas_pagar' AND column_name='descricao') THEN
        ALTER TABLE public.contas_pagar ADD COLUMN descricao TEXT NOT NULL DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contas_pagar' AND column_name='valor') THEN
        ALTER TABLE public.contas_pagar ADD COLUMN valor NUMERIC NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contas_pagar' AND column_name='data_vencimento') THEN
        ALTER TABLE public.contas_pagar ADD COLUMN data_vencimento DATE NOT NULL DEFAULT CURRENT_DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contas_pagar' AND column_name='fornecedor_id') THEN
        ALTER TABLE public.contas_pagar ADD COLUMN fornecedor_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contas_pagar' AND column_name='categoria_id') THEN
        ALTER TABLE public.contas_pagar ADD COLUMN categoria_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contas_pagar' AND column_name='data_pagamento') THEN
        ALTER TABLE public.contas_pagar ADD COLUMN data_pagamento DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contas_pagar' AND column_name='status') THEN
        ALTER TABLE public.contas_pagar ADD COLUMN status public.status_conta NOT NULL DEFAULT 'pendente';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contas_pagar' AND column_name='forma_pagamento') THEN
        ALTER TABLE public.contas_pagar ADD COLUMN forma_pagamento public.forma_pagamento NOT NULL DEFAULT 'pix';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contas_pagar' AND column_name='is_despesa_fixa') THEN
        ALTER TABLE public.contas_pagar ADD COLUMN is_despesa_fixa BOOLEAN NOT NULL DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contas_pagar' AND column_name='recorrencia') THEN
        ALTER TABLE public.contas_pagar ADD COLUMN recorrencia public.recorrencia;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contas_pagar' AND column_name='observacoes') THEN
        ALTER TABLE public.contas_pagar ADD COLUMN observacoes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contas_pagar' AND column_name='created_by') THEN
        ALTER TABLE public.contas_pagar ADD COLUMN created_by UUID;
    END IF;

    -- ==================== CONTAS_RECEBER ====================
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contas_receber' AND column_name='descricao') THEN
        ALTER TABLE public.contas_receber ADD COLUMN descricao TEXT NOT NULL DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contas_receber' AND column_name='valor') THEN
        ALTER TABLE public.contas_receber ADD COLUMN valor NUMERIC NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contas_receber' AND column_name='data_vencimento') THEN
        ALTER TABLE public.contas_receber ADD COLUMN data_vencimento DATE NOT NULL DEFAULT CURRENT_DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contas_receber' AND column_name='cliente_id') THEN
        ALTER TABLE public.contas_receber ADD COLUMN cliente_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contas_receber' AND column_name='pedido_id') THEN
        ALTER TABLE public.contas_receber ADD COLUMN pedido_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contas_receber' AND column_name='categoria_id') THEN
        ALTER TABLE public.contas_receber ADD COLUMN categoria_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contas_receber' AND column_name='data_recebimento') THEN
        ALTER TABLE public.contas_receber ADD COLUMN data_recebimento DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contas_receber' AND column_name='status') THEN
        ALTER TABLE public.contas_receber ADD COLUMN status public.status_conta NOT NULL DEFAULT 'pendente';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contas_receber' AND column_name='forma_pagamento') THEN
        ALTER TABLE public.contas_receber ADD COLUMN forma_pagamento public.forma_pagamento NOT NULL DEFAULT 'pix';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contas_receber' AND column_name='observacoes') THEN
        ALTER TABLE public.contas_receber ADD COLUMN observacoes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contas_receber' AND column_name='created_by') THEN
        ALTER TABLE public.contas_receber ADD COLUMN created_by UUID;
    END IF;

    -- ==================== ENTRADAS ====================
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='entradas' AND column_name='categoria_id') THEN
        ALTER TABLE public.entradas ADD COLUMN categoria_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='entradas' AND column_name='data') THEN
        ALTER TABLE public.entradas ADD COLUMN data DATE NOT NULL DEFAULT CURRENT_DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='entradas' AND column_name='valor_custo') THEN
        ALTER TABLE public.entradas ADD COLUMN valor_custo NUMERIC NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='entradas' AND column_name='margem_lucro') THEN
        ALTER TABLE public.entradas ADD COLUMN margem_lucro NUMERIC;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='entradas' AND column_name='forma_pagamento') THEN
        ALTER TABLE public.entradas ADD COLUMN forma_pagamento public.forma_pagamento NOT NULL DEFAULT 'pix';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='entradas' AND column_name='observacoes') THEN
        ALTER TABLE public.entradas ADD COLUMN observacoes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='entradas' AND column_name='created_by') THEN
        ALTER TABLE public.entradas ADD COLUMN created_by UUID;
    END IF;

    -- ==================== SAIDAS ====================
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='saidas' AND column_name='categoria_id') THEN
        ALTER TABLE public.saidas ADD COLUMN categoria_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='saidas' AND column_name='data') THEN
        ALTER TABLE public.saidas ADD COLUMN data DATE NOT NULL DEFAULT CURRENT_DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='saidas' AND column_name='forma_pagamento') THEN
        ALTER TABLE public.saidas ADD COLUMN forma_pagamento public.forma_pagamento NOT NULL DEFAULT 'pix';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='saidas' AND column_name='observacoes') THEN
        ALTER TABLE public.saidas ADD COLUMN observacoes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='saidas' AND column_name='created_by') THEN
        ALTER TABLE public.saidas ADD COLUMN created_by UUID;
    END IF;

    -- ==================== MOVIMENTACOES_ESTOQUE ====================
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='movimentacoes_estoque' AND column_name='motivo') THEN
        ALTER TABLE public.movimentacoes_estoque ADD COLUMN motivo TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='movimentacoes_estoque' AND column_name='referencia_tipo') THEN
        ALTER TABLE public.movimentacoes_estoque ADD COLUMN referencia_tipo TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='movimentacoes_estoque' AND column_name='referencia_id') THEN
        ALTER TABLE public.movimentacoes_estoque ADD COLUMN referencia_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='movimentacoes_estoque' AND column_name='created_by') THEN
        ALTER TABLE public.movimentacoes_estoque ADD COLUMN created_by UUID;
    END IF;

    -- ==================== ORCAMENTO_FINANCEIRO ====================
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orcamento_financeiro' AND column_name='categoria_id') THEN
        ALTER TABLE public.orcamento_financeiro ADD COLUMN categoria_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orcamento_financeiro' AND column_name='valor_previsto') THEN
        ALTER TABLE public.orcamento_financeiro ADD COLUMN valor_previsto NUMERIC NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orcamento_financeiro' AND column_name='valor_realizado') THEN
        ALTER TABLE public.orcamento_financeiro ADD COLUMN valor_realizado NUMERIC NOT NULL DEFAULT 0;
    END IF;

END $$;

-- ============================================================
-- 4. RLS
-- empresas e empresa_usuarios: RLS DESABILITADO permanentemente
-- (INSERT com RLS habilitado causa erros persistentes)
-- As demais tabelas usam RLS com a function user_belongs_to_empresa
-- ============================================================
ALTER TABLE public.empresas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresa_usuarios DISABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamento_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_producao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamento_financeiro ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. FUNÇÕES
-- ============================================================
CREATE OR REPLACE FUNCTION public.user_belongs_to_empresa(p_empresa_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.empresa_usuarios
    WHERE user_id = auth.uid() AND empresa_id = p_empresa_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.has_empresa_role(p_empresa_id UUID, p_role public.app_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.empresa_usuarios
    WHERE user_id = auth.uid() AND empresa_id = p_empresa_id AND role = p_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. POLÍTICAS RLS
-- ============================================================
-- Profiles
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (id = auth.uid());
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (id = auth.uid());
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());

-- Empresas: RLS desabilitado, sem políticas necessárias
-- Empresa Usuarios: RLS desabilitado, sem políticas necessárias

-- Tabelas com empresa_id (política unificada)
DROP POLICY IF EXISTS "categorias_all" ON public.categorias;
CREATE POLICY "categorias_all" ON public.categorias FOR ALL USING (public.user_belongs_to_empresa(empresa_id));

DROP POLICY IF EXISTS "subcategorias_all" ON public.subcategorias;
CREATE POLICY "subcategorias_all" ON public.subcategorias FOR ALL USING (
  EXISTS (SELECT 1 FROM public.categorias c WHERE c.id = categoria_id AND public.user_belongs_to_empresa(c.empresa_id))
);

DROP POLICY IF EXISTS "clientes_all" ON public.clientes;
CREATE POLICY "clientes_all" ON public.clientes FOR ALL USING (public.user_belongs_to_empresa(empresa_id));

DROP POLICY IF EXISTS "fornecedores_all" ON public.fornecedores;
CREATE POLICY "fornecedores_all" ON public.fornecedores FOR ALL USING (public.user_belongs_to_empresa(empresa_id));

DROP POLICY IF EXISTS "produtos_all" ON public.produtos;
CREATE POLICY "produtos_all" ON public.produtos FOR ALL USING (public.user_belongs_to_empresa(empresa_id));

DROP POLICY IF EXISTS "orcamentos_all" ON public.orcamentos;
CREATE POLICY "orcamentos_all" ON public.orcamentos FOR ALL USING (public.user_belongs_to_empresa(empresa_id));

DROP POLICY IF EXISTS "orcamento_itens_all" ON public.orcamento_itens;
CREATE POLICY "orcamento_itens_all" ON public.orcamento_itens FOR ALL USING (
  EXISTS (SELECT 1 FROM public.orcamentos o WHERE o.id = orcamento_id AND public.user_belongs_to_empresa(o.empresa_id))
);

DROP POLICY IF EXISTS "pedidos_producao_all" ON public.pedidos_producao;
CREATE POLICY "pedidos_producao_all" ON public.pedidos_producao FOR ALL USING (public.user_belongs_to_empresa(empresa_id));

DROP POLICY IF EXISTS "contas_pagar_all" ON public.contas_pagar;
CREATE POLICY "contas_pagar_all" ON public.contas_pagar FOR ALL USING (public.user_belongs_to_empresa(empresa_id));

DROP POLICY IF EXISTS "contas_receber_all" ON public.contas_receber;
CREATE POLICY "contas_receber_all" ON public.contas_receber FOR ALL USING (public.user_belongs_to_empresa(empresa_id));

DROP POLICY IF EXISTS "entradas_all" ON public.entradas;
CREATE POLICY "entradas_all" ON public.entradas FOR ALL USING (public.user_belongs_to_empresa(empresa_id));

DROP POLICY IF EXISTS "saidas_all" ON public.saidas;
CREATE POLICY "saidas_all" ON public.saidas FOR ALL USING (public.user_belongs_to_empresa(empresa_id));

DROP POLICY IF EXISTS "movimentacoes_estoque_all" ON public.movimentacoes_estoque;
CREATE POLICY "movimentacoes_estoque_all" ON public.movimentacoes_estoque FOR ALL USING (public.user_belongs_to_empresa(empresa_id));

DROP POLICY IF EXISTS "orcamento_financeiro_all" ON public.orcamento_financeiro;
CREATE POLICY "orcamento_financeiro_all" ON public.orcamento_financeiro FOR ALL USING (public.user_belongs_to_empresa(empresa_id));

-- ============================================================
-- 7. TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'profiles', 'empresas', 'categorias', 'subcategorias', 'clientes',
    'fornecedores', 'produtos', 'orcamentos', 'pedidos_producao',
    'contas_pagar', 'contas_receber', 'entradas', 'saidas', 'orcamento_financeiro'
  ])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON public.%s', tbl, tbl);
    EXECUTE format(
      'CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON public.%s FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()',
      tbl, tbl
    );
  END LOOP;
END $$;

-- ============================================================
-- 8. TRIGGER DE PROFILE + EMPRESA AUTOMÁTICA
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_empresa_id UUID;
BEGIN
  -- Criar perfil
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  -- Criar empresa padrão
  INSERT INTO public.empresas (nome, sigla)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)) || ' - Empresa',
    UPPER(LEFT(split_part(NEW.email, '@', 1), 3))
  )
  RETURNING id INTO new_empresa_id;

  -- Vincular usuário como admin
  INSERT INTO public.empresa_usuarios (empresa_id, user_id, role)
  VALUES (new_empresa_id, NEW.id, 'admin');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 9. REFRESH DO CACHE
-- ============================================================
NOTIFY pgrst, 'reload schema';
