const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 rounded-lg shadow-xl bg-card-background border border-card-border ">
        <p className="font-bold text-sm mb-1 text-text-primary">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.name}: ${
              typeof entry.value === "number"
                ? entry.value.toFixed(1)
                : entry.value
            }`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default CustomTooltip;