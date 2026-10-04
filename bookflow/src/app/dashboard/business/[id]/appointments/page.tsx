"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";

type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

type Appointment = {
  id: string;
  customer_id: string;
  service_id: string;
  staff_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  notes: string | null;
};

type Lookup = {
  id: string;
  name: string;
};

const statuses: Array<"all" | AppointmentStatus> = [
  "all",
  "pending",
  "confirmed",
  "cancelled",
  "completed",
];

function formatTime(value: string) {
  return value.slice(0, 5);
}

export default function AppointmentsPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const businessId = params.id as string;

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Lookup[]>([]);
  const [services, setServices] = useState<Lookup[]>([]);
  const [staff, setStaff] = useState<Lookup[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | AppointmentStatus>(
    "all"
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAppointments = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: business, error: businessError } = await supabase
        .from("businesses")
        .select("id")
        .eq("id", businessId)
        .eq("owner_id", user.id)
        .single();

      if (businessError || !business) {
        setError("Business not found or you do not have access to it.");
        setLoading(false);
        setTimeout(() => router.replace("/dashboard/business"), 1200);
        return;
      }

      const [appointmentsResult, customersResult, servicesResult, staffResult] =
        await Promise.all([
          supabase
            .from("appointments")
            .select(
              "id, customer_id, service_id, staff_id, appointment_date, start_time, end_time, status, notes"
            )
            .eq("business_id", business.id)
            .order("appointment_date", { ascending: true })
            .order("start_time", { ascending: true }),
          supabase
            .from("customers")
            .select("id, name")
            .eq("business_id", business.id),
          supabase
            .from("services")
            .select("id, name")
            .eq("business_id", business.id),
          supabase
            .from("staff")
            .select("id, name")
            .eq("business_id", business.id),
        ]);

      const failedResult = [
        appointmentsResult,
        customersResult,
        servicesResult,
        staffResult,
      ].find((result) => result.error);

      if (failedResult?.error) {
        setError(failedResult.error.message);
        setLoading(false);
        return;
      }

      setAppointments(appointmentsResult.data || []);
      setCustomers(customersResult.data || []);
      setServices(servicesResult.data || []);
      setStaff(staffResult.data || []);
      setLoading(false);
    };

    fetchAppointments();
  }, [businessId, router, supabase]);

  const customerNames = useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer.name])),
    [customers]
  );
  const serviceNames = useMemo(
    () => new Map(services.map((service) => [service.id, service.name])),
    [services]
  );
  const staffNames = useMemo(
    () => new Map(staff.map((member) => [member.id, member.name])),
    [staff]
  );

  const filteredAppointments = appointments.filter(
    (appointment) =>
      statusFilter === "all" || appointment.status === statusFilter
  );

  return (
    <main className="min-h-screen bg-black p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Appointments</h1>
            <p className="mt-2 text-gray-200">
              Manage appointments for this business.
            </p>
          </div>

          <button
            onClick={() =>
              router.push(`/dashboard/business/${businessId}/appointments/new`)
            }
            className="rounded-md bg-pink-500 px-4 py-2 text-white hover:bg-pink-700"
          >
            Add Appointment
          </button>
        </div>

        {error && (
          <p className="mt-4 text-red-400" role="alert">
            {error}
          </p>
        )}

        {!loading && appointments.length > 0 && (
          <label className="mt-8 block max-w-xs text-sm text-gray-200">
            Filter by status
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "all" | AppointmentStatus)
              }
              className="mt-1 w-full rounded-md border border-gray-500 bg-gray-800 px-3 py-2 text-white"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status === "all"
                    ? "All statuses"
                    : status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </label>
        )}

        {loading ? (
          <p className="mt-8 text-white">Loading appointments...</p>
        ) : appointments.length === 0 ? (
          <div className="mt-8 rounded-lg border bg-gray-800 p-8 text-center">
            <h2 className="text-xl font-semibold text-white">
              No appointments yet
            </h2>
            <p className="mt-2 text-gray-200">
              Add your first appointment to get started.
            </p>
            <button
              onClick={() =>
                router.push(`/dashboard/business/${businessId}/appointments/new`)
              }
              className="mt-5 rounded-md bg-pink-500 px-4 py-2 text-white hover:bg-pink-700"
            >
              Add Appointment
            </button>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="mt-8 rounded-lg border bg-gray-800 p-8 text-center">
            <p className="text-gray-200">
              No appointments match the selected status.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="rounded-lg border bg-gray-800 p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-xl font-semibold text-white">
                    {customerNames.get(appointment.customer_id) ||
                      "Unknown customer"}
                  </h2>
                  <span className="rounded-full bg-pink-100 px-2 py-1 text-xs font-medium text-pink-900">
                    {appointment.status}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm text-gray-200">
                  <p>
                    <strong>Service:</strong>{" "}
                    {serviceNames.get(appointment.service_id) ||
                      "Unknown service"}
                  </p>
                  <p>
                    <strong>Staff:</strong>{" "}
                    {staffNames.get(appointment.staff_id) || "Unknown staff"}
                  </p>
                  <p>
                    <strong>Date:</strong> {appointment.appointment_date}
                  </p>
                  <p>
                    <strong>Time:</strong> {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                  </p>
                </div>

                <button
                  onClick={() =>
                    router.push(
                      `/dashboard/business/${businessId}/appointments/${appointment.id}`
                    )
                  }
                  className="mt-5 w-full rounded-md border border-pink-500 bg-pink-500 px-4 py-2 text-white hover:bg-pink-800"
                >
                  Manage Appointment
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => router.push(`/dashboard/business/${businessId}`)}
          className="mt-8 text-sm text-gray-300 underline hover:text-white"
        >
          Back to Business
        </button>
      </div>
    </main>
  );
}
