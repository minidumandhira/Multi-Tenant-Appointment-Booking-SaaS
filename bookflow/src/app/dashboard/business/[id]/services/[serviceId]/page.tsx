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

export default function ServiceDetailPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();

  const businessId = params.id as string;
  const serviceId = params.serviceId as string;

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
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
        .select("id, name, description, duration_minutes, price")
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

      setService(data);
      setLoading(false);
    };

    fetchService();
  }, [businessId, router, serviceId, supabase]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this service?")) {
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
      .from("services")
      .delete()
      .eq("id", serviceId)
      .eq("business_id", business.id);

    if (deleteError) {
      setError(deleteError.message);
      setDeleting(false);
      return;
    }

    setSuccess("Service deleted successfully.");
    router.push(`/dashboard/business/${businessId}/services`);
    router.refresh();
  };

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <p>Loading service...</p>
      </main>
    );
  }

  if (error && !service) {
    return (
      <main className="min-h-screen bg-black-50 p-8">
        <div className="mx-auto max-w-2xl rounded-lg bg-gray-800 p-8 shadow">
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

  if (!service) {
    return null;
  }

  return (
    <main className="min-h-screen bg-black-50 p-8">
      <div className="mx-auto max-w-2xl rounded-lg bg-gray-800 p-8 shadow">
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

        <h1 className="text-3xl font-bold">{service.name}</h1>

        {service.description && (
          <p className="mt-4 text-gray-300">{service.description}</p>
        )}

        <div className="mt-6 space-y-3">
          <p>
            <strong>Duration:</strong> {service.duration_minutes} minutes
          </p>
          <p>
            <strong>Price:</strong> Rs. {service.price}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={() =>
              router.push(
                `/dashboard/business/${businessId}/services/${serviceId}/edit`
              )
            }
            className="rounded-md bg-pink-500 px-4 py-2 text-white hover:bg-pink-700"
          >
            Edit Service
          </button>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete Service"}
          </button>

          <button
            onClick={() =>
              router.push(`/dashboard/business/${businessId}/services`)
            }
            className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-700"
          >
            Back to Services
          </button>
        </div>
      </div>
    </main>
  );
}
