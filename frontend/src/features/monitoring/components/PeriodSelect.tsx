import { CalendarDays } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useMonitoring } from "../hooks/useMonitoring";
import { isPeriod } from "@/shared/lib/period";

export function PeriodSelect() {
  const { period, setPeriod, refresh } = useMonitoring();
  const [, setParams] = useSearchParams();
  return (
    <label className="period-select">
      <CalendarDays size={17} />
      <span className="sr-only">Período de análise</span>
      <select
        value={period}
        onChange={(event) => {
          const next = new URLSearchParams(window.location.search);
          const value = event.target.value;
          if (!isPeriod(value)) return;
          next.set("periodo", value);
          setPeriod(value);
          setParams(next, { replace: true });
          if (value !== period) void refresh();
        }}
      >
        <option value="24h">Últimas 24 horas</option>
        <option value="7d">Últimos 7 dias</option>
      </select>
    </label>
  );
}
