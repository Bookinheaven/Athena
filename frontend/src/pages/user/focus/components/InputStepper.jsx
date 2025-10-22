import { Plus, Minus } from "lucide-react";

export const InputStepper = ({ label, value, onChange, min, max, step }) => {
  const handleChange = (newValue) => {
    const clampedValue = Math.max(min, Math.min(max, newValue));
    onChange(clampedValue);
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-background-secondary">
      <label className="text-sm font-medium text-text-primary">{label}</label>
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleChange(value - step)}
          disabled={value <= min}
          className="w-8 h-8 rounded-full bg-button-secondary text-button-secondary-text border border-card-border hover:bg-button-secondary-hover transition-all duration-200 flex items-center justify-center active:scale-95 disabled:opacity-50"
        >
          <Minus className="w-4 h-4" />
        </button>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val)) {
              handleChange(val);
            }
          }}
          className="w-20 px-3 py-2 rounded-lg text-center font-medium focus-ring-primary bg-input-background border border-input-border text-text-primary"
        />
        <button
          onClick={() => handleChange(value + step)}
          disabled={value >= max}
          className="w-8 h-8 rounded-full bg-button-secondary text-button-secondary-text border border-card-border hover:bg-button-secondary-hover transition-all duration-200 flex items-center justify-center active:scale-95 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
