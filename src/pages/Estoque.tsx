import { useState } from "react";
import { Plus, Search, Package, AlertTriangle, Loader2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useProdutos, useCreateProduto } from "@/hooks/useProdutos";

const UNIDADES = [
  { value: "un", label: "Unidade" },
  { value: "m2", label: "m²" },
  { value: "m", label: "Metro" },
  { value: "kg", label: "Kg" },
  { value: "l", label: "Litro" },
  { value: "folha", label: "Folha" },
  { value: "caixa", label: "Caixa" },
];

export default function Estoque() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [unidade, setUnidade] = useState("un");
  const [quantidade, setQuantidade] = useState("");
  const [quantidadeMinima, setQuantidadeMinima] = useState("");
  const [valorCusto, setValorCusto] = useState("");
  const [valorVenda, setValorVenda] = useState("");

  const { data: produtos, isLoading } = useProdutos();
  const createProduto = useCreateProduto();

  const handleSubmit = async () => {
    if (!nome) return;

    await createProduto.mutateAsync({
      nome,
      descricao: descricao || undefined,
      unidade,
      quantidade: parseFloat(quantidade) || 0,
      quantidade_minima: parseFloat(quantidadeMinima) || 0,
      valor_custo: parseFloat(valorCusto) || 0,
      valor_venda: parseFloat(valorVenda) || 0,
    });

    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setNome("");
    setDescricao("");
    setUnidade("un");
    setQuantidade("");
    setQuantidadeMinima("");
    setValorCusto("");
    setValorVenda("");
  };

  const getStockStatus = (quantidade: number, minQuantidade: number) => {
    if (quantidade <= minQuantidade * 0.3) return "critical";
    if (quantidade <= minQuantidade) return "low";
    return "ok";
  };

  const filteredProdutos = produtos?.filter((p) =>
    p.nome.toLowerCase().includes(search.toLowerCase())
  );

  const totalProdutos = produtos?.length || 0;
  const produtosEstoqueBaixo =
    produtos?.filter((p) => Number(p.quantidade) <= Number(p.quantidade_minima)).length || 0;
  const valorEmEstoque =
    produtos?.reduce((acc, p) => acc + Number(p.valor_custo) * Number(p.quantidade), 0) || 0;

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Estoque
          </h1>
          <p className="text-muted-foreground mt-1">
            Controle de produtos e materiais
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Novo Produto</DialogTitle>
              <DialogDescription>
                Cadastre um novo item no estoque.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nome">Nome do Produto *</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Vinil Adesivo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  placeholder="Descrição do produto"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="unidade">Unidade</Label>
                  <Select value={unidade} onValueChange={setUnidade}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIDADES.map((u) => (
                        <SelectItem key={u.value} value={u.value}>
                          {u.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quantidade">Quantidade Inicial</Label>
                  <Input
                    id="quantidade"
                    type="number"
                    step="0.001"
                    placeholder="0"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="minimo">Qtd Mínima</Label>
                  <Input
                    id="minimo"
                    type="number"
                    step="0.001"
                    placeholder="0"
                    value={quantidadeMinima}
                    onChange={(e) => setQuantidadeMinima(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="custo">Valor Custo</Label>
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
                  <Label htmlFor="venda">Valor Venda</Label>
                  <Input
                    id="venda"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={valorVenda}
                    onChange={(e) => setValorVenda(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={createProduto.isPending || !nome}>
                {createProduto.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Produto"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="stat-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total de Produtos</p>
            <p className="text-2xl font-bold">{totalProdutos}</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-warning/10 text-warning">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Estoque Baixo</p>
            <p className="text-2xl font-bold">{produtosEstoqueBaixo}</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-success/10 text-success">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Valor em Estoque</p>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(valorEmEstoque)}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
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
        ) : filteredProdutos?.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            {search ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-center">Quantidade</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead className="text-right">Venda</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProdutos?.map((produto) => {
                const status = getStockStatus(
                  Number(produto.quantidade),
                  Number(produto.quantidade_minima)
                );
                return (
                  <TableRow key={produto.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                          <Package className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <p>{produto.nome}</p>
                          {produto.descricao && (
                            <p className="text-xs text-muted-foreground">
                              {produto.descricao}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={cn(
                          "font-semibold",
                          status === "critical" && "text-destructive",
                          status === "low" && "text-warning",
                          status === "ok" && "text-foreground"
                        )}
                      >
                        {Number(produto.quantidade)}
                      </span>
                      <span className="text-muted-foreground text-sm ml-1">
                        {produto.unidade}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(produto.valor_custo)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(produto.valor_venda)}
                    </TableCell>
                    <TableCell className="text-center">
                      {status === "critical" && (
                        <Badge variant="destructive">Crítico</Badge>
                      )}
                      {status === "low" && (
                        <Badge className="bg-warning/10 text-warning hover:bg-warning/20">
                          Baixo
                        </Badge>
                      )}
                      {status === "ok" && (
                        <Badge className="bg-success/10 text-success hover:bg-success/20">
                          Normal
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </MainLayout>
  );
}
