
-- ===========================================
-- FASE 1: CRIAÇÃO DE ENUMS
-- ===========================================

-- Tipo de pessoa (PF/PJ)
CREATE TYPE public.tipo_pessoa AS ENUM ('pf', 'pj');

-- Status do orçamento
CREATE TYPE public.status_orcamento AS ENUM ('rascunho', 'enviado', 'aprovado', 'rejeitado');

-- Status do pedido de produção
CREATE TYPE public.status_pedido AS ENUM ('aguardando', 'em_producao', 'acabamento', 'pronto_entrega', 'entregue');

-- Status de contas
CREATE TYPE public.status_conta AS ENUM ('pendente', 'pago', 'recebido', 'vencido', 'cancelado');

-- Recorrência de despesas fixas
CREATE TYPE public.recorrencia AS ENUM ('mensal', 'semanal', 'quinzenal', 'anual');

-- ===========================================
-- TABELA: clientes
-- ===========================================
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo_pessoa tipo_pessoa NOT NULL DEFAULT 'pf',
  cpf_cnpj TEXT,
  telefone TEXT,
  email TEXT,
  cep TEXT,
  logradouro TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  uf TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver clientes de suas empresas" ON public.clientes
  FOR SELECT USING (user_belongs_to_empresa(empresa_id));

CREATE POLICY "Usuários podem criar clientes em suas empresas" ON public.clientes
  FOR INSERT WITH CHECK (user_belongs_to_empresa(empresa_id));

CREATE POLICY "Usuários podem atualizar clientes de suas empresas" ON public.clientes
  FOR UPDATE USING (user_belongs_to_empresa(empresa_id));

CREATE POLICY "Admins podem deletar clientes" ON public.clientes
  FOR DELETE USING (has_empresa_role(empresa_id, 'admin'));

CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- TABELA: fornecedores
-- ===========================================
CREATE TABLE public.fornecedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  cnpj TEXT,
  telefone TEXT,
  email TEXT,
  cep TEXT,
  logradouro TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  uf TEXT,
  tipo_material TEXT,
  contato_nome TEXT,
  contato_telefone TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver fornecedores de suas empresas" ON public.fornecedores
  FOR SELECT USING (user_belongs_to_empresa(empresa_id));

CREATE POLICY "Usuários podem criar fornecedores em suas empresas" ON public.fornecedores
  FOR INSERT WITH CHECK (user_belongs_to_empresa(empresa_id));

CREATE POLICY "Usuários podem atualizar fornecedores de suas empresas" ON public.fornecedores
  FOR UPDATE USING (user_belongs_to_empresa(empresa_id));

CREATE POLICY "Admins podem deletar fornecedores" ON public.fornecedores
  FOR DELETE USING (has_empresa_role(empresa_id, 'admin'));

CREATE TRIGGER update_fornecedores_updated_at
  BEFORE UPDATE ON public.fornecedores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- TABELA: subcategorias
-- ===========================================
CREATE TABLE public.subcategorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria_id UUID NOT NULL REFERENCES public.categorias(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subcategorias ENABLE ROW LEVEL SECURITY;

-- Subcategorias herdam a empresa da categoria pai
CREATE POLICY "Usuários podem ver subcategorias de suas empresas" ON public.subcategorias
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.categorias c 
      WHERE c.id = categoria_id AND user_belongs_to_empresa(c.empresa_id)
    )
  );

CREATE POLICY "Usuários podem criar subcategorias em suas empresas" ON public.subcategorias
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.categorias c 
      WHERE c.id = categoria_id AND user_belongs_to_empresa(c.empresa_id)
    )
  );

CREATE POLICY "Usuários podem atualizar subcategorias de suas empresas" ON public.subcategorias
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.categorias c 
      WHERE c.id = categoria_id AND user_belongs_to_empresa(c.empresa_id)
    )
  );

CREATE POLICY "Admins podem deletar subcategorias" ON public.subcategorias
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.categorias c 
      WHERE c.id = categoria_id AND has_empresa_role(c.empresa_id, 'admin')
    )
  );

CREATE TRIGGER update_subcategorias_updated_at
  BEFORE UPDATE ON public.subcategorias
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- MODIFICAR TABELA: produtos (adicionar subcategoria_id)
-- ===========================================
ALTER TABLE public.produtos ADD COLUMN subcategoria_id UUID REFERENCES public.subcategorias(id) ON DELETE SET NULL;

-- ===========================================
-- TABELA: orcamentos
-- ===========================================
CREATE TABLE public.orcamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  numero SERIAL,
  status status_orcamento NOT NULL DEFAULT 'rascunho',
  prazo_entrega DATE,
  dias_uteis INTEGER,
  valor_total NUMERIC NOT NULL DEFAULT 0,
  desconto NUMERIC NOT NULL DEFAULT 0,
  valor_final NUMERIC NOT NULL DEFAULT 0,
  observacoes TEXT,
  validade DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver orçamentos de suas empresas" ON public.orcamentos
  FOR SELECT USING (user_belongs_to_empresa(empresa_id));

CREATE POLICY "Usuários podem criar orçamentos em suas empresas" ON public.orcamentos
  FOR INSERT WITH CHECK (user_belongs_to_empresa(empresa_id));

CREATE POLICY "Usuários podem atualizar orçamentos de suas empresas" ON public.orcamentos
  FOR UPDATE USING (user_belongs_to_empresa(empresa_id));

CREATE POLICY "Admins podem deletar orçamentos" ON public.orcamentos
  FOR DELETE USING (has_empresa_role(empresa_id, 'admin'));

CREATE TRIGGER update_orcamentos_updated_at
  BEFORE UPDATE ON public.orcamentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- TABELA: orcamento_itens
-- ===========================================
CREATE TABLE public.orcamento_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES public.produtos(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  quantidade NUMERIC NOT NULL DEFAULT 1,
  unidade TEXT NOT NULL DEFAULT 'un',
  valor_unitario NUMERIC NOT NULL DEFAULT 0,
  valor_total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.orcamento_itens ENABLE ROW LEVEL SECURITY;

-- Itens herdam permissão do orçamento pai
CREATE POLICY "Usuários podem ver itens de orçamentos de suas empresas" ON public.orcamento_itens
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orcamentos o 
      WHERE o.id = orcamento_id AND user_belongs_to_empresa(o.empresa_id)
    )
  );

CREATE POLICY "Usuários podem criar itens em orçamentos de suas empresas" ON public.orcamento_itens
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orcamentos o 
      WHERE o.id = orcamento_id AND user_belongs_to_empresa(o.empresa_id)
    )
  );

CREATE POLICY "Usuários podem atualizar itens de orçamentos de suas empresas" ON public.orcamento_itens
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.orcamentos o 
      WHERE o.id = orcamento_id AND user_belongs_to_empresa(o.empresa_id)
    )
  );

CREATE POLICY "Usuários podem deletar itens de orçamentos de suas empresas" ON public.orcamento_itens
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.orcamentos o 
      WHERE o.id = orcamento_id AND user_belongs_to_empresa(o.empresa_id)
    )
  );

-- ===========================================
-- TABELA: pedidos_producao
-- ===========================================
CREATE TABLE public.pedidos_producao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE SET NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  numero SERIAL,
  status status_pedido NOT NULL DEFAULT 'aguardando',
  data_entrada DATE NOT NULL DEFAULT CURRENT_DATE,
  data_previsao DATE,
  data_entrega DATE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pedidos_producao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver pedidos de suas empresas" ON public.pedidos_producao
  FOR SELECT USING (user_belongs_to_empresa(empresa_id));

CREATE POLICY "Usuários podem criar pedidos em suas empresas" ON public.pedidos_producao
  FOR INSERT WITH CHECK (user_belongs_to_empresa(empresa_id));

CREATE POLICY "Usuários podem atualizar pedidos de suas empresas" ON public.pedidos_producao
  FOR UPDATE USING (user_belongs_to_empresa(empresa_id));

CREATE POLICY "Admins podem deletar pedidos" ON public.pedidos_producao
  FOR DELETE USING (has_empresa_role(empresa_id, 'admin'));

CREATE TRIGGER update_pedidos_producao_updated_at
  BEFORE UPDATE ON public.pedidos_producao
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- TABELA: contas_pagar
-- ===========================================
CREATE TABLE public.contas_pagar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  fornecedor_id UUID REFERENCES public.fornecedores(id) ON DELETE SET NULL,
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status status_conta NOT NULL DEFAULT 'pendente',
  forma_pagamento forma_pagamento NOT NULL DEFAULT 'dinheiro',
  is_despesa_fixa BOOLEAN NOT NULL DEFAULT false,
  recorrencia recorrencia,
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver contas a pagar de suas empresas" ON public.contas_pagar
  FOR SELECT USING (user_belongs_to_empresa(empresa_id));

CREATE POLICY "Usuários podem criar contas a pagar em suas empresas" ON public.contas_pagar
  FOR INSERT WITH CHECK (user_belongs_to_empresa(empresa_id));

CREATE POLICY "Usuários podem atualizar contas a pagar de suas empresas" ON public.contas_pagar
  FOR UPDATE USING (user_belongs_to_empresa(empresa_id));

CREATE POLICY "Admins podem deletar contas a pagar" ON public.contas_pagar
  FOR DELETE USING (has_empresa_role(empresa_id, 'admin'));

CREATE TRIGGER update_contas_pagar_updated_at
  BEFORE UPDATE ON public.contas_pagar
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- TABELA: contas_receber
-- ===========================================
CREATE TABLE public.contas_receber (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  pedido_id UUID REFERENCES public.pedidos_producao(id) ON DELETE SET NULL,
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  data_vencimento DATE NOT NULL,
  data_recebimento DATE,
  status status_conta NOT NULL DEFAULT 'pendente',
  forma_pagamento forma_pagamento NOT NULL DEFAULT 'dinheiro',
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver contas a receber de suas empresas" ON public.contas_receber
  FOR SELECT USING (user_belongs_to_empresa(empresa_id));

CREATE POLICY "Usuários podem criar contas a receber em suas empresas" ON public.contas_receber
  FOR INSERT WITH CHECK (user_belongs_to_empresa(empresa_id));

CREATE POLICY "Usuários podem atualizar contas a receber de suas empresas" ON public.contas_receber
  FOR UPDATE USING (user_belongs_to_empresa(empresa_id));

CREATE POLICY "Admins podem deletar contas a receber" ON public.contas_receber
  FOR DELETE USING (has_empresa_role(empresa_id, 'admin'));

CREATE TRIGGER update_contas_receber_updated_at
  BEFORE UPDATE ON public.contas_receber
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- TABELA: orcamento_financeiro (Budget)
-- ===========================================
CREATE TABLE public.orcamento_financeiro (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano INTEGER NOT NULL CHECK (ano >= 2020 AND ano <= 2100),
  valor_previsto NUMERIC NOT NULL DEFAULT 0,
  valor_realizado NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, categoria_id, mes, ano)
);

ALTER TABLE public.orcamento_financeiro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver budget de suas empresas" ON public.orcamento_financeiro
  FOR SELECT USING (user_belongs_to_empresa(empresa_id));

CREATE POLICY "Usuários podem criar budget em suas empresas" ON public.orcamento_financeiro
  FOR INSERT WITH CHECK (user_belongs_to_empresa(empresa_id));

CREATE POLICY "Usuários podem atualizar budget de suas empresas" ON public.orcamento_financeiro
  FOR UPDATE USING (user_belongs_to_empresa(empresa_id));

CREATE POLICY "Admins podem deletar budget" ON public.orcamento_financeiro
  FOR DELETE USING (has_empresa_role(empresa_id, 'admin'));

CREATE TRIGGER update_orcamento_financeiro_updated_at
  BEFORE UPDATE ON public.orcamento_financeiro
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- ÍNDICES PARA PERFORMANCE
-- ===========================================
CREATE INDEX idx_clientes_empresa ON public.clientes(empresa_id);
CREATE INDEX idx_fornecedores_empresa ON public.fornecedores(empresa_id);
CREATE INDEX idx_subcategorias_categoria ON public.subcategorias(categoria_id);
CREATE INDEX idx_orcamentos_empresa ON public.orcamentos(empresa_id);
CREATE INDEX idx_orcamentos_cliente ON public.orcamentos(cliente_id);
CREATE INDEX idx_orcamento_itens_orcamento ON public.orcamento_itens(orcamento_id);
CREATE INDEX idx_pedidos_producao_empresa ON public.pedidos_producao(empresa_id);
CREATE INDEX idx_pedidos_producao_status ON public.pedidos_producao(status);
CREATE INDEX idx_contas_pagar_empresa ON public.contas_pagar(empresa_id);
CREATE INDEX idx_contas_pagar_vencimento ON public.contas_pagar(data_vencimento);
CREATE INDEX idx_contas_pagar_status ON public.contas_pagar(status);
CREATE INDEX idx_contas_receber_empresa ON public.contas_receber(empresa_id);
CREATE INDEX idx_contas_receber_vencimento ON public.contas_receber(data_vencimento);
CREATE INDEX idx_contas_receber_status ON public.contas_receber(status);
CREATE INDEX idx_orcamento_financeiro_empresa ON public.orcamento_financeiro(empresa_id);
