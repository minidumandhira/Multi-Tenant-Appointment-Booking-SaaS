import DashboardSidebar from "./dashboard-sidebar";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className="min-h-screen lg:pl-64">
      <DashboardSidebar />
      {children}
    </div>
  );
}
