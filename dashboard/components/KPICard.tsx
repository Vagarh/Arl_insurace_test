import clsx from "clsx";

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  trendPositive?: boolean; // if true, up=good; if false, up=bad
  icon?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  delay?: number;
}

export default function KPICard({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  trendPositive = true,
  icon,
  iconBg = "#dce1ff",
  iconColor = "#00216e",
  delay = 0,
}: KPICardProps) {
  // Badge color: green = good, red = bad, gray = neutral
  const isGood =
    trend === "neutral"
      ? null
      : trendPositive
      ? trend === "up"
      : trend === "down";

  const badgeClass =
    trend === "neutral"
      ? "bg-brand-mid text-brand-muted"
      : isGood
      ? "bg-green-50 text-green-700"
      : "bg-red-50 text-red-700";

  const trendArrow =
    trend === "up" ? "↑" : trend === "down" ? "↓" : "→";

  const delayClass = delay === 0 ? "" : `delay-${delay}`;

  return (
    <div
      className={clsx(
        "card-hover animate-fade-up",
        delayClass
      )}
    >
      {/* Top row: icon + badge */}
      <div className="flex justify-between items-start mb-5">
        {icon && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: iconBg, color: iconColor }}
          >
            {icon}
          </div>
        )}
        {trendLabel && (
          <span
            className={clsx(
              "text-xs font-bold px-2.5 py-0.5 rounded-full",
              badgeClass
            )}
          >
            {trendArrow} {trendLabel}
          </span>
        )}
      </div>

      {/* Label */}
      <p className="text-[10px] font-black text-brand-gray1 uppercase tracking-widest mb-1">
        {title}
      </p>

      {/* Value */}
      <h3 className="text-3xl font-black text-sura-navy leading-none tracking-tight">
        {value}
      </h3>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-xs text-brand-muted mt-2 leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
}
