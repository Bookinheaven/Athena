import { motion } from "framer-motion";
import { useMemo } from "react";
import { Star } from "lucide-react";

export default function Header({ displayName, username, level = 12, xp = 65 }) {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const photoURL = `https://ui-avatars.com/api/?name=${displayName.replace(
    " ",
    "+"
  )}&background=7c3aed&color=fff&bold=true`;

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-12"
    >
      <div className="flex items-center justify-between flex-wrap gap-8">
        
        <div className="flex-1 min-w-fit">
          <div className="flex items-center gap-2 mb-2">
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-button-primary/80">
               {greeting}
             </span>
             <div className="h-[1px] w-12 bg-button-primary/20" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-text-primary tracking-tight">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-button-primary to-brand-400">{displayName?.split(" ")[0] || "User"}</span>!
          </h1>
          <p className="text-sm sm:text-base text-text-muted mt-3 font-medium max-w-md leading-relaxed">
            Ready to level up? Your deep focus sessions today will grant bonus XP.
          </p>
        </div>

        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          className="relative min-w-[280px] p-4 rounded-[32px] bg-card-background/40 backdrop-blur-xl border border-card-border shadow-2xl shadow-black/10 group cursor-pointer transition-all duration-500 overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-button-primary/10 blur-[40px] rounded-full group-hover:bg-button-primary/20 transition-colors duration-700" />
          
          <div className="flex items-center gap-4 mb-4">
            <div className="relative shrink-0">
              <img
                src={photoURL}
                alt="Profile"
                className="w-14 h-14 rounded-2xl border-2 border-button-primary/20 shadow-lg object-cover group-hover:border-button-primary/60 transition-all duration-500"
              />
              <div className="absolute -top-2 -right-2 bg-button-primary text-white text-[10px] font-black w-6 h-6 rounded-lg flex items-center justify-center shadow-lg border-2 border-card-background">
                {level}
              </div>
            </div>

            <div className="flex flex-col justify-center truncate">
              <p className="font-black text-base text-text-primary truncate tracking-tight">
                {displayName}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Star size={10} className="text-button-primary fill-button-primary" />
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                  Elite Producer
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-end px-1">
              <span className="text-[10px] font-black text-text-muted uppercase tracking-tighter">Current XP</span>
              <span className="text-[10px] font-black text-button-primary">{xp}% to Level {level + 1}</span>
            </div>
            <div className="relative h-2 w-full bg-background-secondary rounded-full overflow-hidden border border-border-primary/20">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${xp}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                className="absolute h-full bg-gradient-to-r from-button-primary to-brand-400 rounded-full shadow-[0_0_10px_rgba(124,58,237,0.4)]"
              />
            </div>
          </div>
          
          <div className="absolute inset-px rounded-[31px] border border-white/5 pointer-events-none" />
        </motion.div>

      </div>
    </motion.header>
  );
}