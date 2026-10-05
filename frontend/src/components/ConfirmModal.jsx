import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, LogOut, Trash2, HelpCircle, ShieldAlert } from "lucide-react";

const TYPE_CONFIG = {
  danger: {
    icon: ShieldAlert,
    iconColor: "text-destructive",
    iconBg: "bg-destructive/10",
    iconBorder: "border-destructive/20",
    confirmClass: "bg-destructive text-white hover:bg-destructive/90 shadow-lg shadow-destructive/20",
    confirmLabel: "Log out",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10",
    iconBorder: "border-amber-500/20",
    confirmClass: "bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20",
    confirmLabel: "Continue",
  },
  delete: {
    icon: Trash2,
    iconColor: "text-destructive",
    iconBg: "bg-destructive/10",
    iconBorder: "border-destructive/20",
    confirmClass: "bg-destructive text-white hover:bg-destructive/90 shadow-lg shadow-destructive/20",
    confirmLabel: "Delete",
  },
  info: {
    icon: HelpCircle,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    iconBorder: "border-primary/20",
    confirmClass: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20",
    confirmLabel: "Confirm",
  },
};

export const ConfirmModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  type = "danger",
  confirmLabel,
}) => {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.danger;
  const Icon = config.icon;
  const btnLabel = confirmLabel || config.confirmLabel;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/65 backdrop-blur-xl"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.93, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0, transition: { type: "spring", damping: 28, stiffness: 380 } }}
            exit={{ scale: 0.95, opacity: 0, y: 12, transition: { duration: 0.15 } }}
            className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl"
          >
            {/* Top accent line */}
            <div className={`h-px w-full ${type === "danger" || type === "delete" ? "bg-destructive/50" : type === "warning" ? "bg-amber-500/50" : "bg-primary/50"}`} />

            <div className="p-6">
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl ${config.iconBg} border ${config.iconBorder} flex items-center justify-center mb-5`}>
                <Icon size={22} className={config.iconColor} />
              </div>

              {/* Text */}
              <h3 className="text-[15px] font-bold text-foreground tracking-tight mb-1.5">
                {title}
              </h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                {message}
              </p>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex flex-col gap-2">
              <button
                onClick={onConfirm}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.98] cursor-pointer ${config.confirmClass}`}
              >
                {btnLabel}
              </button>

              <button
                onClick={onCancel}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors active:scale-[0.98] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};