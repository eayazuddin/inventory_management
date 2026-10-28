import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:3000/api";
const emptyProduct = {
  name: "",
  description: "",
  price: "",
  stock: "",
  categoryId: "",
  supplierId: "",
};

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("pos-token") || ""}`,
});

const getErrorMessage = (error, fallback) =>
  axios.isAxiosError(error)
    ? error.response?.data?.message || error.message
    : error instanceof Error
      ? error.message
      : fallback;

const Products = ({ readOnly = false }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingProductId, setEditingProductId] = useState(null);
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
        trimmedQuery ? `${API_URL}/product/search` : `${API_URL}/product`,
        {
          params: trimmedQuery ? { query: trimmedQuery } : undefined,
          headers: getAuthHeaders(),
        },
      );
      if (!response.data.success) {
        throw new Error(response.data.message || "Unable to load products");
      }
      if (requestId === latestRequest.current) {
        setProducts(response.data.products);
        setErrorMessage("");
      }
    } catch (error) {
      if (requestId === latestRequest.current) {
        setErrorMessage(getErrorMessage(error, "Unable to load products"));
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

  useEffect(() => {
    if (readOnly) return;

    const loadOptions = async () => {
      try {
        const [categoryResponse, supplierResponse] = await Promise.all([
          axios.get(`${API_URL}/category`, { headers: getAuthHeaders() }),
          axios.get(`${API_URL}/supplier`, { headers: getAuthHeaders() }),
        ]);
        if (!categoryResponse.data.success || !supplierResponse.data.success) {
          throw new Error("Unable to load categories and suppliers");
        }
        setCategories(categoryResponse.data.categories);
        setSuppliers(supplierResponse.data.suppliers);
      } catch (error) {
        setErrorMessage(getErrorMessage(error, "Unable to load categories and suppliers"));
      }
    };

    loadOptions();
  }, [readOnly]);

  const openCreateModal = () => {
    setEditingProductId(null);
    setProductForm(emptyProduct);
    setErrorMessage("");
    setModalOpen(true);
  };

  const handleEdit = (product) => {
    setEditingProductId(product._id);
    setProductForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      stock: String(product.stock),
      categoryId: product.categoryId?._id || "",
      supplierId: product.supplierId?._id || "",
    });
    setErrorMessage("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingProductId(null);
    setProductForm(emptyProduct);
    setErrorMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage("");

    const payload = {
      ...productForm,
      price: Number(productForm.price),
      stock: Number(productForm.stock),
    };

    try {
      const response = editingProductId
        ? await axios.patch(`${API_URL}/product/${editingProductId}`, payload, {
            headers: getAuthHeaders(),
          })
        : await axios.post(`${API_URL}/product/add`, payload, {
            headers: getAuthHeaders(),
          });

      if (!response.data.success) {
        throw new Error(response.data.message || "Unable to save product");
      }

      setModalOpen(false);
      setEditingProductId(null);
      setProductForm(emptyProduct);
      await handleRead(searchQuery);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to save product"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"?`)) return;

    try {
      const response = await axios.delete(`${API_URL}/product/${product._id}`, {
        headers: getAuthHeaders(),
      });
      if (!response.data.success) {
        throw new Error(response.data.message || "Unable to delete product");
      }
      await handleRead(searchQuery);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to delete product"));
    }
  };

  const renderStock = (stock) => (
    <span
      className={`inline-flex min-w-8 justify-center rounded-full px-2 py-1 text-sm font-medium ${
        stock === 0
          ? "bg-red-100 text-red-700"
          : stock < 10
            ? "bg-yellow-100 text-yellow-800"
            : "bg-green-100 text-green-700"
      }`}
    >
      {stock}
    </span>
  );

  return (
    <section className="p-3 lg:p-6">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-2xl font-bold">
          {readOnly ? "Products" : "Products Management"}
        </h1>
        {!readOnly && (
          <button
            type="button"
            onClick={openCreateModal}
            className="w-full rounded-md bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700 lg:w-auto"
          >
            Add Product
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow-md">
        <div className="p-3 lg:p-4">
          <label className="sr-only" htmlFor="product-search">Search products by name</label>
          <input
            id="product-search"
            type="search"
            placeholder="Search products by name..."
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
            <p className="p-6 text-center text-gray-500">Loading products...</p>
          ) : products.length === 0 ? (
            <p className="p-6 text-center text-gray-500">
              {errorMessage ? "Product data is unavailable." : "No products found."}
            </p>
          ) : (
            <div className="space-y-3 p-3">
              {products.map((product, index) => (
                <article key={product._id} className="rounded-lg border border-gray-200 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-gray-500">#{index + 1}</span>
                    <span className="text-lg font-bold text-gray-900">{product.name}</span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p><span className="font-semibold">Description:</span> {product.description}</p>
                    <p><span className="font-semibold">Category:</span> {product.categoryId?.categoryName || "Unavailable"}</p>
                    <p><span className="font-semibold">Supplier:</span> {product.supplierId?.name || "Unavailable"}</p>
                    <p><span className="font-semibold">Price:</span> ${Number(product.price).toFixed(2)}</p>
                    <p className="flex items-center gap-2"><span className="font-semibold">Stock:</span> {renderStock(product.stock)}</p>
                  </div>
                  {!readOnly && (
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(product)}
                        className="flex-1 rounded bg-amber-500 px-3 py-2 text-white hover:bg-amber-600"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(product)}
                        className="flex-1 rounded bg-red-600 px-3 py-2 text-white hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Supplier</th>
                <th className="p-3">Price</th>
                <th className="p-3">Stock</th>
                {!readOnly && <th className="p-3">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={readOnly ? 5 : 6} className="p-6 text-center text-gray-500">Loading products...</td></tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={readOnly ? 5 : 6} className="p-6 text-center text-gray-500">
                    {errorMessage ? "Product data is unavailable." : "No products found."}
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id} className="border-t border-gray-200">
                    <td className="p-3">{product.name}</td>
                    <td className="p-3">{product.categoryId?.categoryName || "Unavailable"}</td>
                    <td className="p-3">{product.supplierId?.name || "Unavailable"}</td>
                    <td className="p-3 whitespace-nowrap">${Number(product.price).toFixed(2)}</td>
                    <td className="p-3">{renderStock(product.stock)}</td>
                    {!readOnly && (
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(product)}
                            className="rounded bg-amber-500 px-3 py-1.5 text-white hover:bg-amber-600"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(product)}
                            className="rounded bg-red-600 px-3 py-1.5 text-white hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
            className="my-auto w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
          >
            <h2 id="product-modal-title" className="mb-5 text-xl font-bold">
              {editingProductId ? "Edit Product" : "Add New Product"}
            </h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block font-medium">
                Name
                <input
                  required
                  autoFocus
                  type="text"
                  placeholder="Product name"
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 font-normal"
                  value={productForm.name}
                  onChange={(event) => setProductForm({ ...productForm, name: event.target.value })}
                />
              </label>
              <label className="block font-medium">
                Description
                <textarea
                  required
                  rows={3}
                  placeholder="Product description"
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 font-normal"
                  value={productForm.description}
                  onChange={(event) => setProductForm({ ...productForm, description: event.target.value })}
                />
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block font-medium">
                  Price
                  <input
                    required
                    min="0"
                    step="0.01"
                    type="number"
                    placeholder="0.00"
                    className="mt-1 w-full rounded-md border border-gray-300 p-2 font-normal"
                    value={productForm.price}
                    onChange={(event) => setProductForm({ ...productForm, price: event.target.value })}
                  />
                </label>
                <label className="block font-medium">
                  Stock
                  <input
                    required
                    min="0"
                    step="1"
                    type="number"
                    placeholder="0"
                    className="mt-1 w-full rounded-md border border-gray-300 p-2 font-normal"
                    value={productForm.stock}
                    onChange={(event) => setProductForm({ ...productForm, stock: event.target.value })}
                  />
                </label>
              </div>
              <label className="block font-medium">
                Category
                <select
                  required
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 font-normal"
                  value={productForm.categoryId}
                  onChange={(event) => setProductForm({ ...productForm, categoryId: event.target.value })}
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>{category.categoryName}</option>
                  ))}
                </select>
              </label>
              <label className="block font-medium">
                Supplier
                <select
                  required
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 font-normal"
                  value={productForm.supplierId}
                  onChange={(event) => setProductForm({ ...productForm, supplierId: event.target.value })}
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier._id} value={supplier._id}>{supplier.name}</option>
                  ))}
                </select>
              </label>
              {errorMessage && (
                <p role="alert" className="rounded-md bg-red-100 p-3 text-red-700">{errorMessage}</p>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving || categories.length === 0 || suppliers.length === 0}
                  className="flex-1 rounded-md bg-blue-600 p-3 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingProductId ? "Update Product" : "Add Product"}
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
              {(categories.length === 0 || suppliers.length === 0) && (
                <p className="text-sm text-gray-600">
                  Add at least one category and one supplier before creating a product.
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default Products;
