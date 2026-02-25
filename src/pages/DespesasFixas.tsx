import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useContasPagar, ContaPagarInput, Recorrencia, StatusConta } from "@/hooks/useContasPagar";
import { useCategorias } from "@/hooks/useCategorias";
import { FORMAS_PAGAMENTO, FormaPagamento } from "@/types/database";
import { Plus, Loader2, CheckCircle, Trash2, CalendarIcon, Repeat } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const RECORRENCIA_OPTIONS: { value: Recorrencia; label: string }[] = [
  { value: "mensal", label: "Mensal" },
  { value: "semanal", label: "Semanal" },
  { value: "quinzenal", label: "Quinzenal" },
  { value: "anual", label: "Anual" },
];

export default function DespesasFixas() {
  const { contas, isLoading, createConta, marcarComoPago, deleteConta } = useContasPagar(true);
  const { data: categorias = [] } = useCategorias();
  const categoriasSaida = categorias.filter((c) => c.tipo === "saida");
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState<ContaPagarInput & { is_despesa_fixa: boolean }>({
    descricao: "",
    valor: 0,
    data_vencimento: new Date().toISOString().split("T")[0],
    forma_pagamento: "pix",
    is_despesa_fixa: true,
    recorrencia: "mensal",
  });
  const [dataVencimento, setDataVencimento] = useState<Date>(new Date());

  const resetForm = () => {
    setForm({
      descricao: "",
      valor: 0,
      data_vencimento: new Date().toISOString().split("T")[0],
      forma_pagamento: "pix",
      is_despesa_fixa: true,
      recorrencia: "mensal",
    });
    setDataVencimento(new Date());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createConta.mutateAsync({
      ...form,
      data_vencimento: dataVencimento.toISOString().split("T")[0],
      is_despesa_fixa: true,
    });
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta despesa fixa?")) {
      await deleteConta.mutateAsync(id);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const totalMensal = contas
    .filter((c) => c.status === "pendente")
    .reduce((sum, c) => sum + c.valor, 0);

  return (
    <MainLayout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Despesas Fixas</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas despesas recorrentes</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => resetForm()}>
              <Plus className="h-4 w-4" />
              Nova Despesa Fixa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Despesa Fixa</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Descrição *</Label>
                <Input
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  required
                  placeholder="Ex: Aluguel, Energia, Internet..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Valor *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={form.valor}
                    onChange={(e) => setForm({ ...form, valor: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div>
                  <Label>Recorrência</Label>
                  <Select
                    value={form.recorrencia}
                    onValueChange={(v: Recorrencia) => setForm({ ...form, recorrencia: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RECORRENCIA_OPTIONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Próximo Vencimento *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(dataVencimento, "dd/MM/yyyy", { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dataVencimento}
                      onSelect={(d) => d && setDataVencimento(d)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Forma de Pagamento</Label>
                <Select
                  value={form.forma_pagamento}
                  onValueChange={(v: FormaPagamento) => setForm({ ...form, forma_pagamento: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMAS_PAGAMENTO.map((fp) => (
                      <SelectItem key={fp.value} value={fp.value}>
                        {fp.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Categoria</Label>
                <Select
                  value={form.categoria_id || ""}
                  onValueChange={(v) => setForm({ ...form, categoria_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriasSaida.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea
                  value={form.observacoes || ""}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createConta.isPending}>
                  {createConta.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Cadastrar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{formatCurrency(totalMensal)}</div>
            <p className="text-xs text-muted-foreground">Total de Despesas Fixas Pendentes</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Despesas Recorrentes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : contas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma despesa fixa cadastrada
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Recorrência</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contas.map((conta) => (
                    <TableRow key={conta.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Repeat className="h-4 w-4 text-muted-foreground" />
                          {conta.descricao}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {RECORRENCIA_OPTIONS.find((r) => r.value === conta.recorrencia)?.label || "Mensal"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(conta.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(conta.valor)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={conta.status === "pago" ? "default" : "secondary"}>
                          {conta.status === "pago" ? "Pago" : "Pendente"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {conta.status === "pendente" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Marcar como pago"
                              onClick={() => marcarComoPago.mutateAsync(conta.id)}
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(conta.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
