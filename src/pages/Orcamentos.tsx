import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { useOrcamentos, StatusOrcamento } from "@/hooks/useOrcamentos";
import {
  Plus,
  Search,
  Loader2,
  FileText,
  Send,
  CheckCircle,
  Trash2,
  Eye,
  Copy,
  Pencil
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_CONFIG: Record<StatusOrcamento, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  rascunho: { label: "Rascunho", variant: "secondary" },
  enviado: { label: "Enviado", variant: "outline" },
  aprovado: { label: "Aprovado", variant: "default" },
  rejeitado: { label: "Rejeitado", variant: "destructive" },
};

export default function Orcamentos() {
  const navigate = useNavigate();
  const { orcamentos, isLoading, deleteOrcamento } = useOrcamentos();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredOrcamentos = orcamentos.filter((orc) => {
    const matchesSearch =
      orc.cliente?.nome?.toLowerCase().includes(search.toLowerCase()) ||
      String(orc.numero).includes(search);
    const matchesStatus = statusFilter === "all" || orc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este orçamento?")) {
      await deleteOrcamento.mutateAsync(id);
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Orçamentos</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus orçamentos comerciais</p>
        </div>
        <Button className="gap-2" onClick={() => navigate("/orcamentos/novo")}>
          <Plus className="h-4 w-4" />
          Novo Orçamento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <CardTitle className="flex-1">Lista de Orçamentos</CardTitle>
            <div className="flex flex-col md:flex-row gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="rejeitado">Rejeitado</SelectItem>
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
          ) : filteredOrcamentos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              {search || statusFilter !== "all" ? "Nenhum orçamento encontrado" : "Nenhum orçamento cadastrado"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[150px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrcamentos.map((orc) => {
                    const config = STATUS_CONFIG[orc.status];
                    return (
                      <TableRow key={orc.id}>
                        <TableCell className="font-medium">#{orc.numero}</TableCell>
                        <TableCell>{orc.cliente?.nome || "Sem cliente"}</TableCell>
                        <TableCell>{orc.vendedor_nome || "-"}</TableCell>
                        <TableCell>
                          {format(new Date(orc.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {orc.prazo_entrega
                            ? format(new Date(orc.prazo_entrega), "dd/MM/yyyy", { locale: ptBR })
                            : orc.dias_uteis
                              ? `${orc.dias_uteis} dias úteis`
                              : "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(orc.valor_final)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={config.variant}>{config.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Ver detalhes"
                              onClick={() => navigate(`/orcamentos/${orc.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Editar"
                              onClick={() => navigate(`/orcamentos/${orc.id}?edit=true`)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Excluir"
                              onClick={() => handleDelete(orc.id)}
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
