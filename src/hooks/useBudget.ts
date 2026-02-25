import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { useToast } from "@/hooks/use-toast";

export interface OrcamentoFinanceiro {
  id: string;
  empresa_id: string;
  categoria_id: string | null;
  mes: number;
  ano: number;
  valor_previsto: number;
  valor_realizado: number;
  created_at: string;
  updated_at: string;
  categoria?: { id: string; nome: string; cor: string } | null;
}

export interface BudgetInput {
  categoria_id?: string;
  mes: number;
  ano: number;
  valor_previsto: number;
}

export function useBudget(mes?: number, ano?: number) {
  const { empresaAtiva } = useEmpresa();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const currentDate = new Date();
  const targetMes = mes ?? currentDate.getMonth() + 1;
  const targetAno = ano ?? currentDate.getFullYear();

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ["budget", empresaAtiva?.id, targetMes, targetAno],
    queryFn: async () => {
      if (!empresaAtiva?.id) return [];
      const { data, error } = await supabase
        .from("orcamento_financeiro")
        .select(`
          *,
          categoria:categorias(id, nome, cor)
        `)
        .eq("empresa_id", empresaAtiva.id)
        .eq("mes", targetMes)
        .eq("ano", targetAno);
      if (error) throw error;
      return data as OrcamentoFinanceiro[];
    },
    enabled: !!empresaAtiva?.id,
  });

  const upsertBudget = useMutation({
    mutationFn: async (input: BudgetInput) => {
      if (!empresaAtiva?.id) throw new Error("Empresa não selecionada");

      // Try to find existing
      const { data: existing } = await supabase
        .from("orcamento_financeiro")
        .select("id")
        .eq("empresa_id", empresaAtiva.id)
        .eq("categoria_id", input.categoria_id || null)
        .eq("mes", input.mes)
        .eq("ano", input.ano)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("orcamento_financeiro")
          .update({ valor_previsto: input.valor_previsto })
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("orcamento_financeiro")
          .insert({
            empresa_id: empresaAtiva.id,
            categoria_id: input.categoria_id || null,
            mes: input.mes,
            ano: input.ano,
            valor_previsto: input.valor_previsto,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget"] });
      toast({ title: "Orçamento atualizado!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao salvar orçamento", description: error.message, variant: "destructive" });
    },
  });

  const deleteBudget = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orcamento_financeiro").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget"] });
      toast({ title: "Orçamento excluído!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    },
  });

  return {
    budgets,
    isLoading,
    upsertBudget,
    deleteBudget,
  };
}
