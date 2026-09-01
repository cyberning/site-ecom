"use client";

import { BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTranslations } from "next-intl";
import { formatDateChart } from "@/lib/format";

interface OrdersChartProps {
  data: { date: string; count: number }[];
}

function CustomTooltip({
  active,
  payload,
  label,
  t,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 shadow-lg"
      style={{ pointerEvents: "none" }}
    >
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className="text-sm font-semibold text-[var(--text-primary)]">
        {t("ordersChart.ordersCount", { count: payload[0].value })}
      </p>
    </div>
  );
}

export default function OrdersChart({ data }: OrdersChartProps) {
  const t = useTranslations("admin");
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-neumorphic)]">
      <div className="mb-6 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-[var(--accent)]" />
        <h3 className="text-base font-semibold text-[var(--text-primary)]">
          {t("ordersChart.title")}
        </h3>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data.map((d) => ({ ...d, date: formatDateChart(d.date) }))}
            margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--text-muted)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "var(--text-muted)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<CustomTooltip t={t} />}
              cursor={{ fill: "var(--accent-light)", opacity: 0.3 }}
            />
            <Bar dataKey="count" fill="var(--accent)" radius={[6, 6, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
