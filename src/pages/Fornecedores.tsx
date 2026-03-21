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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MaskedInput } from "@/components/masks/MaskedInput";
import { useFornecedores, FornecedorInput } from "@/hooks/useFornecedores";
import { useFornecedorProdutos, FornecedorProduto } from "@/hooks/useFornecedorProdutos";
import { useEmpresa } from "@/contexts/EmpresaContext";
import {
  Plus,
  Search,
  Loader2,
  Pencil,
  Trash2,
  Package,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  History,
  X,
  ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function Fornecedores() {
  const { empresaAtiva } = useEmpresa();
  const { fornecedores, isLoading, createFornecedor, updateFornecedor, deleteFornecedor } =
    useFornecedores();

  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedFornecedor, setSelectedFornecedor] = useState<(typeof fornecedores)[0] | null>(null);
  const [activeTab, setActiveTab] = useState("info");

  const [form, setForm] = useState<FornecedorInput>({
    razao_social: "",
    nome_fantasia: "",
    cnpj: "",
    telefone: "",
    email: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    tipo_material: "",
    contato_nome: "",
    contato_telefone: "",
    observacoes: "",
  });

  // Produtos do fornecedor selecionado
  const {
    produtos,
    isLoading: loadingProdutos,
    createProduto,
    updateProduto,
    deleteProduto,
    addHistorico,
  } = useFornecedorProdutos(selectedFornecedor?.id || null);

  const [isProdutoDialogOpen, setIsProdutoDialogOpen] = useState(false);
  const [editingProdutoId, setEditingProdutoId] = useState<string | null>(null);
  const [produtoForm, setProdutoForm] = useState({
    nome: "",
    descricao: "",
    unidade: "un",
    preco_atual: 0,
    preco_minimo: 0,
  });

  const [isHistoricoDialogOpen, setIsHistoricoDialogOpen] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState<FornecedorProduto | null>(null);
  const [historicoForm, setHistoricoForm] = useState({
    preco: 0,
    data_compra: new Date().toISOString().split("T")[0],
    quantidade: 0,
    observacoes: "",
  });

  const filteredFornecedores = fornecedores.filter(
    (f) =>
      f.razao_social.toLowerCase().includes(search.toLowerCase()) ||
      f.nome_fantasia?.toLowerCase().includes(search.toLowerCase()) ||
      f.cnpj?.includes(search)
  );

  const resetForm = () => {
    setForm({
      razao_social: "",
      nome_fantasia: "",
      cnpj: "",
      telefone: "",
      email: "",
      cep: "",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      uf: "",
      tipo_material: "",
      contato_nome: "",
      contato_telefone: "",
      observacoes: "",
    });
    setEditingId(null);
  };

  const handleOpenDialog = (fornecedor?: (typeof fornecedores)[0]) => {
    if (fornecedor) {
      setEditingId(fornecedor.id);
      setForm({
        razao_social: fornecedor.razao_social,
        nome_fantasia: fornecedor.nome_fantasia || "",
        cnpj: fornecedor.cnpj || "",
        telefone: fornecedor.telefone || "",
        email: fornecedor.email || "",
        cep: fornecedor.cep || "",
        logradouro: fornecedor.logradouro || "",
        numero: fornecedor.numero || "",
        complemento: fornecedor.complemento || "",
        bairro: fornecedor.bairro || "",
        cidade: fornecedor.cidade || "",
        uf: fornecedor.uf || "",
        tipo_material: fornecedor.tipo_material || "",
        contato_nome: fornecedor.contato_nome || "",
        contato_telefone: fornecedor.contato_telefone || "",
        observacoes: fornecedor.observacoes || "",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Limpar campos vazios para enviar null em vez de ""
    const payload = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value === "" ? null : value])
    ) as FornecedorInput & { nome?: string | null };

    // Fallback: se o banco exigir 'nome', enviamos a razao_social
    payload.nome = payload.razao_social;

    try {
      if (editingId) {
        await updateFornecedor.mutateAsync({ id: editingId, ...payload });
      } else {
        await createFornecedor.mutateAsync(payload);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Erro ao salvar fornecedor:", error);
      // O erro já é tratado pelo toast dentro do hook useFornecedores
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este fornecedor?")) {
      if (selectedFornecedor?.id === id) setSelectedFornecedor(null);
      await deleteFornecedor.mutateAsync(id);
    }
  };

  const buscarCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setForm((prev) => ({
            ...prev,
            logradouro: data.logradouro || "",
            bairro: data.bairro || "",
            cidade: data.localidade || "",
            uf: data.uf || "",
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      }
    }
  };

  // Produto handlers
  const handleOpenProduto = (produto?: FornecedorProduto) => {
    if (produto) {
      setEditingProdutoId(produto.id);
      setProdutoForm({
        nome: produto.nome,
        descricao: produto.descricao || "",
        unidade: produto.unidade,
        preco_atual: produto.preco_atual,
        preco_minimo: produto.preco_minimo || 0,
      });
    } else {
      setEditingProdutoId(null);
      setProdutoForm({ nome: "", descricao: "", unidade: "un", preco_atual: 0, preco_minimo: 0 });
    }
    setIsProdutoDialogOpen(true);
  };

  const handleSubmitProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFornecedor || !empresaAtiva) return;
    if (editingProdutoId) {
      const oldProduto = produtos.find((p) => p.id === editingProdutoId);
      await updateProduto.mutateAsync({
        id: editingProdutoId,
        oldPreco: oldProduto?.preco_atual || 0,
        nome: produtoForm.nome,
        descricao: produtoForm.descricao || undefined,
        unidade: produtoForm.unidade,
        preco_atual: produtoForm.preco_atual,
        preco_minimo: produtoForm.preco_minimo || undefined,
      });
    } else {
      await createProduto.mutateAsync({
        fornecedor_id: selectedFornecedor.id,
        empresa_id: empresaAtiva.id,
        nome: produtoForm.nome,
        descricao: produtoForm.descricao || undefined,
        unidade: produtoForm.unidade,
        preco_atual: produtoForm.preco_atual,
        preco_minimo: produtoForm.preco_minimo || undefined,
      });
    }
    setIsProdutoDialogOpen(false);
  };

  const handleOpenHistorico = (produto: FornecedorProduto) => {
    setSelectedProduto(produto);
    setHistoricoForm({
      preco: produto.preco_atual,
      data_compra: new Date().toISOString().split("T")[0],
      quantidade: 0,
      observacoes: "",
    });
    setIsHistoricoDialogOpen(true);
  };

  const handleSubmitHistorico = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduto) return;
    await addHistorico.mutateAsync({
      fornecedor_produto_id: selectedProduto.id,
      preco: historicoForm.preco,
      data_compra: historicoForm.data_compra,
      quantidade: historicoForm.quantidade || undefined,
      observacoes: historicoForm.observacoes || undefined,
    });
    setIsHistoricoDialogOpen(false);
  };

  return (
    <MainLayout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Fornecedores</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus fornecedores e seus produtos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4" />
              Novo Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>Razão Social *</Label>
                  <Input
                    value={form.razao_social}
                    onChange={(e) => setForm({ ...form, razao_social: e.target.value })}
                    required
                    placeholder="Razão social da empresa"
                  />
                </div>

                <div>
                  <Label>Nome Fantasia</Label>
                  <Input
                    value={form.nome_fantasia || ""}
                    onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value })}
                    placeholder="Nome fantasia"
                  />
                </div>

                <div>
                  <Label>CNPJ</Label>
                  <MaskedInput
                    mask="cnpj"
                    value={form.cnpj || ""}
                    onChange={(v) => setForm({ ...form, cnpj: v })}
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                <div>
                  <Label>Telefone</Label>
                  <MaskedInput
                    mask="phone"
                    value={form.telefone || ""}
                    onChange={(v) => setForm({ ...form, telefone: v })}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email || ""}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Tipo de Material Fornecido</Label>
                  <Input
                    value={form.tipo_material || ""}
                    onChange={(e) => setForm({ ...form, tipo_material: e.target.value })}
                    placeholder="Ex: Vinil, Acrílico, Lona..."
                  />
                </div>

                <div className="md:col-span-2 border-t pt-4 mt-2">
                  <h4 className="font-medium mb-3">Contato Principal</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nome do Contato</Label>
                      <Input
                        value={form.contato_nome || ""}
                        onChange={(e) => setForm({ ...form, contato_nome: e.target.value })}
                        placeholder="Nome do responsável"
                      />
                    </div>
                    <div>
                      <Label>Telefone do Contato</Label>
                      <MaskedInput
                        mask="phone"
                        value={form.contato_telefone || ""}
                        onChange={(v) => setForm({ ...form, contato_telefone: v })}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 border-t pt-4 mt-2">
                  <h4 className="font-medium mb-3">Endereço</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>CEP</Label>
                      <MaskedInput
                        mask="cep"
                        value={form.cep || ""}
                        onChange={(v) => {
                          setForm({ ...form, cep: v });
                          buscarCep(v);
                        }}
                        placeholder="00000-000"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Logradouro</Label>
                      <Input
                        value={form.logradouro || ""}
                        onChange={(e) => setForm({ ...form, logradouro: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Número</Label>
                      <Input
                        value={form.numero || ""}
                        onChange={(e) => setForm({ ...form, numero: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Complemento</Label>
                      <Input
                        value={form.complemento || ""}
                        onChange={(e) => setForm({ ...form, complemento: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Bairro</Label>
                      <Input
                        value={form.bairro || ""}
                        onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Cidade</Label>
                      <Input
                        value={form.cidade || ""}
                        onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>UF</Label>
                      <Input
                        value={form.uf || ""}
                        onChange={(e) => setForm({ ...form, uf: e.target.value.toUpperCase() })}
                        maxLength={2}
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={form.observacoes || ""}
                    onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createFornecedor.isPending || updateFornecedor.isPending}>
                  {(createFornecedor.isPending || updateFornecedor.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingId ? "Salvar" : "Cadastrar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Fornecedores */}
        <div className={`${selectedFornecedor ? "lg:col-span-1" : "lg:col-span-3"}`}>
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <CardTitle className="flex-1">Lista de Fornecedores</CardTitle>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar fornecedor..."
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
              ) : filteredFornecedores.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {search ? "Nenhum fornecedor encontrado" : "Nenhum fornecedor cadastrado"}
                </div>
              ) : (
                <div className="divide-y -mx-2">
                  {filteredFornecedores.map((fornecedor) => (
                    <div
                      key={fornecedor.id}
                      className={`flex items-center gap-3 px-2 py-3 cursor-pointer hover:bg-muted/40 rounded-lg transition-colors ${selectedFornecedor?.id === fornecedor.id ? "bg-primary/5" : ""
                        }`}
                      onClick={() => setSelectedFornecedor(fornecedor)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{fornecedor.razao_social}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {fornecedor.nome_fantasia || fornecedor.cnpj || fornecedor.cidade || "-"}
                        </p>
                        {fornecedor.tipo_material && (
                          <Badge variant="secondary" className="text-[10px] mt-1">
                            <Package className="h-2.5 w-2.5 mr-1" />
                            {fornecedor.tipo_material}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDialog(fornecedor);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(fornecedor.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detalhe do Fornecedor */}
        {selectedFornecedor && (
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedFornecedor.razao_social}</CardTitle>
                    {selectedFornecedor.nome_fantasia && (
                      <p className="text-sm text-muted-foreground">{selectedFornecedor.nome_fantasia}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedFornecedor(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="info">Informações</TabsTrigger>
                    <TabsTrigger value="produtos" className="gap-1">
                      <Package className="h-3.5 w-3.5" />
                      Produtos/Materiais
                    </TabsTrigger>
                  </TabsList>

                  {/* Aba Informações */}
                  <TabsContent value="info">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {selectedFornecedor.cnpj && (
                        <div>
                          <span className="text-xs text-muted-foreground block">CNPJ</span>
                          <span>{selectedFornecedor.cnpj}</span>
                        </div>
                      )}
                      {selectedFornecedor.telefone && (
                        <div>
                          <span className="text-xs text-muted-foreground block">Telefone</span>
                          <span>{selectedFornecedor.telefone}</span>
                        </div>
                      )}
                      {selectedFornecedor.email && (
                        <div>
                          <span className="text-xs text-muted-foreground block">Email</span>
                          <span>{selectedFornecedor.email}</span>
                        </div>
                      )}
                      {selectedFornecedor.tipo_material && (
                        <div>
                          <span className="text-xs text-muted-foreground block">Material</span>
                          <span>{selectedFornecedor.tipo_material}</span>
                        </div>
                      )}
                      {selectedFornecedor.contato_nome && (
                        <div>
                          <span className="text-xs text-muted-foreground block">Contato</span>
                          <span>{selectedFornecedor.contato_nome} — {selectedFornecedor.contato_telefone}</span>
                        </div>
                      )}
                      {selectedFornecedor.cidade && (
                        <div>
                          <span className="text-xs text-muted-foreground block">Localização</span>
                          <span>{selectedFornecedor.cidade}/{selectedFornecedor.uf}</span>
                        </div>
                      )}
                      {selectedFornecedor.observacoes && (
                        <div className="col-span-2">
                          <span className="text-xs text-muted-foreground block">Observações</span>
                          <span>{selectedFornecedor.observacoes}</span>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Aba Produtos */}
                  <TabsContent value="produtos">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-sm text-muted-foreground">Produtos e materiais fornecidos</p>
                      <Button size="sm" className="gap-1" onClick={() => handleOpenProduto()}>
                        <Plus className="h-3.5 w-3.5" />
                        Novo Produto
                      </Button>
                    </div>

                    {loadingProdutos ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    ) : produtos.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        Nenhum produto cadastrado para este fornecedor
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {produtos.map((produto) => {
                          const hist = produto.historico || [];
                          const sorted = [...hist].sort((a, b) =>
                            new Date(b.data_compra).getTime() - new Date(a.data_compra).getTime()
                          );
                          const precoAnterior = sorted[1]?.preco;
                          const subiu = precoAnterior !== undefined && produto.preco_atual > precoAnterior;
                          const desceu = precoAnterior !== undefined && produto.preco_atual < precoAnterior;

                          return (
                            <div key={produto.id} className="border rounded-lg p-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{produto.nome}</span>
                                    <Badge variant="secondary" className="text-[10px]">{produto.unidade}</Badge>
                                  </div>
                                  {produto.descricao && (
                                    <p className="text-xs text-muted-foreground mt-0.5">{produto.descricao}</p>
                                  )}
                                  <div className="flex items-center gap-3 mt-2">
                                    <div>
                                      <span className="text-xs text-muted-foreground">Preço atual</span>
                                      <div className="flex items-center gap-1">
                                        <span className="font-bold text-base">{formatCurrency(produto.preco_atual)}</span>
                                        {subiu && <TrendingUp className="h-3.5 w-3.5 text-destructive" />}
                                        {desceu && <TrendingDown className="h-3.5 w-3.5 text-green-600" />}
                                      </div>
                                    </div>
                                    {produto.preco_minimo ? (
                                      <div>
                                        <span className="text-xs text-muted-foreground">Mín. registrado</span>
                                        <div className="text-sm text-green-600 font-medium">{formatCurrency(produto.preco_minimo)}</div>
                                      </div>
                                    ) : null}
                                    <div>
                                      <span className="text-xs text-muted-foreground">Compras</span>
                                      <div className="text-sm font-medium">{hist.length}x</div>
                                    </div>
                                  </div>

                                  {/* Últimas compras */}
                                  {sorted.slice(0, 3).length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      {sorted.slice(0, 3).map((h) => (
                                        <div key={h.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                                          <History className="h-2.5 w-2.5" />
                                          <span>{format(new Date(h.data_compra + "T00:00"), "dd/MM/yy", { locale: ptBR })}</span>
                                          <span className="font-medium text-foreground">{formatCurrency(h.preco)}</span>
                                          {h.quantidade && <span>× {h.quantidade} {produto.unidade}</span>}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 ml-2">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenHistorico(produto)}>
                                    <Plus className="h-3.5 w-3.5 text-primary" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenProduto(produto)}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteProduto.mutateAsync(produto.id)}>
                                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Dialog Produto */}
      <Dialog open={isProdutoDialogOpen} onOpenChange={setIsProdutoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProdutoId ? "Editar Produto" : "Novo Produto/Material"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitProduto} className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={produtoForm.nome}
                onChange={(e) => setProdutoForm({ ...produtoForm, nome: e.target.value })}
                placeholder="Ex: Vinil Adesivo Branco"
                required
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={produtoForm.descricao}
                onChange={(e) => setProdutoForm({ ...produtoForm, descricao: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Unidade</Label>
                <Input
                  value={produtoForm.unidade}
                  onChange={(e) => setProdutoForm({ ...produtoForm, unidade: e.target.value })}
                  placeholder="m², un, kg..."
                />
              </div>
              <div>
                <Label>Preço Atual (R$) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={produtoForm.preco_atual}
                  onChange={(e) => setProdutoForm({ ...produtoForm, preco_atual: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label>Preço Mínimo (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={produtoForm.preco_minimo}
                  onChange={(e) => setProdutoForm({ ...produtoForm, preco_minimo: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsProdutoDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createProduto.isPending || updateProduto.isPending}>
                {(createProduto.isPending || updateProduto.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingProdutoId ? "Salvar" : "Cadastrar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Histórico de Preço */}
      <Dialog open={isHistoricoDialogOpen} onOpenChange={setIsHistoricoDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar Compra — {selectedProduto?.nome}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitHistorico} className="space-y-4">
            <div>
              <Label>Preço Pago (R$) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={historicoForm.preco}
                onChange={(e) => setHistoricoForm({ ...historicoForm, preco: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <div>
              <Label>Data da Compra *</Label>
              <Input
                type="date"
                value={historicoForm.data_compra}
                onChange={(e) => setHistoricoForm({ ...historicoForm, data_compra: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Quantidade</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={historicoForm.quantidade || ""}
                onChange={(e) => setHistoricoForm({ ...historicoForm, quantidade: parseFloat(e.target.value) || 0 })}
                placeholder={`Em ${selectedProduto?.unidade}`}
              />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                value={historicoForm.observacoes}
                onChange={(e) => setHistoricoForm({ ...historicoForm, observacoes: e.target.value })}
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsHistoricoDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={addHistorico.isPending}>
                {addHistorico.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Registrar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
