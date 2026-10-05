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
      <main className="min-h-screen bg-[#070a12] p-6 text-slate-300 sm:p-10">
        <div className="mx-auto max-w-5xl animate-pulse">
          <div className="h-8 w-48 rounded-lg bg-white/[0.08]" />
          <div className="mt-8 h-72 rounded-2xl border border-white/[0.07] bg-[#101624]" />
        </div>
      </main>
    );
  }

  if (!business) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#070a12] p-5 text-slate-100 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => router.push("/dashboard/business")}
          className="mb-6 text-sm text-slate-400 transition hover:text-white"
        >
          <span aria-hidden="true">&larr;</span> Back to Businesses
        </button>

        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101624] shadow-2xl shadow-black/20">
          <div className="border-b border-white/[0.07] bg-gradient-to-r from-pink-500/[0.12] via-transparent to-blue-500/[0.1] px-6 py-7 sm:px-8">
        {error && (
          <p className="mb-5 rounded-lg border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200" role="alert">
            {error}
          </p>
        )}

        {success && (
          <p className="mb-5 rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200" role="status">
            {success}
          </p>
        )}

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-300">
          Business workspace
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {business.name}
        </h1>

        {business.description && (
          <p className="mt-3 max-w-2xl text-sm text-slate-400">
            {business.description}
          </p>
        )}
          </div>

        <div className="grid gap-4 px-6 py-7 sm:grid-cols-2 sm:px-8 lg:grid-cols-3">
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Contact</p>
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              <p><span className="text-slate-500">Phone</span><br />{business.phone || "Not provided"}</p>
              <p><span className="text-slate-500">Email</span><br />{business.email || "Not provided"}</p>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Location</p>
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              <p><span className="text-slate-500">Address</span><br />{business.address || "Not provided"}</p>
              <p><span className="text-slate-500">City / Country</span><br />{business.city || "Not provided"}{business.city && business.country ? ", " : ""}{business.country || ""}</p>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Details</p>
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              <p><span className="text-slate-500">Website</span><br />{business.website || "Not provided"}</p>
              <p><span className="text-slate-500">Timezone</span><br />{business.timezone || "Not provided"}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.07] px-6 py-6 sm:px-8">
          <p className="mb-4 text-sm font-medium text-white">Manage workspace</p>
          <div className="flex flex-wrap gap-3">
  <button
    onClick={() =>
      router.push(`/dashboard/business/${id}/edit`)
    }
    className="rounded-lg bg-pink-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-pink-500/10 transition hover:bg-pink-400"
  >
    Edit Business
  </button>

  <button
    onClick={() =>
      router.push(`/dashboard/business/${id}/services`)
    }
    className="rounded-lg border border-white/[0.1] bg-white/[0.05] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.1]"
  >
    Services
  </button>

  <button
    onClick={() =>
      router.push(`/dashboard/business/${id}/staff`)
    }
    className="rounded-lg border border-white/[0.1] bg-white/[0.05] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.1]"
  >
    Staff
  </button>

  <button
    onClick={() =>
      router.push(`/dashboard/business/${id}/hours`)
    }
    className="rounded-lg border border-white/[0.1] bg-white/[0.05] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.1]"
  >
    Business Hours
  </button>

  <button
    onClick={() =>
      router.push(`/dashboard/business/${id}/customers`)
    }
    className="rounded-lg border border-white/[0.1] bg-white/[0.05] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.1]"
  >
    Customers
  </button>

  <button
    onClick={() =>
      router.push(`/dashboard/business/${id}/appointments`)
    }
    className="rounded-lg border border-white/[0.1] bg-white/[0.05] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.1]"
  >
    Appointments
  </button>

  <button
    onClick={handleDelete}
    disabled={deleting}
    className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
  >
    {deleting ? "Deleting..." : "Delete Business"}
  </button>
          </div>
        </div>
      </div>
      </div>
    </main>
  );
}