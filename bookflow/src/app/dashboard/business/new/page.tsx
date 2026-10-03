"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function NewBusinessPage() {

    const supabase = createClient();
    const router = useRouter();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [website, setWebsite] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [country, setCountry] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

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
        setError("You must be logged in.");
        setSaving(false);
    return;
  }

  const { error } = await supabase
    .from("businesses")
    .insert({
      owner_id: user.id,
    name: name.trim(),
      description,
      phone,
      email,
      website,
      address,
      city,
      country,
    });

  if (error) {
        setError(error.message);
        setSaving(false);
    return;
  }

    setSuccess("Business created successfully.");

  router.push("/dashboard/business");
  router.refresh();
};


    return (

        
        <main className="min-h-screen bg-black-50 p-8">
            <div className="mx-auto max-w-2xl rounded-lg bg-black-100 p-8 shadow">
                <h1 className="text-3xl font-bold">
                    Create Your Business
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

                <p className="mt-2 text-gray-600">
                    Add your business details to get started with BookFlow.
                </p>

                <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium">
                            Business Name *
                        </label>

                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter business name"
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
                            placeholder="Tell customers about your business"
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
                            placeholder="Enter phone number"
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
                            placeholder="Enter business email"
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
                            placeholder="https://example.com"
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
                            placeholder="Enter business address"
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
                            placeholder="Enter city"
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
                            placeholder="Enter country"
                            className="mt-1 w-full rounded-md border p-2"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full rounded-md bg-green-600 py-2 text-white hover:bg-green-700 disabled:opacity-50"
                    >
                        {saving ? "Creating..." : "Create Business"}
                    </button>
                </form>
            </div>
        </main>
    );
}