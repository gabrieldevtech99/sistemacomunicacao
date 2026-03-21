-- Enum para tipos de categoria
CREATE TYPE public.tipo_categoria AS ENUM ('entrada', 'saida');

-- Enum para formas de pagamento
CREATE TYPE public.forma_pagamento AS ENUM ('dinheiro', 'pix', 'cartao', 'transferencia', 'boleto', 'outros');

-- Enum para roles de usuário na empresa
CREATE TYPE public.app_role AS ENUM ('admin', 'usuario');

-- Tabela de perfis de usuário
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem inserir seu próprio perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Tabela de empresas
CREATE TABLE public.empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT,
  email TEXT,
  telefone TEXT,
  endereco TEXT,
  sigla TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- Tabela de relacionamento usuário-empresa com role
CREATE TABLE public.empresa_usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'usuario',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, user_id)
);

ALTER TABLE public.empresa_usuarios ENABLE ROW LEVEL SECURITY;

-- Função security definer para verificar se usuário pertence à empresa
CREATE OR REPLACE FUNCTION public.user_belongs_to_empresa(p_empresa_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.empresa_usuarios
    WHERE empresa_id = p_empresa_id
    AND user_id = auth.uid()
  )
$$;

-- Função security definer para verificar role na empresa
CREATE OR REPLACE FUNCTION public.has_empresa_role(p_empresa_id UUID, p_role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.empresa_usuarios
    WHERE empresa_id = p_empresa_id
    AND user_id = auth.uid()
    AND role = p_role
  )
$$;

-- Policies para empresas
CREATE POLICY "Usuários podem ver empresas que pertencem"
  ON public.empresas FOR SELECT
  USING (public.user_belongs_to_empresa(id));

CREATE POLICY "Admins podem criar empresas"
  ON public.empresas FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins podem atualizar suas empresas"
  ON public.empresas FOR UPDATE
  USING (public.has_empresa_role(id, 'admin'));

-- Policies para empresa_usuarios
CREATE POLICY "Usuários podem ver membros de suas empresas"
  ON public.empresa_usuarios FOR SELECT
  USING (public.user_belongs_to_empresa(empresa_id));

CREATE POLICY "Admins podem adicionar usuários à empresa"
  ON public.empresa_usuarios FOR INSERT
  WITH CHECK (public.has_empresa_role(empresa_id, 'admin') OR NOT EXISTS (
    SELECT 1 FROM public.empresa_usuarios WHERE empresa_id = empresa_usuarios.empresa_id
  ));

CREATE POLICY "Admins podem remover usuários da empresa"
  ON public.empresa_usuarios FOR DELETE
  USING (public.has_empresa_role(empresa_id, 'admin'));

-- Tabela de categorias
CREATE TABLE public.categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo tipo_categoria NOT NULL,
  cor TEXT NOT NULL DEFAULT 'blue',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver categorias de suas empresas"
  ON public.categorias FOR SELECT
  USING (public.user_belongs_to_empresa(empresa_id));

CREATE POLICY "Usuários podem criar categorias em suas empresas"
  ON public.categorias FOR INSERT
  WITH CHECK (public.user_belongs_to_empresa(empresa_id));

CREATE POLICY "Usuários podem atualizar categorias de suas empresas"
  ON public.categorias FOR UPDATE
  USING (public.user_belongs_to_empresa(empresa_id));

CREATE POLICY "Admins podem deletar categorias"
  ON public.categorias FOR DELETE
  USING (public.has_empresa_role(empresa_id, 'admin'));

-- Tabela de entradas (recebimentos)
CREATE TABLE public.entradas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  valor_custo DECIMAL(12,2) NOT NULL DEFAULT 0,
  valor_venda DECIMAL(12,2) NOT NULL,
  margem_lucro DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN valor_venda > 0 THEN ((valor_venda - valor_custo) / valor_venda * 100) ELSE 0 END
  ) STORED,
  forma_pagamento forma_pagamento NOT NULL DEFAULT 'dinheiro',
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.entradas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver entradas de suas empresas"
  ON public.entradas FOR SELECT
  USING (public.user_belongs_to_empresa(empresa_id));

CREATE POLICY "Usuários podem criar entradas em suas empresas"
  ON public.entradas FOR INSERT
  WITH CHECK (public.user_belongs_to_empresa(empresa_id));

CREATE POLICY "Usuários podem atualizar entradas de suas empresas"
  ON public.entradas FOR UPDATE
  USING (public.user_belongs_to_empresa(empresa_id));

CREATE POLICY "Admins podem deletar entradas"
  ON public.entradas FOR DELETE
  USING (public.has_empresa_role(empresa_id, 'admin'));

-- Tabela de saídas (despesas)
CREATE TABLE public.saidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  forma_pagamento forma_pagamento NOT NULL DEFAULT 'dinheiro',
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.saidas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver saídas de suas empresas"
  ON public.saidas FOR SELECT
  USING (public.user_belongs_to_empresa(empresa_id));

CREATE POLICY "Usuários podem criar saídas em suas empresas"
  ON public.saidas FOR INSERT
  WITH CHECK (public.user_belongs_to_empresa(empresa_id));

CREATE POLICY "Usuários podem atualizar saídas de suas empresas"
  ON public.saidas FOR UPDATE
  USING (public.user_belongs_to_empresa(empresa_id));

CREATE POLICY "Admins podem deletar saídas"
  ON public.saidas FOR DELETE
  USING (public.has_empresa_role(empresa_id, 'admin'));

-- Tabela de produtos (estoque)
CREATE TABLE public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  unidade TEXT NOT NULL DEFAULT 'un',
  quantidade DECIMAL(12,3) NOT NULL DEFAULT 0,
  quantidade_minima DECIMAL(12,3) NOT NULL DEFAULT 0,
  valor_custo DECIMAL(12,2) NOT NULL DEFAULT 0,
  valor_venda DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver produtos de suas empresas"
  ON public.produtos FOR SELECT
  USING (public.user_belongs_to_empresa(empresa_id));

CREATE POLICY "Usuários podem criar produtos em suas empresas"
  ON public.produtos FOR INSERT
  WITH CHECK (public.user_belongs_to_empresa(empresa_id));

CREATE POLICY "Usuários podem atualizar produtos de suas empresas"
  ON public.produtos FOR UPDATE
  USING (public.user_belongs_to_empresa(empresa_id));

CREATE POLICY "Admins podem deletar produtos"
  ON public.produtos FOR DELETE
  USING (public.has_empresa_role(empresa_id, 'admin'));

-- Tabela de movimentações de estoque
CREATE TABLE public.movimentacoes_estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ajuste')),
  quantidade DECIMAL(12,3) NOT NULL,
  quantidade_anterior DECIMAL(12,3) NOT NULL,
  quantidade_nova DECIMAL(12,3) NOT NULL,
  motivo TEXT,
  referencia_id UUID,
  referencia_tipo TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver movimentações de suas empresas"
  ON public.movimentacoes_estoque FOR SELECT
  USING (public.user_belongs_to_empresa(empresa_id));

CREATE POLICY "Usuários podem criar movimentações em suas empresas"
  ON public.movimentacoes_estoque FOR INSERT
  WITH CHECK (public.user_belongs_to_empresa(empresa_id));

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON public.empresas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categorias_updated_at BEFORE UPDATE ON public.categorias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_entradas_updated_at BEFORE UPDATE ON public.entradas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_saidas_updated_at BEFORE UPDATE ON public.saidas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON public.produtos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar perfil automaticamente após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Índices para performance
CREATE INDEX idx_empresa_usuarios_user_id ON public.empresa_usuarios(user_id);
CREATE INDEX idx_empresa_usuarios_empresa_id ON public.empresa_usuarios(empresa_id);
CREATE INDEX idx_categorias_empresa_id ON public.categorias(empresa_id);
CREATE INDEX idx_entradas_empresa_id ON public.entradas(empresa_id);
CREATE INDEX idx_entradas_data ON public.entradas(data);
CREATE INDEX idx_saidas_empresa_id ON public.saidas(empresa_id);
CREATE INDEX idx_saidas_data ON public.saidas(data);
CREATE INDEX idx_produtos_empresa_id ON public.produtos(empresa_id);
CREATE INDEX idx_movimentacoes_produto_id ON public.movimentacoes_estoque(produto_id);