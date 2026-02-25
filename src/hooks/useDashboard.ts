import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/contexts/EmpresaContext";

export interface DashboardData {
  faturamentoMes: number;
  despesasMes: number;
  lucroLiquidoMes: number;
  totalReceberPendente: number;
  totalPagarPendente: number;
  osPorStatus: { status: string; total: number }[];
  osPorPrioridade: { prioridade: string; total: number }[];
  osAtrasadas: number;
  orcamentosAbertos: number;
  orcamentosAprovados: number;
  comprasAbertas: number;
  graficoMensal: { mes: string; entradas: number; saidas: number }[];
  transacoesRecentes: {
    id: string;
    descricao: string;
    categoria: string;
    tipo: "entrada" | "saida";
    valor: number;
    data: string;
  }[];
  produtosEstoqueBaixo: {
    id: string;
    nome: string;
    quantidade: number;
    quantidade_minima: number;
  }[];
}

export function useDashboardData() {
  const { empresaAtiva } = useEmpresa();

  return useQuery({
    queryKey: ["dashboard-data", empresaAtiva?.id],
    queryFn: async (): Promise<DashboardData> => {
      if (!empresaAtiva?.id) {
        throw new Error("Empresa não selecionada");
      }

      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      // 1. Faturamento do Mês (Contas Receber Pagas no mês atual)
      const { data: recebimentosMes } = await supabase
        .from("contas_receber")
        .select("valor")
        .eq("empresa_id", empresaAtiva.id)
        .eq("status", "recebido")
        .gte("data_recebimento", firstDayOfMonth)
        .lte("data_recebimento", lastDayOfMonth);

      const faturamentoMes = recebimentosMes?.reduce((sum, item) => sum + Number(item.valor), 0) || 0;

      // 2. Despesas do Mês (Contas Pagar Pagas no mês atual)
      const { data: pagamentosMes } = await supabase
        .from("contas_pagar")
        .select("valor")
        .eq("empresa_id", empresaAtiva.id)
        .eq("status", "pago")
        .gte("data_pagamento", firstDayOfMonth)
        .lte("data_pagamento", lastDayOfMonth);

      const despesasMes = pagamentosMes?.reduce((sum, item) => sum + Number(item.valor), 0) || 0;

      // 3. Pendentes de Receber
      const { data: pendentesReceber } = await supabase
        .from("contas_receber")
        .select("valor")
        .eq("empresa_id", empresaAtiva.id)
        .eq("status", "pendente");

      const totalReceberPendente = pendentesReceber?.reduce((sum, item) => sum + Number(item.valor), 0) || 0;

      // 4. Pendentes de Pagar
      const { data: pendentesPagar } = await supabase
        .from("contas_pagar")
        .select("valor")
        .eq("empresa_id", empresaAtiva.id)
        .eq("status", "pendente");

      const totalPagarPendente = pendentesPagar?.reduce((sum, item) => sum + Number(item.valor), 0) || 0;

      // 5. Ordens de Serviço por Status
      const { data: osStatus } = await supabase
        .from("ordens_servico")
        .select("status")
        .eq("empresa_id", empresaAtiva.id);

      const statusMap: Record<string, number> = {};
      osStatus?.forEach((os) => {
        statusMap[os.status] = (statusMap[os.status] || 0) + 1;
      });

      const osPorStatus = Object.entries(statusMap).map(([status, total]) => ({
        status,
        total,
      }));

      // 6. Transações Recentes (Union of Pagar and Receber)
      const { data: ultimosRecebimentos } = await supabase
        .from("contas_receber")
        .select("id, descricao, valor, created_at, categoria:categorias(nome)")
        .eq("empresa_id", empresaAtiva.id)
        .order("created_at", { ascending: false })
        .limit(5);

      const { data: ultimosPagamentos } = await supabase
        .from("contas_pagar")
        .select("id, descricao, valor, created_at, categoria:categorias(nome)")
        .eq("empresa_id", empresaAtiva.id)
        .order("created_at", { ascending: false })
        .limit(5);

      const transacoesRecentes = [
        ...(ultimosRecebimentos || []).map((r) => ({
          id: r.id,
          descricao: r.descricao,
          categoria: r.categoria?.nome || "Receita",
          tipo: "entrada" as const,
          valor: Number(r.valor),
          data: r.created_at,
        })),
        ...(ultimosPagamentos || []).map((p) => ({
          id: p.id,
          descricao: p.descricao,
          categoria: p.categoria?.nome || "Despesa",
          tipo: "saida" as const,
          valor: Number(p.valor),
          data: p.created_at,
        })),
      ]
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        .slice(0, 5);

      // 7. Gráfico Mensal (últimos 6 meses)
      const graficoMensal = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mesNome = d.toLocaleDateString("pt-BR", { month: "short" });
        const mesStart = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
        const mesEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();

        const { data: ent } = await supabase
          .from("contas_receber")
          .select("valor")
          .eq("empresa_id", empresaAtiva.id)
          .eq("status", "recebido")
          .gte("data_recebimento", mesStart)
          .lte("data_recebimento", mesEnd);

        const { data: sai } = await supabase
          .from("contas_pagar")
          .select("valor")
          .eq("empresa_id", empresaAtiva.id)
          .eq("status", "pago")
          .gte("data_pagamento", mesStart)
          .lte("data_pagamento", mesEnd);

        graficoMensal.push({
          mes: mesNome.charAt(0).toUpperCase() + mesNome.slice(1).replace(".", ""),
          entradas: ent?.reduce((sum, item) => sum + Number(item.valor), 0) || 0,
          saidas: sai?.reduce((sum, item) => sum + Number(item.valor), 0) || 0,
        });
      }

      // 8. Estoque Baixo
      const { data: produtos } = await supabase
        .from("produtos")
        .select("id, nome, quantidade, quantidade_minima")
        .eq("empresa_id", empresaAtiva.id);

      const produtosEstoqueBaixo = (produtos || [])
        .filter((p) => p.quantidade <= p.quantidade_minima)
        .map((p) => ({
          id: p.id,
          nome: p.nome,
          quantidade: p.quantidade,
          quantidade_minima: p.quantidade_minima,
        }));

      // 9. Status Adicionais
      const { count: orcamentosAbertos } = await supabase
        .from("orcamentos")
        .select("*", { count: "exact", head: true })
        .eq("empresa_id", empresaAtiva.id)
        .eq("status", "enviado");

      const { count: orcamentosAprovados } = await supabase
        .from("orcamentos")
        .select("*", { count: "exact", head: true })
        .eq("empresa_id", empresaAtiva.id)
        .eq("status", "aprovado");

      return {
        faturamentoMes,
        despesasMes,
        lucroLiquidoMes: faturamentoMes - despesasMes,
        totalReceberPendente,
        totalPagarPendente,
        osPorStatus,
        osPorPrioridade: [],
        osAtrasadas: 0,
        orcamentosAbertos: orcamentosAbertos || 0,
        orcamentosAprovados: orcamentosAprovados || 0,
        comprasAbertas: 0,
        graficoMensal,
        transacoesRecentes,
        produtosEstoqueBaixo,
      };
    },
    enabled: !!empresaAtiva?.id,
  });
}
