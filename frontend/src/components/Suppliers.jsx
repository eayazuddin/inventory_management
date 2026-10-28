import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:3000/api/supplier";
const emptySupplier = { name: "", email: "", number: "", address: "" };

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [supplierForm, setSupplierForm] = useState(emptySupplier);
  const [editingSupplierId, setEditingSupplierId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
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
        throw new Error(response.data.message || "Unable to load suppliers");
      }
      if (requestId === latestRequest.current) {
        setSuppliers(response.data.suppliers);
        setErrorMessage("");
      }
    } catch (error) {
      if (requestId === latestRequest.current) {
        setErrorMessage(
          axios.isAxiosError(error)
            ? error.response?.data?.message || error.message
            : error instanceof Error
              ? error.message
              : "Unable to load suppliers",
        );
      }
    } finally {
      if (requestId === latestRequest.current) {
        setLoading(false);
      }
    }
  }, [searchQuery]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      handleRead(searchQuery);
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [handleRead, searchQuery]);

  const openCreateModal = () => {
    setEditingSupplierId(null);
    setSupplierForm(emptySupplier);
    setErrorMessage("");
    setModalOpen(true);
  };

  const handleEdit = (supplier) => {
    setEditingSupplierId(supplier._id);
    setSupplierForm({
      name: supplier.name,
      email: supplier.email,
      number: supplier.number,
      address: supplier.address,
    });
    setErrorMessage("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingSupplierId(null);
    setSupplierForm(emptySupplier);
    setErrorMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage("");
    try {
      const response = editingSupplierId
        ? await axios.patch(`${API_URL}/${editingSupplierId}`, supplierForm, {
            headers: { Authorization: `Bearer ${localStorage.getItem("pos-token")}` },
          })
        : await axios.post(`${API_URL}/add`, supplierForm, {
            headers: { Authorization: `Bearer ${localStorage.getItem("pos-token")}` },
          });

      if (!response.data.success) {
        throw new Error(response.data.message || "Unable to save supplier");
      }

      setModalOpen(false);
      setEditingSupplierId(null);
      setSupplierForm(emptySupplier);
      await handleRead(searchQuery);
    } catch (error) {
      setErrorMessage(
        axios.isAxiosError(error)
          ? error.response?.data?.message || error.message
          : error instanceof Error
            ? error.message
            : "Unable to save supplier",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (supplier) => {
    if (!window.confirm(
      `Delete "${supplier.name}"? Suppliers used by products cannot be deleted.`
    )) return;

    try {
      const response = await axios.delete(`${API_URL}/${supplier._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("pos-token")}` },
      });
      if (!response.data.success) {
        throw new Error(response.data.message || "Unable to delete supplier");
      }
      await handleRead(searchQuery);
    } catch (error) {
      setErrorMessage(
        axios.isAxiosError(error)
          ? error.response?.data?.message || error.message
          : error instanceof Error
            ? error.message
            : "Unable to delete supplier",
      );
    }
  };

  return (
    <section className="p-3 lg:p-6">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-2xl font-bold">Supplier Management</h1>
        <button
          type="button"
          onClick={openCreateModal}
          className="w-full rounded-md bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700 lg:w-auto"
        >
          Add Supplier
        </button>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow-md">
        <div className="p-3 lg:p-4">
          <label className="sr-only" htmlFor="supplier-search">Search suppliers</label>
          <input
            id="supplier-search"
            type="search"
            placeholder="Search suppliers..."
            className="w-full rounded-md border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-none"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>

        {errorMessage && !modalOpen && (
          <p role="alert" className="mx-4 mb-4 rounded-md bg-red-100 p-3 text-red-700">
            {errorMessage}
          </p>
        )}

        <div className="block lg:hidden">
          {loading ? (
            <p className="p-6 text-center text-gray-500">Loading suppliers...</p>
          ) : suppliers.length === 0 ? (
            <p className="p-6 text-center text-gray-500">
              {errorMessage ? "Supplier data is unavailable." : "No suppliers found."}
            </p>
          ) : (
            <div className="space-y-3 p-3">
              {suppliers.map((supplier, index) => (
                <div key={supplier._id} className="rounded-lg border border-gray-200 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-gray-500">#{index + 1}</span>
                    <span className="text-lg font-bold text-gray-900">{supplier.name}</span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p><span className="font-semibold">Email:</span> {supplier.email}</p>
                    <p><span className="font-semibold">Number:</span> {supplier.number}</p>
                    <p><span className="font-semibold">Address:</span> {supplier.address}</p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(supplier)}
                      className="flex-1 rounded bg-amber-500 px-3 py-2 text-white hover:bg-amber-600"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(supplier)}
                      className="flex-1 rounded bg-red-600 px-3 py-2 text-white hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Number</th>
                <th className="p-3">Address</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-6 text-center text-gray-500">Loading suppliers...</td></tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    {errorMessage ? "Supplier data is unavailable." : "No suppliers found."}
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier, index) => (
                  <tr key={supplier._id} className="border-t border-gray-200 align-top">
                    <td className="p-3">{index + 1}</td>
                    <td className="p-3">{supplier.name}</td>
                    <td className="p-3 break-all">{supplier.email}</td>
                    <td className="p-3 whitespace-nowrap">{supplier.number}</td>
                    <td className="p-3 break-words">{supplier.address}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(supplier)}
                          className="rounded bg-amber-500 px-3 py-1.5 text-white hover:bg-amber-600"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(supplier)}
                          className="rounded bg-red-600 px-3 py-1.5 text-white hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="supplier-modal-title"
            className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
          >
            <h2 id="supplier-modal-title" className="mb-5 text-xl font-bold">
              {editingSupplierId ? "Edit Supplier" : "Add New Supplier"}
            </h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block font-medium">
                Name
                <input
                  required
                  type="text"
                  autoFocus
                  placeholder="Supplier name"
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 font-normal"
                  value={supplierForm.name}
                  onChange={(event) => setSupplierForm({ ...supplierForm, name: event.target.value })}
                />
              </label>
              <label className="block font-medium">
                Email
                <input
                  required
                  type="email"
                  placeholder="Supplier email"
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 font-normal"
                  value={supplierForm.email}
                  onChange={(event) => setSupplierForm({ ...supplierForm, email: event.target.value })}
                />
              </label>
              <label className="block font-medium">
                Number
                <input
                  required
                  type="tel"
                  placeholder="Supplier number"
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 font-normal"
                  value={supplierForm.number}
                  onChange={(event) => setSupplierForm({ ...supplierForm, number: event.target.value })}
                />
              </label>
              <label className="block font-medium">
                Address
                <textarea
                  required
                  rows={3}
                  placeholder="Supplier address"
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 font-normal"
                  value={supplierForm.address}
                  onChange={(event) => setSupplierForm({ ...supplierForm, address: event.target.value })}
                />
              </label>
              {errorMessage && (
                <p role="alert" className="rounded-md bg-red-100 p-3 text-red-700">{errorMessage}</p>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-md bg-blue-600 p-3 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingSupplierId ? "Update Supplier" : "Add Supplier"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="flex-1 rounded-md bg-gray-600 p-3 text-white hover:bg-gray-700 disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default Suppliers;
