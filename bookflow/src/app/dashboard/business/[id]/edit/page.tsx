"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";

export default function EditBusinessPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();

  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  useEffect(() => {
    const fetchBusiness = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", id)
        .eq("owner_id", user.id)
        .single();

      if (error || !data) {
        setError("Business not found or you do not have access to it.");
        setLoading(false);
        setTimeout(() => router.replace("/dashboard/business"), 1200);
        return;
      }

      setName(data.name || "");
      setDescription(data.description || "");
      setPhone(data.phone || "");
      setEmail(data.email || "");
      setWebsite(data.website || "");
      setAddress(data.address || "");
      setCity(data.city || "");
      setCountry(data.country || "");

      setLoading(false);
    };

    fetchBusiness();
  }, [id, router, supabase]);

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <p>Loading business...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-black-50 p-8">
        <div className="mx-auto max-w-2xl rounded-lg bg-white-100 p-8 shadow">
          <p className="text-red-600" role="alert">
            {error}
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Redirecting to your businesses...
          </p>
        </div>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Business name is required.");
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { error: updateError } = await supabase
      .from("businesses")
      .update({
        name: name.trim(),
        description,
        phone,
        email,
        website,
        address,
        city,
        country,
      })
      .eq("id", id)
      .eq("owner_id", user.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSuccess("Business updated successfully.");
    setSaving(false);

    router.push(`/dashboard/business/${id}`);
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-black-50 p-8">
      <div className="mx-auto max-w-2xl rounded-lg bg-white-100 p-8 shadow">
        <h1 className="text-3xl font-bold">
          Edit Business
        </h1>

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

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium">
              Business Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border p-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-md border p-2"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Phone
            </label>

            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-md border p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Website
            </label>

            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="mt-1 w-full rounded-md border p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Address
            </label>

            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1 w-full rounded-md border p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              City
            </label>

            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1 w-full rounded-md border p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Country
            </label>

            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="mt-1 w-full rounded-md border p-2"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-md bg-pink-500 py-2 text-white hover:bg-gray-800"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </main>
  );
}