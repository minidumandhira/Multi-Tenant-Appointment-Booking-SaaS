"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";

type Staff = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  is_active: boolean;
};

export default function StaffDetailPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const businessId = params.id as string;
  const staffId = params.staffId as string;

  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [serviceMessage, setServiceMessage] = useState("");

  useEffect(() => {
    const fetchStaff = async () => {
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

      const { data, error: staffError } = await supabase
        .from("staff")
        .select("id, name, email, phone, role, is_active")
        .eq("id", staffId)
        .eq("business_id", business.id)
        .single();

      if (staffError || !data) {
        setError("Staff member not found or you do not have access to it.");
        setLoading(false);
        setTimeout(
          () => router.replace(`/dashboard/business/${businessId}/staff`),
          1200
        );
        return;
      }

      setStaff(data);
      setLoading(false);
    };

    fetchStaff();
  }, [businessId, router, staffId, supabase]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this staff member?")) {
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
      .from("staff")
      .delete()
      .eq("id", staffId)
      .eq("business_id", business.id);

    if (deleteError) {
      setError(deleteError.message);
      setDeleting(false);
      return;
    }

    setSuccess("Staff member deleted successfully.");
    router.push(`/dashboard/business/${businessId}/staff`);
    router.refresh();
  };

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <p>Loading staff member...</p>
      </main>
    );
  }

  if (error && !staff) {
    return (
      <main className="min-h-screen bg-black-50 p-8">
        <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow">
          <p className="text-red-600" role="alert">
            {error}
          </p>
          <p className="mt-2 text-sm text-gray-600">Redirecting...</p>
        </div>
      </main>
    );
  }

  if (!staff) {
    return null;
  }

  return (
    <main className="min-h-screen bg-black-50 p-8">
      <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow">
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

        {serviceMessage && (
          <p className="mb-4 text-blue-700" role="status">
            {serviceMessage}
          </p>
        )}

        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">{staff.name}</h1>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              staff.is_active
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {staff.is_active ? "Active" : "Inactive"}
          </span>
        </div>

        <div className="mt-6 space-y-3">
          <p>
            <strong>Email:</strong> {staff.email || "Not provided"}
          </p>
          <p>
            <strong>Phone:</strong> {staff.phone || "Not provided"}
          </p>
          <p>
            <strong>Role:</strong> {staff.role || "Not provided"}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={() =>
              router.push(
                `/dashboard/business/${businessId}/staff/${staffId}/edit`
              )
            }
            className="rounded-md bg-pink-500 px-4 py-2 text-white hover:bg-pink-700"
          >
            Edit Staff
          </button>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete Staff"}
          </button>

          <button
            onClick={() =>
              setServiceMessage(
                "Staff service assignment management will be available in the next phase."
              )
            }
            className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-100"
          >
            Manage Services
          </button>
        </div>

        <button
          onClick={() => router.push(`/dashboard/business/${businessId}/staff`)}
          className="mt-6 text-sm text-gray-600 underline hover:text-gray-900"
        >
          Back to Staff
        </button>
      </div>
    </main>
  );
}
