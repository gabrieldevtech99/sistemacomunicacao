import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    useOrdemServico,
    OrdemServico as OSItem,
    STATUS_OS_LABELS,
    PRIORIDADE_LABELS,
} from "@/hooks/useOrdemServico";
import {
    Search,
    Filter,
    Calendar,
    Clock,
    AlertCircle,
    CheckCircle2,
    LayoutGrid,
    SearchX,
} from "lucide-react";
import { format, isBefore, startOfDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const PRIORIDADE_VAL: Record<string, number> = {
    urgente: 4,
    alta: 3,
    normal: 2,
    baixa: 1
};

export default function PainelOS() {
    const { ordens, isLoading } = useOrdemServico();
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"todos" | "aberto" | "andamento" | "concluido" | "atrasado">("todos");

    const isAtrasada = (os: OSItem) => {
        if (!os.data_previsao || os.status === "concluida" || os.status === "cancelada") return false;
        try {
            return isBefore(parseISO(os.data_previsao), startOfDay(new Date()));
        } catch (e) {
            return false;
        }
    };

    const filteredOrdens = (ordens || []).filter((os) => {
        const matchesSearch =
            os.titulo.toLowerCase().includes(search.toLowerCase()) ||
            os.cliente?.nome.toLowerCase().includes(search.toLowerCase()) ||
            os.numero.toString().includes(search);

        if (!matchesSearch) return false;

        if (filter === "aberto") return os.status === "aberta";
        if (filter === "andamento") return os.status === "em_andamento";
        if (filter === "concluido") return os.status === "concluida";
        if (filter === "atrasado") return isAtrasada(os);

        return true;
    }).sort((a, b) => {
        // Ordenação por prioridade (maior primeiro) e depois por prazo (mais antigo primeiro)
        const prioA = PRIORIDADE_VAL[a.prioridade] || 0;
        const prioB = PRIORIDADE_VAL[b.prioridade] || 0;

        if (prioB !== prioA) return prioB - prioA;

        const dateA = a.data_previsao || "9999-12-31";
        const dateB = b.data_previsao || "9999-12-31";
        return dateA.localeCompare(dateB);
    });

    const statusStats = {
        todos: (ordens || []).length,
        aberto: (ordens || []).filter(o => o.status === "aberta").length,
        andamento: (ordens || []).filter(o => o.status === "em_andamento").length,
        concluido: (ordens || []).filter(o => o.status === "concluida").length,
        atrasado: (ordens || []).filter(o => isAtrasada(o)).length,
    };

    return (
        <MainLayout>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Painel de Produção</h1>
                        <p className="text-muted-foreground mt-1 text-sm md:text-base">
                            Visão gerencial e acompanhamento de prazos das Ordens de Serviço.
                        </p>
                    </div>
                </div>

                {/* Filtros e Busca */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por título, cliente ou número..."
                            className="pl-9 h-11"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 p-1 bg-muted/30 rounded-lg overflow-x-auto whitespace-nowrap border">
                        <Button
                            variant={filter === "todos" ? "default" : "ghost"}
                            size="sm"
                            className="text-xs h-9"
                            onClick={() => setFilter("todos")}
                        >
                            Todos ({statusStats.todos})
                        </Button>
                        <Button
                            variant={filter === "aberto" ? "default" : "ghost"}
                            size="sm"
                            className="text-xs h-9"
                            onClick={() => setFilter("aberto")}
                        >
                            Em Aberto ({statusStats.aberto})
                        </Button>
                        <Button
                            variant={filter === "andamento" ? "default" : "ghost"}
                            size="sm"
                            className="text-xs h-9"
                            onClick={() => setFilter("andamento")}
                        >
                            Em Andamento ({statusStats.andamento})
                        </Button>
                        <Button
                            variant={filter === "concluido" ? "default" : "ghost"}
                            size="sm"
                            className="text-xs h-9"
                            onClick={() => setFilter("concluido")}
                        >
                            Concluído ({statusStats.concluido})
                        </Button>
                        <Button
                            variant={filter === "atrasado" ? "destructive" : "ghost"}
                            size="sm"
                            className="text-xs h-9"
                            onClick={() => setFilter("atrasado")}
                        >
                            Atrasado ({statusStats.atrasado})
                        </Button>
                    </div>
                </div>

                {/* Grid de OS */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-48 rounded-xl bg-muted/20 animate-pulse border border-dashed" />
                        ))}
                    </div>
                ) : filteredOrdens.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/10 rounded-2xl border border-dashed">
                        <SearchX className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                        <h3 className="text-lg font-medium">Nenhuma OS encontrada</h3>
                        <p className="text-muted-foreground">Tente ajustar seus filtros ou busca.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredOrdens.map((os) => {
                            const atrasada = isAtrasada(os);
                            return (
                                <Card key={os.id} className={`overflow-hidden border-l-4 transition-all hover:shadow-lg ${atrasada ? "border-l-destructive shadow-destructive/5" :
                                        os.status === "concluida" ? "border-l-green-500" :
                                            os.status === "em_andamento" ? "border-l-yellow-500" :
                                                "border-l-blue-500"
                                    }`}>
                                    <div className="p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">#{os.numero}</span>
                                            <Badge variant={os.prioridade === "urgente" ? "destructive" : "secondary"} className="text-[9px] h-4 px-1 leading-none uppercase">
                                                {PRIORIDADE_LABELS[os.prioridade]}
                                            </Badge>
                                        </div>

                                        <div>
                                            <h3 className="font-bold text-sm leading-tight line-clamp-2 min-h-[2.5rem]">{os.titulo}</h3>
                                            <p className="text-xs text-muted-foreground mt-1 truncate">{os.cliente?.nome || "Sem cliente"}</p>
                                        </div>

                                        <div className="flex flex-wrap gap-2 pt-1 border-t border-dashed">
                                            <div className="flex items-center gap-1.5 text-[10px] bg-muted/50 px-2 py-1 rounded">
                                                <Clock className="h-3 w-3" />
                                                {STATUS_OS_LABELS[os.status]}
                                            </div>
                                            {os.data_previsao && (
                                                <div className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded ${atrasada ? "bg-destructive/10 text-destructive font-bold" : "bg-muted/50 text-muted-foreground"}`}>
                                                    <Calendar className="h-3 w-3" />
                                                    {format(parseISO(os.data_previsao), "dd/MM/yy")}
                                                    {atrasada && " (Atrasado)"}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
