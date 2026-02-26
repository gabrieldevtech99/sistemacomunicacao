import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type StatusOrcamento = "rascunho" | "enviado" | "aprovado" | "rejeitado";

export interface OrcamentoItem {
  id?: string;
  orcamento_id?: string;
  produto_id?: string | null;
  descricao: string;
  quantidade: number;
  unidade: string;
  valor_unitario: number;
  valor_total: number;
}

export interface Orcamento {
  id: string;
  empresa_id: string;
  cliente_id: string | null;
  numero: number;
  status: StatusOrcamento;
  prazo_entrega: string | null;
  dias_uteis: number | null;
  valor_total: number;
  desconto: number;
  valor_final: number;
  observacoes: string | null;
  validade: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  vendedor_nome: string | null;
  cliente?: { id: string; nome: string; telefone: string | null } | null;
  itens?: OrcamentoItem[];
}

export interface OrcamentoInput {
  cliente_id?: string;
  prazo_entrega?: string;
  dias_uteis?: number;
  desconto?: number;
  observacoes?: string;
  validade?: string;
  garantia_servico?: string;
  requisitos?: string;
  formas_pagamento?: string;
  chave_pix?: string;
  banco?: string;
  vendedor_nome?: string;
  numero_manual?: string;
  endereco_entrega?: string;
  descricao_servico?: string;
  itens: OrcamentoItem[];
}

export function useOrcamentos() {
  const { empresaAtiva } = useEmpresa();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: orcamentos = [], isLoading } = useQuery({
    queryKey: ["orcamentos", empresaAtiva?.id],
    queryFn: async () => {
      if (!empresaAtiva?.id) return [];
      const { data, error } = await supabase
        .from("orcamentos")
        .select(`
          *,
          cliente:clientes(id, nome, telefone)
        `)
        .eq("empresa_id", empresaAtiva.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Orcamento[];
    },
    enabled: !!empresaAtiva?.id,
  });

  const getOrcamentoComItens = async (id: string): Promise<Orcamento | null> => {
    const { data: orcamento, error: orcError } = await supabase
      .from("orcamentos")
      .select(`
        *,
        cliente:clientes(id, nome, telefone)
      `)
      .eq("id", id)
      .single();
    if (orcError) throw orcError;

    const { data: itens, error: itensError } = await supabase
      .from("orcamento_itens")
      .select("*")
      .eq("orcamento_id", id)
      .order("created_at");
    if (itensError) throw itensError;

    return { ...orcamento, itens } as Orcamento;
  };

  const createOrcamento = useMutation({
    mutationFn: async (input: OrcamentoInput) => {
      if (!empresaAtiva?.id) throw new Error("Empresa não selecionada");

      const valorTotal = input.itens.reduce((sum, item) => sum + item.valor_total, 0);
      const valorFinal = valorTotal - (input.desconto || 0);

      const insertData: any = {
        empresa_id: empresaAtiva.id,
        cliente_id: input.cliente_id || null,
        prazo_entrega: input.prazo_entrega || null,
        dias_uteis: input.dias_uteis || null,
        valor_total: valorTotal,
        desconto: input.desconto || 0,
        valor_final: valorFinal,
        observacoes: input.observacoes || null,
        validade: input.validade || null,
        created_by: user?.id || null,
        status: "rascunho",
        garantia_servico: input.garantia_servico || null,
        requisitos: input.requisitos || null,
        formas_pagamento: input.formas_pagamento || null,
        chave_pix: input.chave_pix || null,
        banco: input.banco || null,
        vendedor_nome: input.vendedor_nome || null,
        numero_manual: input.numero_manual || '',
        numero_orcamento: input.numero_manual || '',
        endereco_entrega: input.endereco_entrega || null,
        descricao_servico: input.descricao_servico || null,
      };

      const { data: orcamento, error: orcError } = await supabase
        .from("orcamentos")
        .insert(insertData)
        .select()
        .single();

      if (orcError) throw orcError;

      if (input.itens.length > 0) {
        const itensToInsert = input.itens.map((item) => ({
          orcamento_id: orcamento.id,
          empresa_id: empresaAtiva.id,
          produto_id: item.produto_id || null,
          descricao: item.descricao,
          quantidade: item.quantidade,
          unidade: item.unidade,
          valor_unitario: item.valor_unitario,
          valor_total: item.valor_total,
        }));

        const { error: itensError } = await supabase
          .from("orcamento_itens")
          .insert(itensToInsert);
        if (itensError) throw itensError;
      }

      return orcamento;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orcamentos"] });
      toast({ title: "Orçamento criado com sucesso!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao criar orçamento", description: error.message, variant: "destructive" });
    },
  });

  const updateOrcamento = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: OrcamentoInput }) => {
      if (!empresaAtiva?.id) throw new Error("Empresa não selecionada");

      const valorTotal = input.itens.reduce((sum, item) => sum + item.valor_total, 0);
      const valorFinal = valorTotal - (input.desconto || 0);

      const updateData: any = {
        cliente_id: input.cliente_id || null,
        prazo_entrega: input.prazo_entrega || null,
        dias_uteis: input.dias_uteis || null,
        valor_total: valorTotal,
        desconto: input.desconto || 0,
        valor_final: valorFinal,
        observacoes: input.observacoes || null,
        validade: input.validade || null,
        garantia_servico: input.garantia_servico || null,
        requisitos: input.requisitos || null,
        formas_pagamento: input.formas_pagamento || null,
        chave_pix: input.chave_pix || null,
        banco: input.banco || null,
        vendedor_nome: input.vendedor_nome || null,
        numero_manual: input.numero_manual || '',
        numero_orcamento: input.numero_manual || '',
        endereco_entrega: input.endereco_entrega || null,
        descricao_servico: input.descricao_servico || null,
      };

      const { data: orcamento, error: orcError } = await supabase
        .from("orcamentos")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (orcError) throw orcError;

      // Atualizar itens: remover antigos e inserir novos
      const { error: deleteError } = await supabase
        .from("orcamento_itens")
        .delete()
        .eq("orcamento_id", id);

      if (deleteError) throw deleteError;

      if (input.itens.length > 0) {
        const itensToInsert = input.itens.map((item) => ({
          orcamento_id: id,
          empresa_id: empresaAtiva.id,
          produto_id: item.produto_id || null,
          descricao: item.descricao,
          quantidade: item.quantidade,
          unidade: item.unidade,
          valor_unitario: item.valor_unitario,
          valor_total: item.valor_total,
        }));

        const { error: itensError } = await supabase
          .from("orcamento_itens")
          .insert(itensToInsert);
        if (itensError) throw itensError;
      }

      return orcamento;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orcamentos"] });
      toast({ title: "Orçamento atualizado com sucesso!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar orçamento", description: error.message, variant: "destructive" });
    },
  });

  const updateOrcamentoStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: StatusOrcamento }) => {
      const { data, error } = await supabase
        .from("orcamentos")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orcamentos"] });
      toast({ title: "Status atualizado!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar status", description: error.message, variant: "destructive" });
    },
  });

  const deleteOrcamento = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orcamentos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orcamentos"] });
      toast({ title: "Orçamento excluído!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao excluir orçamento", description: error.message, variant: "destructive" });
    },
  });

  return {
    orcamentos,
    isLoading,
    getOrcamentoComItens,
    createOrcamento,
    updateOrcamento,
    updateOrcamentoStatus,
    deleteOrcamento,
  };
}
