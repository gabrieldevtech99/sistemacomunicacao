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
        let query = supabase
          .from("contas_pagar")
          .select("*")
          .eq("empresa_id", empresaAtiva.id);

        if (isDespesaFixa !== undefined) {
          query = query.eq("is_despesa_fixa", isDespesaFixa);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Erro na busca de contas_pagar:", error);
          throw error;
        }

        if (!data) return [];

        return [...data].sort((a, b) => {
          const dateA = (a as any).data_vencimento || (a as any).vencimento || "";
          const dateB = (b as any).data_vencimento || (b as any).vencimento || "";
          return dateA.localeCompare(dateB);
        }) as ContaPagar[];
      } catch (error) {
        console.error("Erro crítico no useContasPagar:", error);
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
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
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
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
      toast({ title: "Conta marcada como paga!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar conta", description: error.message, variant: "destructive" });
    },
  });

  const updateConta = useMutation({
    mutationFn: async ({ id, ...input }: ContaPagarInput & { id: string }) => {
      const { data, error } = await supabase
        .from("contas_pagar")
        .update({
          ...input,
          vencimento: input.data_vencimento, // Fallback para schema legado
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contas_pagar"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
      toast({ title: "Conta atualizada!" });
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
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
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
    updateConta,
    marcarComoPago,
    deleteConta,
  };
}
