import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const CORES_MAP: Record<string, string> = {
  blue: "hsl(217, 91%, 50%)",
  green: "hsl(142, 76%, 36%)",
  purple: "hsl(270, 70%, 50%)",
  orange: "hsl(38, 92%, 50%)",
  red: "hsl(0, 84%, 60%)",
  yellow: "hsl(45, 93%, 47%)",
  pink: "hsl(330, 80%, 60%)",
  cyan: "hsl(199, 89%, 48%)",
};

interface CategoryChartProps {
  data: { nome: string; valor: number; cor: string }[];
  title?: string;
}

export function CategoryChart({ data, title = "Por Categoria" }: CategoryChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    color: CORES_MAP[item.cor] || CORES_MAP.blue,
  }));

  const hasData = chartData.length > 0 && chartData.some((d) => d.valor > 0);

  return (
    <div className="stat-card animate-slide-up">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">Distribuição de entradas</p>
      </div>
      <div className="h-[250px]">
        {!hasData ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Nenhum dado disponível
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="valor"
                nameKey="nome"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(214, 32%, 91%)",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px hsl(217 91% 15% / 0.1)",
                }}
                formatter={(value: number) =>
                  new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(value)
                }
              />
              <Legend
                formatter={(value) => (
                  <span className="text-sm text-muted-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
