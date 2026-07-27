import { motion } from "framer-motion";
<<<<<<< Updated upstream

export default function Header({ displayName, username }) {
  const photoURL = `https://ui-avatars.com/api/?name=${displayName.replace(
    " ",
    "+"
  )}&background=3b82f6&color=fff`;

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="mb-8"
    >
      <div className="flex items-center justify-between flex-wrap gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex-1 min-w-fit"
        >
          <h1 className="text-3xl sm:text-4xl lg:text-4xl font-bold mb-2 text-text-primary tracking-tight">
            Welcome back, <span className="text-button-primary">{displayName?.split(" ")[0] || "User"}</span>! 👋
          </h1>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            Here's your productivity and wellness dashboard.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          whileHover={{ scale: 1.02 }}
          className="w-70 flex items-center gap-3 px-4 sm:px-5 py-3 rounded-xl bg-card-background border border-card-border hover:border-button-primary shadow-sm transition-all duration-300 cursor-pointer group"
        >
          <div className="relative">
            <img
              src={photoURL}
              alt="Profile"
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-button-primary/30 group-hover:border-button-primary transition-all duration-300 shadow-md"
            />
            <div className="absolute inset-0 rounded-full bg-button-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <div className="hidden sm:flex flex-col justify-center">
            <p className="font-semibold text-sm text-text-primary truncate">
              {displayName}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">@{username}</p>
          </div>
        </motion.div>
      </div>
    </motion.header>
  );
}
=======
import { useMemo } from "react";
import { Star } from "lucide-react";

export default function Header({ displayName = "User", username = "producer", level = 5, xp = 42 }) {
    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    }, []);

    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
        displayName
    )}&background=27272a&color=fff&bold=true`;

    return (
        <motion.header
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 w-full"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border-primary">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-2.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-button-primary text-button-primary-text text-[10px] font-mono font-bold tracking-wider uppercase shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {greeting}
                        </span>
                        <span className="text-xs font-mono text-text-muted">
                            @{username}
                        </span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-text-primary tracking-tight leading-none">
                        Welcome back,{" "}
                        <span className="underline decoration-button-primary underline-offset-4">
                            {displayName.split(" ")[0] || "User"}
                        </span>
                        .
                    </h1>
                    <p className="text-sm sm:text-base text-text-secondary mt-2.5 font-sans max-w-xl leading-relaxed">
                        Your workspace is optimized. Complete focus sessions and structured tasks today to accelerate your productivity streak.
                    </p>
                </div>

                {/* Leveling & XP Card */}
                <motion.div
                    whileHover={{ y: -2, scale: 1.01 }}
                    className="relative min-w-[280px] sm:min-w-[320px] p-5 rounded-2xl bg-card-background border border-card-border shadow-sm hover:border-button-primary/50 transition-all duration-300 overflow-hidden shrink-0 group"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-button-primary/5 blur-2xl rounded-full pointer-events-none group-hover:bg-button-primary/15 transition-all duration-500" />
                    
                    <div className="flex items-center gap-3.5 mb-4 relative z-10">
                        <div className="relative shrink-0">
                            <img
                                src={avatarUrl}
                                alt="Profile"
                                className="w-12 h-12 rounded-xl border border-border-primary shadow-xs object-cover"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-button-primary text-button-primary-text text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-md shadow-xs border border-border-primary">
                                LVL {level}
                            </div>
                        </div>

                        <div className="flex flex-col justify-center min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="font-bold text-sm text-text-primary truncate">
                                    {displayName}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5 text-text-secondary">
                                <Star size={12} className="text-amber-500 fill-amber-500 shrink-0" />
                                <span className="text-[10px] font-mono font-semibold tracking-wider uppercase">
                                    Elite Producer
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5 relative z-10">
                        <div className="flex justify-between items-center text-xs font-mono">
                            <span className="text-text-secondary">Level Progression</span>
                            <span className="font-bold text-text-primary">{xp}%</span>
                        </div>
                        <div className="h-2 w-full bg-background-secondary rounded-full overflow-hidden p-0.5">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${xp}%` }}
                                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                                className="h-full bg-button-primary rounded-full"
                            />
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.header>
    );
}
>>>>>>> Stashed changes
