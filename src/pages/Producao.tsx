import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePedidos, STATUS_LABELS, STATUS_ORDER, StatusPedido } from "@/hooks/usePedidos";
import { Loader2, Calendar, User, AlertCircle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

const STATUS_COLORS: Record<StatusPedido, string> = {
  aguardando: "bg-yellow-500/10 border-yellow-500/30",
  em_producao: "bg-blue-500/10 border-blue-500/30",
  acabamento: "bg-purple-500/10 border-purple-500/30",
  pronto_entrega: "bg-green-500/10 border-green-500/30",
  entregue: "bg-gray-500/10 border-gray-500/30",
};

export default function Producao() {
  const { pedidos, isLoading, updatePedidoStatus } = usePedidos();

  const getPedidosByStatus = (status: StatusPedido) =>
    pedidos.filter((p) => p.status === status);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const sourceStatus = result.source.droppableId as StatusPedido;
    const destStatus = result.destination.droppableId as StatusPedido;

    if (sourceStatus === destStatus) return;

    const pedidoId = result.draggableId;
    await updatePedidoStatus.mutateAsync({ id: pedidoId, status: destStatus });
  };

  const isAtrasado = (dataPrevisao: string | null) => {
    if (!dataPrevisao) return false;
    return differenceInDays(new Date(), new Date(dataPrevisao)) > 0;
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Produção</h1>
        <p className="text-muted-foreground mt-1">Acompanhe os pedidos em produção</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
            {STATUS_ORDER.map((status) => (
              <div key={status} className="min-w-[250px]">
                <Card className={`${STATUS_COLORS[status]} border-2`}>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      {STATUS_LABELS[status]}
                      <Badge variant="secondary" className="ml-2">
                        {getPedidosByStatus(status).length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <Droppable droppableId={status}>
                    {(provided, snapshot) => (
                      <CardContent
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-[400px] space-y-2 transition-colors ${
                          snapshot.isDraggingOver ? "bg-primary/5" : ""
                        }`}
                      >
                        {getPedidosByStatus(status).map((pedido, index) => (
                          <Draggable key={pedido.id} draggableId={pedido.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-3 bg-card rounded-lg border shadow-sm transition-shadow ${
                                  snapshot.isDragging ? "shadow-lg" : ""
                                }`}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <span className="font-bold text-sm">#{pedido.numero}</span>
                                  {pedido.data_previsao && isAtrasado(pedido.data_previsao) && pedido.status !== "entregue" && (
                                    <AlertCircle className="h-4 w-4 text-destructive" />
                                  )}
                                </div>
                                
                                {pedido.cliente && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                    <User className="h-3 w-3" />
                                    {pedido.cliente.nome}
                                  </div>
                                )}

                                {pedido.orcamento && (
                                  <div className="text-xs text-muted-foreground mb-1">
                                    Orç. #{pedido.orcamento.numero} - {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(pedido.orcamento.valor_final)}
                                  </div>
                                )}

                                {pedido.data_previsao && (
                                  <div className={`flex items-center gap-1 text-xs ${isAtrasado(pedido.data_previsao) && pedido.status !== "entregue" ? "text-destructive" : "text-muted-foreground"}`}>
                                    <Calendar className="h-3 w-3" />
                                    {format(new Date(pedido.data_previsao), "dd/MM/yyyy", { locale: ptBR })}
                                  </div>
                                )}

                                {pedido.observacoes && (
                                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                    {pedido.observacoes}
                                  </p>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        
                        {getPedidosByStatus(status).length === 0 && (
                          <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
                            Nenhum pedido
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Droppable>
                </Card>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}
    </MainLayout>
  );
}
