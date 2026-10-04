"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";

export default function EditCustomerPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const businessId = params.id as string;
  const customerId = params.customerId as string;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchCustomer = async () => {
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

      const { data, error: customerError } = await supabase
        .from("customers")
        .select("name, email, phone, notes")
        .eq("id", customerId)
        .eq("business_id", business.id)
        .single();

      if (customerError || !data) {
        setError("Customer not found or you do not have access to it.");
        setLoading(false);
        setTimeout(
          () => router.replace(`/dashboard/business/${businessId}/customers`),
          1200
        );
        return;
      }

      setName(data.name || "");
      setEmail(data.email || "");
      setPhone(data.phone || "");
      setNotes(data.notes || "");
      setLoading(false);
    };

    fetchCustomer();
  }, [businessId, customerId, router, supabase]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Customer name is required.");
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
      .from("customers")
      .update({
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        notes: notes.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", customerId)
      .eq("business_id", business.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSuccess("Customer updated successfully.");
    setSaving(false);
    router.push(`/dashboard/business/${businessId}/customers/${customerId}`);
    router.refresh();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black p-8">
        <p className="text-white">Loading customer...</p>
      </main>
    );
  }

  if (error && !name) {
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

  return (
    <main className="min-h-screen bg-black p-8">
      <div className="mx-auto max-w-2xl rounded-lg bg-gray-800 p-8 shadow">
        <h1 className="text-3xl font-bold text-white">Edit Customer</h1>

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
            <label className="block text-sm font-medium text-white">
              Name *
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
            <label className="block text-sm font-medium text-white">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={5}
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
                  `/dashboard/business/${businessId}/customers/${customerId}`
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
