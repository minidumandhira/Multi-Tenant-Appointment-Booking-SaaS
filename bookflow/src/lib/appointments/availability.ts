import type { SupabaseClient } from "@supabase/supabase-js";

type AvailabilityInput = {
  businessId: string;
  staffId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  excludeAppointmentId?: string;
};

type BusinessHoursRow = {
  is_open: boolean;
  open_time: string | null;
  close_time: string | null;
};

type ExistingAppointment = {
  id: string;
  start_time: string;
  end_time: string;
};

function normalizeTime(value: string | null) {
  return value ? value.slice(0, 5) : null;
}

export async function validateAppointmentAvailability(
  supabase: SupabaseClient,
  input: AvailabilityInput
): Promise<string | null> {
  const dayOfWeek = new Date(
    `${input.appointmentDate}T00:00:00`
  ).getDay();

  const { data: businessHours, error: hoursError } = await supabase
    .from("business_hours")
    .select("is_open, open_time, close_time")
    .eq("business_id", input.businessId)
    .eq("day_of_week", dayOfWeek)
    .maybeSingle<BusinessHoursRow>();

  if (hoursError) {
    return hoursError.message;
  }

  if (!businessHours || !businessHours.is_open) {
    return "The business is closed on this day.";
  }

  const openTime = normalizeTime(businessHours.open_time);
  const closeTime = normalizeTime(businessHours.close_time);

  if (
    !openTime ||
    !closeTime ||
    input.startTime < openTime ||
    input.endTime > closeTime
  ) {
    return "The appointment is outside business hours.";
  }

  let appointmentsQuery = supabase
    .from("appointments")
    .select("id, start_time, end_time")
    .eq("business_id", input.businessId)
    .eq("staff_id", input.staffId)
    .eq("appointment_date", input.appointmentDate)
    .neq("status", "cancelled");

  if (input.excludeAppointmentId) {
    appointmentsQuery = appointmentsQuery.neq(
      "id",
      input.excludeAppointmentId
    );
  }

  const { data: existingAppointments, error: appointmentsError } =
    await appointmentsQuery;

  if (appointmentsError) {
    return appointmentsError.message;
  }

  const hasOverlap = (existingAppointments || []).some(
    (appointment: ExistingAppointment) =>
      normalizeTime(appointment.start_time)! < input.endTime &&
      normalizeTime(appointment.end_time)! > input.startTime
  );

  if (hasOverlap) {
    return "This staff member already has an appointment during that time.";
  }

  return null;
}
