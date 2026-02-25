import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { FormaPagamento } from "@/types/database";

export interface Saida {
  id: string;
  empresa_id: string;
  categoria_id: string | null;
  descricao: string;
  valor: number;
  forma_pagamento: FormaPagamento;
  data: string;
  observacoes: string | null;
  created_by: string | null;
  created_at: string;
  categoria?: {
    nome: string;
  };
}

export function useSaidas(filters?: { startDate?: string; endDate?: string }) {
  const { empresaAtiva } = useEmpresa();

  return useQuery({
    queryKey: ["saidas", empresaAtiva?.id, filters],
    queryFn: async () => {
      if (!empresaAtiva) return [];

      let query = supabase
        .from("saidas")
        .select("*, categoria:categorias(nome)")
        .eq("empresa_id", empresaAtiva.id)
        .order("data", { ascending: false });

      if (filters?.startDate) {
        query = query.gte("data", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("data", filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Saida[];
    },
    enabled: !!empresaAtiva,
  });
}

export function useCreateSaida() {
  const queryClient = useQueryClient();
  const { empresaAtiva } = useEmpresa();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (saida: {
      descricao: string;
      valor: number;
      forma_pagamento: FormaPagamento;
      data: string;
      categoria_id?: string;
      observacoes?: string;
    }) => {
      if (!empresaAtiva) throw new Error("Nenhuma empresa selecionada");

      const { data, error } = await supabase
        .from("saidas")
        .insert({
          descricao: saida.descricao,
          valor: saida.valor,
          forma_pagamento: saida.forma_pagamento,
          data: saida.data,
          categoria_id: saida.categoria_id,
          observacoes: saida.observacoes,
          empresa_id: empresaAtiva.id,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saidas"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Saída registrada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao registrar saída: " + error.message);
    },
  });
}

export function useUpdateSaida() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      descricao?: string;
      valor?: number;
      forma_pagamento?: FormaPagamento;
      data?: string;
      categoria_id?: string | null;
      observacoes?: string;
    }) => {
      const { data, error } = await supabase
        .from("saidas")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saidas"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Saída atualizada!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar saída: " + error.message);
    },
  });
}

export function useDeleteSaida() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("saidas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saidas"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Saída excluída!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir saída: " + error.message);
    },
  });
}
