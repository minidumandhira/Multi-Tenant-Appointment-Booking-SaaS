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

export default function CustomersPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const businessId = params.id as string;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
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

      const { data, error: customersError } = await supabase
        .from("customers")
        .select("id, name, email, phone, notes")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false });

      if (customersError) {
        setError(customersError.message);
        setLoading(false);
        return;
      }

      setCustomers(data || []);
      setLoading(false);
    };

    fetchCustomers();
  }, [businessId, router, supabase]);

  return (
    <main className="min-h-screen bg-black p-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Customers</h1>
            <p className="mt-2 text-gray-200">
              Manage the customers for this business.
            </p>
          </div>

          <button
            onClick={() =>
              router.push(`/dashboard/business/${businessId}/customers/new`)
            }
            className="rounded-md bg-pink-500 px-4 py-2 text-white hover:bg-pink-700"
          >
            Add Customer
          </button>
        </div>

        {error && (
          <p className="mt-4 text-red-400" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <p className="mt-8 text-white">Loading customers...</p>
        ) : customers.length === 0 ? (
          <div className="mt-8 rounded-lg border bg-gray-800 p-8 text-center">
            <h2 className="text-xl font-semibold text-white">
              No customers yet
            </h2>
            <p className="mt-2 text-gray-200">
              Add your first customer to get started.
            </p>
            <button
              onClick={() =>
                router.push(`/dashboard/business/${businessId}/customers/new`)
              }
              className="mt-5 rounded-md bg-pink-500 px-4 py-2 text-white hover:bg-pink-700"
            >
              Add Customer
            </button>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="rounded-lg border bg-gray-800 p-6 shadow-sm"
              >
                <h2 className="text-xl font-semibold text-white">
                  {customer.name}
                </h2>

                <div className="mt-4 space-y-2 text-sm text-gray-200">
                  <p>
                    <strong>Email:</strong> {customer.email || "Not provided"}
                  </p>
                  <p>
                    <strong>Phone:</strong> {customer.phone || "Not provided"}
                  </p>
                </div>

                {customer.notes && (
                  <p className="mt-4 line-clamp-3 text-sm text-gray-300">
                    {customer.notes}
                  </p>
                )}

                <button
                  onClick={() =>
                    router.push(
                      `/dashboard/business/${businessId}/customers/${customer.id}`
                    )
                  }
                  className="mt-5 w-full rounded-md border border-pink-500 bg-pink-500 px-4 py-2 text-white hover:bg-pink-800"
                >
                  Manage Customer
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
