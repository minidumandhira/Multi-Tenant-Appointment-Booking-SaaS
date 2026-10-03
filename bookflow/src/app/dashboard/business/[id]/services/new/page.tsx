"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";

export default function NewServicePage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();

  const businessId = params.id as string;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const verifyBusiness = async () => {
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
      }

      setLoading(false);
    };

    verifyBusiness();
  }, [businessId, router, supabase]);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name || !duration || !price) {
      setError("Please fill in all required fields.");
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

    const { error } = await supabase
      .from("services")
      .insert({
        business_id: business.id,
        name: name.trim(),
        description,
        duration_minutes: Number(duration),
        price: Number(price),
      });

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    setSuccess("Service created successfully.");

    router.push(
      `/dashboard/business/${businessId}/services`
    );

    router.refresh();
  };

  return (
    <main className="min-h-screen bg-black-50 p-8">
      <div className="mx-auto max-w-2xl rounded-lg bg-black p-8 shadow">

        {error && (
          <p className="mb-4 text-red-600" role="alert">
            {error}
          </p>
        )}

        {success && (
          <p className="mb-4 text-green-600" role="status">
            {success}
          </p>
        )}

        <h1 className="text-3xl font-bold">
          Add Service
        </h1>

        <p className="mt-2 text-gray-600">
          Add a service offered by your business.
        </p>

        {loading ? (
          <p className="mt-8 text-gray-600">Checking business access...</p>
        ) : error ? null : (
          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >

          {/* Service Name */}
          <div>
            <label className="block text-sm font-medium">
              Service Name *
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Haircut"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              placeholder="Describe this service..."
              rows={4}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium">
              Duration (minutes) *
            </label>

            <input
              type="number"
              min="10"
              step='10'
              value={duration}
              onChange={(e) =>
                setDuration(e.target.value)
              }
              placeholder="30"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              required
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium">
              Price (Rs.) *
            </label>

            <input
              type="number"
              min="0"
              step="100.00"
              value={price}
              onChange={(e) =>
                setPrice(e.target.value)
              }
              placeholder="1500"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-3">

            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-md bg-pink-500 py-2 text-white hover:bg-pink-700 disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Service"}
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/dashboard/business/${businessId}/services`
                )
              }
              className="flex-1 rounded-md border border-gray-300 py-2 hover:bg-red-700"
            >
              Cancel
            </button>

          </div>

          </form>
        )}
      </div>
    </main>
  );
}