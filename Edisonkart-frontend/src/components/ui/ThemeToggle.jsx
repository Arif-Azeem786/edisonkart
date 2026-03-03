import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "../theme-provider"
import { Button } from "./button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu"
import { motion, AnimatePresence } from "framer-motion"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative h-10 w-10 rounded-xl transition-colors text-[#1E3A8A] dark:text-blue-400 hover:bg-[#1E3A8A]/5 dark:hover:bg-blue-400/10"
        >
          <AnimatePresence mode="wait">
            {theme === "light" ? (
              <motion.div
                key="sun"
                initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                transition={{ duration: 0.2 }}
              >
                <Sun className="h-[1.2rem] w-[1.2rem]" />
              </motion.div>
            ) : theme === "dark" ? (
              <motion.div
                key="moon"
                initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                transition={{ duration: 0.2 }}
              >
                <Moon className="h-[1.2rem] w-[1.2rem]" />
              </motion.div>
            ) : (
              <motion.div
                key="system"
                initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                transition={{ duration: 0.2 }}
              >
                <Monitor className="h-[1.2rem] w-[1.2rem]" />
              </motion.div>
            )}
          </AnimatePresence>
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-1.5 shadow-xl">
        <DropdownMenuItem 
          onClick={() => setTheme("light")}
          className="rounded-xl flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 focus:bg-slate-100 dark:focus:bg-slate-900 focus:text-slate-900 dark:focus:text-slate-100 transition-colors cursor-pointer"
        >
          <Sun className="h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")}
          className="rounded-xl flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 focus:bg-slate-100 dark:focus:bg-slate-900 focus:text-slate-900 dark:focus:text-slate-100 transition-colors cursor-pointer"
        >
          <Moon className="h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("system")}
          className="rounded-xl flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 focus:bg-slate-100 dark:focus:bg-slate-900 focus:text-slate-900 dark:focus:text-slate-100 transition-colors cursor-pointer"
        >
          <Monitor className="h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
