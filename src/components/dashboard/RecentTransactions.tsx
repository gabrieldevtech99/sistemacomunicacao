import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  descricao: string;
  categoria: string;
  tipo: "entrada" | "saida";
  valor: number;
  data: string;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Hoje";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Ontem";
    }
    return date.toLocaleDateString("pt-BR");
  };

  return (
    <div className="stat-card animate-slide-up">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Transações Recentes</h3>
        <p className="text-sm text-muted-foreground">Últimas movimentações financeiras</p>
      </div>
      {transactions.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          Nenhuma transação registrada
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    transaction.tipo === "entrada"
                      ? "bg-success/10 text-success"
                      : "bg-destructive/10 text-destructive"
                  )}
                >
                  {transaction.tipo === "entrada" ? (
                    <ArrowDownCircle className="h-4 w-4" />
                  ) : (
                    <ArrowUpCircle className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {transaction.descricao}
                  </p>
                  <p className="text-xs text-muted-foreground">{transaction.categoria}</p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    transaction.tipo === "entrada" ? "text-success" : "text-destructive"
                  )}
                >
                  {transaction.tipo === "entrada" ? "+" : "-"}
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(transaction.valor)}
                </p>
                <p className="text-xs text-muted-foreground">{formatDate(transaction.data)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
