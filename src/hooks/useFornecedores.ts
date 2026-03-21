import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { useToast } from "@/hooks/use-toast";

export interface Fornecedor {
  id: string;
  empresa_id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  tipo_material: string | null;
  contato_nome: string | null;
  contato_telefone: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FornecedorInput {
  razao_social: string;
  nome_fantasia?: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  tipo_material?: string;
  contato_nome?: string;
  contato_telefone?: string;
  observacoes?: string;
}

export function useFornecedores() {
  const { empresaAtiva } = useEmpresa();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: fornecedores = [], isLoading } = useQuery({
    queryKey: ["fornecedores", empresaAtiva?.id],
    queryFn: async () => {
      if (!empresaAtiva?.id) return [];
      const { data, error } = await supabase
        .from("fornecedores")
        .select("*")
        .eq("empresa_id", empresaAtiva.id)
        .order("razao_social");
      if (error) throw error;
      return data as Fornecedor[];
    },
    enabled: !!empresaAtiva?.id,
  });

  const createFornecedor = useMutation({
    mutationFn: async (input: FornecedorInput) => {
      if (!empresaAtiva?.id) throw new Error("Empresa não selecionada");
      const { data, error } = await supabase
        .from("fornecedores")
        .insert({ ...input, empresa_id: empresaAtiva.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
      toast({ title: "Fornecedor cadastrado com sucesso!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao cadastrar fornecedor", description: error.message, variant: "destructive" });
    },
  });

  const updateFornecedor = useMutation({
    mutationFn: async ({ id, ...input }: FornecedorInput & { id: string }) => {
      const { data, error } = await supabase
        .from("fornecedores")
        .update(input)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
      toast({ title: "Fornecedor atualizado com sucesso!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar fornecedor", description: error.message, variant: "destructive" });
    },
  });

  const deleteFornecedor = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fornecedores").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
      toast({ title: "Fornecedor excluído com sucesso!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao excluir fornecedor", description: error.message, variant: "destructive" });
    },
  });

  return {
    fornecedores,
    isLoading,
    createFornecedor,
    updateFornecedor,
    deleteFornecedor,
  };
}
