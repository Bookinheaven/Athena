import { motion } from "framer-motion";

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
