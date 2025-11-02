const MetricCard = ({ icon, title, value, color }) => (
  <div className="rounded-xl px-4 py-3 shadow-sm flex flex-col gap-2 items-start bg-card-background border border-card-border hover:border-blue-500 transition cursor-pointer card-hover min-w-[130px]">
    <div
      className="flex items-center justify-center w-8 h-8 rounded-lg"
      style={{
        background: `linear-gradient(135deg, ${color}18 0%, ${color}0A 100%)`,
        color,
      }}
    >
      {icon}
    </div>
    <span className="text-xs font-medium text-text-muted mt-1">{title}</span>
    <span className="text-xl font-extrabold text-text-primary tracking-tight">{value}</span>
  </div>
);
export default MetricCard;
