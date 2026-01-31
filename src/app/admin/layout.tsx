import { AdminSidebar } from '@/components/admin/admin-sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-full flex bg-black text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 shrink-0">
        <AdminSidebar />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#0a0a0a]">
        <div className="min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
