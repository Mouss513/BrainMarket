import Sidebar from '@/components/dashboard/sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#050508] text-white relative overflow-hidden">
      {/* Animated orbs */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="orb orb-4" />
      </div>

      <Sidebar />
      <main className="ml-60 p-8 relative z-10">{children}</main>
    </div>
  )
}
