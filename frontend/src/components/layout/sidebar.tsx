"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Brain, Settings, LayoutDashboard, LineChart } from "lucide-react"
import { UserButton, useUser } from "@clerk/nextjs"

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useUser()
  
  return (
    <div className="flex h-screen w-64 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-sm z-10 transition-colors duration-300">
      <div className="flex h-16 items-center px-6 border-b border-slate-200 dark:border-slate-800">
        <Link href="/" className="flex items-center gap-2">
          <Brain className="text-indigo-600 dark:text-indigo-400 w-6 h-6" />
          <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
            Mind<span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-500 dark:from-indigo-400 dark:to-cyan-400">Breaker</span>
          </span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
            pathname === "/dashboard" 
              ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-semibold" 
              : "text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>
        <Link
          href="/dashboard/trends"
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
            pathname === "/dashboard/trends" 
              ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-semibold" 
              : "text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
          }`}
        >
          <LineChart className="h-4 w-4" />
          Trends
        </Link>
        <Link
          href="/dashboard/settings"
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
            pathname === "/dashboard/settings" 
              ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-semibold" 
              : "text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
          }`}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2">
          <UserButton afterSignOutUrl="/" />
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
              {user?.fullName || user?.firstName || 'User'}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {user?.primaryEmailAddress?.emailAddress}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
