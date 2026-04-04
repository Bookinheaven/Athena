import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, LogOut, Trash2, HelpCircle } from "lucide-react";

export const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, type = "danger" }) => {
  
  const config = {
    danger: {
      icon: LogOut,
      color: "text-red-500",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      btn: "bg-red-500 hover:bg-red-600 shadow-red-500/20"
    },
    warning: {
      icon: AlertTriangle,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      btn: "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
    },
    info: {
      icon: HelpCircle,
      color: "text-button-primary",
      bg: "bg-button-primary/10",
      border: "border-button-primary/20",
      btn: "bg-button-primary hover:bg-button-primary-hover shadow-button-primary/20"
    }
  }[type];

  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/60 backdrop-blur-xl"
          />

          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 10 }}
            animate={{ 
              scale: 1, 
              opacity: 1, 
              y: 0,
              transition: { type: "spring", damping: 25, stiffness: 400 } 
            }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="relative w-full max-w-[360px] overflow-hidden rounded-[28px] border border-white/10 bg-card-background shadow-[0_20px_70px_rgba(0,0,0,0.5)]"
          >
            <div className="p-8">
              <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${config.bg} ${config.border} border shadow-inner relative`}>
                <Icon size={28} className={config.color} />
                <div className={`absolute inset-0 rounded-2xl ${config.color} opacity-20 blur-xl`} />
              </div>
              
              <div className="text-center">
                <h3 className="text-xl font-black text-text-primary tracking-tight mb-2">
                  {title}
                </h3>
                <p className="text-[15px] leading-relaxed text-text-muted font-medium px-2">
                  {message}
                </p>
              </div>
            </div>

            <div className="px-6 pb-6 space-y-2">
              <button
                onClick={onConfirm}
                className={`w-full py-4 rounded-2xl font-bold text-white transition-all duration-300 shadow-lg active:scale-[0.97] ${config.btn}`}
              >
                Confirm Action
              </button>
              
              <button
                onClick={onCancel}
                className="w-full py-3.5 rounded-2xl font-bold text-text-secondary hover:text-text-primary hover:bg-background-secondary transition-all active:scale-[0.97]"
              >
                Nevermind
              </button>
            </div>

            <div className="absolute inset-px pointer-events-none rounded-[27px] border border-white/5" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};