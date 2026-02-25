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
import { useContasReceber, ContaReceberInput, StatusConta } from "@/hooks/useContasReceber";
import { useClientes } from "@/hooks/useClientes";
import { useCategorias } from "@/hooks/useCategorias";
import { FORMAS_PAGAMENTO, FormaPagamento } from "@/types/database";
import { Plus, Search, Loader2, CheckCircle, Trash2, CalendarIcon, AlertCircle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<StatusConta, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "secondary" },
  pago: { label: "Pago", variant: "default" },
  recebido: { label: "Recebido", variant: "default" },
  vencido: { label: "Vencido", variant: "destructive" },
  cancelado: { label: "Cancelado", variant: "outline" },
};

export default function ContasReceber() {
  const { contas, isLoading, createConta, marcarComoRecebido, deleteConta } = useContasReceber();
  const { clientes } = useClientes();
  const { data: categorias = [] } = useCategorias();
  const categoriasEntrada = categorias.filter((c) => c.tipo === "entrada");
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState<ContaReceberInput>({
    descricao: "",
    valor: 0,
    data_vencimento: new Date().toISOString().split("T")[0],
    forma_pagamento: "pix",
  });
  const [dataVencimento, setDataVencimento] = useState<Date>(new Date());

  const filteredContas = contas.filter((conta) => {
    const matchesSearch = conta.descricao.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || conta.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setForm({
      descricao: "",
      valor: 0,
      data_vencimento: new Date().toISOString().split("T")[0],
      forma_pagamento: "pix",
    });
    setDataVencimento(new Date());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createConta.mutateAsync({
      ...form,
      data_vencimento: dataVencimento.toISOString().split("T")[0],
    });
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta conta?")) {
      await deleteConta.mutateAsync(id);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const isVencido = (dataVencimento: string, status: StatusConta) => {
    if (status === "recebido" || status === "cancelado") return false;
    return differenceInDays(new Date(), new Date(dataVencimento)) > 0;
  };

  const totalPendente = filteredContas
    .filter((c) => c.status === "pendente")
    .reduce((sum, c) => sum + c.valor, 0);

  return (
    <MainLayout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Contas a Receber</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas receitas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => resetForm()}>
              <Plus className="h-4 w-4" />
              Nova Conta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Conta a Receber</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Descrição *</Label>
                <Input
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  required
                  placeholder="Descrição da conta"
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
              </div>

              <div>
                <Label>Data de Vencimento *</Label>
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
                <Label>Cliente</Label>
                <Select
                  value={form.cliente_id || ""}
                  onValueChange={(v) => setForm({ ...form, cliente_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
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
                    {categoriasEntrada.map((c) => (
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
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPendente)}</div>
            <p className="text-xs text-muted-foreground">Total a Receber</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <CardTitle className="flex-1">Contas</CardTitle>
            <div className="flex flex-col md:flex-row gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="recebido">Recebido</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredContas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma conta encontrada
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContas.map((conta) => {
                    const vencido = isVencido(conta.data_vencimento, conta.status);
                    const config = vencido ? STATUS_CONFIG.vencido : STATUS_CONFIG[conta.status];
                    return (
                      <TableRow key={conta.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {vencido && <AlertCircle className="h-4 w-4 text-destructive" />}
                            {conta.descricao}
                          </div>
                        </TableCell>
                        <TableCell>{conta.cliente?.nome || "-"}</TableCell>
                        <TableCell>
                          {format(new Date(conta.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(conta.valor)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={config.variant}>{config.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {conta.status === "pendente" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Marcar como recebido"
                                onClick={() => marcarComoRecebido.mutateAsync(conta.id)}
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
