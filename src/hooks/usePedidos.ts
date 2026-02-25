import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { useToast } from "@/hooks/use-toast";

export type StatusPedido = "aguardando" | "em_producao" | "acabamento" | "pronto_entrega" | "entregue";

export interface PedidoProducao {
  id: string;
  empresa_id: string;
  orcamento_id: string | null;
  cliente_id: string | null;
  numero: number;
  status: StatusPedido;
  data_entrada: string;
  data_previsao: string | null;
  data_entrega: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  cliente?: { id: string; nome: string } | null;
  orcamento?: { id: string; numero: number; valor_final: number } | null;
}

export interface PedidoInput {
  orcamento_id?: string;
  cliente_id?: string;
  data_previsao?: string;
  observacoes?: string;
}

export const STATUS_LABELS: Record<StatusPedido, string> = {
  aguardando: "Aguardando",
  em_producao: "Em Produção",
  acabamento: "Acabamento",
  pronto_entrega: "Pronto p/ Entrega",
  entregue: "Entregue",
};

export const STATUS_ORDER: StatusPedido[] = [
  "aguardando",
  "em_producao",
  "acabamento",
  "pronto_entrega",
  "entregue",
];

export function usePedidos() {
  const { empresaAtiva } = useEmpresa();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ["pedidos", empresaAtiva?.id],
    queryFn: async () => {
      if (!empresaAtiva?.id) return [];
      const { data, error } = await supabase
        .from("pedidos_producao")
        .select(`
          *,
          cliente:clientes(id, nome),
          orcamento:orcamentos(id, numero, valor_final)
        `)
        .eq("empresa_id", empresaAtiva.id)
        .order("data_entrada", { ascending: false });
      if (error) throw error;
      return data as PedidoProducao[];
    },
    enabled: !!empresaAtiva?.id,
  });

  const createPedido = useMutation({
    mutationFn: async (input: PedidoInput) => {
      if (!empresaAtiva?.id) throw new Error("Empresa não selecionada");
      const { data, error } = await supabase
        .from("pedidos_producao")
        .insert({
          empresa_id: empresaAtiva.id,
          orcamento_id: input.orcamento_id || null,
          cliente_id: input.cliente_id || null,
          data_previsao: input.data_previsao || null,
          observacoes: input.observacoes || null,
          status: "aguardando",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
      toast({ title: "Pedido de produção criado!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao criar pedido", description: error.message, variant: "destructive" });
    },
  });

  const updatePedidoStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: StatusPedido }) => {
      const updateData: Record<string, unknown> = { status };
      if (status === "entregue") {
        updateData.data_entrega = new Date().toISOString().split("T")[0];
      }
      const { data, error } = await supabase
        .from("pedidos_producao")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar status", description: error.message, variant: "destructive" });
    },
  });

  const deletePedido = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pedidos_producao").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
      toast({ title: "Pedido excluído!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao excluir pedido", description: error.message, variant: "destructive" });
    },
  });

  return {
    pedidos,
    isLoading,
    createPedido,
    updatePedidoStatus,
    deletePedido,
  };
}
