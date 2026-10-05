import React from "react";
import { Plus, Minus } from "lucide-react";

export const InputStepper = ({
  label,
  description,
  value,
  onChange,
  min = 1,
  max = 60,
  step = 1,
  unit = "",
  presets = [],
}) => {
  const handleChange = (newValue) => {
    const clamped = Math.max(min, Math.min(max, newValue));
    onChange(clamped);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <label className="text-xs font-semibold text-foreground tracking-tight block">
            {label}
          </label>
          {description && (
            <p className="text-[11px] text-muted-foreground leading-snug">
              {description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 bg-secondary/40 p-1 rounded-xl border border-border/50">
          <button
            type="button"
            onClick={() => handleChange(Number((value - step).toFixed(1)))}
            disabled={value <= min}
            className="w-7 h-7 rounded-lg bg-background text-foreground border border-border/40 hover:bg-secondary flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shadow-2xs"
            aria-label={`Decrease ${label}`}
          >
            <Minus size={13} strokeWidth={2.5} />
          </button>

          <div className="min-w-[3.5rem] px-2 text-center">
            <span className="text-xs font-black tabular-nums text-foreground">
              {value}
            </span>
            {unit && (
              <span className="text-[10px] text-muted-foreground ml-0.5 font-medium">
                {unit}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleChange(Number((value + step).toFixed(1)))}
            disabled={value >= max}
            className="w-7 h-7 rounded-lg bg-background text-foreground border border-border/40 hover:bg-secondary flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shadow-2xs"
            aria-label={`Increase ${label}`}
          >
            <Plus size={13} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {presets.length > 0 && (
        <div className="flex items-center gap-1 pt-0.5">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handleChange(preset)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all border ${
                value === preset
                  ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                  : "bg-secondary/40 text-muted-foreground border-border/40 hover:text-foreground hover:bg-secondary"
              }`}
            >
              {preset}{unit ? ` ${unit}` : ""}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default InputStepper;
