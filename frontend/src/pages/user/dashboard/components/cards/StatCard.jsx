const StatCard = ({ icon, title, value, subtitle, color }) => (
  <div className="rounded-xl p-4 bg-card-background border border-card-border hover:border-blue-500 shadow-sm flex flex-col justify-between min-h-[98px]">
    <div className="flex items-center justify-between mb-2">
      <div
        className="flex items-center justify-center w-8 h-8 rounded-lg"
        style={{
          background: `linear-gradient(135deg, ${color}18 0%, ${color}0A 100%)`,
          color,
        }}
      >
        {icon}
      </div>
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-background-secondary text-text-primary">
        {subtitle}
      </span>
    </div>
    <div>
      <h4 className="text-xs font-semibold text-text-secondary mb-1">{title}</h4>
      <p className="text-lg font-bold text-text-primary">{value}</p>
    </div>
  </div>
);
export default StatCard;
