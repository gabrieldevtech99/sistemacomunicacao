import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { FormaPagamento } from "@/types/database";

export type StatusConta = "pendente" | "pago" | "recebido" | "vencido" | "cancelado";
export type Recorrencia = "mensal" | "semanal" | "quinzenal" | "anual";

export interface ContaPagar {
  id: string;
  empresa_id: string;
  fornecedor_id: string | null;
  categoria_id: string | null;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: StatusConta;
  forma_pagamento: FormaPagamento;
  is_despesa_fixa: boolean;
  recorrencia: Recorrencia | null;
  observacoes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  fornecedor?: { id: string; razao_social: string } | null;
  categoria?: { id: string; nome: string; cor: string } | null;
}

export interface ContaPagarInput {
  fornecedor_id?: string;
  categoria_id?: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  forma_pagamento: FormaPagamento;
  is_despesa_fixa?: boolean;
  recorrencia?: Recorrencia;
  observacoes?: string;
}

export function useContasPagar(isDespesaFixa?: boolean) {
  const { empresaAtiva } = useEmpresa();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: contas = [], isLoading } = useQuery({
    queryKey: ["contas_pagar", empresaAtiva?.id, isDespesaFixa],
    queryFn: async () => {
      if (!empresaAtiva?.id) return [];
      try {
        // Tenta a busca completa com joins
        let query = supabase
          .from("contas_pagar")
          .select(`
            *,
            fornecedor:fornecedores(id, razao_social),
            categoria:categorias(id, nome, cor)
          `)
          .eq("empresa_id", empresaAtiva.id);

        if (isDespesaFixa !== undefined) {
          query = query.eq("is_despesa_fixa", isDespesaFixa);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Erro na busca principal de contas_pagar:", error);

          // Fallback 1: Busca simples sem joins, mas respeitando empresa e tipo
          let fallbackQuery = supabase
            .from("contas_pagar")
            .select("*")
            .eq("empresa_id", empresaAtiva.id);

          if (isDespesaFixa !== undefined) {
            fallbackQuery = fallbackQuery.eq("is_despesa_fixa", isDespesaFixa);
          }

          const { data: fallbackData, error: fallbackError } = await fallbackQuery;

          if (fallbackError) {
            console.error("Erro no Fallback 1:", fallbackError);

            // Fallback 2: Busca absoluta sem filtros (apenas empresa) para garantir que apareça algo
            const { data: ultimateData, error: ultimateError } = await supabase
              .from("contas_pagar")
              .select("*")
              .eq("empresa_id", empresaAtiva.id);

            if (ultimateError) throw ultimateError;
            return ultimateData as ContaPagar[];
          }
          return fallbackData as ContaPagar[];
        }

        // Ordenação manual no JS para evitar erro de coluna no DB
        if (data) {
          const sortedData = [...data].sort((a, b) => {
            const dateA = a.data_vencimento || (a as any).vencimento || "";
            const dateB = b.data_vencimento || (b as any).vencimento || "";
            return dateA.localeCompare(dateB);
          });
          return sortedData as ContaPagar[];
        }

        return data as ContaPagar[];
      } catch (error) {
        console.error("Erro crítico no useContasPagar:", error);
        // Retorna array vazio em vez de travar a tela
        return [];
      }
    },
    enabled: !!empresaAtiva?.id,
  });

  const createConta = useMutation({
    mutationFn: async (input: ContaPagarInput) => {
      if (!empresaAtiva?.id) throw new Error("Empresa não selecionada");
      const { data, error } = await supabase
        .from("contas_pagar")
        .insert({
          empresa_id: empresaAtiva.id,
          created_by: user?.id || null,
          ...input,
          vencimento: input.data_vencimento, // Fallback para schema legado
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contas_pagar"] });
      toast({ title: "Conta a pagar cadastrada!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao cadastrar conta", description: error.message, variant: "destructive" });
    },
  });

  const marcarComoPago = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("contas_pagar")
        .update({
          status: "pago",
          data_pagamento: new Date().toISOString().split("T")[0],
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contas_pagar"] });
      toast({ title: "Conta marcada como paga!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar conta", description: error.message, variant: "destructive" });
    },
  });

  const deleteConta = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contas_pagar").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contas_pagar"] });
      toast({ title: "Conta excluída!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao excluir conta", description: error.message, variant: "destructive" });
    },
  });

  return {
    contas,
    isLoading,
    createConta,
    marcarComoPago,
    deleteConta,
  };
}
