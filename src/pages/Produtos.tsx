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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useCategorias } from "@/hooks/useCategorias";
import { useSubcategorias, SubcategoriaInput } from "@/hooks/useSubcategorias";
import { useProdutos, useCreateProduto, useUpdateProduto, useDeleteProduto, STATUS_PRODUTO_OPTIONS, StatusProduto } from "@/hooks/useProdutos";
import { Plus, Search, Loader2, Pencil, Trash2, Package } from "lucide-react";

interface ProdutoFormData {
  nome: string;
  descricao: string;
  categoria_id: string;
  subcategoria_id: string;
  valor_custo: number;
  valor_venda: number;
  quantidade: number;
  quantidade_minima: number;
  unidade: string;
  status: StatusProduto;
}

export default function Produtos() {
  const { data: categorias = [], isLoading: categoriasLoading } = useCategorias();
  const { data: produtos = [], isLoading } = useProdutos();
  const createProduto = useCreateProduto();
  const updateProduto = useUpdateProduto();
  const deleteProdutoMutation = useDeleteProduto();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubcatDialogOpen, setIsSubcatDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<string>("");
  const { subcategorias, createSubcategoria } = useSubcategorias(selectedCategoriaId || undefined);
  
  const [form, setForm] = useState<ProdutoFormData>({
    nome: "",
    descricao: "",
    categoria_id: "",
    subcategoria_id: "",
    valor_custo: 0,
    valor_venda: 0,
    quantidade: 0,
    quantidade_minima: 0,
    unidade: "un",
    status: "em_aberto",
  });

  const [newSubcat, setNewSubcat] = useState<SubcategoriaInput>({
    categoria_id: "",
    nome: "",
    descricao: "",
  });

  const filteredProdutos = produtos.filter(
    (p) =>
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      p.descricao?.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setForm({
      nome: "",
      descricao: "",
      categoria_id: "",
      subcategoria_id: "",
      valor_custo: 0,
      valor_venda: 0,
      quantidade: 0,
      quantidade_minima: 0,
      unidade: "un",
      status: "em_aberto",
    });
    setSelectedCategoriaId("");
    setEditingId(null);
  };

  const handleOpenDialog = (produto?: typeof produtos[0]) => {
    if (produto) {
      setEditingId(produto.id);
      setSelectedCategoriaId(produto.categoria_id || "");
      setForm({
        nome: produto.nome,
        descricao: produto.descricao || "",
        categoria_id: produto.categoria_id || "",
        subcategoria_id: (produto as any).subcategoria_id || "",
        valor_custo: produto.valor_custo,
        valor_venda: produto.valor_venda,
        quantidade: produto.quantidade,
        quantidade_minima: produto.quantidade_minima,
        unidade: produto.unidade,
        status: (produto.status as StatusProduto) || "em_aberto",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateProduto.mutateAsync({ id: editingId, ...form } as any);
    } else {
      await createProduto.mutateAsync(form as any);
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      await deleteProdutoMutation.mutateAsync(id);
    }
  };

  const handleCategoriaChange = (categoriaId: string) => {
    setSelectedCategoriaId(categoriaId);
    setForm({ ...form, categoria_id: categoriaId, subcategoria_id: "" });
  };

  const handleAddSubcategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    await createSubcategoria.mutateAsync(newSubcat);
    setNewSubcat({ categoria_id: "", nome: "", descricao: "" });
    setIsSubcatDialogOpen(false);
  };

  const handleStatusChange = async (produtoId: string, newStatus: StatusProduto) => {
    await updateProduto.mutateAsync({ id: produtoId, status: newStatus } as any);
  };

  const getStatusOption = (status: string | null) => {
    return STATUS_PRODUTO_OPTIONS.find((s) => s.value === status) || STATUS_PRODUTO_OPTIONS[0];
  };

  const categoriasEntrada = categorias.filter((c) => c.tipo === "entrada");

  return (
    <MainLayout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Produtos/Materiais</h1>
          <p className="text-muted-foreground mt-1">Gerencie seu catálogo de produtos</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isSubcatDialogOpen} onOpenChange={setIsSubcatDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Subcategoria
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Subcategoria</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddSubcategoria} className="space-y-4">
                <div>
                  <Label>Categoria *</Label>
                  <Select
                    value={newSubcat.categoria_id}
                    onValueChange={(v) => setNewSubcat({ ...newSubcat, categoria_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
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
                <div>
                  <Label>Nome *</Label>
                  <Input
                    value={newSubcat.nome}
                    onChange={(e) => setNewSubcat({ ...newSubcat, nome: e.target.value })}
                    required
                    placeholder="Ex: Vinil Fosco"
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={newSubcat.descricao || ""}
                    onChange={(e) => setNewSubcat({ ...newSubcat, descricao: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsSubcatDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createSubcategoria.isPending}>
                    {createSubcategoria.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Criar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4" />
                Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Produto" : "Novo Produto"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label>Nome *</Label>
                    <Input
                      value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      required
                      placeholder="Nome do produto"
                    />
                  </div>

                  <div>
                    <Label>Categoria *</Label>
                    <Select
                      value={form.categoria_id}
                      onValueChange={handleCategoriaChange}
                    >
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

                  <div>
                    <Label>Subcategoria *</Label>
                    <Select
                      value={form.subcategoria_id}
                      onValueChange={(v) => setForm({ ...form, subcategoria_id: v })}
                      disabled={!selectedCategoriaId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={selectedCategoriaId ? "Selecione" : "Selecione categoria primeiro"} />
                      </SelectTrigger>
                      <SelectContent>
                        {subcategorias.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id}>
                            {sub.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Preço de Custo</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.valor_custo}
                      onChange={(e) => setForm({ ...form, valor_custo: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div>
                    <Label>Preço de Venda</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.valor_venda}
                      onChange={(e) => setForm({ ...form, valor_venda: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div>
                    <Label>Quantidade em Estoque</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.quantidade}
                      onChange={(e) => setForm({ ...form, quantidade: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div>
                    <Label>Quantidade Mínima</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.quantidade_minima}
                      onChange={(e) => setForm({ ...form, quantidade_minima: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div>
                    <Label>Unidade</Label>
                    <Select
                      value={form.unidade}
                      onValueChange={(v) => setForm({ ...form, unidade: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="un">Unidade (un)</SelectItem>
                        <SelectItem value="m">Metro (m)</SelectItem>
                        <SelectItem value="m2">Metro² (m²)</SelectItem>
                        <SelectItem value="kg">Quilograma (kg)</SelectItem>
                        <SelectItem value="l">Litro (L)</SelectItem>
                        <SelectItem value="pç">Peça (pç)</SelectItem>
                        <SelectItem value="rolo">Rolo</SelectItem>
                        <SelectItem value="folha">Folha</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Status</Label>
                    <Select
                      value={form.status}
                      onValueChange={(v) => setForm({ ...form, status: v as StatusProduto })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_PRODUTO_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <Label>Descrição</Label>
                    <Textarea
                      value={form.descricao}
                      onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createProduto.isPending || updateProduto.isPending}>
                    {(createProduto.isPending || updateProduto.isPending) && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {editingId ? "Salvar" : "Cadastrar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <CardTitle className="flex-1">Lista de Produtos</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredProdutos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              {search ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Custo</TableHead>
                    <TableHead className="text-right">Venda</TableHead>
                    <TableHead className="text-right">Estoque</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProdutos.map((produto) => {
                    const statusOpt = getStatusOption(produto.status);
                    const categoria = categorias.find((c) => c.id === produto.categoria_id);
                    return (
                      <TableRow key={produto.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{produto.nome}</div>
                            {produto.descricao && (
                              <div className="text-xs text-muted-foreground">{produto.descricao}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{categoria?.nome || "-"}</TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(produto.valor_custo)}
                        </TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(produto.valor_venda)}
                        </TableCell>
                        <TableCell className="text-right">
                          {produto.quantidade} {produto.unidade}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="cursor-pointer">
                                <Badge
                                  variant="outline"
                                  className="gap-1.5 hover:bg-accent transition-colors"
                                >
                                  <span className={`w-2 h-2 rounded-full ${statusOpt.color}`} />
                                  {statusOpt.label}
                                </Badge>
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {STATUS_PRODUTO_OPTIONS.map((opt) => (
                                <DropdownMenuItem
                                  key={opt.value}
                                  onClick={() => handleStatusChange(produto.id, opt.value)}
                                  className="gap-2 cursor-pointer"
                                >
                                  <span className={`w-2 h-2 rounded-full ${opt.color}`} />
                                  {opt.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(produto)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(produto.id)}>
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
