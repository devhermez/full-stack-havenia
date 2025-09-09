"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import ClientNav from "@/components/ClientNav";

type Address = {
  id: string;
  line1: string;
  line2: string | null;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
};

export default function AddressesPage() {
  const [items, setItems] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // form state
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("Siargao");
  const [province, setProvince] = useState("SUR");
  const [postal, setPostal] = useState("8420");
  const [country, setCountry] = useState("PH");
  const [isDefault, setIsDefault] = useState(true);

  useEffect(() => {
    const t = getToken();
    if (!t) {
      window.location.href = "/login";
      return;
    }
    api.defaults.headers.common.Authorization = `Bearer ${t}`;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const { data } = await api.get<{ data: Address[] }>("/addresses");
      setItems(data.data);
    } catch (e: any) {
      setErr(e?.response?.data?.error?.message ?? "Failed to load addresses");
    } finally {
      setLoading(false);
    }
  }

  async function createAddress(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await api.post("/addresses", {
        line1,
        line2: line2 || null,
        city,
        province,
        postal_code: postal,
        country,
        is_default: isDefault,
      });
      // reset a few fields
      setLine1("");
      setLine2("");
      // refresh list
      await load();
    } catch (e: any) {
      setErr(e?.response?.data?.error?.message ?? "Create failed");
    }
  }

  async function makeDefault(id: string) {
    setErr(null);
    try {
      await api.put(`/addresses/${id}/default`);
      await load();
    } catch (e: any) {
      setErr(e?.response?.data?.error?.message ?? "Failed to set default");
    }
  }

  async function removeAddress(id: string) {
    setErr(null);
    try {
      await api.delete(`/addresses/${id}`);
      // optimistic update
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e: any) {
      setErr(e?.response?.data?.error?.message ?? "Delete failed");
    }
  }

  return (
    <div className="w-screen min-h-screen bg-gray-400">
      <ClientNav />
      <div className="addresses-content p-4 flex flex-col gap-4">
        <section>
          <h1 className="text-3xl font-semibold mb-2 text-white">Your Addresses</h1>
        <p className=" text-sm text-gray-200">Manage your delivery or booking addresses here. Save time by setting a default address and keeping everything ready for your next order or stay.</p>
        </section>
        <section className="bg-white rounded-2xl shadow p-6 text-black placeholder-black">
          <h2 className="text-lg font-semibold mb-4">New Address</h2>

          <form
            onSubmit={createAddress}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            <input
              className="border rounded-lg px-3 py-2"
              placeholder="Line 1"
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              required
            />
            <input
              className="border rounded-lg px-3 py-2"
              placeholder="Line 2 (optional)"
              value={line2}
              onChange={(e) => setLine2(e.target.value)}
            />
            <input
              className="border rounded-lg px-3 py-2"
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
            <input
              className="border rounded-lg px-3 py-2"
              placeholder="Province"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              required
            />
            <input
              className="border rounded-lg px-3 py-2"
              placeholder="Postal code"
              value={postal}
              onChange={(e) => setPostal(e.target.value)}
              required
            />
            <input
              className="border rounded-lg px-3 py-2"
              placeholder="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              required
            />

            <label className="flex items-center gap-2 sm:col-span-2">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
              />
              Make this the default address
            </label>

            <div className="sm:col-span-2">
              <button className="px-4 py-2 rounded-lg bg-black text-white">
                Save
              </button>
            </div>
          </form>
        </section>

        <section className="bg-white rounded-2xl shadow p-6 text-black">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Your Addresses</h2>
            {loading && (
              <span className="text-sm text-neutral-500">Loading…</span>
            )}
          </div>

          {err && <p className="text-red-600 text-sm mb-3">{err}</p>}

          {items.length === 0 && !loading ? (
            <p className="text-sm text-neutral-600">No addresses yet.</p>
          ) : (
            <ul className="space-y-3">
              {items.map((a) => (
                <li
                  key={a.id}
                  className="border rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="text-sm">
                    <div className="font-medium">
                      {a.line1}
                      {a.line2 ? `, ${a.line2}` : ""}
                    </div>
                    <div className="text-neutral-600">
                      {a.city}, {a.province} {a.postal_code}, {a.country}
                    </div>
                    {a.is_default && (
                      <span className="mt-1 inline-block text-xs bg-neutral-100 border rounded px-2 py-0.5">
                        Default
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!a.is_default && (
                      <button
                        onClick={() => makeDefault(a.id)}
                        className="text-sm border rounded px-3 py-1"
                      >
                        Set default
                      </button>
                    )}
                    <button
                      onClick={() => removeAddress(a.id)}
                      className="text-sm border rounded px-3 py-1"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
