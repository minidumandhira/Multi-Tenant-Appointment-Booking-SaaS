"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";

type Service = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
};

export default function ServicesPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();

  const businessId = params.id as string;

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchServices = async () => {
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

      const { data, error: servicesError } = await supabase
        .from("services")
        .select("*")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false });

      if (servicesError) {
        setError(servicesError.message);
        setLoading(false);
        return;
      }

      setServices(data || []);
      setLoading(false);
    };

    fetchServices();
  }, [businessId, router, supabase]);

  return (
    <main className="min-h-screen bg-black-50 p-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Services
            </h1>

            <p className="mt-2 text-white">
              Manage the services offered by your business.
            </p>
          </div>

          <button
            onClick={() =>
              router.push(
                `/dashboard/business/${businessId}/services/new`
              )
            }
            className="rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800"
          >
            Add Service
          </button>
        </div>

        {error && (
          <p className="mt-4 text-red-600" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <p className="mt-8 text-gray-600">
            Loading services...
          </p>
        ) : services.length === 0 ? (
          <div className="mt-8 rounded-lg border bg-black p-8 text-center">
            <h2 className="text-xl font-semibold">
              No services yet
            </h2>

            <p className="mt-2 text-gray-600">
              Add your first service to get started.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="rounded-lg border bg-gray-800 p-6 shadow-sm"
              >
                <h2 className="text-xl font-semibold">
                  {service.name}
                </h2>

                {service.description && (
                  <p className="mt-2 text-gray-300">
                    {service.description}
                  </p>
                )}

                <div className="mt-4 space-y-2 text-sm">
                  <p>
                    <strong>Duration:</strong>{" "}
                    {service.duration_minutes} minutes
                  </p>

                  <p>
                    <strong>Price:</strong>{" "}
                    Rs. {service.price}
                  </p>
                </div>

                <button
                  onClick={() =>
                    router.push(
                      `/dashboard/business/${businessId}/services/${service.id}`
                    )
                  }
                  className="mt-5 w-full rounded-md border border-gray-300 bg-gray-700 px-4 py-2 hover:bg-gray-800"
                >
                  Manage Service
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}