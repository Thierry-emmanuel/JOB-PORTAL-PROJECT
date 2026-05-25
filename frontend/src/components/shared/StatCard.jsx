import { ArrowUp, ArrowDown } from "lucide-react";

export default function StatCard({
  icon,
  label,
  value,
  change,
  color = "#0B2B26"
}) {
  const isPositive = change >= 0;

  return (
    <div className="ed-stat-card">
      <div className="ed-stat-icon" style={{ background: `${color}18`, color }}>
        {icon}
      </div>
      <div className="ed-stat-body">
        <p className="ed-stat-label">{label}</p>
        <p className="ed-stat-value">{value}</p>
        {change !== undefined && (
          <div className={`ed-stat-change ${isPositive ? "positive" : "negative"}`}>
            {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            <span>{Math.abs(change)} this week</span>
          </div>
        )}
      </div>
    </div>
  );
}