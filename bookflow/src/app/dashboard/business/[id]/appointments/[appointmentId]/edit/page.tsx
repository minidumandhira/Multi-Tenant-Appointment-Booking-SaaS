"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { validateAppointmentAvailability } from "@/lib/appointments/availability";

type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

type Option = {
  id: string;
  name: string;
};

type Assignment = {
  staff_id: string;
  service_id: string;
};

type AppointmentData = {
  customer_id: string;
  service_id: string;
  staff_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  notes: string | null;
};

const statusOptions: AppointmentStatus[] = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
];

function formatTime(value: string) {
  return value.slice(0, 5);
}

export default function EditAppointmentPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const businessId = params.id as string;
  const appointmentId = params.appointmentId as string;

  const [customers, setCustomers] = useState<Option[]>([]);
  const [services, setServices] = useState<Option[]>([]);
  const [staff, setStaff] = useState<Option[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [status, setStatus] = useState<AppointmentStatus>("pending");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadAppointment = async () => {
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

      const [appointmentResult, customersResult, servicesResult, staffResult] =
        await Promise.all([
          supabase
            .from("appointments")
            .select(
              "customer_id, service_id, staff_id, appointment_date, start_time, end_time, status, notes"
            )
            .eq("id", appointmentId)
            .eq("business_id", business.id)
            .single(),
          supabase
            .from("customers")
            .select("id, name")
            .eq("business_id", business.id)
            .order("name"),
          supabase
            .from("services")
            .select("id, name")
            .eq("business_id", business.id)
            .order("name"),
          supabase
            .from("staff")
            .select("id, name")
            .eq("business_id", business.id)
            .eq("is_active", true)
            .order("name"),
        ]);

      const failedResult = [
        appointmentResult,
        customersResult,
        servicesResult,
        staffResult,
      ].find((result) => result.error);

      if (failedResult?.error) {
        setError(failedResult.error.message);
        setLoading(false);
        return;
      }

      const staffIds = (staffResult.data || []).map((member) => member.id);
      const serviceIds = (servicesResult.data || []).map(
        (service) => service.id
      );
      const assignmentsResult =
        staffIds.length > 0 && serviceIds.length > 0
          ? await supabase
              .from("staff_services")
              .select("staff_id, service_id")
              .in("staff_id", staffIds)
              .in("service_id", serviceIds)
          : { data: [], error: null };

      if (assignmentsResult.error) {
        setError(assignmentsResult.error.message);
        setLoading(false);
        return;
      }

      if (!appointmentResult.data) {
        setError("Appointment not found or you do not have access to it.");
        setLoading(false);
        return;
      }

      const appointment = appointmentResult.data as AppointmentData;
      setCustomers(customersResult.data || []);
      setServices(servicesResult.data || []);
      setStaff(staffResult.data || []);
      setAssignments(assignmentsResult.data || []);
      setCustomerId(appointment.customer_id);
      setServiceId(appointment.service_id);
      setStaffId(appointment.staff_id);
      setAppointmentDate(appointment.appointment_date);
      setStartTime(formatTime(appointment.start_time));
      setEndTime(formatTime(appointment.end_time));
      setStatus(appointment.status);
      setNotes(appointment.notes || "");
      setLoading(false);
    };

    loadAppointment();
  }, [appointmentId, businessId, router, supabase]);

  const availableStaff = useMemo(
    () =>
      staff.filter((member) =>
        assignments.some(
          (assignment) =>
            assignment.staff_id === member.id &&
            assignment.service_id === serviceId
        )
      ),
    [assignments, serviceId, staff]
  );

  const handleServiceChange = (value: string) => {
    setServiceId(value);
    if (!assignments.some((assignment) => assignment.staff_id === staffId && assignment.service_id === value)) {
      setStaffId("");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (
      !customerId ||
      !serviceId ||
      !staffId ||
      !appointmentDate ||
      !startTime ||
      !endTime
    ) {
      setError("Customer, service, staff, date, start time, and end time are required.");
      return;
    }

    if (startTime >= endTime) {
      setError("Start time must be earlier than end time.");
      return;
    }

    if (!availableStaff.some((member) => member.id === staffId)) {
      setError("The selected staff member is not assigned to this service.");
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Your session has expired. Please log in again.");
      setSaving(false);
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
      setSaving(false);
      return;
    }

    const [appointmentResult, customerResult, serviceResult, staffResult, assignmentResult] =
      await Promise.all([
        supabase
          .from("appointments")
          .select("id")
          .eq("id", appointmentId)
          .eq("business_id", business.id)
          .single(),
        supabase
          .from("customers")
          .select("id")
          .eq("id", customerId)
          .eq("business_id", business.id)
          .single(),
        supabase
          .from("services")
          .select("id")
          .eq("id", serviceId)
          .eq("business_id", business.id)
          .single(),
        supabase
          .from("staff")
          .select("id")
          .eq("id", staffId)
          .eq("business_id", business.id)
          .eq("is_active", true)
          .single(),
        supabase
          .from("staff_services")
          .select("staff_id")
          .eq("staff_id", staffId)
          .eq("service_id", serviceId)
          .single(),
      ]);

    if (
      appointmentResult.error ||
      customerResult.error ||
      serviceResult.error ||
      staffResult.error ||
      assignmentResult.error
    ) {
      setError("Verify that the appointment and selected related records are valid.");
      setSaving(false);
      return;
    }

    const availabilityError = await validateAppointmentAvailability(
      supabase,
      {
        businessId: business.id,
        staffId,
        appointmentDate,
        startTime,
        endTime,
        excludeAppointmentId: appointmentId,
      }
    );

    if (availabilityError) {
      setError(availabilityError);
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("appointments")
      .update({
        customer_id: customerId,
        service_id: serviceId,
        staff_id: staffId,
        appointment_date: appointmentDate,
        start_time: startTime,
        end_time: endTime,
        status,
        notes: notes.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointmentId)
      .eq("business_id", business.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSuccess("Appointment updated successfully.");
    setSaving(false);
    router.push(`/dashboard/business/${businessId}/appointments/${appointmentId}`);
    router.refresh();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black p-8">
        <p className="text-white">Loading appointment...</p>
      </main>
    );
  }

  if (error && !customerId) {
    return (
      <main className="min-h-screen bg-black p-8">
        <div className="mx-auto max-w-2xl rounded-lg bg-gray-800 p-8 shadow">
          <p className="text-red-400" role="alert">
            {error}
          </p>
          <p className="mt-2 text-sm text-gray-300">Unable to load appointment.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black p-8">
      <div className="mx-auto max-w-2xl rounded-lg bg-gray-800 p-8 shadow">
        <h1 className="text-3xl font-bold text-white">Edit Appointment</h1>

        {error && (
          <p className="mt-4 text-red-400" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="mt-4 text-green-400" role="status">
            {success}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-white">Customer *</label>
            <select
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
              className="mt-1 w-full rounded-md border border-gray-500 bg-gray-700 px-3 py-2 text-white"
              required
            >
              <option value="" className="bg-gray-700 text-white">Select a customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id} className="bg-gray-700 text-white">
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white">Service *</label>
            <select
              value={serviceId}
              onChange={(event) => handleServiceChange(event.target.value)}
              className="mt-1 w-full rounded-md border border-gray-500 bg-gray-700 px-3 py-2 text-white"
              required
            >
              <option value="" className="bg-gray-700 text-white">Select a service</option>
              {services.map((service) => (
                <option key={service.id} value={service.id} className="bg-gray-700 text-white">
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white">Staff *</label>
            <select
              value={staffId}
              onChange={(event) => setStaffId(event.target.value)}
              disabled={!serviceId}
              className="mt-1 w-full rounded-md border border-gray-500 bg-gray-700 px-3 py-2 text-white disabled:opacity-50"
              required
            >
              <option value="" className="bg-gray-700 text-white">
                {serviceId ? "Select assigned staff" : "Select a service first"}
              </option>
              {availableStaff.map((member) => (
                <option key={member.id} value={member.id} className="bg-gray-700 text-white">
                  {member.name}
                </option>
              ))}
            </select>
            {serviceId && availableStaff.length === 0 && (
              <p className="mt-1 text-sm text-yellow-300">
                No active staff member is assigned to this service.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-white">Date *</label>
            <input
              type="date"
              value={appointmentDate}
              onChange={(event) => setAppointmentDate(event.target.value)}
              className="mt-1 w-full rounded-md border border-gray-500 bg-gray-700 px-3 py-2 text-white"
              required
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-white">Start Time *</label>
              <input
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white">End Time *</label>
              <input
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white">Status</label>
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as AppointmentStatus)
              }
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option} className="bg-gray-700 text-white">
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white">Notes</label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-md bg-pink-500 py-2 text-white hover:bg-pink-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/dashboard/business/${businessId}/appointments/${appointmentId}`
                )
              }
              className="flex-1 rounded-md border border-gray-300 py-2 text-white hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
