"use client";

import { createClient } from "@/lib/supabase/client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type IconName =
  | "dashboard"
  | "business"
  | "services"
  | "appointments"
  | "customers"
  | "staff"
  | "settings"
  | "menu"
  | "arrow";

export function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: IconName;
  className?: string;
}) {
  const paths: Record<IconName, string> = {
    dashboard: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z",
    business: "M4 20V6l8-3 8 3v14M8 20v-4h8v4M8 9h.01M12 9h.01M16 9h.01M8 12h.01M12 12h.01M16 12h.01",
    services: "M5 5h14v14H5V5Zm3 4h8M8 13h5M8 16h3",
    appointments: "M6 3v4M18 3v4M4 9h16M5 5h14a1 1 0 0 1 1 1v13H4V6a1 1 0 0 1 1-1Zm3 8h3M8 16h5",
    customers: "M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7-6a3 3 0 0 1 0 6M17 15h1a4 4 0 0 1 4 4v1",
    staff: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6-8a4 4 0 0 1 0 8",
    settings: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0-12v2M12 18.5v2M4.5 4.5l1.4 1.4M18.1 18.1l1.4 1.4M2 12h2M20 12h2M4.5 19.5l1.4-1.4M18.1 5.9l1.4-1.4",
    menu: "M4 6h16M4 12h16M4 18h16",
    arrow: "M5 12h14M13 6l6 6-6 6",
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
}

export default function DashboardSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [primaryBusinessId, setPrimaryBusinessId] = useState<string | null>(null);

  useEffect(() => {
    const loadPrimaryBusiness = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setPrimaryBusinessId(data?.id || null);
    };

    loadPrimaryBusiness();
  }, [supabase]);

  const businessRoute = "/dashboard/business";
  const primaryRoute = primaryBusinessId
    ? (section: string) => `/dashboard/business/${primaryBusinessId}/${section}`
    : () => businessRoute;
  const navigation = [
    { label: "Dashboard", icon: "dashboard" as IconName, href: "/dashboard" },
    { label: "Businesses", icon: "business" as IconName, href: businessRoute },
    { label: "Services", icon: "services" as IconName, href: primaryRoute("services") },
    { label: "Appointments", icon: "appointments" as IconName, href: primaryRoute("appointments") },
    { label: "Customers", icon: "customers" as IconName, href: primaryRoute("customers") },
    { label: "Staff", icon: "staff" as IconName, href: primaryRoute("staff") },
  ];

  const businessPath = pathname.split("/");
  const businessSection = businessPath[4];
  const isBusinessPage =
    pathname === businessRoute ||
    pathname === `${businessRoute}/new` ||
    (businessPath[2] === "business" && businessPath.length === 4);

  const isActive = (label: string) => {
    if (label === "Dashboard") {
      return pathname === "/dashboard";
    }

    if (label === "Businesses") {
      return isBusinessPage;
    }

    return businessSection === label.toLowerCase();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {sidebarOpen && (
        <button
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
        />
      )}
      <button
        onClick={() => setSidebarOpen(true)}
        aria-label="Open navigation"
        className="fixed left-5 top-4 z-20 rounded-lg border border-white/[0.08] bg-[#0b0f1a] p-2 text-slate-300 hover:bg-white/[0.06] lg:hidden"
      >
        <Icon name="menu" />
      </button>
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/[0.07] bg-[#0b0f1a] px-4 py-5 transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-3 px-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 via-fuchsia-500 to-blue-500 text-sm font-bold text-white shadow-lg shadow-fuchsia-500/20">B</div>
          <div>
            <p className="text-sm font-semibold tracking-wide text-white">BookFlow</p>
            <p className="text-[11px] text-slate-500">Business workspace</p>
          </div>
        </div>
        <nav className="mt-10 space-y-1" aria-label="Main navigation">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">Workspace</p>
          {navigation.map((item) => {
            const active = isActive(item.label);
            return (
              <button key={item.label} onClick={() => { setSidebarOpen(false); router.push(item.href); }} className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${active ? "bg-white/[0.09] text-white shadow-inner shadow-white/[0.03]" : "text-slate-400 hover:bg-white/[0.05] hover:text-white"}`}>
                <Icon name={item.icon} className={`h-[18px] w-[18px] ${active ? "text-pink-300" : "text-slate-500 group-hover:text-slate-300"}`} />
                <span>{item.label}</span>
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-pink-400" />}
              </button>
            );
          })}
          <button type="button" disabled title="Settings are not available yet" className="group flex w-full cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-600">
            <Icon name="settings" className="h-[18px] w-[18px] text-slate-600" />
            <span>Settings</span>
          </button>
        </nav>
        <div className="mt-auto border-t border-white/[0.07] pt-4">
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.06] text-xs font-semibold text-slate-300">U</span>
            <span>Logout</span>
            <Icon name="arrow" className="ml-auto h-4 w-4 rotate-180" />
          </button>
        </div>
      </aside>
    </>
  );
}
