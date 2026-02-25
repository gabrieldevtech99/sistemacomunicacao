
-- ============================================================
-- SCRIPT DE CURA DEFINITIVA: Sincronização Total de Ordens de Serviço
-- Resolvendo: numero_os, enums, colunas faltantes e permissões
-- ============================================================

DO $$
BEGIN
    -- 1. CORREÇÃO DE NOMES (numero_os -> numero)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ordens_servico' AND column_name='numero_os') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ordens_servico' AND column_name='numero') THEN
        ALTER TABLE public.ordens_servico RENAME COLUMN numero_os TO numero;
    END IF;

    -- 2. GARANTIA DE COLUNA AUTO-INCREMENTO (numero)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ordens_servico' AND column_name='numero') THEN
        ALTER TABLE public.ordens_servico ADD COLUMN numero SERIAL;
    ELSE
        -- Se existe mas não tem default (o que causa o erro de null), adiciona uma sequência
        IF (SELECT column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='ordens_servico' AND column_name='numero') IS NULL THEN
            BEGIN
                CREATE SEQUENCE IF NOT EXISTS ordens_servico_numero_seq;
                ALTER TABLE public.ordens_servico ALTER COLUMN numero SET DEFAULT nextval('ordens_servico_numero_seq');
                -- Sincronizar sequência com o maior número existente
                PERFORM setval('ordens_servico_numero_seq', COALESCE((SELECT MAX(numero) FROM public.ordens_servico), 0) + 1);
            EXCEPTION WHEN OTHERS THEN
                NULL; -- Ignora erros se já houver default de outra forma
            END;
        END IF;
    END IF;

    -- 3. CONVERSÃO DE ENUMS PARA TEXT (Segurança Máxima)
    -- Converter status
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ordens_servico' AND column_name='status') THEN
        ALTER TABLE public.ordens_servico ALTER COLUMN status TYPE TEXT USING status::TEXT;
        ALTER TABLE public.ordens_servico ALTER COLUMN status SET DEFAULT 'aberta';
    END IF;
    
    -- Converter prioridade
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ordens_servico' AND column_name='prioridade') THEN
        ALTER TABLE public.ordens_servico ALTER COLUMN prioridade TYPE TEXT USING prioridade::TEXT;
        ALTER TABLE public.ordens_servico ALTER COLUMN prioridade SET DEFAULT 'normal';
    END IF;

    -- 4. GARANTIA DE TODAS AS COLUNAS RESTANTES
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ordens_servico' AND column_name='titulo') THEN
        ALTER TABLE public.ordens_servico ADD COLUMN titulo TEXT NOT NULL DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ordens_servico' AND column_name='descricao') THEN
        ALTER TABLE public.ordens_servico ADD COLUMN descricao TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ordens_servico' AND column_name='cliente_id') THEN
        ALTER TABLE public.ordens_servico ADD COLUMN cliente_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ordens_servico' AND column_name='data_abertura') THEN
        ALTER TABLE public.ordens_servico ADD COLUMN data_abertura DATE DEFAULT CURRENT_DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ordens_servico' AND column_name='data_previsao') THEN
        ALTER TABLE public.ordens_servico ADD COLUMN data_previsao DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ordens_servico' AND column_name='responsavel') THEN
        ALTER TABLE public.ordens_servico ADD COLUMN responsavel TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ordens_servico' AND column_name='maquinarios') THEN
        ALTER TABLE public.ordens_servico ADD COLUMN maquinarios TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ordens_servico' AND column_name='observacoes') THEN
        ALTER TABLE public.ordens_servico ADD COLUMN observacoes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ordens_servico' AND column_name='empresa_id') THEN
        ALTER TABLE public.ordens_servico ADD COLUMN empresa_id UUID;
    END IF;

END $$;

-- 5. RECARREGAR POLÍTICAS RLS (Garantir que você tem permissão de escrita)
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ordens_servico_all" ON public.ordens_servico;
CREATE POLICY "ordens_servico_all" ON public.ordens_servico FOR ALL USING (public.user_belongs_to_empresa(empresa_id));

-- 6. RECARREGAR SCHEMA
NOTIFY pgrst, 'reload schema';
