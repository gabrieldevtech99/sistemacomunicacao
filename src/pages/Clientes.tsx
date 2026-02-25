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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MaskedInput } from "@/components/masks/MaskedInput";
import { useClientes, ClienteInput, TipoPessoa } from "@/hooks/useClientes";
import { Plus, Search, Loader2, Pencil, Trash2, User, Building2 } from "lucide-react";

export default function Clientes() {
  const { clientes, isLoading, createCliente, updateCliente, deleteCliente } = useClientes();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ClienteInput>({
    nome: "",
    tipo_pessoa: "pf",
    cpf_cnpj: "",
    telefone: "",
    email: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    observacoes: "",
  });

  const filteredClientes = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.cpf_cnpj?.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setForm({
      nome: "",
      tipo_pessoa: "pf",
      cpf_cnpj: "",
      telefone: "",
      email: "",
      cep: "",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      uf: "",
      observacoes: "",
    });
    setEditingId(null);
  };

  const handleOpenDialog = (cliente?: typeof clientes[0]) => {
    if (cliente) {
      setEditingId(cliente.id);
      setForm({
        nome: cliente.nome,
        tipo_pessoa: cliente.tipo_pessoa,
        cpf_cnpj: cliente.cpf_cnpj || "",
        telefone: cliente.telefone || "",
        email: cliente.email || "",
        cep: cliente.cep || "",
        logradouro: cliente.logradouro || "",
        numero: cliente.numero || "",
        complemento: cliente.complemento || "",
        bairro: cliente.bairro || "",
        cidade: cliente.cidade || "",
        uf: cliente.uf || "",
        observacoes: cliente.observacoes || "",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateCliente.mutateAsync({ id: editingId, ...form });
    } else {
      await createCliente.mutateAsync(form);
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este cliente?")) {
      await deleteCliente.mutateAsync(id);
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

  return (
    <MainLayout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus clientes</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>Nome *</Label>
                  <Input
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    required
                    placeholder="Nome completo ou razão social"
                  />
                </div>

                <div>
                  <Label>Tipo de Pessoa</Label>
                  <Select
                    value={form.tipo_pessoa}
                    onValueChange={(v: TipoPessoa) => setForm({ ...form, tipo_pessoa: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pf">Pessoa Física</SelectItem>
                      <SelectItem value="pj">Pessoa Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{form.tipo_pessoa === "pf" ? "CPF" : "CNPJ"}</Label>
                  <MaskedInput
                    mask={form.tipo_pessoa === "pf" ? "cpf" : "cnpj"}
                    value={form.cpf_cnpj || ""}
                    onChange={(v) => setForm({ ...form, cpf_cnpj: v })}
                    placeholder={form.tipo_pessoa === "pf" ? "000.000.000-00" : "00.000.000/0000-00"}
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
                        placeholder="Rua, Avenida..."
                      />
                    </div>
                    <div>
                      <Label>Número</Label>
                      <Input
                        value={form.numero || ""}
                        onChange={(e) => setForm({ ...form, numero: e.target.value })}
                        placeholder="123"
                      />
                    </div>
                    <div>
                      <Label>Complemento</Label>
                      <Input
                        value={form.complemento || ""}
                        onChange={(e) => setForm({ ...form, complemento: e.target.value })}
                        placeholder="Apto, Sala..."
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
                        placeholder="SP"
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={form.observacoes || ""}
                    onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                    placeholder="Informações adicionais..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createCliente.isPending || updateCliente.isPending}>
                  {(createCliente.isPending || updateCliente.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingId ? "Salvar" : "Cadastrar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <CardTitle className="flex-1">Lista de Clientes</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
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
          ) : filteredClientes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>CPF/CNPJ</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Cidade</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClientes.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">{cliente.nome}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          {cliente.tipo_pessoa === "pf" ? (
                            <>
                              <User className="h-3 w-3" /> PF
                            </>
                          ) : (
                            <>
                              <Building2 className="h-3 w-3" /> PJ
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>{cliente.cpf_cnpj || "-"}</TableCell>
                      <TableCell>{cliente.telefone || "-"}</TableCell>
                      <TableCell>{cliente.email || "-"}</TableCell>
                      <TableCell>{cliente.cidade ? `${cliente.cidade}/${cliente.uf}` : "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(cliente)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(cliente.id)}
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
