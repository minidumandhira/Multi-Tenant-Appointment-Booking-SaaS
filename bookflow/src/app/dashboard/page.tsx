"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Appointment = {
  id: string;
  customer_id: string;
  service_id: string;
  staff_id: string;
  appointment_date: string;
  start_time: string;
  status: string;
};

type NamedRecord = {
  id: string;
  name: string;
};

type DashboardData = {
  businessCount: number;
  serviceCount: number;
  staffCount: number;
  customerCount: number;
  primaryBusinessId: string | null;
  upcomingAppointments: Array<
    Appointment & {
      customerName: string;
      serviceName: string;
      staffName: string;
    }
  >;
};

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTime(value: string) {
  return value.slice(0, 5);
}

type IconName =
  | "dashboard"
  | "business"
  | "services"
  | "appointments"
  | "customers"
  | "staff"
  | "settings"
  | "menu"
  | "bell"
  | "arrow"
  | "plus"
  | "calendar"
  | "users";

function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  const paths: Record<IconName, string> = {
    dashboard: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z",
    business: "M4 20V6l8-3 8 3v14M8 20v-4h8v4M8 9h.01M12 9h.01M16 9h.01M8 12h.01M12 12h.01M16 12h.01",
    services: "M5 5h14v14H5V5Zm3 4h8M8 13h5M8 16h3",
    appointments: "M6 3v4M18 3v4M4 9h16M5 5h14a1 1 0 0 1 1 1v13H4V6a1 1 0 0 1 1-1Zm3 8h3M8 16h5",
    customers: "M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7-6a3 3 0 0 1 0 6M17 15h1a4 4 0 0 1 4 4v1",
    staff: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6-8a4 4 0 0 1 0 8",
    settings: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0-12v2M12 18.5v2M4.5 4.5l1.4 1.4M18.1 18.1l1.4 1.4M2 12h2M20 12h2M4.5 19.5l1.4-1.4M18.1 5.9l1.4-1.4",
    menu: "M4 6h16M4 12h16M4 18h16",
    bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
    arrow: "M5 12h14M13 6l6 6-6 6",
    plus: "M12 5v14M5 12h14",
    calendar: "M6 3v4M18 3v4M4 9h16M5 5h14a1 1 0 0 1 1 1v13H4V6a1 1 0 0 1 1-1Z",
    users: "M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
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

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();

  const [dashboardData, setDashboardData] = useState<DashboardData>({
    businessCount: 0,
    serviceCount: 0,
    staffCount: 0,
    customerCount: 0,
    primaryBusinessId: null,
    upcomingAppointments: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchBusinesses = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: businesses, error: businessesError } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", user.id);

      if (businessesError) {
        setError(businessesError.message);
        setLoading(false);
        return;
      }

      const businessIds = (businesses || []).map((business) => business.id);

      if (businessIds.length === 0) {
        setDashboardData({
          businessCount: 0,
          serviceCount: 0,
          staffCount: 0,
          customerCount: 0,
          primaryBusinessId: null,
          upcomingAppointments: [],
        });
        setLoading(false);
        return;
      }

      const [
        servicesResult,
        staffResult,
        customersResult,
        appointmentsResult,
      ] = await Promise.all([
        supabase
          .from("services")
          .select("id, business_id, name")
          .in("business_id", businessIds),
        supabase
          .from("staff")
          .select("id, business_id, name")
          .in("business_id", businessIds),
        supabase
          .from("customers")
          .select("id, business_id, name")
          .in("business_id", businessIds),
        supabase
          .from("appointments")
          .select(
            "id, customer_id, service_id, staff_id, appointment_date, start_time, status"
          )
          .in("business_id", businessIds)
          .gte("appointment_date", getTodayDate())
          .neq("status", "cancelled")
          .order("appointment_date", { ascending: true })
          .order("start_time", { ascending: true })
          .limit(5),
      ]);

      const failedResult = [
        servicesResult,
        staffResult,
        customersResult,
        appointmentsResult,
      ].find((result) => result.error);

      if (failedResult?.error) {
        setError(failedResult.error.message);
        setLoading(false);
        return;
      }

      const serviceRecords = (servicesResult.data || []) as NamedRecord[];
      const staffRecords = (staffResult.data || []) as NamedRecord[];
      const customerRecords = (customersResult.data || []) as NamedRecord[];
      const appointments = (appointmentsResult.data || []) as Appointment[];

      const customerNames = new Map(
        customerRecords.map((customer) => [customer.id, customer.name])
      );
      const serviceNames = new Map(
        serviceRecords.map((service) => [service.id, service.name])
      );
      const staffNames = new Map(
        staffRecords.map((member) => [member.id, member.name])
      );

      setDashboardData({
        businessCount: businessIds.length,
        serviceCount: serviceRecords.length,
        staffCount: staffRecords.length,
        customerCount: customerRecords.length,
        primaryBusinessId: businessIds[0] || null,
        upcomingAppointments: appointments.map((appointment) => ({
          ...appointment,
          customerName: customerNames.get(appointment.customer_id) || "Unknown customer",
          serviceName: serviceNames.get(appointment.service_id) || "Unknown service",
          staffName: staffNames.get(appointment.staff_id) || "Unknown staff",
        })),
      });

      setLoading(false);
    };

    fetchBusinesses();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
  };

  const primaryBusinessId = dashboardData.primaryBusinessId;
  const businessRoute = "/dashboard/business";
  const serviceRoute = primaryBusinessId
    ? `/dashboard/business/${primaryBusinessId}/services`
    : businessRoute;
  const appointmentRoute = primaryBusinessId
    ? `/dashboard/business/${primaryBusinessId}/appointments`
    : businessRoute;
  const customerRoute = primaryBusinessId
    ? `/dashboard/business/${primaryBusinessId}/customers`
    : businessRoute;
  const staffRoute = primaryBusinessId
    ? `/dashboard/business/${primaryBusinessId}/staff`
    : businessRoute;

  const navigation = [
    { label: "Dashboard", icon: "dashboard" as IconName, href: "/dashboard", active: true },
    { label: "Businesses", icon: "business" as IconName, href: businessRoute },
    { label: "Services", icon: "services" as IconName, href: serviceRoute },
    { label: "Appointments", icon: "appointments" as IconName, href: appointmentRoute },
    { label: "Customers", icon: "customers" as IconName, href: customerRoute },
    { label: "Staff", icon: "staff" as IconName, href: staffRoute },
  ];

  const statistics = [
    {
      label: "Total Businesses",
      value: dashboardData.businessCount,
      icon: "business" as IconName,
      accent: "text-pink-300",
      glow: "bg-pink-500/15",
    },
    {
      label: "Total Services",
      value: dashboardData.serviceCount,
      icon: "services" as IconName,
      accent: "text-violet-300",
      glow: "bg-violet-500/15",
    },
    {
      label: "Total Staff",
      value: dashboardData.staffCount,
      icon: "staff" as IconName,
      accent: "text-sky-300",
      glow: "bg-sky-500/15",
    },
    {
      label: "Total Customers",
      value: dashboardData.customerCount,
      icon: "customers" as IconName,
      accent: "text-emerald-300",
      glow: "bg-emerald-500/15",
    },
  ];

  const statusStyles: Record<string, string> = {
    confirmed: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20",
    pending: "bg-amber-400/10 text-amber-300 ring-amber-400/20",
    cancelled: "bg-rose-400/10 text-rose-300 ring-rose-400/20",
    completed: "bg-sky-400/10 text-sky-300 ring-sky-400/20",
  };

  return (
    <main className="min-h-screen bg-[#070a12] text-slate-100">
      {sidebarOpen && (
        <button
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/[0.07] bg-[#0b0f1a] px-4 py-5 transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 px-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 via-fuchsia-500 to-blue-500 text-sm font-bold text-white shadow-lg shadow-fuchsia-500/20">
            B
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide text-white">BookFlow</p>
            <p className="text-[11px] text-slate-500">Business workspace</p>
          </div>
        </div>

        <nav className="mt-10 space-y-1" aria-label="Main navigation">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            Workspace
          </p>
          {navigation.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                setSidebarOpen(false);
                router.push(item.href);
              }}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                item.active
                  ? "bg-white/[0.09] text-white shadow-inner shadow-white/[0.03]"
                  : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              <Icon
                name={item.icon}
                className={`h-[18px] w-[18px] ${
                  item.active ? "text-pink-300" : "text-slate-500 group-hover:text-slate-300"
                }`}
              />
              <span>{item.label}</span>
              {item.active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-pink-400" />}
            </button>
          ))}

          <button
            type="button"
            disabled
            title="Settings are not available yet"
            className="group flex w-full cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-600"
          >
            <Icon name="settings" className="h-[18px] w-[18px] text-slate-600" />
            <span>Settings</span>
          </button>
        </nav>

        <div className="mt-auto border-t border-white/[0.07] pt-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.06] text-xs font-semibold text-slate-300">
              {"U"}
            </span>
            <span>Logout</span>
            <Icon name="arrow" className="ml-auto h-4 w-4 rotate-180" />
          </button>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-white/[0.07] bg-[#070a12]/85 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-5 sm:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                aria-label="Open navigation"
                className="rounded-lg border border-white/[0.08] p-2 text-slate-300 hover:bg-white/[0.06] lg:hidden"
              >
                <Icon name="menu" />
              </button>
              <div>
                <p className="text-sm font-medium text-white">Dashboard</p>
                <p className="hidden text-xs text-slate-500 sm:block">BookFlow workspace overview</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                aria-label="Notifications"
                className="relative rounded-lg border border-white/[0.08] p-2 text-slate-400 hover:bg-white/[0.06] hover:text-white"
              >
                <Icon name="bell" className="h-[18px] w-[18px]" />
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-pink-400" />
              </button>
              <div className="hidden h-8 w-px bg-white/[0.08] sm:block" />
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-blue-500 text-xs font-semibold text-white">
                  U
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-medium text-white">Workspace owner</p>
                  <p className="text-[11px] text-slate-500">Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-10">
          <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-pink-300">
                Overview
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Welcome back
              </h1>
              <p className="mt-2 max-w-xl text-sm text-slate-400">
                Here&apos;s what&apos;s happening with your business today.
              </p>
            </div>
            <div className="hidden items-center gap-2 text-xs text-slate-500 md:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Data synced from Supabase
            </div>
          </section>

          {loading ? (
            <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-32 animate-pulse rounded-2xl border border-white/[0.07] bg-white/[0.04]" />
              ))}
            </section>
          ) : error ? (
            <div className="mt-8 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-5 text-sm text-rose-200" role="alert">
              {error}
            </div>
          ) : (
            <>
              <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {statistics.map((stat) => (
                  <div
                    key={stat.label}
                    className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101624] p-5 shadow-xl shadow-black/10 transition hover:-translate-y-0.5 hover:border-white/[0.14]"
                  >
                    <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl ${stat.glow}`} />
                    <div className="relative flex items-start justify-between">
                      <div>
                        <p className="text-sm text-slate-400">{stat.label}</p>
                        <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
                          {stat.value}
                        </p>
                      </div>
                      <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] ${stat.accent}`}>
                        <Icon name={stat.icon} className="h-5 w-5" />
                      </span>
                    </div>
                    <p className="relative mt-4 text-xs text-slate-500">Across your owned businesses</p>
                  </div>
                ))}
              </section>

              <section className="mt-8 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101624] shadow-xl shadow-black/10">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-5 sm:px-6">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-400/10 text-blue-300">
                        <Icon name="calendar" className="h-4 w-4" />
                      </span>
                      <h2 className="text-base font-semibold text-white">Upcoming appointments</h2>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">Your next five scheduled customer visits.</p>
                  </div>
                  <button
                    onClick={() => router.push(appointmentRoute)}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/[0.1] px-3.5 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    View appointments
                    <Icon name="arrow" className="h-3.5 w-3.5" />
                  </button>
                </div>

                {dashboardData.upcomingAppointments.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.05] text-slate-500">
                      <Icon name="calendar" />
                    </div>
                    <p className="mt-4 text-sm font-medium text-slate-300">No upcoming appointments</p>
                    <p className="mt-1 text-sm text-slate-500">Your schedule is clear for now.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead className="text-[11px] uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-6 py-4 font-medium">Customer</th>
                          <th className="px-6 py-4 font-medium">Service</th>
                          <th className="px-6 py-4 font-medium">Staff</th>
                          <th className="px-6 py-4 font-medium">Date</th>
                          <th className="px-6 py-4 font-medium">Time</th>
                          <th className="px-6 py-4 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData.upcomingAppointments.map((appointment) => (
                          <tr key={appointment.id} className="border-t border-white/[0.06] text-slate-300 transition hover:bg-white/[0.025]">
                            <td className="px-6 py-4 font-medium text-white">{appointment.customerName}</td>
                            <td className="px-6 py-4">{appointment.serviceName}</td>
                            <td className="px-6 py-4">{appointment.staffName}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{appointment.appointment_date}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{formatTime(appointment.start_time)}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${statusStyles[appointment.status] || "bg-slate-400/10 text-slate-300 ring-slate-400/20"}`}>
                                {appointment.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="mt-8">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-white">Quick actions</h2>
                    <p className="mt-1 text-sm text-slate-500">Jump into the areas you use most.</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: "Manage Businesses", icon: "business" as IconName, href: businessRoute, color: "text-pink-300" },
                    { label: "Create Business", icon: "plus" as IconName, href: "/dashboard/business/new", color: "text-violet-300" },
                    { label: "Manage Services", icon: "services" as IconName, href: serviceRoute, color: "text-sky-300" },
                    { label: "View Appointments", icon: "appointments" as IconName, href: appointmentRoute, color: "text-emerald-300" },
                  ].map((action) => (
                    <button
                      key={action.label}
                      onClick={() => router.push(action.href)}
                      className="group flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#101624] px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-white/[0.16] hover:bg-[#151d2e]"
                    >
                      <span className={`flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] ${action.color}`}>
                        <Icon name={action.icon} className="h-[18px] w-[18px]" />
                      </span>
                      <span className="text-sm font-medium text-slate-200">{action.label}</span>
                      <Icon name="arrow" className="ml-auto h-4 w-4 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-slate-300" />
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </main>
  );
}