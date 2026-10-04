"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";

type BusinessHour = {
  day_of_week: number;
  is_open: boolean;
  open_time: string | null;
  close_time: string | null;
};

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function createDefaultHours(): BusinessHour[] {
  return dayNames.map((_, dayOfWeek) => {
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

    return {
      day_of_week: dayOfWeek,
      is_open: isWeekday,
      open_time: isWeekday ? "09:00" : null,
      close_time: isWeekday ? "17:00" : null,
    };
  });
}

function normalizeTime(value: string | null) {
  return value ? value.slice(0, 5) : null;
}

export default function BusinessHoursPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const businessId = params.id as string;

  const [hours, setHours] = useState<BusinessHour[]>(createDefaultHours);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchHours = async () => {
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

      const { data, error: hoursError } = await supabase
        .from("business_hours")
        .select("day_of_week, is_open, open_time, close_time")
        .eq("business_id", business.id)
        .order("day_of_week", { ascending: true });

      if (hoursError) {
        setError(hoursError.message);
        setLoading(false);
        return;
      }

      const savedHours = new Map(
        (data || []).map((hour) => [hour.day_of_week, hour])
      );
      const defaultHours = createDefaultHours();

      setHours(
        defaultHours.map((defaultHour) => {
          const savedHour = savedHours.get(defaultHour.day_of_week);

          return savedHour
            ? {
                day_of_week: savedHour.day_of_week,
                is_open: savedHour.is_open,
                open_time: normalizeTime(savedHour.open_time),
                close_time: normalizeTime(savedHour.close_time),
              }
            : defaultHour;
        })
      );
      setLoading(false);
    };

    fetchHours();
  }, [businessId, router, supabase]);

  const updateHour = (
    dayOfWeek: number,
    changes: Partial<BusinessHour>
  ) => {
    setHours((currentHours) =>
      currentHours.map((hour) =>
        hour.day_of_week === dayOfWeek ? { ...hour, ...changes } : hour
      )
    );
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");

    const invalidHour = hours.find(
      (hour) =>
        hour.is_open &&
        (!hour.open_time ||
          !hour.close_time ||
          hour.open_time >= hour.close_time)
    );

    if (invalidHour) {
      const dayName = dayNames[invalidHour.day_of_week];
      setError(
        `${dayName} must have an opening time earlier than its closing time.`
      );
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

    const { error: saveError } = await supabase
      .from("business_hours")
      .upsert(
        hours.map((hour) => ({
          business_id: business.id,
          day_of_week: hour.day_of_week,
          is_open: hour.is_open,
          open_time: hour.is_open ? hour.open_time : null,
          close_time: hour.is_open ? hour.close_time : null,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: "business_id,day_of_week" }
      );

    if (saveError) {
      setError(saveError.message);
      setSaving(false);
      return;
    }

    setSuccess("Business hours saved successfully.");
    setSaving(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black p-8">
        <p className="text-white">Loading business hours...</p>
      </main>
    );
  }

  if (error && hours.length === 0) {
    return (
      <main className="min-h-screen bg-black p-8">
        <div className="mx-auto max-w-3xl rounded-lg bg-gray-800 p-8 shadow">
          <p className="text-red-400" role="alert">
            {error}
          </p>
          <p className="mt-2 text-sm text-gray-300">Redirecting...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black p-8">
      <div className="mx-auto max-w-3xl rounded-lg bg-gray-800 p-8 shadow">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Business Hours</h1>
            <p className="mt-2 text-gray-300">
              Set the weekly operating hours for this business.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push(`/dashboard/business/${businessId}`)}
            className="rounded-md border border-gray-400 px-4 py-2 text-white hover:bg-gray-700"
          >
            Back to Business
          </button>
        </div>

        {error && (
          <p className="mt-6 text-red-400" role="alert">
            {error}
          </p>
        )}

        {success && (
          <p className="mt-6 text-green-400" role="status">
            {success}
          </p>
        )}

        <div className="mt-8 space-y-4">
          {hours.map((hour) => {
            const dayName = dayNames[hour.day_of_week];

            return (
              <div
                key={hour.day_of_week}
                className="grid gap-4 rounded-lg border border-gray-600 bg-gray-900 p-4 md:grid-cols-[1fr_auto_1fr_1fr] md:items-center"
              >
                <h2 className="font-semibold text-white">{dayName}</h2>

                <label className="flex items-center gap-2 text-gray-200">
                  <input
                    type="checkbox"
                    checked={hour.is_open}
                    onChange={(event) => {
                      const isOpen = event.target.checked;
                      updateHour(hour.day_of_week, {
                        is_open: isOpen,
                        open_time: isOpen
                          ? hour.open_time || "09:00"
                          : hour.open_time,
                        close_time: isOpen
                          ? hour.close_time || "17:00"
                          : hour.close_time,
                      });
                    }}
                    className="h-4 w-4"
                  />
                  Open
                </label>

                <label className="text-sm text-gray-300">
                  Opens
                  <input
                    type="time"
                    value={hour.open_time || ""}
                    disabled={!hour.is_open}
                    onChange={(event) =>
                      updateHour(hour.day_of_week, {
                        open_time: event.target.value || null,
                      })
                    }
                    className="mt-1 w-full rounded-md border border-gray-500 bg-gray-800 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </label>

                <label className="text-sm text-gray-300">
                  Closes
                  <input
                    type="time"
                    value={hour.close_time || ""}
                    disabled={!hour.is_open}
                    onChange={(event) =>
                      updateHour(hour.day_of_week, {
                        close_time: event.target.value || null,
                      })
                    }
                    className="mt-1 w-full rounded-md border border-gray-500 bg-gray-800 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </label>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="mt-8 w-full rounded-md bg-pink-500 py-3 font-medium text-white hover:bg-pink-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Business Hours"}
        </button>
      </div>
    </main>
  );
}
