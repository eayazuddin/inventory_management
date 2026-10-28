import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:3000/api";

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("pos-token") || ""}`,
});

const getErrorMessage = (error, fallback) =>
  axios.isAxiosError(error)
    ? error.response?.data?.message || error.message
    : error instanceof Error
      ? error.message
      : fallback;

const CustomerProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [orderingProductId, setOrderingProductId] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState("1");
  const [orderError, setOrderError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const [productResponse, categoryResponse] = await Promise.all([
          axios.get(`${API_URL}/product`, { headers: getAuthHeaders() }),
          axios.get(`${API_URL}/category`, { headers: getAuthHeaders() }),
        ]);

        if (!productResponse.data.success || !categoryResponse.data.success) {
          throw new Error("Unable to load products and categories");
        }

        setProducts(productResponse.data.products);
        setCategories(categoryResponse.data.categories);
      } catch (error) {
        setErrorMessage(getErrorMessage(error, "Unable to load products"));
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        !selectedCategory || product.categoryId?._id === selectedCategory;
      const matchesSearch =
        !normalizedQuery || product.name.toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesSearch;
    });
  }, [products, searchQuery, selectedCategory]);

  const openOrderDialog = (product) => {
    setNotice("");
    setErrorMessage("");
    setOrderError("");
    setOrderQuantity("1");
    setSelectedProduct(product);
  };

  const closeOrderDialog = () => {
    if (orderingProductId) return;
    setSelectedProduct(null);
    setOrderQuantity("1");
    setOrderError("");
  };

  const handleOrder = async (event) => {
    event.preventDefault();
    const quantity = Number(orderQuantity);
    if (
      !selectedProduct ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > selectedProduct.stock
    ) {
      setOrderError("Enter a quantity within the available stock.");
      return;
    }

    setOrderError("");
    setErrorMessage("");
    setNotice("");
    setOrderingProductId(selectedProduct._id);
    try {
      const response = await axios.post(
        `${API_URL}/order`,
        { productId: selectedProduct._id, quantity },
        { headers: getAuthHeaders() },
      );
      if (!response.data.success) {
        throw new Error(response.data.message || "Unable to place order");
      }

      setProducts((currentProducts) =>
        currentProducts.map((currentProduct) =>
          currentProduct._id === selectedProduct._id
            ? { ...currentProduct, stock: currentProduct.stock - quantity }
            : currentProduct,
        ),
      );
      setNotice(`Order placed for "${selectedProduct.name}".`);
      setSelectedProduct(null);
      setOrderQuantity("1");
    } catch (error) {
      setOrderError(getErrorMessage(error, "Unable to place order"));
    } finally {
      setOrderingProductId("");
    }
  };

  return (
    <section className="min-h-screen bg-gray-100 p-3 lg:p-6">
      <h1 className="mb-4 text-2xl font-bold">Products</h1>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="sr-only" htmlFor="customer-product-category">
          Filter by category
        </label>
        <select
          id="customer-product-category"
          value={selectedCategory}
          onChange={(event) => setSelectedCategory(event.target.value)}
          className="w-full rounded-md border border-gray-300 bg-white p-2.5 sm:max-w-sm"
        >
          <option value="">Select Category</option>
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.categoryName}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="customer-product-search">
          Search products
        </label>
        <input
          id="customer-product-search"
          type="search"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="w-full rounded-md border border-gray-300 bg-white p-2.5 sm:max-w-sm"
        />
      </div>

      {errorMessage && (
        <p role="alert" className="mb-4 rounded-md bg-red-100 p-3 text-red-700">
          {errorMessage}
        </p>
      )}
      {notice && (
        <p role="status" className="mb-4 rounded-md bg-blue-100 p-3 text-blue-800">
          {notice}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-200">
              <th scope="col" className="p-3">ID</th>
              <th scope="col" className="p-3">Name</th>
              <th scope="col" className="p-3">Category</th>
              <th scope="col" className="p-3">Price</th>
              <th scope="col" className="p-3">Stock</th>
              <th scope="col" className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  Loading products...
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  {errorMessage ? "Product data is unavailable." : "No products found."}
                </td>
              </tr>
            ) : (
              filteredProducts.map((product, index) => (
                <tr key={product._id} className="border-b border-gray-200 last:border-0">
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3">{product.name}</td>
                  <td className="p-3">
                    {product.categoryId?.categoryName || "Unavailable"}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    ${Number(product.price).toFixed(2)}
                  </td>
                  <td className="p-3">{product.stock}</td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => openOrderDialog(product)}
                      disabled={product.stock < 1 || orderingProductId === product._id}
                      className="rounded-md bg-green-600 px-3 py-1.5 text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                    >
                      Order
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeOrderDialog();
          }}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="place-order-title"
            onSubmit={handleOrder}
            className="w-full max-w-md rounded-md bg-white p-4 shadow-xl sm:p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="place-order-title" className="text-xl font-bold">
                Place Order
              </h2>
              <button
                type="button"
                aria-label="Close order dialog"
                onClick={closeOrderDialog}
                disabled={Boolean(orderingProductId)}
                className="px-1 text-xl font-bold text-gray-700 hover:text-black disabled:opacity-50"
              >
                X
              </button>
            </div>

            <label className="sr-only" htmlFor="order-quantity">
              Quantity
            </label>
            <input
              id="order-quantity"
              type="number"
              min="1"
              max={selectedProduct.stock}
              step="1"
              required
              autoFocus
              value={orderQuantity}
              onChange={(event) => setOrderQuantity(event.target.value)}
              disabled={Boolean(orderingProductId)}
              className="mb-4 w-full rounded-md border border-gray-400 px-3 py-2 text-base"
            />
            <p className="mb-5 text-gray-700" aria-live="polite">
              ${(selectedProduct.price * (Number(orderQuantity) || 0)).toFixed(2)}
            </p>

            {orderError && (
              <p role="alert" className="mb-4 rounded-md bg-red-100 p-3 text-red-700">
                {orderError}
              </p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                disabled={Boolean(orderingProductId)}
                className="flex-1 rounded-md bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700 disabled:cursor-wait disabled:opacity-60"
              >
                {orderingProductId ? "Placing Order..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={closeOrderDialog}
                disabled={Boolean(orderingProductId)}
                className="flex-1 rounded-md bg-red-600 px-4 py-3 font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};

export default CustomerProducts;
