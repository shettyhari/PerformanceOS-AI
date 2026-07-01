import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return <div className="w-9 h-9 rounded-[12px] bg-white/[0.02] border border-white/5" />;
  }

  const cycleTheme = () => {
    if (theme === "dark") setTheme("light");
    else if (theme === "light") setTheme("system");
    else setTheme("dark");
  };

  return (
    <button
      onClick={cycleTheme}
      className="relative w-9 h-9 flex items-center justify-center rounded-[12px] bg-white/[0.02] hover:bg-white/[0.08] border border-white/5 hover:border-white/10 active:scale-95 transition-all duration-200 cursor-pointer text-neutral-300 hover:text-white outline-none"
      title={`Current theme: ${theme}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === "dark" && (
          <motion.div key="moon" initial={{ scale: 0, rotate: -45, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} exit={{ scale: 0, rotate: 45, opacity: 0 }} transition={{ duration: 0.2 }}>
            <Moon className="w-4 h-4" />
          </motion.div>
        )}
        {theme === "light" && (
          <motion.div key="sun" initial={{ scale: 0, rotate: -45, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} exit={{ scale: 0, rotate: 45, opacity: 0 }} transition={{ duration: 0.2 }} className="text-neutral-700">
            <Sun className="w-4 h-4" />
          </motion.div>
        )}
        {(theme === "system" || !theme) && (
          <motion.div key="system" initial={{ scale: 0, rotate: -45, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} exit={{ scale: 0, rotate: 45, opacity: 0 }} transition={{ duration: 0.2 }}>
            <Monitor className="w-4 h-4" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
