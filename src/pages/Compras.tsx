import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useCompras, StatusCompraItem } from "@/hooks/useCompras";
import { useOrdemServico } from "@/hooks/useOrdemServico";
import {
    Plus,
    ShoppingCart,
    Trash2,
    CheckCircle2,
    Clock,
    Package,
    ChevronDown,
    ChevronUp,
    SearchX,
    Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Compras() {
    const { compras, isLoading: loadingCompras, createCompra, addCompraItem, updateItemStatus, deleteItem, deleteCompra } = useCompras();
    const { ordens, isLoading: loadingOrdens } = useOrdemServico();

    const [selectedOS, setSelectedOS] = useState("");
    const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({});
    const [expandedCompra, setExpandedCompra] = useState<string | null>(null);

    const handleCreateCompra = async () => {
        if (!selectedOS) return;
        await createCompra.mutateAsync({ os_id: selectedOS });
        setSelectedOS("");
    };

    const handleAddItem = async (compraId: string) => {
        const text = newItemTexts[compraId];
        if (!text?.trim()) return;
        await addCompraItem.mutateAsync({ compra_id: compraId, descricao: text.trim() });
        setNewItemTexts(prev => ({ ...prev, [compraId]: "" }));
    };

    const getStatusVariant = (status: StatusCompraItem) => {
        if (status === "entregue") return "default"; // green/blue
        if (status === "comprado") return "secondary"; // yellow/orange
        return "outline"; // gray
    };

    return (
        <MainLayout>
            <div className="flex flex-col gap-6 ">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Controle de Compras</h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Gerencie os suprimentos e materiais necessários para cada Ordem de Serviço.
                        </p>
                    </div>
                </div>

                {/* Nova Lista de Compras */}
                <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-4 flex flex-col md:flex-row items-end gap-4">
                        <div className="flex-1 w-full space-y-1.5">
                            <Label className="text-xs uppercase tracking-wider font-bold text-primary/70">Vincular Compra à O.S.</Label>
                            <Select value={selectedOS} onValueChange={setSelectedOS}>
                                <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="Selecione uma Ordem de Serviço..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {(ordens || []).filter(o => o.status !== "concluida" && o.status !== "cancelada").map(os => (
                                        <SelectItem key={os.id} value={os.id}>
                                            #{os.numero} - {os.titulo} ({os.cliente?.nome || 'Sem cliente'})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleCreateCompra} disabled={!selectedOS || createCompra.isPending} className="gap-2 w-full md:w-auto">
                            <Plus className="h-4 w-4" />
                            Criar Pasta de Compra
                        </Button>
                    </CardContent>
                </Card>

                {/* Listagem de Compras */}
                {loadingCompras ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : compras.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/10 rounded-2xl border border-dashed">
                        <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                        <h3 className="text-lg font-medium">Nenhuma lista de compra</h3>
                        <p className="text-muted-foreground">Inicie uma nova lista selecionando uma O.S. acima.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {compras.map((compra) => (
                            <Card key={compra.id} className="overflow-hidden border-sidebar-border">
                                <div
                                    className="p-4 bg-muted/20 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                                    onClick={() => setExpandedCompra(expandedCompra === compra.id ? null : compra.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="hidden md:flex h-10 w-10 rounded-full bg-primary/10 text-primary items-center justify-center">
                                            <Package className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-sm md:text-base">
                                                    {compra.os?.cliente?.nome || "Sem Cliente"} → {compra.os?.titulo || "Sem OS vinculada"}
                                                </h3>
                                                {compra.os?.id && <Badge variant="outline" className="text-[10px]">#{compra.os.id.substring(0, 4)}</Badge>}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {compra.itens?.length || 0} itens cadastrados • Criado em {format(new Date(compra.created_at), "dd/MM/yy")}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm("Excluir esta lista de compras?")) deleteCompra.mutate(compra.id);
                                        }}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        {expandedCompra === compra.id ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                                    </div>
                                </div>

                                {expandedCompra === compra.id && (
                                    <CardContent className="p-4 pt-2 border-t border-dashed">
                                        <div className="space-y-3">
                                            {/* Cabeçalho da Lista */}
                                            <div className="flex gap-2 mb-4 mt-2">
                                                <Input
                                                    placeholder="O que precisa comprar? (Ex: ACM 3mm, Ferro Chato...)"
                                                    className="flex-1 text-sm h-9"
                                                    value={newItemTexts[compra.id] || ""}
                                                    onChange={(e) => setNewItemTexts(prev => ({ ...prev, [compra.id]: e.target.value }))}
                                                    onKeyDown={(e) => e.key === "Enter" && handleAddItem(compra.id)}
                                                />
                                                <Button size="sm" onClick={() => handleAddItem(compra.id)} disabled={!newItemTexts[compra.id]?.trim()}>
                                                    Adicionar
                                                </Button>
                                            </div>

                                            {/* Itens */}
                                            {(!compra.itens || compra.itens.length === 0) ? (
                                                <p className="text-xs text-center py-4 text-muted-foreground bg-muted/10 rounded-lg">Lista vazia. Adicione o primeiro item acima.</p>
                                            ) : (
                                                <div className="divide-y border rounded-lg overflow-hidden bg-background">
                                                    {compra.itens.map(item => (
                                                        <div key={item.id} className="flex items-center justify-between p-3 group hover:bg-muted/10">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`h-2 w-2 rounded-full ${item.status === 'entregue' ? 'bg-green-500' :
                                                                    item.status === 'comprado' ? 'bg-yellow-500' :
                                                                        item.status === 'incompleto' ? 'bg-red-500' : 'bg-gray-300'
                                                                    }`} />
                                                                <span className={`text-sm ${item.status === 'entregue' ? 'line-through text-muted-foreground' : ''}`}>
                                                                    {item.descricao}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Select
                                                                    value={item.status}
                                                                    onValueChange={(val: StatusCompraItem) => updateItemStatus.mutate({ id: item.id, status: val })}
                                                                >
                                                                    <SelectTrigger className="h-8 text-[11px] w-[100px] border-none bg-muted/40 font-medium">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="pendente">Pendente</SelectItem>
                                                                        <SelectItem value="comprado">Comprado</SelectItem>
                                                                        <SelectItem value="entregue">Entregue</SelectItem>
                                                                        <SelectItem value="incompleto">Incompleto</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteItem.mutate(item.id)}>
                                                                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
