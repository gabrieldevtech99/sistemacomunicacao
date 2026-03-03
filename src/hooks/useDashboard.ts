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
      const year = now.getFullYear();
      const month = now.getMonth(); // 0-based

      // Helper: check if a date string (YYYY-MM-DD or ISO) is in the given month
      const isInMonth = (dateStr: string | null, y: number, m: number): boolean => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return d.getFullYear() === y && d.getMonth() === m;
      };

      // ============================================================
      // Fetch ALL contas_receber and contas_pagar for the company,
      // then filter in JavaScript to avoid enum type issues on Supabase
      // ============================================================

      const { data: todasContasReceber, error: errReceber } = await supabase
        .from("contas_receber")
        .select("id, valor, status, data_recebimento, updated_at, descricao, created_at, empresa_id")
        .eq("empresa_id", empresaAtiva.id);

      if (errReceber) {
        console.error("Erro ao buscar contas_receber:", errReceber);
      }

      const { data: todasContasPagar, error: errPagar } = await supabase
        .from("contas_pagar")
        .select("id, valor, status, data_pagamento, updated_at, descricao, created_at")
        .eq("empresa_id", empresaAtiva.id);

      if (errPagar) {
        console.error("Erro ao buscar contas_pagar:", errPagar);
      }

      const contasReceber = todasContasReceber || [];
      const contasPagar = todasContasPagar || [];

      console.log("Dashboard - contas_receber total:", contasReceber.length);
      console.log("Dashboard - contas_pagar total:", contasPagar.length);
      console.log("Dashboard - statuses receber:", [...new Set(contasReceber.map((c: any) => c.status))]);
      console.log("Dashboard - statuses pagar:", [...new Set(contasPagar.map((c: any) => c.status))]);

      // Statuses considered as "paid/received"
      const PAID_STATUSES = ["pago", "recebido"];
      // Statuses considered as "pending"
      const PENDING_STATUSES = ["pendente", "vencido"];

      // 1. Faturamento do Mês — contas_receber pagas NESTE mês
      const recebidosEsteMes = contasReceber.filter((c: any) => {
        if (!PAID_STATUSES.includes(c.status)) return false;
        // Check by data_recebimento, otherwise fall back to updated_at
        const dateToCheck = c.data_recebimento || c.updated_at;
        return isInMonth(dateToCheck, year, month);
      });

      const faturamentoMes = recebidosEsteMes.reduce((sum: number, c: any) => sum + Number(c.valor), 0);
      console.log("Dashboard - faturamento:", faturamentoMes, "from", recebidosEsteMes.length, "entries");

      // 2. Despesas do Mês — contas_pagar pagas NESTE mês
      const pagosEsteMes = contasPagar.filter((c: any) => {
        if (c.status !== "pago") return false;
        const dateToCheck = c.data_pagamento || c.updated_at;
        return isInMonth(dateToCheck, year, month);
      });

      const despesasMes = pagosEsteMes.reduce((sum: number, c: any) => sum + Number(c.valor), 0);
      console.log("Dashboard - despesas:", despesasMes, "from", pagosEsteMes.length, "entries");

      // 3. Total a receber (tudo que não está pago/cancelado)
      const PAID_OR_CANCELLED = ["pago", "recebido", "cancelado"];
      const pendentesReceber = contasReceber.filter((c: any) => !PAID_OR_CANCELLED.includes(c.status));
      const totalReceberPendente = pendentesReceber.reduce((sum: number, c: any) => sum + Number(c.valor), 0);
      console.log("Dashboard - a receber pendente:", totalReceberPendente, "count:", pendentesReceber.length);
      console.log("Dashboard - statuses receber:", contasReceber.map((c: any) => c.status));

      // 4. Total a pagar (tudo que não está pago/cancelado)
      const pendentesPagar = contasPagar.filter((c: any) => !PAID_OR_CANCELLED.includes(c.status));
      const totalPagarPendente = pendentesPagar.reduce((sum: number, c: any) => sum + Number(c.valor), 0);

      // 5. Ordens de Serviço por Status
      const { data: osStatus } = await (supabase
        .from("ordens_servico" as any) as any)
        .select("status")
        .eq("empresa_id", empresaAtiva.id);

      const statusMap: Record<string, number> = {};
      (osStatus || []).forEach((os: any) => {
        statusMap[os.status] = (statusMap[os.status] || 0) + 1;
      });

      const osPorStatus = Object.entries(statusMap).map(([status, total]) => ({
        status,
        total,
      }));

      // 6. Transações Recentes
      const transacoesRecentes = [
        ...contasReceber.slice(0, 5).map((r: any) => ({
          id: r.id,
          descricao: r.descricao,
          categoria: "Receita",
          tipo: "entrada" as const,
          valor: Number(r.valor),
          data: r.created_at,
        })),
        ...contasPagar.slice(0, 5).map((p: any) => ({
          id: p.id,
          descricao: p.descricao,
          categoria: "Despesa",
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
        const targetYear = month - i < 0 ? year - 1 : year;
        const targetMonth = ((month - i) % 12 + 12) % 12;

        const mesNome = new Date(targetYear, targetMonth, 1).toLocaleDateString("pt-BR", { month: "short" });

        const entradas = contasReceber
          .filter((c: any) => {
            if (!PAID_STATUSES.includes(c.status)) return false;
            const dateToCheck = c.data_recebimento || c.updated_at;
            return isInMonth(dateToCheck, targetYear, targetMonth);
          })
          .reduce((sum: number, c: any) => sum + Number(c.valor), 0);

        const saidas = contasPagar
          .filter((c: any) => {
            if (c.status !== "pago") return false;
            const dateToCheck = c.data_pagamento || c.updated_at;
            return isInMonth(dateToCheck, targetYear, targetMonth);
          })
          .reduce((sum: number, c: any) => sum + Number(c.valor), 0);

        graficoMensal.push({
          mes: mesNome.charAt(0).toUpperCase() + mesNome.slice(1).replace(".", ""),
          entradas,
          saidas,
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

      // 9. Orçamentos
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
