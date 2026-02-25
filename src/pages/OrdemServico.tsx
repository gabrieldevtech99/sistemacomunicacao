import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import {
    useOrdemServico,
    OrdemServico as OSItem,
    OSInput,
    StatusOS,
    PrioridadeOS,
    STATUS_OS_LABELS,
    STATUS_OS_ORDER,
    PRIORIDADE_LABELS,
} from "@/hooks/useOrdemServico";
import { useClientes } from "@/hooks/useClientes";
import { useEmpresa } from "@/contexts/EmpresaContext";
import {
    Plus,
    Loader2,
    Pencil,
    Trash2,
    CheckSquare,
    Calendar,
    User,
    AlertCircle,
    Wrench,
    ChevronRight,
    X,
    ClipboardList,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_COLORS: Record<StatusOS, string> = {
    aberta: "bg-blue-500/10 border-blue-500/40 text-blue-700 dark:text-blue-300",
    em_andamento: "bg-yellow-500/10 border-yellow-500/40 text-yellow-700 dark:text-yellow-300",
    pausada: "bg-orange-500/10 border-orange-500/40 text-orange-700 dark:text-orange-300",
    concluida: "bg-green-500/10 border-green-500/40 text-green-700 dark:text-green-300",
    cancelada: "bg-gray-500/10 border-gray-500/40 text-gray-500",
};

const PRIORIDADE_COLORS: Record<PrioridadeOS, string> = {
    baixa: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
    normal: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    alta: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    urgente: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const getStatusColor = (status: string | null | undefined): string => {
    if (!status) return "bg-gray-500/10 border-gray-500/40 text-gray-500";
    return STATUS_COLORS[status as StatusOS] || "bg-gray-500/10 border-gray-500/40 text-gray-500";
};

const getPrioridadeColor = (prioridade: string | null | undefined): string => {
    if (!prioridade) return "bg-gray-100 text-gray-600";
    return PRIORIDADE_COLORS[prioridade as PrioridadeOS] || "bg-gray-100 text-gray-600";
};

const KANBAN_COLUMNS: StatusOS[] = ["aberta", "em_andamento", "pausada", "concluida"];

const emptyForm: OSInput = {
    titulo: "",
    descricao: "",
    cliente_id: "",
    status: "aberta",
    prioridade: "normal",
    data_previsao: "",
    responsavel: "",
    maquinarios: "",
    observacoes: "",
};

export default function OrdemServico() {
    const { empresaAtiva } = useEmpresa();
    const {
        ordens,
        isLoading,
        createOS,
        updateOS,
        updateOSStatus,
        deleteOS,
        addChecklistItem,
        toggleChecklistItem,
        deleteChecklistItem,
    } = useOrdemServico();
    const { clientes } = useClientes();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedOS, setSelectedOS] = useState<OSItem | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<OSInput>(emptyForm);
    const [newChecklistItem, setNewChecklistItem] = useState("");
    const [activeTab, setActiveTab] = useState("kanban");

    const getOrdensByStatus = (status: StatusOS) =>
        (ordens || []).filter((o) => o?.status === status);

    const isAtrasada = (os: OSItem) => {
        if (!os?.data_previsao || os.status === "concluida" || os.status === "cancelada") return false;
        try {
            return differenceInDays(new Date(), new Date(os.data_previsao)) > 0;
        } catch (e) {
            return false;
        }
    };

    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination) return;
        const sourceStatus = result.source.droppableId as StatusOS;
        const destStatus = result.destination.droppableId as StatusOS;
        if (sourceStatus === destStatus) return;
        try {
            await updateOSStatus.mutateAsync({ id: result.draggableId, status: destStatus });
        } catch (e) {
            console.error("Erro ao mover OS:", e);
        }
    };

    const handleOpenForm = (os?: OSItem) => {
        if (os) {
            setEditingId(os.id);
            setForm({
                titulo: os.titulo,
                descricao: os.descricao || "",
                cliente_id: os.cliente_id || "",
                status: os.status,
                prioridade: os.prioridade,
                data_previsao: os.data_previsao || "",
                responsavel: os.responsavel || "",
                maquinarios: os.maquinarios || "",
                observacoes: os.observacoes || "",
            });
        } else {
            setEditingId(null);
            setForm(emptyForm);
        }
        setIsFormOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.titulo) return;
        try {
            const payload = {
                ...form,
                cliente_id: form.cliente_id || undefined,
                data_previsao: form.data_previsao || undefined,
            };
            if (editingId) {
                await updateOS.mutateAsync({ id: editingId, ...payload });
            } else {
                await createOS.mutateAsync(payload);
            }
            setIsFormOpen(false);
        } catch (e) {
            console.error("Erro no submit da OS:", e);
            // O erro já é tratado pelo onError da mutation (toast), mas o catch evita bubble up
        }
    };

    const handleSelectOS = (os: OSItem) => {
        setSelectedOS(os);
        setNewChecklistItem("");
    };

    const handleAddChecklistItem = async () => {
        if (!newChecklistItem.trim() || !selectedOS?.id) return;
        const ordem = (selectedOS.checklist?.length || 0);
        try {
            await addChecklistItem.mutateAsync({
                os_id: selectedOS.id,
                descricao: newChecklistItem.trim(),
                ordem,
            });
            setNewChecklistItem("");
            // Refresh selectedOS from updated ordens
            if (selectedOS?.id) {
                const updated = (ordens || []).find((o) => o.id === selectedOS.id);
                if (updated) setSelectedOS(updated);
            }
        } catch (e) {
            console.error("Erro ao adicionar item ao checklist:", e);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Tem certeza que deseja excluir esta OS?")) {
            await deleteOS.mutateAsync(id);
            if (selectedOS?.id === id) setSelectedOS(null);
        }
    };

    const checklistProgress = (os: OSItem) => {
        const total = os.checklist?.length || 0;
        const done = os.checklist?.filter((i) => i.concluido).length || 0;
        return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
    };

    // Keep selectedOS in sync with ordens data
    const currentSelectedOS = selectedOS
        ? (ordens || []).find((o) => o.id === selectedOS.id) || selectedOS
        : null;

    return (
        <MainLayout>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">Ordens de Serviço</h1>
                    <p className="text-muted-foreground mt-1">
                        {(ordens || []).length} OS encontradas
                    </p>
                </div>
                <Button className="gap-2" onClick={() => handleOpenForm()}>
                    <Plus className="h-4 w-4" />
                    Nova OS
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                    <TabsTrigger value="kanban" className="gap-2">
                        <ClipboardList className="h-4 w-4" />
                        Painel Kanban
                    </TabsTrigger>
                    <TabsTrigger value="lista" className="gap-2">
                        <CheckSquare className="h-4 w-4" />
                        Lista
                    </TabsTrigger>
                </TabsList>

                {/* ========== KANBAN ========== */}
                <TabsContent value="kanban">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="flex gap-4 overflow-x-auto pb-4">
                            <DragDropContext onDragEnd={handleDragEnd}>
                                {KANBAN_COLUMNS.map((status) => (
                                    <div key={status} className="min-w-[280px] flex-shrink-0">
                                        <div className={`rounded-xl border-2 ${getStatusColor(status)} bg-background`}>
                                            <div className="flex items-center justify-between px-4 py-3 border-b border-current/20">
                                                <span className="font-semibold text-sm">{STATUS_OS_LABELS[status] || status}</span>
                                                <Badge variant="secondary" className="text-xs">
                                                    {(getOrdensByStatus(status) || []).length}
                                                </Badge>
                                            </div>
                                            <Droppable droppableId={status}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.droppableProps}
                                                        className={`min-h-[400px] p-2 space-y-2 transition-colors ${snapshot.isDraggingOver ? "bg-primary/5" : ""
                                                            }`}
                                                    >
                                                        {getOrdensByStatus(status).map((os, index) => {
                                                            const prog = checklistProgress(os);
                                                            const atrasada = isAtrasada(os);
                                                            return (
                                                                <Draggable key={os.id} draggableId={os.id} index={index}>
                                                                    {(provided, snapshot) => (
                                                                        <div
                                                                            ref={provided.innerRef}
                                                                            {...provided.draggableProps}
                                                                            {...provided.dragHandleProps}
                                                                            className={`p-3 bg-card rounded-lg border shadow-sm cursor-pointer transition-all hover:shadow-md ${snapshot.isDragging ? "shadow-lg rotate-1" : ""
                                                                                } ${currentSelectedOS?.id === os.id ? "ring-2 ring-primary" : ""}`}
                                                                            onClick={() => handleSelectOS(os)}
                                                                        >
                                                                            <div className="flex items-start justify-between mb-2">
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <span className="font-bold text-xs text-muted-foreground">#{os.numero || "?"}</span>
                                                                                    {atrasada && <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
                                                                                </div>
                                                                                <Badge className={`text-[10px] px-1.5 py-0 ${getPrioridadeColor(os.prioridade)}`}>
                                                                                    {PRIORIDADE_LABELS[os.prioridade] || os.prioridade}
                                                                                </Badge>
                                                                            </div>

                                                                            <p className="font-medium text-sm mb-2 line-clamp-2">{os.titulo}</p>

                                                                            {os.cliente && (
                                                                                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                                                                    <User className="h-3 w-3" />
                                                                                    {os.cliente.nome}
                                                                                </div>
                                                                            )}

                                                                            {os.responsavel && (
                                                                                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                                                                    <Wrench className="h-3 w-3" />
                                                                                    {os.responsavel}
                                                                                </div>
                                                                            )}

                                                                            {os.data_previsao && (
                                                                                <div className={`flex items-center gap-1 text-xs mb-2 ${atrasada ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                                                                                    <Calendar className="h-3 w-3" />
                                                                                    {(() => {
                                                                                        try {
                                                                                            return format(new Date(os.data_previsao + "T00:00"), "dd/MM/yyyy", { locale: ptBR });
                                                                                        } catch (e) {
                                                                                            return os.data_previsao;
                                                                                        }
                                                                                    })()}
                                                                                </div>
                                                                            )}

                                                                            {prog.total > 0 && (
                                                                                <div className="mt-2">
                                                                                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                                                                                        <span>Checklist</span>
                                                                                        <span>{prog.done}/{prog.total}</span>
                                                                                    </div>
                                                                                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                                                        <div
                                                                                            className="h-full bg-primary rounded-full transition-all"
                                                                                            style={{ width: `${prog.pct}%` }}
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </Draggable>
                                                            );
                                                        })}
                                                        {provided.placeholder}
                                                        {getOrdensByStatus(status).length === 0 && (
                                                            <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
                                                                Nenhuma OS
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </Droppable>
                                        </div>
                                    </div>
                                ))}
                            </DragDropContext>
                        </div>
                    )}
                </TabsContent>

                {/* ========== LISTA ========== */}
                <TabsContent value="lista">
                    <Card>
                        <CardContent className="p-0">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            ) : ordens.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    Nenhuma OS cadastrada
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {ordens.map((os) => {
                                        const prog = checklistProgress(os);
                                        const atrasada = isAtrasada(os);
                                        return (
                                            <div
                                                key={os.id}
                                                className={`flex items-center gap-4 p-4 hover:bg-muted/40 cursor-pointer transition-colors ${currentSelectedOS?.id === os.id ? "bg-primary/5" : ""
                                                    }`}
                                                onClick={() => handleSelectOS(os)}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-sm font-bold text-muted-foreground">#{os.numero}</span>
                                                        <span className="font-medium truncate">{os.titulo}</span>
                                                        {atrasada && <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />}
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                                                        {os.cliente && <span className="flex items-center gap-1"><User className="h-3 w-3" />{os.cliente.nome}</span>}
                                                        {os.responsavel && <span className="flex items-center gap-1"><Wrench className="h-3 w-3" />{os.responsavel}</span>}
                                                        {os.data_previsao && (
                                                            <span className={`flex items-center gap-1 ${atrasada ? "text-destructive" : ""}`}>
                                                                <Calendar className="h-3 w-3" />
                                                                {(() => {
                                                                    try {
                                                                        return format(new Date(os.data_previsao + "T00:00"), "dd/MM/yyyy");
                                                                    } catch (e) {
                                                                        return os.data_previsao;
                                                                    }
                                                                })()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <Badge className={`text-[11px] ${getPrioridadeColor(os.prioridade)}`}>
                                                        {PRIORIDADE_LABELS[os.prioridade] || os.prioridade}
                                                    </Badge>
                                                    <Badge variant="outline" className={`text-[11px] ${getStatusColor(os.status)}`}>
                                                        {STATUS_OS_LABELS[os.status] || os.status}
                                                    </Badge>
                                                    {prog.total > 0 && (
                                                        <span className="text-xs text-muted-foreground">{prog.done}/{prog.total}</span>
                                                    )}
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* ========== PAINEL LATERAL - DETALHES DA OS ========== */}
            {currentSelectedOS && (
                <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={() => setSelectedOS(null)}>
                    <div
                        className="w-full max-w-lg h-full bg-background border-l shadow-2xl overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 bg-background border-b z-10">
                            <div className="flex items-center justify-between p-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-muted-foreground">#{currentSelectedOS.numero}</span>
                                        <Badge className={`text-xs ${getStatusColor(currentSelectedOS.status)}`}>
                                            {STATUS_OS_LABELS[currentSelectedOS.status] || currentSelectedOS.status}
                                        </Badge>
                                        <Badge className={`text-xs ${getPrioridadeColor(currentSelectedOS.prioridade)}`}>
                                            {PRIORIDADE_LABELS[currentSelectedOS.prioridade] || currentSelectedOS.prioridade}
                                        </Badge>
                                    </div>
                                    <h2 className="font-bold text-lg mt-1 pr-4">{currentSelectedOS.titulo}</h2>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => handleOpenForm(currentSelectedOS)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(currentSelectedOS.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => setSelectedOS(null)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 space-y-5">
                            {/* Alterar status rápido */}
                            <div>
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Alterar Status</Label>
                                <div className="flex flex-wrap gap-2">
                                    {STATUS_OS_ORDER.map((s) => (
                                        <Button
                                            key={s}
                                            size="sm"
                                            variant={currentSelectedOS.status === s ? "default" : "outline"}
                                            onClick={() => updateOSStatus.mutateAsync({ id: currentSelectedOS.id, status: s })}
                                            className="text-xs h-7"
                                        >
                                            {STATUS_OS_LABELS[s]}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Informações */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                {currentSelectedOS.cliente && (
                                    <div>
                                        <span className="text-xs text-muted-foreground block">Cliente</span>
                                        <span className="font-medium">{currentSelectedOS.cliente.nome}</span>
                                    </div>
                                )}
                                {currentSelectedOS.responsavel && (
                                    <div>
                                        <span className="text-xs text-muted-foreground block">Responsável</span>
                                        <span className="font-medium">{currentSelectedOS.responsavel}</span>
                                    </div>
                                )}
                                {currentSelectedOS.data_abertura && (
                                    <div>
                                        <span className="text-xs text-muted-foreground block">Data de Abertura</span>
                                        <span className="font-medium">
                                            {(() => {
                                                try {
                                                    return format(new Date(currentSelectedOS.data_abertura + "T00:00"), "dd/MM/yyyy");
                                                } catch (e) {
                                                    return currentSelectedOS.data_abertura;
                                                }
                                            })()}
                                        </span>
                                    </div>
                                )}
                                {currentSelectedOS.data_previsao && (
                                    <div>
                                        <span className="text-xs text-muted-foreground block">Previsão</span>
                                        <span className={`font-medium ${isAtrasada(currentSelectedOS) ? "text-destructive" : ""}`}>
                                            {(() => {
                                                try {
                                                    return format(new Date(currentSelectedOS.data_previsao + "T00:00"), "dd/MM/yyyy");
                                                } catch (e) {
                                                    return currentSelectedOS.data_previsao;
                                                }
                                            })()}
                                            {isAtrasada(currentSelectedOS) && " (Atrasada)"}
                                        </span>
                                    </div>
                                )}
                                {currentSelectedOS.data_conclusao && (
                                    <div>
                                        <span className="text-xs text-muted-foreground block">Concluída em</span>
                                        <span className="font-medium text-green-600">
                                            {(() => {
                                                try {
                                                    return format(new Date(currentSelectedOS.data_conclusao + "T00:00"), "dd/MM/yyyy");
                                                } catch (e) {
                                                    return currentSelectedOS.data_conclusao;
                                                }
                                            })()}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {currentSelectedOS.descricao && (
                                <div>
                                    <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Descrição</span>
                                    <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">{currentSelectedOS.descricao}</p>
                                </div>
                            )}

                            {currentSelectedOS.maquinarios && (
                                <div>
                                    <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Maquinários / Equipamentos</span>
                                    <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">{currentSelectedOS.maquinarios}</p>
                                </div>
                            )}

                            {currentSelectedOS.observacoes && (
                                <div>
                                    <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Observações</span>
                                    <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">{currentSelectedOS.observacoes}</p>
                                </div>
                            )}

                            {/* Checklist */}
                            <div>
                                <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-3">
                                    Checklist
                                    {(currentSelectedOS.checklist?.length || 0) > 0 && (
                                        <span className="ml-2 text-primary">
                                            {checklistProgress(currentSelectedOS).done}/{checklistProgress(currentSelectedOS).total}
                                        </span>
                                    )}
                                </span>

                                {/* Barra de progresso */}
                                {(currentSelectedOS.checklist?.length || 0) > 0 && (
                                    <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
                                        <div
                                            className="h-full bg-primary rounded-full transition-all"
                                            style={{ width: `${checklistProgress(currentSelectedOS).pct}%` }}
                                        />
                                    </div>
                                )}

                                <div className="space-y-2 mb-3">
                                    {(currentSelectedOS.checklist || [])
                                        .sort((a, b) => a.ordem - b.ordem)
                                        .map((item) => (
                                            <div key={item.id} className="flex items-center gap-2 group p-2 rounded-lg hover:bg-muted/50">
                                                <Checkbox
                                                    checked={item.concluido}
                                                    onCheckedChange={(checked) =>
                                                        toggleChecklistItem.mutateAsync({ id: item.id, concluido: !!checked })
                                                    }
                                                />
                                                <span className={`flex-1 text-sm ${item.concluido ? "line-through text-muted-foreground" : ""}`}>
                                                    {item.descricao}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => deleteChecklistItem.mutateAsync(item.id)}
                                                >
                                                    <X className="h-3 w-3 text-destructive" />
                                                </Button>
                                            </div>
                                        ))}
                                </div>

                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Adicionar etapa ao checklist..."
                                        value={newChecklistItem}
                                        onChange={(e) => setNewChecklistItem(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleAddChecklistItem()}
                                        className="text-sm"
                                    />
                                    <Button size="icon" onClick={handleAddChecklistItem} disabled={!newChecklistItem.trim()}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========== FORM DIALOG ========== */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Editar OS" : "Nova Ordem de Serviço"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label>Título *</Label>
                            <Input
                                value={form.titulo}
                                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                                placeholder="Título da OS"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Cliente</Label>
                                <Select value={form.cliente_id || "none"} onValueChange={(v) => setForm({ ...form, cliente_id: v === "none" ? "" : v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um cliente" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Nenhum</SelectItem>
                                        {(clientes || [])
                                            .filter(c => c && c.id)
                                            .map((c) => (
                                                <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Responsável</Label>
                                <Input
                                    value={form.responsavel || ""}
                                    onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
                                    placeholder="Nome do responsável"
                                />
                            </div>

                            <div>
                                <Label>Status</Label>
                                <Select value={form.status || "aberta"} onValueChange={(v) => setForm({ ...form, status: v as StatusOS })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STATUS_OS_ORDER.map((s) => (
                                            <SelectItem key={s} value={s}>{STATUS_OS_LABELS[s]}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Prioridade</Label>
                                <Select value={form.prioridade || "normal"} onValueChange={(v) => setForm({ ...form, prioridade: v as PrioridadeOS })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(["baixa", "normal", "alta", "urgente"] as PrioridadeOS[]).map((p) => (
                                            <SelectItem key={p} value={p}>{PRIORIDADE_LABELS[p]}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Data de Previsão</Label>
                                <Input
                                    type="date"
                                    value={form.data_previsao || ""}
                                    onChange={(e) => setForm({ ...form, data_previsao: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Descrição do Serviço</Label>
                            <Textarea
                                value={form.descricao || ""}
                                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                                placeholder="Descreva o serviço a ser realizado..."
                                rows={3}
                            />
                        </div>

                        <div>
                            <Label>Maquinários / Equipamentos Necessários</Label>
                            <Textarea
                                value={form.maquinarios || ""}
                                onChange={(e) => setForm({ ...form, maquinarios: e.target.value })}
                                placeholder="Liste os maquinários e equipamentos necessários..."
                                rows={2}
                            />
                        </div>

                        <div>
                            <Label>Observações</Label>
                            <Textarea
                                value={form.observacoes || ""}
                                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                                rows={2}
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={createOS.isPending || updateOS.isPending}>
                                {(createOS.isPending || updateOS.isPending) && (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                )}
                                {editingId ? "Salvar" : "Criar OS"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}
