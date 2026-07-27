import { motion } from "framer-motion";

const StatCard = ({ icon, title, value, subtitle }) => (
    <motion.div 
        whileHover={{ y: -3, scale: 1.01 }}
        transition={{ duration: 0.2 }}
        className="rounded-2xl p-5 bg-card-background border border-card-border hover:border-button-primary/50 shadow-sm flex flex-col justify-between gap-4 min-h-[110px] group transition-colors cursor-pointer"
    >
        <div className="flex items-center justify-between gap-2">
            <div
                className="flex items-center justify-center w-10 h-10 rounded-xl shadow-xs border border-border-primary group-hover:scale-105 transition-transform shrink-0 bg-button-primary/10 text-button-primary"
            >
                {icon}
            </div>
            {subtitle && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-bold bg-background-secondary text-text-secondary tracking-wider">
                    {subtitle}
                </span>
            )}
        </div>
        <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-text-muted mb-1">{title}</h4>
            <p className="text-2xl font-extrabold text-text-primary tracking-tight">{value}</p>
        </div>
    </motion.div>
);
export default StatCard;
