import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Subcategoria {
  id: string;
  categoria_id: string;
  nome: string;
  descricao: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubcategoriaInput {
  categoria_id: string;
  nome: string;
  descricao?: string;
}

export function useSubcategorias(categoriaId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: subcategorias = [], isLoading } = useQuery({
    queryKey: ["subcategorias", categoriaId],
    queryFn: async () => {
      let query = supabase.from("subcategorias").select("*").order("nome");
      if (categoriaId) {
        query = query.eq("categoria_id", categoriaId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Subcategoria[];
    },
  });

  const createSubcategoria = useMutation({
    mutationFn: async (input: SubcategoriaInput) => {
      const { data, error } = await supabase
        .from("subcategorias")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcategorias"] });
      toast({ title: "Subcategoria criada com sucesso!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao criar subcategoria", description: error.message, variant: "destructive" });
    },
  });

  const updateSubcategoria = useMutation({
    mutationFn: async ({ id, ...input }: Partial<SubcategoriaInput> & { id: string }) => {
      const { data, error } = await supabase
        .from("subcategorias")
        .update(input)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcategorias"] });
      toast({ title: "Subcategoria atualizada!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar subcategoria", description: error.message, variant: "destructive" });
    },
  });

  const deleteSubcategoria = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subcategorias").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcategorias"] });
      toast({ title: "Subcategoria excluída!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao excluir subcategoria", description: error.message, variant: "destructive" });
    },
  });

  return {
    subcategorias,
    isLoading,
    createSubcategoria,
    updateSubcategoria,
    deleteSubcategoria,
  };
}
