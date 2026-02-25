import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { useToast } from "@/hooks/use-toast";

export type StatusOS = "aberta" | "em_andamento" | "pausada" | "concluida" | "cancelada";
export type PrioridadeOS = "baixa" | "normal" | "alta" | "urgente";

export interface ChecklistItem {
    id: string;
    os_id: string;
    descricao: string;
    concluido: boolean;
    ordem: number;
    concluido_em: string | null;
    concluido_por: string | null;
    created_at: string;
}

export interface OrdemServico {
    id: string;
    empresa_id: string;
    numero: number;
    titulo: string;
    descricao: string | null;
    cliente_id: string | null;
    orcamento_id: string | null;
    status: StatusOS;
    prioridade: PrioridadeOS;
    data_abertura: string;
    data_previsao: string | null;
    data_conclusao: string | null;
    responsavel: string | null;
    maquinarios: string | null;
    observacoes: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
    cliente?: { id: string; nome: string } | null;
    orcamento?: { id: string; numero: number; valor_final: number } | null;
    checklist?: ChecklistItem[];
}

export interface OSInput {
    titulo: string;
    descricao?: string;
    cliente_id?: string;
    orcamento_id?: string;
    status?: StatusOS;
    prioridade?: PrioridadeOS;
    data_previsao?: string;
    responsavel?: string;
    maquinarios?: string;
    observacoes?: string;
}

export const STATUS_OS_LABELS: Record<StatusOS, string> = {
    aberta: "Aberta",
    em_andamento: "Em Andamento",
    pausada: "Pausada",
    concluida: "Concluída",
    cancelada: "Cancelada",
};

export const STATUS_OS_ORDER: StatusOS[] = [
    "aberta",
    "em_andamento",
    "pausada",
    "concluida",
    "cancelada",
];

export const PRIORIDADE_LABELS: Record<PrioridadeOS, string> = {
    baixa: "Baixa",
    normal: "Normal",
    alta: "Alta",
    urgente: "Urgente",
};

export function useOrdemServico() {
    const { empresaAtiva } = useEmpresa();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: ordens = [], isLoading } = useQuery({
        queryKey: ["ordens_servico", empresaAtiva?.id],
        queryFn: async () => {
            if (!empresaAtiva?.id) return [];
            try {
                // Tenta a busca completa com joins
                const { data, error } = await supabase
                    .from("ordens_servico")
                    .select(`
                        *,
                        cliente:clientes(id, nome),
                        orcamento:orcamentos(id, numero, valor_final),
                        checklist:os_checklist_itens(*)
                    `)
                    .eq("empresa_id", empresaAtiva.id);

                if (error) {
                    console.error("Erro na busca principal de ordens_servico:", error);

                    // Fallback 1: Busca apenas dados básicos da OS e Cliente (mais comum estar ok)
                    const { data: fallback1, error: err1 } = await supabase
                        .from("ordens_servico")
                        .select("*, cliente:clientes(id, nome)")
                        .eq("empresa_id", empresaAtiva.id);

                    if (err1) {
                        console.error("Erro Fallback 1 OS:", err1);
                        // Fallback 2: Busca absoluta apenas da tabela de OS
                        const { data: fallback2, error: err2 } = await supabase
                            .from("ordens_servico")
                            .select("*")
                            .eq("empresa_id", empresaAtiva.id);

                        if (err2) throw err2;
                        return (fallback2 || []) as OrdemServico[];
                    }
                    return (fallback1 || []) as OrdemServico[];
                }

                // Ordenação manual para evitar erro de coluna no DB
                if (data) {
                    return [...data].sort((a, b) => {
                        const dateA = a.data_abertura || a.created_at || "";
                        const dateB = b.data_abertura || b.created_at || "";
                        return dateB.localeCompare(dateA); // Do mais novo para o mais antigo
                    }) as OrdemServico[];
                }

                return (data || []) as OrdemServico[];
            } catch (error) {
                console.error("Erro crítico no useOrdemServico:", error);
                return [];
            }
        },
        enabled: !!empresaAtiva?.id,
    });

    const createOS = useMutation({
        mutationFn: async (input: OSInput) => {
            if (!empresaAtiva?.id) throw new Error("Empresa não selecionada");
            const { data, error } = await supabase
                .from("ordens_servico")
                .insert({
                    empresa_id: empresaAtiva.id,
                    titulo: input.titulo,
                    descricao: input.descricao || null,
                    cliente_id: input.cliente_id || null,
                    orcamento_id: input.orcamento_id || null,
                    status: input.status || "aberta",
                    prioridade: input.prioridade || "normal",
                    data_previsao: input.data_previsao || null,
                    responsavel: input.responsavel || null,
                    maquinarios: input.maquinarios || null,
                    observacoes: input.observacoes || null,
                })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ordens_servico"] });
            toast({ title: "Ordem de serviço criada com sucesso!" });
        },
        onError: (error) => {
            toast({ title: "Erro ao criar OS", description: error.message, variant: "destructive" });
        },
    });

    const updateOS = useMutation({
        mutationFn: async ({ id, ...input }: OSInput & { id: string }) => {
            const updateData: Record<string, unknown> = { ...input };
            if (input.status === "concluida") {
                updateData.data_conclusao = new Date().toISOString().split("T")[0];
            }
            const { data, error } = await supabase
                .from("ordens_servico")
                .update(updateData)
                .eq("id", id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ordens_servico"] });
            toast({ title: "OS atualizada!" });
        },
        onError: (error) => {
            toast({ title: "Erro ao atualizar OS", description: error.message, variant: "destructive" });
        },
    });

    const updateOSStatus = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: StatusOS }) => {
            const updateData: Record<string, unknown> = { status };
            if (status === "concluida") {
                updateData.data_conclusao = new Date().toISOString().split("T")[0];
            }
            const { error } = await supabase
                .from("ordens_servico")
                .update(updateData)
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ordens_servico"] });
        },
        onError: (error) => {
            toast({ title: "Erro ao atualizar status", description: error.message, variant: "destructive" });
        },
    });

    const deleteOS = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("ordens_servico").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ordens_servico"] });
            toast({ title: "OS excluída!" });
        },
        onError: (error) => {
            toast({ title: "Erro ao excluir OS", description: error.message, variant: "destructive" });
        },
    });

    // Checklist
    const addChecklistItem = useMutation({
        mutationFn: async ({ os_id, descricao, ordem }: { os_id: string; descricao: string; ordem: number }) => {
            const { data, error } = await supabase
                .from("os_checklist_itens")
                .insert({ os_id, descricao, ordem })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ordens_servico"] });
        },
        onError: (error) => {
            toast({ title: "Erro ao adicionar item", description: error.message, variant: "destructive" });
        },
    });

    const toggleChecklistItem = useMutation({
        mutationFn: async ({ id, concluido }: { id: string; concluido: boolean }) => {
            const { error } = await supabase
                .from("os_checklist_itens")
                .update({
                    concluido,
                    concluido_em: concluido ? new Date().toISOString() : null,
                })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ordens_servico"] });
        },
        onError: (error) => {
            toast({ title: "Erro ao atualizar checklist", description: error.message, variant: "destructive" });
        },
    });

    const deleteChecklistItem = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("os_checklist_itens").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ordens_servico"] });
        },
        onError: (error) => {
            toast({ title: "Erro ao remover item", description: error.message, variant: "destructive" });
        },
    });

    return {
        ordens,
        isLoading,
        createOS,
        updateOS,
        updateOSStatus,
        deleteOS,
        addChecklistItem,
        toggleChecklistItem,
        deleteChecklistItem,
    };
}
