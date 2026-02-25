import { useState } from "react";
import { Plus, Search, Filter, ArrowDownCircle, Loader2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useEntradas, useCreateEntrada } from "@/hooks/useEntradas";
import { useCategorias } from "@/hooks/useCategorias";
import { FORMAS_PAGAMENTO, FormaPagamento } from "@/types/database";

export default function Entradas() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>("pix");
  const [valorCusto, setValorCusto] = useState("");
  const [valorVenda, setValorVenda] = useState("");
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [observacoes, setObservacoes] = useState("");

  const { data: entradas, isLoading } = useEntradas();
  const { data: categorias } = useCategorias();
  const createEntrada = useCreateEntrada();

  const categoriasEntrada = categorias?.filter((c) => c.tipo === "entrada") || [];

  const calcularMargem = () => {
    const custo = parseFloat(valorCusto) || 0;
    const venda = parseFloat(valorVenda) || 0;
    if (venda === 0) return 0;
    return (((venda - custo) / venda) * 100).toFixed(1);
  };

  const handleSubmit = async () => {
    if (!descricao || !valorVenda) {
      return;
    }

    await createEntrada.mutateAsync({
      descricao,
      valor_custo: parseFloat(valorCusto) || 0,
      valor_venda: parseFloat(valorVenda),
      forma_pagamento: formaPagamento,
      data,
      categoria_id: categoriaId || undefined,
      observacoes: observacoes || undefined,
    });

    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setDescricao("");
    setCategoriaId("");
    setFormaPagamento("pix");
    setValorCusto("");
    setValorVenda("");
    setData(new Date().toISOString().split("T")[0]);
    setObservacoes("");
  };

  const filteredEntradas = entradas?.filter((e) =>
    e.descricao.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Entradas
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie todos os recebimentos
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Entrada
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nova Entrada</DialogTitle>
              <DialogDescription>
                Registre um novo recebimento no sistema.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="descricao">Descrição *</Label>
                <Input
                  id="descricao"
                  placeholder="Ex: Venda de Banner"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select value={categoriaId} onValueChange={setCategoriaId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriasEntrada.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pagamento">Forma de Pagamento</Label>
                  <Select
                    value={formaPagamento}
                    onValueChange={(v) => setFormaPagamento(v as FormaPagamento)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMAS_PAGAMENTO.map((forma) => (
                        <SelectItem key={forma.value} value={forma.value}>
                          {forma.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="custo">Valor de Custo</Label>
                  <Input
                    id="custo"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={valorCusto}
                    onChange={(e) => setValorCusto(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="venda">Valor de Venda *</Label>
                  <Input
                    id="venda"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={valorVenda}
                    onChange={(e) => setValorVenda(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Margem de Lucro</Label>
                  <div className="h-10 flex items-center justify-center rounded-md bg-success/10 text-success font-semibold">
                    {calcularMargem()}%
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="data">Data</Label>
                <Input
                  id="data"
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="obs">Observações</Label>
                <Textarea
                  id="obs"
                  placeholder="Observações adicionais..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createEntrada.isPending || !descricao || !valorVenda}
              >
                {createEntrada.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Entrada"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar entradas..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="stat-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filteredEntradas?.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            {search ? "Nenhuma entrada encontrada" : "Nenhuma entrada registrada"}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead className="text-right">Venda</TableHead>
                <TableHead className="text-right">Margem</TableHead>
                <TableHead className="text-right">Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntradas?.map((entrada) => (
                <TableRow key={entrada.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-success/10 text-success">
                        <ArrowDownCircle className="h-3.5 w-3.5" />
                      </div>
                      {entrada.descricao}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {entrada.categoria?.nome || "Sem categoria"}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">
                    {FORMAS_PAGAMENTO.find((f) => f.value === entrada.forma_pagamento)?.label ||
                      entrada.forma_pagamento}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(entrada.valor_custo)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(entrada.valor_venda)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge className="bg-success/10 text-success hover:bg-success/20">
                      {Number(entrada.margem_lucro).toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {new Date(entrada.data).toLocaleDateString("pt-BR")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </MainLayout>
  );
}
