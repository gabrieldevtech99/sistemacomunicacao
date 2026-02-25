import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ArrowDownCircle,
  ArrowUpCircle,
  FolderOpen,
  Loader2,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  useCategorias,
  useCreateCategoria,
  useDeleteCategoria,
  Categoria,
} from "@/hooks/useCategorias";
import { CORES_CATEGORIA, TipoCategoria } from "@/types/database";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CategoryCardProps {
  categoria: Categoria;
  onDelete: (id: string) => void;
  deleting: boolean;
}

function CategoryCard({ categoria, onDelete, deleting }: CategoryCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const corClass =
    CORES_CATEGORIA.find((c) => c.value === categoria.cor)?.class || "bg-blue-500";

  return (
    <>
      <div className="stat-card group hover:shadow-md transition-all">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("w-3 h-3 rounded-full", corClass)} />
            <div>
              <h3 className="font-semibold text-foreground">{categoria.nome}</h3>
              <p className="text-sm text-muted-foreground">
                {categoria.descricao || "Sem descrição"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            {categoria.tipo === "entrada" ? (
              <ArrowDownCircle className="h-4 w-4 text-success" />
            ) : (
              <ArrowUpCircle className="h-4 w-4 text-destructive" />
            )}
            <span className="text-xs text-muted-foreground">
              Categoria de {categoria.tipo === "entrada" ? "entrada" : "saída"}
            </span>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria "{categoria.nome}"? Esta ação
              não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(categoria.id);
                setDeleteOpen(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function Categorias() {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState<TipoCategoria>("entrada");
  const [cor, setCor] = useState("blue");

  const { data: categorias, isLoading } = useCategorias();
  const createCategoria = useCreateCategoria();
  const deleteCategoria = useDeleteCategoria();

  const categoriasEntrada = categorias?.filter((c) => c.tipo === "entrada") || [];
  const categoriasSaida = categorias?.filter((c) => c.tipo === "saida") || [];

  const handleSubmit = async () => {
    if (!nome) return;

    await createCategoria.mutateAsync({
      nome,
      descricao: descricao || undefined,
      tipo,
      cor,
    });

    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setNome("");
    setDescricao("");
    setTipo("entrada");
    setCor("blue");
  };

  const handleDelete = async (id: string) => {
    await deleteCategoria.mutateAsync(id);
  };

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Categorias
          </h1>
          <p className="text-muted-foreground mt-1">
            Organize suas entradas e saídas
          </p>
        </div>
        <Button className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
            <DialogDescription>
              Crie uma nova categoria para organizar suas transações.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome da Categoria *</Label>
              <Input
                id="nome"
                placeholder="Ex: Serviços"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                placeholder="Breve descrição..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as TipoCategoria)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cor">Cor</Label>
                <Select value={cor} onValueChange={setCor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {CORES_CATEGORIA.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-3 h-3 rounded-full", c.class)} />
                          {c.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={createCategoria.isPending || !nome}>
              {createCategoria.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Categoria"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="entradas" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="entradas" className="gap-2">
              <ArrowDownCircle className="h-4 w-4" />
              Entradas
              <Badge variant="secondary" className="ml-1">
                {categoriasEntrada.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="saidas" className="gap-2">
              <ArrowUpCircle className="h-4 w-4" />
              Saídas
              <Badge variant="secondary" className="ml-1">
                {categoriasSaida.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="entradas">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoriasEntrada.map((categoria) => (
                <CategoryCard
                  key={categoria.id}
                  categoria={categoria}
                  onDelete={handleDelete}
                  deleting={deleteCategoria.isPending}
                />
              ))}
              <button
                onClick={() => {
                  setTipo("entrada");
                  setOpen(true);
                }}
                className="stat-card border-dashed border-2 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-primary transition-colors min-h-[140px]"
              >
                <FolderOpen className="h-5 w-5" />
                <span>Adicionar Categoria</span>
              </button>
            </div>
          </TabsContent>

          <TabsContent value="saidas">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoriasSaida.map((categoria) => (
                <CategoryCard
                  key={categoria.id}
                  categoria={categoria}
                  onDelete={handleDelete}
                  deleting={deleteCategoria.isPending}
                />
              ))}
              <button
                onClick={() => {
                  setTipo("saida");
                  setOpen(true);
                }}
                className="stat-card border-dashed border-2 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-primary transition-colors min-h-[140px]"
              >
                <FolderOpen className="h-5 w-5" />
                <span>Adicionar Categoria</span>
              </button>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </MainLayout>
  );
}
