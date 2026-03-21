import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface FornecedorProduto {
    id: string;
    fornecedor_id: string;
    empresa_id: string;
    nome: string;
    descricao: string | null;
    unidade: string;
    preco_atual: number;
    preco_minimo: number | null;
    created_at: string;
    updated_at: string;
    historico?: FornecedorProdutoHistorico[];
}

export interface FornecedorProdutoHistorico {
    id: string;
    fornecedor_produto_id: string;
    preco: number;
    data_compra: string;
    quantidade: number | null;
    observacoes: string | null;
    created_at: string;
}

export interface FornecedorProdutoInput {
    fornecedor_id: string;
    empresa_id: string;
    nome: string;
    descricao?: string;
    unidade?: string;
    preco_atual: number;
    preco_minimo?: number;
}

export function useFornecedorProdutos(fornecedorId: string | null) {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: produtos = [], isLoading } = useQuery({
        queryKey: ["fornecedor_produtos", fornecedorId],
        queryFn: async () => {
            if (!fornecedorId) return [];
            const { data, error } = await supabase
                .from("fornecedor_produtos")
                .select(`
          *,
          historico:fornecedor_produto_historico(*)
        `)
                .eq("fornecedor_id", fornecedorId)
                .order("nome");
            if (error) throw error;
            return data as FornecedorProduto[];
        },
        enabled: !!fornecedorId,
    });

    const createProduto = useMutation({
        mutationFn: async (input: FornecedorProdutoInput) => {
            const { data, error } = await supabase
                .from("fornecedor_produtos")
                .insert(input)
                .select()
                .single();
            if (error) throw error;
            // Registrar no histórico automaticamente
            await supabase.from("fornecedor_produto_historico").insert({
                fornecedor_produto_id: data.id,
                preco: input.preco_atual,
                data_compra: new Date().toISOString().split("T")[0],
            });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["fornecedor_produtos"] });
            toast({ title: "Produto cadastrado com sucesso!" });
        },
        onError: (error) => {
            toast({ title: "Erro ao cadastrar produto", description: error.message, variant: "destructive" });
        },
    });

    const updateProduto = useMutation({
        mutationFn: async ({ id, oldPreco, ...input }: Partial<FornecedorProdutoInput> & { id: string; oldPreco: number }) => {
            const { data, error } = await supabase
                .from("fornecedor_produtos")
                .update(input)
                .eq("id", id)
                .select()
                .single();
            if (error) throw error;
            // Se o preço mudou, registrar no histórico
            if (input.preco_atual !== undefined && input.preco_atual !== oldPreco) {
                await supabase.from("fornecedor_produto_historico").insert({
                    fornecedor_produto_id: id,
                    preco: input.preco_atual,
                    data_compra: new Date().toISOString().split("T")[0],
                });
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["fornecedor_produtos"] });
            toast({ title: "Produto atualizado!" });
        },
        onError: (error) => {
            toast({ title: "Erro ao atualizar produto", description: error.message, variant: "destructive" });
        },
    });

    const deleteProduto = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("fornecedor_produtos").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["fornecedor_produtos"] });
            toast({ title: "Produto excluído!" });
        },
        onError: (error) => {
            toast({ title: "Erro ao excluir produto", description: error.message, variant: "destructive" });
        },
    });

    const addHistorico = useMutation({
        mutationFn: async ({
            fornecedor_produto_id,
            preco,
            data_compra,
            quantidade,
            observacoes,
        }: {
            fornecedor_produto_id: string;
            preco: number;
            data_compra: string;
            quantidade?: number;
            observacoes?: string;
        }) => {
            // Atualiza o preço atual do produto
            await supabase
                .from("fornecedor_produtos")
                .update({ preco_atual: preco })
                .eq("id", fornecedor_produto_id);

            const { data, error } = await supabase
                .from("fornecedor_produto_historico")
                .insert({ fornecedor_produto_id, preco, data_compra, quantidade, observacoes })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["fornecedor_produtos"] });
            toast({ title: "Registro de compra adicionado!" });
        },
        onError: (error) => {
            toast({ title: "Erro ao registrar compra", description: error.message, variant: "destructive" });
        },
    });

    return { produtos, isLoading, createProduto, updateProduto, deleteProduto, addHistorico };
}
