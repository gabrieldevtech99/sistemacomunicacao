-- Remove a policy permissiva e cria uma mais restritiva
DROP POLICY IF EXISTS "Admins podem criar empresas" ON public.empresas;

-- Apenas usuários autenticados podem criar empresas
CREATE POLICY "Usuários autenticados podem criar empresas"
  ON public.empresas FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Função para adicionar o criador como admin da empresa automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_empresa()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.empresa_usuarios (empresa_id, user_id, role)
  VALUES (NEW.id, auth.uid(), 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_empresa_created
  AFTER INSERT ON public.empresas
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_empresa();