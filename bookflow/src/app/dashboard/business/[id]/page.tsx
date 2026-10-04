"use client";

import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Business = {
  id: string;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  timezone: string | null;
};

export default function ManageBusinessPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();

  const id = params.id as string;

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchBusiness = async () => {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", id)
        .eq("owner_id", userData.user.id)
        .single();

      if (error || !data) {
        setError("Business not found or you do not have access to it.");
        setLoading(false);
        setTimeout(() => router.replace("/dashboard/business"), 1200);
        return;
      }

      setBusiness(data);
      setLoading(false);
    };

    fetchBusiness();
  }, [id, router, supabase]);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this business?"
    );

    if (!confirmed) {
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

    const { error } = await supabase
      .from("businesses")
      .delete()
      .eq("id", id)
      .eq("owner_id", user.id);

    if (error) {
      setError(error.message);
      setDeleting(false);
      return;
    }

    setSuccess("Business deleted successfully.");

    setTimeout(() => {
      router.push("/dashboard/business");
      router.refresh();
    }, 500);
  };

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <p>Loading business...</p>
      </main>
    );
  }

  if (!business) {
    return null;
  }

  return (
    <main className="min-h-screen bg-black-50 p-8">
      <div className="mx-auto max-w-3xl rounded-lg bg-black-100 p-8 shadow">
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
          {business.name}
        </h1>

        {business.description && (
          <p className="mt-4 text-pink-600">
            {business.description}
          </p>
        )}

        <div className="mt-6 space-y-3">

          <p>
            <strong>Phone:</strong>{" "}
            {business.phone || "Not provided"}
          </p>

          <p>
            <strong>Email:</strong>{" "}
            {business.email || "Not provided"}
          </p>

          <p>
            <strong>Website:</strong>{" "}
            {business.website || "Not provided"}
          </p>

          <p>
            <strong>Address:</strong>{" "}
            {business.address || "Not provided"}
          </p>

          <p>
            <strong>City:</strong>{" "}
            {business.city || "Not provided"}
          </p>

          <p>
            <strong>Country:</strong>{" "}
            {business.country || "Not provided"}
          </p>

          <p>
            <strong>Timezone:</strong>{" "}
            {business.timezone || "Not provided"}
          </p>
        </div>

       <div className="mt-8 flex gap-3">
  <button
    onClick={() =>
      router.push(`/dashboard/business/${id}/edit`)
    }
    className="rounded-md bg-pink-500 px-4 py-2 text-white hover:bg-gray-800"
  >
    Edit Business
  </button>

  <button
    onClick={() =>
      router.push(`/dashboard/business/${id}/services`)
    }
    className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-blue-700"
  >
    Services
  </button>

  <button
    onClick={() =>
      router.push(`/dashboard/business/${id}/staff`)
    }
    className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
  >
    Staff
  </button>

  <button
    onClick={() =>
      router.push(`/dashboard/business/${id}/hours`)
    }
    className="rounded-md bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
  >
    Business Hours
  </button>

  <button
    onClick={() =>
      router.push(`/dashboard/business/${id}/customers`)
    }
    className="rounded-md bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
  >
    Customers
  </button>

  <button
    onClick={() =>
      router.push(`/dashboard/business/${id}/appointments`)
    }
    className="rounded-md bg-orange-600 px-4 py-2 text-white hover:bg-orange-700"
  >
    Appointments
  </button>

  <button
    onClick={handleDelete}
    disabled={deleting}
    className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
  >
    {deleting ? "Deleting..." : "Delete Business"}
  </button>
</div>
      </div>
    </main>
  );
}