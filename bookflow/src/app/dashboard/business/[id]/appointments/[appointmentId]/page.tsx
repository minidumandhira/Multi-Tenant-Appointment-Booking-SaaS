"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";

type Appointment = {
  id: string;
  customer_id: string;
  service_id: string;
  staff_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
};

type RelatedRecord = {
  id: string;
  name: string;
};

function formatTime(value: string) {
  return value.slice(0, 5);
}

export default function AppointmentDetailPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const businessId = params.id as string;
  const appointmentId = params.appointmentId as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [customer, setCustomer] = useState<RelatedRecord | null>(null);
  const [service, setService] = useState<RelatedRecord | null>(null);
  const [staff, setStaff] = useState<RelatedRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchAppointment = async () => {
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

      const { data, error: appointmentError } = await supabase
        .from("appointments")
        .select(
          "id, customer_id, service_id, staff_id, appointment_date, start_time, end_time, status, notes"
        )
        .eq("id", appointmentId)
        .eq("business_id", business.id)
        .single();

      if (appointmentError || !data) {
        setError("Appointment not found or you do not have access to it.");
        setLoading(false);
        setTimeout(
          () => router.replace(`/dashboard/business/${businessId}/appointments`),
          1200
        );
        return;
      }

      const [customerResult, serviceResult, staffResult] = await Promise.all([
        supabase
          .from("customers")
          .select("id, name")
          .eq("id", data.customer_id)
          .eq("business_id", business.id)
          .single(),
        supabase
          .from("services")
          .select("id, name")
          .eq("id", data.service_id)
          .eq("business_id", business.id)
          .single(),
        supabase
          .from("staff")
          .select("id, name")
          .eq("id", data.staff_id)
          .eq("business_id", business.id)
          .single(),
      ]);

      if (customerResult.error || serviceResult.error || staffResult.error) {
        setError("The appointment has an invalid related record.");
        setLoading(false);
        return;
      }

      setAppointment(data);
      setCustomer(customerResult.data);
      setService(serviceResult.data);
      setStaff(staffResult.data);
      setLoading(false);
    };

    fetchAppointment();
  }, [appointmentId, businessId, router, supabase]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this appointment?")) {
      return;
    }

    setDeleting(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Your session has expired. Please log in again.");
      setDeleting(false);
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
      setDeleting(false);
      return;
    }

    const { error: deleteError } = await supabase
      .from("appointments")
      .delete()
      .eq("id", appointmentId)
      .eq("business_id", business.id);

    if (deleteError) {
      setError(deleteError.message);
      setDeleting(false);
      return;
    }

    setSuccess("Appointment deleted successfully.");
    router.push(`/dashboard/business/${businessId}/appointments`);
    router.refresh();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black p-8">
        <p className="text-white">Loading appointment...</p>
      </main>
    );
  }

  if (error && !appointment) {
    return (
      <main className="min-h-screen bg-black p-8">
        <div className="mx-auto max-w-2xl rounded-lg bg-gray-800 p-8 shadow">
          <p className="text-red-400" role="alert">
            {error}
          </p>
          <p className="mt-2 text-sm text-gray-300">Redirecting...</p>
        </div>
      </main>
    );
  }

  if (!appointment) {
    return null;
  }

  return (
    <main className="min-h-screen bg-black p-8">
      <div className="mx-auto max-w-2xl rounded-lg bg-gray-800 p-8 shadow">
        {error && (
          <p className="mb-4 text-red-400" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="mb-4 text-green-400" role="status">
            {success}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold text-white">Appointment</h1>
          <span className="rounded-full bg-pink-100 px-3 py-1 text-sm font-medium text-pink-900">
            {appointment.status}
          </span>
        </div>

        <div className="mt-6 space-y-3 text-gray-200">
          <p>
            <strong>Customer:</strong> {customer?.name || "Not available"}
          </p>
          <p>
            <strong>Service:</strong> {service?.name || "Not available"}
          </p>
          <p>
            <strong>Staff:</strong> {staff?.name || "Not available"}
          </p>
          <p>
            <strong>Date:</strong> {appointment.appointment_date}
          </p>
          <p>
            <strong>Time:</strong> {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
          </p>
          <div>
            <strong>Notes:</strong>
            <p className="mt-1 whitespace-pre-wrap">
              {appointment.notes || "No notes"}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={() =>
              router.push(
                `/dashboard/business/${businessId}/appointments/${appointmentId}/edit`
              )
            }
            className="rounded-md bg-pink-500 px-4 py-2 text-white hover:bg-pink-700"
          >
            Edit Appointment
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete Appointment"}
          </button>
        </div>

        <button
          onClick={() => router.push(`/dashboard/business/${businessId}/appointments`)}
          className="mt-6 text-sm text-gray-300 underline hover:text-white"
        >
          Back to Appointments
        </button>
      </div>
    </main>
  );
}
