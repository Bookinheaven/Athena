import { TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function PlannerHeader() {
    return (
        <motion.header 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 shrink-0"
        >
            <div className="flex items-center gap-2.5 mb-2.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-button-primary/10 text-button-primary border border-button-primary/20 text-[10px] font-mono font-bold tracking-wider uppercase shadow-xs">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Mission Control
                </span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-text-primary leading-tight">
                Daily <span className="underline decoration-button-primary underline-offset-4">Planner</span>
            </h1>
            <p className="text-text-secondary font-sans text-sm md:text-base mt-2 max-w-xl">
                Structure your goals, drag tasks into your timeline, and initiate high-efficiency focus sessions.
            </p>
        </motion.header>
    );
}