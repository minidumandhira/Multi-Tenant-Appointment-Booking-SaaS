"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";

type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

export default function CustomerDetailPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const businessId = params.id as string;
  const customerId = params.customerId as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
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
        .select("id, name, email, phone, notes")
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

      setCustomer(data);
      setLoading(false);
    };

    fetchCustomer();
  }, [businessId, customerId, router, supabase]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this customer?")) {
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
      .from("customers")
      .delete()
      .eq("id", customerId)
      .eq("business_id", business.id);

    if (deleteError) {
      setError(deleteError.message);
      setDeleting(false);
      return;
    }

    setSuccess("Customer deleted successfully.");
    router.push(`/dashboard/business/${businessId}/customers`);
    router.refresh();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black p-8">
        <p className="text-white">Loading customer...</p>
      </main>
    );
  }

  if (error && !customer) {
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

  if (!customer) {
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

        <h1 className="text-3xl font-bold text-white">{customer.name}</h1>

        <div className="mt-6 space-y-3 text-gray-200">
          <p>
            <strong>Email:</strong> {customer.email || "Not provided"}
          </p>
          <p>
            <strong>Phone:</strong> {customer.phone || "Not provided"}
          </p>
          <div>
            <strong>Notes:</strong>
            <p className="mt-1 whitespace-pre-wrap">
              {customer.notes || "No notes"}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={() =>
              router.push(
                `/dashboard/business/${businessId}/customers/${customerId}/edit`
              )
            }
            className="rounded-md bg-pink-500 px-4 py-2 text-white hover:bg-pink-700"
          >
            Edit Customer
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete Customer"}
          </button>
        </div>

        <button
          onClick={() => router.push(`/dashboard/business/${businessId}/customers`)}
          className="mt-6 text-sm text-gray-300 underline hover:text-white"
        >
          Back to Customers
        </button>
      </div>
    </main>
  );
}
