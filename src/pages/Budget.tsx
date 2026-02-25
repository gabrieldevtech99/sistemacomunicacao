import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useBudget, BudgetInput } from "@/hooks/useBudget";
import { useCategorias } from "@/hooks/useCategorias";
import { Loader2, Save, TrendingUp, TrendingDown, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MESES = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

export default function Budget() {
  const currentDate = new Date();
  const [mes, setMes] = useState(currentDate.getMonth() + 1);
  const [ano, setAno] = useState(currentDate.getFullYear());
  const { budgets, isLoading, upsertBudget } = useBudget(mes, ano);
  const { data: categorias = [] } = useCategorias();
  const categoriasSaida = categorias.filter((c) => c.tipo === "saida");
  const { toast } = useToast();

  const [editingBudgets, setEditingBudgets] = useState<Record<string, number>>({});

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const handleValueChange = (categoriaId: string, value: number) => {
    setEditingBudgets((prev) => ({
      ...prev,
      [categoriaId]: value,
    }));
  };

  const handleSave = async (categoriaId: string) => {
    const valor = editingBudgets[categoriaId];
    if (valor === undefined) return;

    await upsertBudget.mutateAsync({
      categoria_id: categoriaId,
      mes,
      ano,
      valor_previsto: valor,
    });

    setEditingBudgets((prev) => {
      const newState = { ...prev };
      delete newState[categoriaId];
      return newState;
    });
  };

  const getBudgetForCategoria = (categoriaId: string) => {
    return budgets.find((b) => b.categoria_id === categoriaId);
  };

  const getProgressPercent = (previsto: number, realizado: number) => {
    if (previsto === 0) return 0;
    return Math.min((realizado / previsto) * 100, 100);
  };

  const getProgressColor = (previsto: number, realizado: number) => {
    const percent = (realizado / previsto) * 100;
    if (percent > 100) return "bg-destructive";
    if (percent > 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  const totalPrevisto = budgets.reduce((sum, b) => sum + b.valor_previsto, 0);
  const totalRealizado = budgets.reduce((sum, b) => sum + b.valor_realizado, 0);

  const anos = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i);

  return (
    <MainLayout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Orçamento Financeiro</h1>
          <p className="text-muted-foreground mt-1">Defina metas de gastos por categoria</p>
        </div>
        <div className="flex gap-2">
          <Select value={String(mes)} onValueChange={(v) => setMes(parseInt(v))}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MESES.map((m) => (
                <SelectItem key={m.value} value={String(m.value)}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(ano)} onValueChange={(v) => setAno(parseInt(v))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {anos.map((a) => (
                <SelectItem key={a} value={String(a)}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Previsto</span>
            </div>
            <div className="text-2xl font-bold mt-1">{formatCurrency(totalPrevisto)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              {totalRealizado <= totalPrevisto ? (
                <TrendingDown className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingUp className="h-5 w-5 text-destructive" />
              )}
              <span className="text-sm text-muted-foreground">Realizado</span>
            </div>
            <div className="text-2xl font-bold mt-1">{formatCurrency(totalRealizado)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Saldo</div>
            <div className={`text-2xl font-bold mt-1 ${totalPrevisto - totalRealizado >= 0 ? "text-green-600" : "text-destructive"}`}>
              {formatCurrency(totalPrevisto - totalRealizado)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orçamento por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : categoriasSaida.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Crie categorias de saída para definir orçamentos
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="w-[200px]">Valor Previsto</TableHead>
                    <TableHead className="text-right">Realizado</TableHead>
                    <TableHead className="w-[300px]">Progresso</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoriasSaida.map((categoria) => {
                    const budget = getBudgetForCategoria(categoria.id);
                    const previsto = editingBudgets[categoria.id] ?? budget?.valor_previsto ?? 0;
                    const realizado = budget?.valor_realizado ?? 0;
                    const saldo = previsto - realizado;
                    const hasChanges = editingBudgets[categoria.id] !== undefined;

                    return (
                      <TableRow key={categoria.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3 h-3 rounded-full bg-${categoria.cor}-500`}
                              style={{ backgroundColor: `var(--${categoria.cor}-500, #3b82f6)` }}
                            />
                            {categoria.nome}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={previsto}
                            onChange={(e) => handleValueChange(categoria.id, parseFloat(e.target.value) || 0)}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(realizado)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Progress
                              value={getProgressPercent(previsto, realizado)}
                              className="h-2"
                            />
                            <div className="text-xs text-muted-foreground text-right">
                              {previsto > 0 ? `${Math.round((realizado / previsto) * 100)}%` : "0%"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className={`text-right font-medium ${saldo >= 0 ? "text-green-600" : "text-destructive"}`}>
                          {formatCurrency(saldo)}
                        </TableCell>
                        <TableCell>
                          {hasChanges && (
                            <Button
                              size="sm"
                              onClick={() => handleSave(categoria.id)}
                              disabled={upsertBudget.isPending}
                            >
                              {upsertBudget.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
