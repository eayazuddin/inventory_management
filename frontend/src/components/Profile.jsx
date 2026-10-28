import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_URL = "http://localhost:3000/api/auth/profile";

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("pos-token") || ""}`,
});

const getErrorMessage = (error, fallback) =>
  axios.isAxiosError(error)
    ? error.response?.data?.message || error.message
    : error instanceof Error
      ? error.message
      : fallback;

const Profile = () => {
  const { updateUser } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    password: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await axios.get(API_URL, { headers: getAuthHeaders() });
        if (!response.data.success) {
          throw new Error(response.data.message || "Unable to load profile");
        }
        const { name, email, address } = response.data.user;
        setForm({ name, email, address: address || "", password: "" });
      } catch (error) {
        setErrorMessage(getErrorMessage(error, "Unable to load profile"));
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { password, ...profile } = form;
      const response = await axios.patch(
        API_URL,
        password ? { ...profile, password } : profile,
        { headers: getAuthHeaders() },
      );
      if (!response.data.success) {
        throw new Error(response.data.message || "Unable to update profile");
      }

      updateUser(response.data.user);
      setForm((currentForm) => ({ ...currentForm, password: "" }));
      setSuccessMessage(response.data.message || "Profile updated successfully");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to update profile"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="p-6 text-gray-600">Loading profile...</p>;
  }

  return (
    <section className="min-h-screen bg-gray-100 p-3 lg:p-6">
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-md">
        <h1 className="mb-4 text-2xl font-bold">User Profile</h1>

        {errorMessage && (
          <p role="alert" className="mb-4 rounded-md bg-red-100 p-3 text-red-700">
            {errorMessage}
          </p>
        )}
        {successMessage && (
          <p role="status" className="mb-4 rounded-md bg-green-100 p-3 text-green-700">
            {successMessage}
          </p>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700">
            Name
            <input
              type="text"
              required
              autoComplete="name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="mt-1 w-full rounded-md border border-gray-500 px-2.5 py-2.5 text-base font-normal text-gray-900"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              className="mt-1 w-full rounded-md border border-gray-500 px-2.5 py-2.5 text-base font-normal text-gray-900"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Address
            <input
              type="text"
              autoComplete="street-address"
              value={form.address}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
              className="mt-1 w-full rounded-md border border-gray-500 px-2.5 py-2.5 text-base font-normal text-gray-900"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Password
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Enter new password (optional)"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              className="mt-1 w-full rounded-md border border-gray-500 px-2.5 py-2.5 text-base font-normal text-gray-900"
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-amber-600 px-4 py-2.5 font-medium text-white transition hover:bg-amber-700 disabled:cursor-wait disabled:opacity-60"
          >
            {saving ? "Saving..." : "Edit Profile"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default Profile;
