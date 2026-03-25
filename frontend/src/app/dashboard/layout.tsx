import { Sidebar } from '@/components/layout/sidebar'

export const metadata = {
  title: 'MindBreaker Dashboard',
  description: 'Digital Addiction Intervention System',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 overflow-y-auto w-full">
        {children}
      </main>
    </div>
  )
}
