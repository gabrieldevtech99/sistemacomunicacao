import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { FormaPagamento } from "@/types/database";

export type StatusConta = "pendente" | "pago" | "recebido" | "vencido" | "cancelado";

export interface ContaReceber {
  id: string;
  empresa_id: string;
  cliente_id: string | null;
  pedido_id: string | null;
  categoria_id: string | null;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_recebimento: string | null;
  status: StatusConta;
  forma_pagamento: FormaPagamento;
  observacoes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  cliente?: { id: string; nome: string } | null;
  categoria?: { id: string; nome: string; cor: string } | null;
}

export interface ContaReceberInput {
  cliente_id?: string;
  pedido_id?: string;
  categoria_id?: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  forma_pagamento: FormaPagamento;
  observacoes?: string;
}

export function useContasReceber() {
  const { empresaAtiva } = useEmpresa();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: contas = [], isLoading } = useQuery({
    queryKey: ["contas_receber", empresaAtiva?.id],
    queryFn: async () => {
      if (!empresaAtiva?.id) return [];
      try {
        const { data, error } = await supabase
          .from("contas_receber")
          .select(`
            *,
            cliente:clientes(id, nome),
            categoria:categorias(id, nome, cor)
          `)
          .eq("empresa_id", empresaAtiva.id);

        if (error) {
          console.error("Erro na busca principal de contas_receber:", error);
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("contas_receber")
            .select("*")
            .eq("empresa_id", empresaAtiva.id);

          if (fallbackError) throw fallbackError;
          return (fallbackData || []) as ContaReceber[];
        }

        if (data) {
          const sortedData = [...data].sort((a, b) => {
            const dateA = a.data_vencimento || (a as any).vencimento || "";
            const dateB = b.data_vencimento || (b as any).vencimento || "";
            return dateA.localeCompare(dateB);
          });
          return sortedData as ContaReceber[];
        }
        return (data || []) as ContaReceber[];
      } catch (error) {
        console.error("Erro crítico no useContasReceber:", error);
        return [];
      }
    },
    enabled: !!empresaAtiva?.id,
  });

  const createConta = useMutation({
    mutationFn: async (input: ContaReceberInput) => {
      if (!empresaAtiva?.id) throw new Error("Empresa não selecionada");
      const { data, error } = await supabase
        .from("contas_receber")
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
      queryClient.invalidateQueries({ queryKey: ["contas_receber"] });
      toast({ title: "Conta a receber cadastrada!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao cadastrar conta", description: error.message, variant: "destructive" });
    },
  });

  const marcarComoRecebido = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("contas_receber")
        .update({
          status: "recebido",
          data_recebimento: new Date().toISOString().split("T")[0],
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contas_receber"] });
      toast({ title: "Conta marcada como recebida!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar conta", description: error.message, variant: "destructive" });
    },
  });

  const deleteConta = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contas_receber").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contas_receber"] });
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
    marcarComoRecebido,
    deleteConta,
  };
}
