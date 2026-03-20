import AdminSidebar from '@/components/admin/sidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <AdminSidebar />
      <main className="ml-60 p-8">{children}</main>
    </div>
  )
}
