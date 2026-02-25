import {
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  Wallet,
  Calendar,
  Loader2,
  AlertTriangle,
  ClipboardList,
  CheckCheck,
  Clock,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { CategoryChart } from "@/components/dashboard/CategoryChart";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { LowStockAlert } from "@/components/dashboard/LowStockAlert";
import { Button } from "@/components/ui/button";
import { useDashboardData } from "@/hooks/useDashboard";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useDashboardData();

  const currentMonth = new Date().toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Visão geral do seu negócio
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="capitalize">{currentMonth}</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            <StatCard
              title="Entradas do Mês"
              value={formatCurrency(data?.faturamentoMes || 0)}
              icon={ArrowDownCircle}
              iconColor="bg-success/10 text-success"
            />
            <StatCard
              title="Saídas do Mês"
              value={formatCurrency(data?.despesasMes || 0)}
              icon={ArrowUpCircle}
              iconColor="bg-destructive/10 text-destructive"
            />
            <StatCard
              title="Lucro Líquido"
              value={formatCurrency(data?.lucroLiquidoMes || 0)}
              changeType={(data?.lucroLiquidoMes || 0) >= 0 ? "positive" : "negative"}
              icon={TrendingUp}
              iconColor="bg-primary/10 text-primary"
            />
            <StatCard
              title="A Receber (Pendentes)"
              value={formatCurrency(data?.totalReceberPendente || 0)}
              icon={Wallet}
              iconColor="bg-info/10 text-info"
            />
          </div>

          {/* OS Indicators Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            <StatCard
              title="Orçamentos Enviados"
              value={data?.orcamentosAbertos?.toString() || "0"}
              icon={Clock}
              iconColor="bg-amber-100 text-amber-600"
            />
            <StatCard
              title="Orçamentos Aprovados"
              value={data?.orcamentosAprovados?.toString() || "0"}
              icon={CheckCheck}
              iconColor="bg-green-100 text-green-600"
            />
            <StatCard
              title="Total de OS"
              value={(data?.osPorStatus?.reduce((acc, curr) => acc + curr.total, 0) || 0).toString()}
              icon={ClipboardList}
              iconColor="bg-blue-100 text-blue-600"
            />
            <StatCard
              title="Alerta de Estoque"
              value={data?.produtosEstoqueBaixo?.length.toString() || "0"}
              icon={AlertTriangle}
              iconColor="bg-red-100 text-red-600"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
            <div className="lg:col-span-2">
              <RevenueChart
                data={data?.graficoMensal || []}
                title="Fluxo de Caixa (6 meses)"
              />
            </div>
            <div>
              <CategoryChart
                data={data?.osPorStatus?.map(s => ({
                  nome: s.status.charAt(0).toUpperCase() + s.status.slice(1).replace("_", " "),
                  valor: s.total,
                  cor: s.status === "aberta" ? "#f59e0b" : s.status === "em_andamento" ? "#3b82f6" : s.status === "concluida" ? "#10b981" : "#94a3b8"
                })) || []}
                title="Status de OS"
              />
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <RecentTransactions transactions={data?.transacoesRecentes || []} />
            <LowStockAlert produtos={data?.produtosEstoqueBaixo || []} />
          </div>
        </>
      )}
    </MainLayout>
  );
}
