import { Calendar, Download, FileSpreadsheet, FileText, Filter, Loader2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useDashboardData } from "@/hooks/useDashboard";

const reportTypes = [
  {
    id: "mensal",
    title: "Relatório Mensal",
    description: "Resumo completo das movimentações do mês",
    icon: Calendar,
  },
  {
    id: "anual",
    title: "Relatório Anual",
    description: "Visão consolidada do ano fiscal",
    icon: Calendar,
  },
  {
    id: "categoria",
    title: "Por Categoria",
    description: "Análise detalhada por categoria",
    icon: Filter,
  },
  {
    id: "estoque",
    title: "Relatório de Estoque",
    description: "Movimentação e valorização do estoque",
    icon: FileText,
  },
];

export default function Relatorios() {
  const { data, isLoading } = useDashboardData();

  const chartData = data?.entradasPorMes.map((m) => ({
    ...m,
    lucro: m.entradas - m.saidas,
  })) || [];

  const totalEntradas = chartData.reduce((acc, m) => acc + m.entradas, 0);
  const totalSaidas = chartData.reduce((acc, m) => acc + m.saidas, 0);
  const totalLucro = totalEntradas - totalSaidas;

  const hasData = chartData.length > 0 && chartData.some((d) => d.entradas > 0 || d.saidas > 0);

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Relatórios
          </h1>
          <p className="text-muted-foreground mt-1">
            Análises e exportações financeiras
          </p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue={new Date().getFullYear().toString()}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {reportTypes.map((report) => (
          <Card
            key={report.id}
            className="cursor-pointer hover:shadow-md transition-shadow border-border/50"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <report.icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">{report.title}</CardTitle>
                  <CardDescription className="text-xs">
                    {report.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  PDF
                </Button>
                <Button size="sm" variant="outline" className="flex-1 gap-1">
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  Excel
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Chart */}
          <div className="stat-card mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Comparativo Mensal
                </h3>
                <p className="text-sm text-muted-foreground">
                  Entradas, saídas e lucro por mês (últimos 6 meses)
                </p>
              </div>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </div>
            <div className="h-[350px]">
              {!hasData ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Nenhum dado disponível para o período
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                    <XAxis
                      dataKey="mes"
                      stroke="hsl(215, 16%, 47%)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(215, 16%, 47%)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `R$${value / 1000}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(0, 0%, 100%)",
                        border: "1px solid hsl(214, 32%, 91%)",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px hsl(217 91% 15% / 0.1)",
                      }}
                      formatter={(value: number) =>
                        new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(value)
                      }
                    />
                    <Legend />
                    <Bar
                      dataKey="entradas"
                      name="Entradas"
                      fill="hsl(217, 91%, 50%)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="saidas"
                      name="Saídas"
                      fill="hsl(0, 84%, 60%)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="lucro"
                      name="Lucro"
                      fill="hsl(142, 76%, 36%)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Summary Table */}
          <div className="stat-card">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Resumo do Período (6 meses)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 rounded-lg bg-primary/5">
                <p className="text-sm text-muted-foreground mb-1">Total Entradas</p>
                <p className="text-2xl font-bold text-primary">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(totalEntradas)}
                </p>
              </div>
              <div className="text-center p-4 rounded-lg bg-destructive/5">
                <p className="text-sm text-muted-foreground mb-1">Total Saídas</p>
                <p className="text-2xl font-bold text-destructive">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(totalSaidas)}
                </p>
              </div>
              <div className="text-center p-4 rounded-lg bg-success/5">
                <p className="text-sm text-muted-foreground mb-1">Lucro Total</p>
                <p className="text-2xl font-bold text-success">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(totalLucro)}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </MainLayout>
  );
}
