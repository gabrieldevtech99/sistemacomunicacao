import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type StatusProduto = "em_aberto" | "em_producao" | "a_iniciar" | "finalizado";

export const STATUS_PRODUTO_OPTIONS: { value: StatusProduto; label: string; color: string }[] = [
  { value: "em_aberto", label: "Em aberto", color: "bg-yellow-500" },
  { value: "em_producao", label: "Em produção", color: "bg-blue-500" },
  { value: "a_iniciar", label: "A iniciar", color: "bg-orange-500" },
  { value: "finalizado", label: "Finalizado", color: "bg-green-500" },
];

export interface Produto {
  id: string;
  empresa_id: string;
  categoria_id: string | null;
  nome: string;
  descricao: string | null;
  unidade: string;
  quantidade: number;
  quantidade_minima: number;
  valor_custo: number;
  valor_venda: number;
  status: StatusProduto | null;
  created_at: string;
  categoria?: {
    nome: string;
  };
}

export function useProdutos() {
  const { empresaAtiva } = useEmpresa();

  return useQuery({
    queryKey: ["produtos", empresaAtiva?.id],
    queryFn: async () => {
      if (!empresaAtiva) return [];

      // Simplificamos a query para garantir que os produtos apareçam
      // O join com 'categoria' pode falhar se o RLS dela estiver bloqueando
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("empresa_id", empresaAtiva.id)
        .order("nome");

      if (error) {
        console.error("Erro Supabase (Produtos):", error);
        throw error;
      }

      console.log("Produtos carregados:", data?.length || 0);
      return (data || []) as Produto[];
    },
    enabled: !!empresaAtiva,
  });
}

export function useCreateProduto() {
  const queryClient = useQueryClient();
  const { empresaAtiva } = useEmpresa();

  return useMutation({
    mutationFn: async (produto: {
      nome: string;
      descricao?: string;
      unidade: string;
      quantidade: number;
      quantidade_minima: number;
      valor_custo: number;
      valor_venda: number;
      categoria_id?: string;
    }) => {
      if (!empresaAtiva) throw new Error("Nenhuma empresa selecionada");

      const { data, error } = await supabase
        .from("produtos")
        .insert({
          ...produto,
          empresa_id: empresaAtiva.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      toast.success("Produto cadastrado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar produto: " + error.message);
    },
  });
}

export function useUpdateProduto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      nome?: string;
      descricao?: string;
      unidade?: string;
      quantidade?: number;
      quantidade_minima?: number;
      valor_custo?: number;
      valor_venda?: number;
      categoria_id?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("produtos")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      toast.success("Produto atualizado!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar produto: " + error.message);
    },
  });
}

export function useDeleteProduto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("produtos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      toast.success("Produto excluído!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir produto: " + error.message);
    },
  });
}

export function useAjustarEstoque() {
  const queryClient = useQueryClient();
  const { empresaAtiva } = useEmpresa();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      produto_id,
      quantidade,
      tipo,
      motivo,
    }: {
      produto_id: string;
      quantidade: number;
      tipo: "entrada" | "saida" | "ajuste";
      motivo?: string;
    }) => {
      if (!empresaAtiva) throw new Error("Nenhuma empresa selecionada");

      // Buscar produto atual
      const { data: produto, error: produtoError } = await supabase
        .from("produtos")
        .select("quantidade")
        .eq("id", produto_id)
        .single();

      if (produtoError) throw produtoError;

      const quantidadeAnterior = Number(produto.quantidade);
      let quantidadeNova: number;

      if (tipo === "entrada") {
        quantidadeNova = quantidadeAnterior + quantidade;
      } else if (tipo === "saida") {
        quantidadeNova = quantidadeAnterior - quantidade;
      } else {
        quantidadeNova = quantidade;
      }

      // Registrar movimentação
      const { error: movError } = await supabase.from("movimentacoes_estoque").insert({
        empresa_id: empresaAtiva.id,
        produto_id,
        tipo,
        quantidade,
        quantidade_anterior: quantidadeAnterior,
        quantidade_nova: quantidadeNova,
        motivo,
        created_by: user?.id,
      });

      if (movError) throw movError;

      // Atualizar quantidade do produto
      const { data, error } = await supabase
        .from("produtos")
        .update({ quantidade: quantidadeNova })
        .eq("id", produto_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      queryClient.invalidateQueries({ queryKey: ["movimentacoes"] });
      toast.success("Estoque atualizado!");
    },
    onError: (error) => {
      toast.error("Erro ao ajustar estoque: " + error.message);
    },
  });
}
