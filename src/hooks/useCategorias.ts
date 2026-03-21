import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { toast } from "sonner";

export interface Categoria {
  id: string;
  empresa_id: string;
  nome: string;
  descricao: string | null;
  tipo: "entrada" | "saida";
  cor: string;
  created_at: string;
}

export function useCategorias() {
  const { empresaAtiva } = useEmpresa();

  return useQuery({
    queryKey: ["categorias", empresaAtiva?.id],
    queryFn: async () => {
      if (!empresaAtiva) return [];

      const { data, error } = await supabase
        .from("categorias")
        .select("*")
        .eq("empresa_id", empresaAtiva.id)
        .order("nome");

      if (error) throw error;
      return data as Categoria[];
    },
    enabled: !!empresaAtiva,
  });
}

export function useCreateCategoria() {
  const queryClient = useQueryClient();
  const { empresaAtiva } = useEmpresa();

  return useMutation({
    mutationFn: async (categoria: {
      nome: string;
      descricao?: string;
      tipo: "entrada" | "saida";
      cor: string;
    }) => {
      if (!empresaAtiva) throw new Error("Nenhuma empresa selecionada");

      const { data, error } = await supabase
        .from("categorias")
        .insert({
          ...categoria,
          empresa_id: empresaAtiva.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      toast.success("Categoria criada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar categoria: " + error.message);
    },
  });
}

export function useUpdateCategoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      nome?: string;
      descricao?: string;
      cor?: string;
    }) => {
      const { data, error } = await supabase
        .from("categorias")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      toast.success("Categoria atualizada!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar categoria: " + error.message);
    },
  });
}

export function useDeleteCategoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("categorias")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      toast.success("Categoria excluída!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir categoria: " + error.message);
    },
  });
}
