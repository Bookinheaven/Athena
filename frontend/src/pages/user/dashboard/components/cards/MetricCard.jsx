import { motion } from "framer-motion";

const MetricCard = ({ icon, title, value }) => (
    <motion.div 
        whileHover={{ y: -3, scale: 1.01 }}
        transition={{ duration: 0.2 }}
        className="rounded-2xl p-4 shadow-sm flex flex-col justify-between gap-3 bg-card-background border border-card-border hover:border-button-primary/50 transition-colors cursor-pointer min-w-[130px] group"
    >
        <div className="flex items-center justify-between">
            <div
                className="flex items-center justify-center w-9 h-9 rounded-xl shadow-xs border border-border-primary group-hover:scale-105 transition-transform bg-button-primary/10 text-button-primary"
            >
                {icon}
            </div>
        </div>
        <div>
            <span className="text-xs font-mono uppercase tracking-wider text-text-muted block mb-1">{title}</span>
            <span className="text-2xl font-extrabold text-text-primary tracking-tight">{value}</span>
        </div>
    </motion.div>
);
export default MetricCard;
