"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";

export default function EditServicePage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();

  const businessId = params.id as string;
  const serviceId = params.serviceId as string;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchService = async () => {
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

      const { data, error: serviceError } = await supabase
        .from("services")
        .select("name, description, duration_minutes, price")
        .eq("id", serviceId)
        .eq("business_id", business.id)
        .single();

      if (serviceError || !data) {
        setError("Service not found or you do not have access to it.");
        setLoading(false);
        setTimeout(
          () => router.replace(`/dashboard/business/${businessId}/services`),
          1200
        );
        return;
      }

      setName(data.name || "");
      setDescription(data.description || "");
      setDuration(String(data.duration_minutes));
      setPrice(String(data.price));
      setLoading(false);
    };

    fetchService();
  }, [businessId, router, serviceId, supabase]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const durationValue = Number(duration);
    const priceValue = Number(price);

    if (!name.trim()) {
      setError("Service name is required.");
      return;
    }

    if (!Number.isFinite(durationValue) || durationValue < 10) {
      setError("Duration must be at least 10 minutes.");
      return;
    }

    if (!Number.isFinite(priceValue) || priceValue < 0) {
      setError("Price must be zero or greater.");
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

    const { error: updateError } = await supabase
      .from("services")
      .update({
        name: name.trim(),
        description,
        duration_minutes: durationValue,
        price: priceValue,
      })
      .eq("id", serviceId)
      .eq("business_id", business.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSuccess("Service updated successfully.");
    setSaving(false);

    router.push(
      `/dashboard/business/${businessId}/services/${serviceId}`
    );
    router.refresh();
  };

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <p>Loading service...</p>
      </main>
    );
  }

  if (error && !name) {
    return (
      <main className="min-h-screen bg-black-50 p-8">
        <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow">
          <p className="text-red-600" role="alert">
            {error}
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Redirecting...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black-50 p-8">
      <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow">
        <h1 className="text-3xl font-bold">Edit Service</h1>

        {error && (
          <p className="mt-4 text-red-600" role="alert">
            {error}
          </p>
        )}

        {success && (
          <p className="mt-4 text-green-600" role="status">
            {success}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-medium">
              Service Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Duration (minutes) *
            </label>
            <input
              type="number"
              min="10"
              step="10"
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Price (Rs.) *</label>
            <input
              type="number"
              min="0"
              step="100.00"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              required
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
                  `/dashboard/business/${businessId}/services/${serviceId}`
                )
              }
              className="flex-1 rounded-md border border-gray-300 py-2 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
