import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { FormaPagamento } from "@/types/database";

export interface Entrada {
  id: string;
  empresa_id: string;
  categoria_id: string | null;
  descricao: string;
  valor_custo: number;
  valor_venda: number;
  margem_lucro: number;
  forma_pagamento: FormaPagamento;
  data: string;
  observacoes: string | null;
  created_by: string | null;
  created_at: string;
  categoria?: {
    nome: string;
  };
}

export function useEntradas(filters?: { startDate?: string; endDate?: string }) {
  const { empresaAtiva } = useEmpresa();

  return useQuery({
    queryKey: ["entradas", empresaAtiva?.id, filters],
    queryFn: async () => {
      if (!empresaAtiva) return [];

      let query = supabase
        .from("entradas")
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
      return data as Entrada[];
    },
    enabled: !!empresaAtiva,
  });
}

export function useCreateEntrada() {
  const queryClient = useQueryClient();
  const { empresaAtiva } = useEmpresa();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (entrada: {
      descricao: string;
      valor_custo: number;
      valor_venda: number;
      forma_pagamento: FormaPagamento;
      data: string;
      categoria_id?: string;
      observacoes?: string;
    }) => {
      if (!empresaAtiva) throw new Error("Nenhuma empresa selecionada");

      const { data, error } = await supabase
        .from("entradas")
        .insert({
          descricao: entrada.descricao,
          valor_custo: entrada.valor_custo,
          valor_venda: entrada.valor_venda,
          forma_pagamento: entrada.forma_pagamento,
          data: entrada.data,
          categoria_id: entrada.categoria_id,
          observacoes: entrada.observacoes,
          empresa_id: empresaAtiva.id,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entradas"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Entrada registrada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao registrar entrada: " + error.message);
    },
  });
}

export function useUpdateEntrada() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      descricao?: string;
      valor_custo?: number;
      valor_venda?: number;
      forma_pagamento?: FormaPagamento;
      data?: string;
      categoria_id?: string | null;
      observacoes?: string;
    }) => {
      const { data, error } = await supabase
        .from("entradas")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entradas"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Entrada atualizada!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar entrada: " + error.message);
    },
  });
}

export function useDeleteEntrada() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("entradas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entradas"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Entrada excluída!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir entrada: " + error.message);
    },
  });
}
