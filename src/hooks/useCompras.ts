import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { useToast } from "@/hooks/use-toast";

export type StatusCompraItem = "pendente" | "comprado" | "entregue" | "incompleto";

export interface CompraItem {
    id: string;
    compra_id: string;
    descricao: string;
    status: StatusCompraItem;
    created_at: string;
}

export interface OSCompra {
    id: string;
    empresa_id: string;
    os_id: string | null;
    status: string;
    created_at: string;
    os?: {
        id: string;
        titulo: string;
        cliente: { nome: string } | null;
    } | null;
    itens?: CompraItem[];
}

export function useCompras() {
    const { empresaAtiva } = useEmpresa();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: compras = [], isLoading } = useQuery({
        queryKey: ["os_compras", empresaAtiva?.id],
        queryFn: async () => {
            if (!empresaAtiva?.id) return [];

            const { data, error } = await supabase
                .from("os_compras")
                .select(`
                    *,
                    os:ordens_servico (
                        id,
                        titulo,
                        cliente:clientes (id, nome)
                    ),
                    itens:os_compra_itens (*)
                `)
                .eq("empresa_id", empresaAtiva.id)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Erro ao buscar compras:", error);
                // Fallback simples caso os joins falhem
                const { data: fallback, error: err2 } = await supabase
                    .from("os_compras")
                    .select("*")
                    .eq("empresa_id", empresaAtiva.id);

                if (err2) throw err2;
                return (fallback || []) as OSCompra[];
            }

            return (data || []) as OSCompra[];
        },
        enabled: !!empresaAtiva?.id,
    });

    const createCompra = useMutation({
        mutationFn: async ({ os_id }: { os_id?: string }) => {
            if (!empresaAtiva?.id) throw new Error("Empresa não selecionada");
            const { data, error } = await supabase
                .from("os_compras")
                .insert({
                    empresa_id: empresaAtiva.id,
                    os_id: os_id || null,
                    status: "pendente"
                })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["os_compras"] });
            toast({ title: "Lista de compra criada!" });
        },
        onError: (error: any) => {
            console.error("Erro ao criar compra:", error);
            toast({
                title: "Erro ao criar lista",
                description: error.message || "Verifique se a tabela de compras existe no banco.",
                variant: "destructive"
            });
        }
    });

    const addCompraItem = useMutation({
        mutationFn: async ({ compra_id, descricao }: { compra_id: string; descricao: string }) => {
            if (!empresaAtiva?.id) throw new Error("Empresa não selecionada");
            const { data, error } = await supabase
                .from("os_compra_itens")
                .insert({
                    empresa_id: empresaAtiva.id,
                    compra_id,
                    descricao,
                    status: "pendente"
                })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["os_compras"] }),
    });

    const updateItemStatus = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: StatusCompraItem }) => {
            const { error } = await supabase
                .from("os_compra_itens")
                .update({ status })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["os_compras"] }),
    });

    const deleteItem = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("os_compra_itens").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["os_compras"] }),
    });

    const deleteCompra = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("os_compras").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["os_compras"] });
            toast({ title: "Lista de compra removida" });
        },
        onError: (error: any) => {
            console.error("Erro ao excluir lista:", error);
            toast({
                title: "Erro ao excluir lista",
                description: error.message,
                variant: "destructive"
            });
        }
    });

    return {
        compras,
        isLoading,
        createCompra,
        addCompraItem,
        updateItemStatus,
        deleteItem,
        deleteCompra,
    };
}
