interface MetricCardProps {
  label: string;
  value: number | null | undefined;
  unit: string;
  large?: boolean;
}

export function MetricCard({ label, value, unit, large = false }: MetricCardProps) {
  const display = value != null ? value.toFixed(large ? 0 : 1) : "—";

  return (
    <div className="flex flex-col items-center justify-center bg-gray-900 rounded-2xl p-4 gap-1">
      <span className="text-gray-400 text-sm uppercase tracking-widest">{label}</span>
      <span className={`font-mono font-bold tabular-nums ${large ? "text-6xl" : "text-3xl"} text-white`}>
        {display}
      </span>
      {unit && <span className="text-gray-500 text-xs">{unit}</span>}
    </div>
  );
}
