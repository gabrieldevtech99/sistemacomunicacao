import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { useToast } from "@/hooks/use-toast";

export type TipoPessoa = "pf" | "pj";

export interface Cliente {
  id: string;
  empresa_id: string;
  nome: string;
  tipo_pessoa: TipoPessoa;
  cpf_cnpj: string | null;
  telefone: string | null;
  email: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClienteInput {
  nome: string;
  tipo_pessoa: TipoPessoa;
  cpf_cnpj?: string;
  telefone?: string;
  email?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  observacoes?: string;
}

export function useClientes() {
  const { empresaAtiva } = useEmpresa();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ["clientes", empresaAtiva?.id],
    queryFn: async () => {
      if (!empresaAtiva?.id) return [];
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("empresa_id", empresaAtiva.id)
        .order("nome");
      if (error) throw error;
      return data as Cliente[];
    },
    enabled: !!empresaAtiva?.id,
  });

  const createCliente = useMutation({
    mutationFn: async (input: ClienteInput) => {
      if (!empresaAtiva?.id) throw new Error("Empresa não selecionada");
      const { data, error } = await supabase
        .from("clientes")
        .insert({ ...input, empresa_id: empresaAtiva.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast({ title: "Cliente cadastrado com sucesso!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao cadastrar cliente", description: error.message, variant: "destructive" });
    },
  });

  const updateCliente = useMutation({
    mutationFn: async ({ id, ...input }: ClienteInput & { id: string }) => {
      const { data, error } = await supabase
        .from("clientes")
        .update(input)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast({ title: "Cliente atualizado com sucesso!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar cliente", description: error.message, variant: "destructive" });
    },
  });

  const deleteCliente = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clientes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast({ title: "Cliente excluído com sucesso!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao excluir cliente", description: error.message, variant: "destructive" });
    },
  });

  return {
    clientes,
    isLoading,
    createCliente,
    updateCliente,
    deleteCliente,
  };
}
