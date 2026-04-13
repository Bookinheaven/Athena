import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { twMerge } from "tailwind-merge"; // Optional: recommended for merging classes

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  align = "left",
  className,
  dropdownClassName,
  optionClassName,
  icon: Icon = ChevronDown,
  renderOption,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative inline-block w-full sm:w-auto" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={twMerge(
          `flex items-center justify-between gap-3 w-full sm:min-w-[140px] px-3 py-2 
          bg-card-background border rounded-xl text-xs font-black transition-all duration-150 outline-none
          ${
            isOpen
              ? "border-button-primary bg-button-primary/5 ring-2 ring-button-primary/10"
              : "border-border-secondary hover:border-text-muted/40 hover:bg-background-secondary/50"
          }`,
          className,
        )}
      >
        <span className="truncate text-text-primary uppercase tracking-tight">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <Icon
          size={14}
          className={twMerge(
            `text-text-muted transition-transform duration-200`,
            isOpen && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.1 }}
            className={twMerge(
              `absolute mt-2 p-1.5 min-w-[200px] 
              bg-card-background border border-card-border rounded-2xl 
              shadow-2xl z-[9999] overflow-hidden
              ${align === "right" ? "right-0" : "left-0"}`,
              dropdownClassName,
            )}
          >
            <div className="flex flex-col gap-1 max-h-[250px] overflow-y-auto custom-scrollbar">
              {options.map((opt) => {
                const isSelected = value === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={twMerge(
                      `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-none ring-0
                      ${
                        isSelected
                          ? "bg-button-primary text-white"
                          : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
                      }`,
                      optionClassName,
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {renderOption ? (
                        renderOption(opt)
                      ) : (
                        <span>{opt.label}</span>
                      )}
                    </div>

                    {isSelected && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <Check
                          size={12}
                          strokeWidth={4}
                          className="ml-2 shrink-0"
                        />
                      </motion.div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
