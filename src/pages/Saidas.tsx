import { useState } from "react";
import { Plus, Search, ArrowUpCircle, Loader2 } from "lucide-react";
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
import { useSaidas, useCreateSaida } from "@/hooks/useSaidas";
import { useCategorias } from "@/hooks/useCategorias";
import { FORMAS_PAGAMENTO, FormaPagamento } from "@/types/database";

export default function Saidas() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>("pix");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [observacoes, setObservacoes] = useState("");

  const { data: saidas, isLoading } = useSaidas();
  const { data: categorias } = useCategorias();
  const createSaida = useCreateSaida();

  const categoriasSaida = categorias?.filter((c) => c.tipo === "saida") || [];

  const handleSubmit = async () => {
    if (!descricao || !valor) {
      return;
    }

    await createSaida.mutateAsync({
      descricao,
      valor: parseFloat(valor),
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
    setValor("");
    setData(new Date().toISOString().split("T")[0]);
    setObservacoes("");
  };

  const filteredSaidas = saidas?.filter((s) =>
    s.descricao.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Saídas
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie despesas e pagamentos
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Saída
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nova Saída</DialogTitle>
              <DialogDescription>
                Registre uma nova despesa ou pagamento.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="descricao">Descrição *</Label>
                <Input
                  id="descricao"
                  placeholder="Ex: Compra de Material"
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
                      {categoriasSaida.map((cat) => (
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
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="valor">Valor *</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                  />
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
                variant="destructive"
                onClick={handleSubmit}
                disabled={createSaida.isPending || !descricao || !valor}
              >
                {createSaida.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Saída"
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
            placeholder="Buscar saídas..."
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
        ) : filteredSaidas?.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            {search ? "Nenhuma saída encontrada" : "Nenhuma saída registrada"}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSaidas?.map((saida) => (
                <TableRow key={saida.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-destructive/10 text-destructive">
                        <ArrowUpCircle className="h-3.5 w-3.5" />
                      </div>
                      {saida.descricao}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {saida.categoria?.nome || "Sem categoria"}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">
                    {FORMAS_PAGAMENTO.find((f) => f.value === saida.forma_pagamento)?.label ||
                      saida.forma_pagamento}
                  </TableCell>
                  <TableCell className="text-right font-medium text-destructive">
                    -{new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(saida.valor)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {new Date(saida.data).toLocaleDateString("pt-BR")}
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
