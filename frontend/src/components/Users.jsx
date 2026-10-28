import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:3000/api/user";
const emptyUser = {
  name: "",
  email: "",
  password: "",
  address: "",
  role: "customer",
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [userForm, setUserForm] = useState(emptyUser);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const latestRequest = useRef(0);

  const handleRead = useCallback(async (query = searchQuery) => {
    const requestId = ++latestRequest.current;
    const trimmedQuery = query.trim();

    try {
      const response = await axios.get(
        trimmedQuery ? `${API_URL}/search` : API_URL,
        {
          params: trimmedQuery ? { query: trimmedQuery } : undefined,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
          },
        },
      );
      if (!response.data.success) {
        throw new Error(response.data.message || "Unable to load users");
      }
      if (requestId === latestRequest.current) {
        setUsers(response.data.users);
        setErrorMessage("");
      }
    } catch (error) {
      if (requestId === latestRequest.current) {
        setErrorMessage(
          axios.isAxiosError(error)
            ? error.response?.data?.message || error.message
            : error instanceof Error
              ? error.message
              : "Unable to load users",
        );
      }
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => handleRead(searchQuery), 300);
    return () => window.clearTimeout(timeoutId);
  }, [handleRead, searchQuery]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage("");

    try {
      const response = await axios.post(`${API_URL}/add`, userForm, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
        },
      });
      if (!response.data.success) {
        throw new Error(response.data.message || "Unable to add user");
      }

      setUserForm(emptyUser);
      await handleRead(searchQuery);
    } catch (error) {
      setErrorMessage(
        axios.isAxiosError(error)
          ? error.response?.data?.message || error.message
          : error instanceof Error
            ? error.message
            : "Unable to add user",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete "${user.name}"?`)) return;

    setErrorMessage("");
    try {
      const response = await axios.delete(`${API_URL}/${user._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
        },
      });
      if (!response.data.success) {
        throw new Error(response.data.message || "Unable to delete user");
      }
      await handleRead(searchQuery);
    } catch (error) {
      setErrorMessage(
        axios.isAxiosError(error)
          ? error.response?.data?.message || error.message
          : error instanceof Error
            ? error.message
            : "Unable to delete user",
      );
    }
  };

  return (
    <section className="p-3 lg:p-6">
      <h1 className="mb-5 text-2xl font-bold">Users Management</h1>

      {errorMessage && (
        <p role="alert" className="mb-4 rounded-md bg-red-100 p-3 text-red-700">
          {errorMessage}
        </p>
      )}

      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="w-full shrink-0 rounded-lg bg-white p-4 shadow-md lg:w-1/3">
          <h2 className="mb-4 text-xl font-bold">Add New User</h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-gray-700">
              User Name
              <input
                type="text"
                required
                autoComplete="name"
                placeholder="Enter Name"
                className="mt-1 w-full rounded-md border border-gray-300 p-2.5"
                value={userForm.name}
                onChange={(event) =>
                  setUserForm({ ...userForm, name: event.target.value })
                }
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              User Email
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="Enter Email"
                className="mt-1 w-full rounded-md border border-gray-300 p-2.5"
                value={userForm.email}
                onChange={(event) =>
                  setUserForm({ ...userForm, email: event.target.value })
                }
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Password
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Enter Password"
                className="mt-1 w-full rounded-md border border-gray-300 p-2.5"
                value={userForm.password}
                onChange={(event) =>
                  setUserForm({ ...userForm, password: event.target.value })
                }
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              User Address
              <input
                type="text"
                required
                autoComplete="street-address"
                placeholder="Enter Address"
                className="mt-1 w-full rounded-md border border-gray-300 p-2.5"
                value={userForm.address}
                onChange={(event) =>
                  setUserForm({ ...userForm, address: event.target.value })
                }
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              User Role
              <select
                className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2.5"
                value={userForm.role}
                onChange={(event) =>
                  setUserForm({ ...userForm, role: event.target.value })
                }
              >
                <option value="customer">User</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-md bg-blue-600 p-2.5 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Adding..." : "Add User"}
            </button>
          </form>
        </div>

        <div className="min-w-0 flex-1 overflow-hidden rounded-lg bg-white p-3 shadow-md lg:p-4">
          <label className="sr-only" htmlFor="user-search">Search users</label>
          <input
            id="user-search"
            type="search"
            placeholder="Search users..."
            className="mb-4 w-full rounded-md border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-none"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2">ID</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Role</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="p-4 text-center text-gray-500" colSpan={5}>
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td className="p-4 text-center text-gray-500" colSpan={5}>
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user, index) => (
                    <tr key={user._id} className="border-t border-gray-200">
                      <td className="p-2">{index + 1}</td>
                      <td className="p-2">{user.name}</td>
                      <td className="p-2">{user.email}</td>
                      <td className="p-2">
                        {user.role === "customer" ? "user" : user.role}
                      </td>
                      <td className="p-2">
                        <button
                          type="button"
                          className="font-semibold text-red-600 hover:text-red-800"
                          onClick={() => handleDelete(user)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Users;
