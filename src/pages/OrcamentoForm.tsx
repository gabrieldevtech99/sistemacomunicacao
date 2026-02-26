import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useClientes } from "@/hooks/useClientes";
import { useProdutos } from "@/hooks/useProdutos";
import { useOrcamentos, OrcamentoItem, StatusOrcamento } from "@/hooks/useOrcamentos";
import { useOrdemServico } from "@/hooks/useOrdemServico";
import { usePedidos } from "@/hooks/usePedidos";
import { useContasReceber } from "@/hooks/useContasReceber";
import { useEmpresa } from "@/contexts/EmpresaContext";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  CalendarIcon,
  FileText,
  MessageCircle,
  CheckCircle,
  Send,
  Pencil
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "@/hooks/use-toast";

interface ItemForm {
  produto_id: string | null;
  descricao: string;
  quantidade: number;
  unidade: string;
  valor_unitario: number;
  valor_total: number;
}

export default function OrcamentoForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { empresaAtiva } = useEmpresa();
  const { clientes } = useClientes();
  const { data: produtos = [] } = useProdutos();
  const { createOrcamento, updateOrcamento, getOrcamentoComItens, updateOrcamentoStatus } = useOrcamentos();
  const { createOS } = useOrdemServico();
  const { createPedido } = usePedidos();
  const { createConta } = useContasReceber();

  const [isLoading, setIsLoading] = useState(false);
  const [clienteId, setClienteId] = useState<string>("");
  const [prazoEntrega, setPrazoEntrega] = useState<Date | undefined>();
  const [diasUteis, setDiasUteis] = useState<number | undefined>();
  const [desconto, setDesconto] = useState(0);
  const [observacoes, setObservacoes] = useState("");
  const [validade, setValidade] = useState<Date | undefined>();
  const [garantiaServico, setGarantiaServico] = useState("GARANTIA: OS MATERIAIS ELÉTRICOS (FONTES, LEDS, ETC.) SÃO GARANTIDOS PELO PERÍODO LEGAL DE 3 MESES.\nESTA GARANTIA NÃO COBRE DEFEITOS OU PROBLEMAS CAUSADOS POR SOBRETENSÕES, CHUVAS, RAIOS, VENTOS, ETC.)\nE SERÁ AUTOMATICAMENTE CANCELADA SE HOUVER INTERFERENCIA DE PESSOAS OU TÉCNICOS NÃO AUTORIZADOS.");
  const [requisitos, setRequisitos] = useState("");
  const [formasPagamento, setFormasPagamento] = useState("");
  const [chavePix, setChavePix] = useState("");
  const [banco, setBanco] = useState("");
  const [vendedorNome, setVendedorNome] = useState("");
  const [numeroManual, setNumeroManual] = useState("");
  const [enderecoEntrega, setEnderecoEntrega] = useState("");
  const [descricaoServico, setDescricaoServico] = useState("");
  const [itens, setItens] = useState<ItemForm[]>([]);
  const [orcamentoCarregado, setOrcamentoCarregado] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(searchParams.get("edit") === "true");

  const [novoItem, setNovoItem] = useState<ItemForm>({
    produto_id: null,
    descricao: "",
    quantidade: 1,
    unidade: "un",
    valor_unitario: 0,
    valor_total: 0,
  });

  useEffect(() => {
    if (id) {
      carregarOrcamento();
    }
  }, [id]);

  useEffect(() => {
    setIsEditing(searchParams.get("edit") === "true");
  }, [searchParams]);

  const carregarOrcamento = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const orc = await getOrcamentoComItens(id);
      if (orc) {
        setOrcamentoCarregado(orc);
        setClienteId(orc.cliente_id || "");
        setPrazoEntrega(orc.prazo_entrega ? new Date(orc.prazo_entrega) : undefined);
        setDiasUteis(orc.dias_uteis || undefined);
        setDesconto(orc.desconto);
        setObservacoes(orc.observacoes || "");
        setValidade(orc.validade ? new Date(orc.validade) : undefined);
        setGarantiaServico((orc as any).garantia_servico || "");
        setRequisitos((orc as any).requisitos || "");
        setFormasPagamento((orc as any).formas_pagamento || "");
        setChavePix((orc as any).chave_pix || "");
        setBanco((orc as any).banco || "");
        setVendedorNome((orc as any).vendedor_nome || "");
        setNumeroManual((orc as any).numero_manual || "");
        setEnderecoEntrega((orc as any).endereco_entrega || "");
        setDescricaoServico((orc as any).descricao_servico || "");
        setItens((orc.itens || []).map(item => ({ ...item, produto_id: item.produto_id ?? null })));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const calcularTotal = () => {
    const subtotal = itens.reduce((sum, item) => sum + item.valor_total, 0);
    return subtotal - desconto;
  };

  const handleProdutoChange = (produtoId: string) => {
    const produto = produtos.find((p) => p.id === produtoId);
    if (produto) {
      setNovoItem({
        produto_id: produtoId,
        descricao: produto.nome,
        quantidade: 1,
        unidade: produto.unidade,
        valor_unitario: produto.valor_venda,
        valor_total: produto.valor_venda,
      });
    }
  };

  const handleQuantidadeChange = (quantidade: number) => {
    setNovoItem((prev) => ({
      ...prev,
      quantidade,
      valor_total: quantidade * prev.valor_unitario,
    }));
  };

  const handleValorUnitarioChange = (valor_unitario: number) => {
    setNovoItem((prev) => ({
      ...prev,
      valor_unitario,
      valor_total: prev.quantidade * valor_unitario,
    }));
  };

  const adicionarItem = () => {
    if (!novoItem.descricao) {
      toast({ title: "Informe a descrição do item", variant: "destructive" });
      return;
    }
    setItens([...itens, novoItem]);
    setNovoItem({
      produto_id: null,
      descricao: "",
      quantidade: 1,
      unidade: "un",
      valor_unitario: 0,
      valor_total: 0,
    });
  };

  const removerItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const handleSalvar = async () => {
    if (itens.length === 0) {
      toast({ title: "Adicione pelo menos um item", variant: "destructive" });
      return;
    }
    if (!prazoEntrega && !diasUteis) {
      toast({ title: "Informe o prazo de entrega", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const input = {
        cliente_id: clienteId || undefined,
        prazo_entrega: prazoEntrega?.toISOString().split("T")[0],
        dias_uteis: diasUteis,
        desconto,
        observacoes,
        validade: validade?.toISOString().split("T")[0],
        garantia_servico: garantiaServico || undefined,
        requisitos: requisitos || undefined,
        formas_pagamento: formasPagamento || undefined,
        chave_pix: chavePix || undefined,
        banco: banco || undefined,
        vendedor_nome: vendedorNome || undefined,
        numero_manual: numeroManual || undefined,
        endereco_entrega: enderecoEntrega || undefined,
        descricao_servico: descricaoServico || undefined,
        itens,
      };

      if (id) {
        await updateOrcamento.mutateAsync({ id, input });
        setIsEditing(false);
        carregarOrcamento();
      } else {
        await createOrcamento.mutateAsync(input);
        navigate("/orcamentos");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const gerarPDF = () => {
    if (!orcamentoCarregado) return;

    const doc = new jsPDF();
    const cliente = clientes.find((c) => c.id === orcamentoCarregado.cliente_id);

    // Cabeçalho com dados da empresa
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(empresaAtiva?.nome || "Empresa", 14, 22);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    let headerY = 28;
    if (empresaAtiva?.cnpj) { doc.text(`CNPJ: ${empresaAtiva.cnpj}`, 14, headerY); headerY += 5; }
    if (empresaAtiva?.telefone) { doc.text(`Tel: ${empresaAtiva.telefone}`, 14, headerY); headerY += 5; }
    if (empresaAtiva?.email) { doc.text(`Email: ${empresaAtiva.email}`, 14, headerY); headerY += 5; }
    if (empresaAtiva?.endereco) { doc.text(`End: ${empresaAtiva.endereco}`, 14, headerY, { maxWidth: 100 }); headerY += 5; }

    // Orçamento info
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    const numOS = orcamentoCarregado.numero_manual || orcamentoCarregado.numero;
    doc.text(`ORÇAMENTO #${numOS}`, 130, 22);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Data: ${format(new Date(orcamentoCarregado.created_at), "dd/MM/yyyy")}`, 130, 30);
    if (orcamentoCarregado.validade) {
      doc.text(`Validade: ${format(new Date(orcamentoCarregado.validade), "dd/MM/yyyy")}`, 130, 36);
    }

    // Cliente
    const clienteStartY = Math.max(headerY + 5, 50);
    doc.setFillColor(240, 240, 240);
    doc.rect(14, clienteStartY, 182, 25, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("CLIENTE", 18, clienteStartY + 8);
    doc.setFont("helvetica", "normal");
    doc.text(cliente?.nome || "Não informado", 18, clienteStartY + 15);
    if (cliente?.telefone) doc.text(`Tel: ${cliente.telefone}`, 18, clienteStartY + 21);

    // Vendedor
    const vendedor = orcamentoCarregado.vendedor_nome || vendedorNome || "Não informado";
    doc.setFont("helvetica", "bold");
    doc.text("VENDEDOR/RESPONSÁVEL", 130, clienteStartY + 8);
    doc.setFont("helvetica", "normal");
    doc.text(vendedor, 130, clienteStartY + 15);

    // Tabela de itens
    const tableData = itens.map((item) => [
      item.descricao,
      `${item.quantidade} ${item.unidade}`,
      new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.valor_unitario),
      new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.valor_total),
    ]);

    autoTable(doc, {
      startY: clienteStartY + 30,
      head: [["Descrição", "Qtd", "Valor Unit.", "Total"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 10 },
      columnStyles: { 0: { cellWidth: 80 } },
    });

    let finalY = (doc as any).lastAutoTable.finalY + 10;

    // Totais
    const subtotal = itens.reduce((sum, item) => sum + item.valor_total, 0);
    doc.setFontSize(11);
    doc.text(`Subtotal: ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(subtotal)}`, 140, finalY);
    if (orcamentoCarregado.desconto > 0) {
      finalY += 6;
      doc.text(`Desconto: -${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(orcamentoCarregado.desconto)}`, 140, finalY);
    }
    finalY += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(`TOTAL: ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(orcamentoCarregado.valor_final)}`, 140, finalY);

    // Prazo
    finalY += 12;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const prazoTexto = orcamentoCarregado.prazo_entrega
      ? `Prazo de Entrega: ${format(new Date(orcamentoCarregado.prazo_entrega), "dd/MM/yyyy")}`
      : orcamentoCarregado.dias_uteis
        ? `Prazo de Entrega: ${orcamentoCarregado.dias_uteis} dias úteis`
        : "";
    if (prazoTexto) { doc.text(prazoTexto, 14, finalY); finalY += 8; }

    // Garantia do Serviço
    const garantia = (orcamentoCarregado as any).garantia_servico || garantiaServico;
    if (garantia) {
      doc.setFont("helvetica", "bold");
      doc.text("GARANTIA DO SERVIÇO", 14, finalY);
      finalY += 6;
      doc.setFont("helvetica", "normal");
      doc.text(garantia, 14, finalY, { maxWidth: 180 });
      finalY += Math.ceil(garantia.length / 80) * 5 + 5;
    }

    // Descrição Complementar (antigo Requisitos)
    const req = (orcamentoCarregado as any).requisitos || requisitos;
    if (req) {
      if (finalY > 260) { doc.addPage(); finalY = 20; }
      doc.setFont("helvetica", "bold");
      doc.text("DESCRIÇÃO COMPLEMENTAR", 14, finalY);
      finalY += 6;
      doc.setFont("helvetica", "normal");
      doc.text(req, 14, finalY, { maxWidth: 180 });
      finalY += Math.ceil(req.length / 80) * 5 + 5;
    }

    // Descrição do Serviço
    const descServ = orcamentoCarregado.descricao_servico || descricaoServico;
    if (descServ) {
      if (finalY > 260) { doc.addPage(); finalY = 20; }
      doc.setFont("helvetica", "bold");
      doc.text("DESCRIÇÃO DO SERVIÇO", 14, finalY);
      finalY += 6;
      doc.setFont("helvetica", "normal");
      doc.text(descServ, 14, finalY, { maxWidth: 180 });
      finalY += Math.ceil(descServ.length / 80) * 5 + 5;
    }

    // Endereço de Entrega
    const endEnt = orcamentoCarregado.endereco_entrega || enderecoEntrega;
    if (endEnt) {
      if (finalY > 260) { doc.addPage(); finalY = 20; }
      doc.setFont("helvetica", "bold");
      doc.text("ENDEREÇO DE ENTREGA", 14, finalY);
      finalY += 6;
      doc.setFont("helvetica", "normal");
      doc.text(endEnt, 14, finalY, { maxWidth: 180 });
      finalY += Math.ceil(endEnt.length / 80) * 5 + 5;
    }

    // Formas de Pagamento
    const fp = (orcamentoCarregado as any).formas_pagamento || formasPagamento;
    if (fp || (orcamentoCarregado as any).chave_pix || chavePix) {
      if (finalY > 250) { doc.addPage(); finalY = 20; }
      doc.setFont("helvetica", "bold");
      doc.text("FORMAS DE PAGAMENTO", 14, finalY);
      finalY += 6;
      doc.setFont("helvetica", "normal");
      if (fp) { doc.text(fp, 14, finalY, { maxWidth: 180 }); finalY += Math.ceil(fp.length / 80) * 5 + 3; }
      const pix = (orcamentoCarregado as any).chave_pix || chavePix;
      const bco = (orcamentoCarregado as any).banco || banco;
      if (pix) { doc.text(`Chave PIX: ${pix}`, 14, finalY); finalY += 5; }
      if (bco) { doc.text(`Banco: ${bco}`, 14, finalY); finalY += 5; }
    }

    // Observações
    if (orcamentoCarregado.observacoes) {
      if (finalY > 260) { doc.addPage(); finalY = 20; }
      finalY += 5;
      doc.setFont("helvetica", "bold");
      doc.text("OBSERVAÇÕES", 14, finalY);
      finalY += 6;
      doc.setFont("helvetica", "normal");
      doc.text(orcamentoCarregado.observacoes, 14, finalY, { maxWidth: 180 });
    }

    doc.save(`orcamento-${orcamentoCarregado.numero}.pdf`);
    toast({ title: "PDF gerado com sucesso!" });
  };

  const enviarWhatsApp = () => {
    if (!orcamentoCarregado) return;
    const cliente = clientes.find((c) => c.id === orcamentoCarregado.cliente_id);

    if (!cliente?.telefone) {
      toast({ title: "Cliente não possui telefone cadastrado", variant: "destructive" });
      return;
    }

    const telefone = cliente.telefone.replace(/\D/g, "");
    const prazoTexto = orcamentoCarregado.prazo_entrega
      ? format(new Date(orcamentoCarregado.prazo_entrega), "dd/MM/yyyy")
      : orcamentoCarregado.dias_uteis
        ? `${orcamentoCarregado.dias_uteis} dias úteis`
        : "A combinar";

    const mensagem = `Olá! Segue o orçamento #${orcamentoCarregado.numero} da ${empresaAtiva?.nome || "nossa empresa"}:

📋 *Cliente:* ${cliente.nome}
💰 *Total:* ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(orcamentoCarregado.valor_final)}
📅 *Prazo:* ${prazoTexto}

Aguardamos seu retorno!`;

    const url = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, "_blank");
  };

  const aprovarOrcamento = async () => {
    if (!orcamentoCarregado || !id) return;

    setIsLoading(true);
    try {
      // 1. Atualizar status do orçamento para aprovado
      await updateOrcamentoStatus.mutateAsync({ id, status: "aprovado" });

      // 2. Criar Ordem de Serviço automaticamente
      await createOS.mutateAsync({
        titulo: `OS - Orçamento #${orcamentoCarregado.numero}`,
        cliente_id: orcamentoCarregado.cliente_id || undefined,
        responsavel: (orcamentoCarregado as any).vendedor_nome || vendedorNome || undefined,
        status: "aberta",
        prioridade: "normal",
        data_previsao: orcamentoCarregado.prazo_entrega || undefined,
        descricao: (orcamentoCarregado as any).descricao_servico || descricaoServico || undefined,
        observacoes: orcamentoCarregado.observacoes || undefined,
        orcamento_id: id,
        orcamento_origem_id: id,
      });

      // 3. Criar conta a receber
      await createConta.mutateAsync({
        cliente_id: orcamentoCarregado.cliente_id || undefined,
        descricao: `Orçamento #${orcamentoCarregado.numero}`,
        valor: orcamentoCarregado.valor_final,
        data_vencimento: orcamentoCarregado.prazo_entrega || new Date().toISOString().split("T")[0],
        forma_pagamento: "dinheiro",
      });

      toast({ title: "Orçamento aprovado! Ordem de Serviço criada com sucesso." });
      navigate("/ordem-servico");
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  if (isLoading && id) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const isViewMode = !!id && !!orcamentoCarregado && !isEditing;

  return (
    <MainLayout>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/orcamentos")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {id && orcamentoCarregado ? `Orçamento #${orcamentoCarregado.numero}` : "Novo Orçamento"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isViewMode ? "Detalhes do orçamento" : isEditing ? "Editando orçamento" : "Preencha os dados do orçamento"}
          </p>
        </div>
        {orcamentoCarregado && (
          <div className="ml-auto flex gap-2">
            <Badge variant={orcamentoCarregado.status === "aprovado" ? "default" : "secondary"}>
              {orcamentoCarregado.status.toUpperCase()}
            </Badge>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {isViewMode ? (
          <>
            <Button variant="outline" className="gap-2" onClick={gerarPDF}>
              <FileText className="h-4 w-4" />
              Gerar PDF
            </Button>
            <Button variant="outline" className="gap-2" onClick={enviarWhatsApp}>
              <MessageCircle className="h-4 w-4" />
              Enviar WhatsApp
            </Button>
            {orcamentoCarregado.status === "rascunho" && (
              <>
                <Button variant="outline" className="gap-2" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => updateOrcamentoStatus.mutateAsync({ id: id!, status: "enviado" })}>
                  <Send className="h-4 w-4" />
                  Marcar como Enviado
                </Button>
              </>
            )}
            {orcamentoCarregado.status !== "aprovado" && (
              <Button className="gap-2" onClick={aprovarOrcamento}>
                <CheckCircle className="h-4 w-4" />
                Aprovar
              </Button>
            )}
          </>
        ) : (
          <div className="flex gap-2 ml-auto w-full md:w-auto">
            {id && (
              <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isLoading}>
                Cancelar
              </Button>
            )}
            <Button onClick={handleSalvar} disabled={isLoading} className="flex-1 md:flex-none gap-2">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {id ? "Salvar Alterações" : "Salvar Orçamento"}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Cliente e Prazo */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Cliente</Label>
                  <Select value={clienteId} onValueChange={setClienteId} disabled={isViewMode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Vendedor/Responsável</Label>
                  <Input
                    value={vendedorNome}
                    onChange={(e) => setVendedorNome(e.target.value)}
                    placeholder="Nome do vendedor ou responsável"
                    disabled={isViewMode}
                  />
                </div>

                {!isViewMode && (
                  <div>
                    <Label>Número Manual (Opcional)</Label>
                    <Input
                      value={numeroManual}
                      onChange={(e) => setNumeroManual(e.target.value)}
                      placeholder="Ex: 2024-001"
                    />
                  </div>
                )}

                <div>
                  <Label>Prazo de Entrega *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !prazoEntrega && "text-muted-foreground"
                        )}
                        disabled={isViewMode}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {prazoEntrega ? format(prazoEntrega, "dd/MM/yyyy", { locale: ptBR }) : "Selecione uma data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={prazoEntrega}
                        onSelect={setPrazoEntrega}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Ou dias úteis</Label>
                  <Input
                    type="number"
                    min="1"
                    value={diasUteis || ""}
                    onChange={(e) => setDiasUteis(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Ex: 10"
                    disabled={isViewMode}
                  />
                </div>

                <div>
                  <Label>Validade do Orçamento</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !validade && "text-muted-foreground"
                        )}
                        disabled={isViewMode}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {validade ? format(validade, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={validade}
                        onSelect={setValidade}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <Label>Garantia do Serviço</Label>
                <Textarea
                  value={garantiaServico}
                  readOnly
                  rows={4}
                  className="bg-muted/50 cursor-default"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Endereço de Entrega</Label>
                  <Input
                    value={enderecoEntrega}
                    onChange={(e) => setEnderecoEntrega(e.target.value)}
                    placeholder="Cidade, bairro, rua..."
                    disabled={isViewMode}
                  />
                </div>
                <div>
                  <Label>Descrição Complementar</Label>
                  <Input
                    value={requisitos}
                    onChange={(e) => setRequisitos(e.target.value)}
                    placeholder="Detalhes técnicos, materiais..."
                    disabled={isViewMode}
                  />
                </div>
              </div>

              <div>
                <Label>Descrição do Serviço</Label>
                <Textarea
                  value={descricaoServico}
                  onChange={(e) => setDescricaoServico(e.target.value)}
                  placeholder="Descrição detalhada do serviço a ser realizado..."
                  rows={4}
                  disabled={isViewMode}
                />
              </div>

              <div>
                <Label>Observações Gerais</Label>
                <Textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Informações adicionais..."
                  rows={2}
                  disabled={isViewMode}
                />
              </div>
            </CardContent>
          </Card>

          {/* Itens */}
          <Card>
            <CardHeader>
              <CardTitle>Itens do Orçamento</CardTitle>
            </CardHeader>
            <CardContent>
              {!isViewMode && (
                <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-4 p-4 bg-muted/50 rounded-lg">
                  <div className="md:col-span-2">
                    <Label>Produto</Label>
                    <Select
                      value={novoItem.produto_id || ""}
                      onValueChange={handleProdutoChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione ou digite abaixo" />
                      </SelectTrigger>
                      <SelectContent>
                        {produtos.map((produto) => (
                          <SelectItem key={produto.id} value={produto.id}>
                            {produto.nome} - {formatCurrency(produto.valor_venda)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Descrição</Label>
                    <Textarea
                      value={novoItem.descricao}
                      onChange={(e) => setNovoItem({ ...novoItem, descricao: e.target.value })}
                      placeholder="Descrição do item"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Qtd</Label>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={novoItem.quantidade}
                      onChange={(e) => handleQuantidadeChange(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>Unid</Label>
                    <Select
                      value={novoItem.unidade}
                      onValueChange={(v) => setNovoItem({ ...novoItem, unidade: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="un">un</SelectItem>
                        <SelectItem value="m">m</SelectItem>
                        <SelectItem value="m2">m²</SelectItem>
                        <SelectItem value="pç">pç</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Valor Unit.</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={novoItem.valor_unitario}
                      onChange={(e) => handleValorUnitarioChange(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={adicionarItem} className="w-full gap-1">
                      <Plus className="h-4 w-4" />
                      Adicionar
                    </Button>
                  </div>
                </div>
              )}

              {itens.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum item adicionado
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Valor Unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      {!isViewMode && <TableHead className="w-[50px]"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itens.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="whitespace-pre-wrap">{item.descricao}</TableCell>
                        <TableCell className="text-right">
                          {item.quantidade} {item.unidade}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(item.valor_unitario)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(item.valor_total)}</TableCell>
                        {!isViewMode && (
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => removerItem(index)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle>Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Formas de Pagamento</Label>
                <Textarea
                  value={formasPagamento}
                  onChange={(e) => setFormasPagamento(e.target.value)}
                  placeholder="Descreva as formas de pagamento aceitas..."
                  rows={3}
                  disabled={isViewMode}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Chave PIX</Label>
                  <Input
                    value={chavePix}
                    onChange={(e) => setChavePix(e.target.value)}
                    placeholder="Chave PIX"
                    disabled={isViewMode}
                  />
                </div>
                <div>
                  <Label>Banco</Label>
                  <Input
                    value={banco}
                    onChange={(e) => setBanco(e.target.value)}
                    placeholder="Nome do banco"
                    disabled={isViewMode}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumo */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(itens.reduce((sum, i) => sum + i.valor_total, 0))}</span>
              </div>

              {!isViewMode && (
                <div>
                  <Label>Desconto</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={desconto}
                    onChange={(e) => setDesconto(parseFloat(e.target.value) || 0)}
                  />
                </div>
              )}

              {desconto > 0 && (
                <div className="flex justify-between text-sm text-destructive">
                  <span>Desconto</span>
                  <span>-{formatCurrency(desconto)}</span>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(calcularTotal())}</span>
                </div>
              </div>

              {!isViewMode && (
                <Button
                  className="w-full"
                  onClick={handleSalvar}
                  disabled={isLoading || itens.length === 0}
                >
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Salvar Orçamento
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout >
  );
}
