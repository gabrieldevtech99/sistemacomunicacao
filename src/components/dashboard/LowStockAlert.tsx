import { AlertTriangle, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Produto {
  id: string;
  nome: string;
  quantidade: number;
  quantidade_minima: number;
}

interface LowStockAlertProps {
  produtos: Produto[];
}

export function LowStockAlert({ produtos }: LowStockAlertProps) {
  if (produtos.length === 0) {
    return (
      <div className="stat-card animate-slide-up">
        <div className="flex items-center gap-2 mb-4">
          <Package className="h-5 w-5 text-success" />
          <h3 className="text-lg font-semibold text-foreground">Estoque</h3>
        </div>
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          Todos os produtos estão com estoque adequado
        </div>
      </div>
    );
  }

  return (
    <div className="stat-card border-warning/30 bg-warning/5 animate-slide-up">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-warning" />
        <h3 className="text-lg font-semibold text-foreground">Estoque Baixo</h3>
        <Badge variant="outline" className="ml-auto border-warning text-warning">
          {produtos.length} {produtos.length === 1 ? "item" : "itens"}
        </Badge>
      </div>
      <div className="space-y-3">
        {produtos.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 rounded-lg bg-card"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10 text-warning">
                <Package className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{item.nome}</p>
                <p className="text-xs text-muted-foreground">
                  Mínimo: {item.quantidade_minima} unidades
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-warning">{Number(item.quantidade)}</p>
              <p className="text-xs text-muted-foreground">em estoque</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
