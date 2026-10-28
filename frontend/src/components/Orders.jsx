import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

const API_URL = "http://localhost:3000/api/order";

const getErrorMessage = (error) =>
  axios.isAxiosError(error)
    ? error.response?.data?.message || error.message
    : error instanceof Error
      ? error.message
      : "Unable to load orders";

const statusStyles = {
  pending: "bg-amber-100 text-amber-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const getAuthHeaders = () => {
  const token = localStorage.getItem("pos-token");
  if (!token) {
    throw new Error("Your session has expired. Please sign in again.");
  }
  return { Authorization: "Bearer " + token };
};

const Orders = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const response = await axios.get(API_URL, {
          headers: getAuthHeaders(),
        });
        if (!response.data.success) {
          throw new Error(response.data.message || "Unable to load orders");
        }
        setOrders(response.data.orders);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          logout();
          navigate("/login", { replace: true });
          return;
        }
        setErrorMessage(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    if (!localStorage.getItem("pos-token")) {
      logout();
      navigate("/login", { replace: true });
      return;
    }

    loadOrders();
  }, [logout, navigate]);

  const handleStatusChange = async (orderId, status) => {
    setUpdatingOrderId(orderId);
    setErrorMessage("");
    try {
      const response = await axios.patch(
        `${API_URL}/${orderId}/status`,
        { status },
        {
          headers: getAuthHeaders(),
        },
      );
      if (!response.data.success) {
        throw new Error(response.data.message || "Unable to update order status");
      }
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order._id === orderId ? { ...order, status: response.data.order.status } : order,
        ),
      );
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        logout();
        navigate("/login", { replace: true });
        return;
      }
      setErrorMessage(getErrorMessage(error));
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <section className="p-3 lg:p-6">
      <h1 className="mb-5 text-2xl font-bold">Orders</h1>
      {errorMessage && (
        <p role="alert" className="mb-4 rounded-md bg-red-100 p-3 text-red-700">
          {errorMessage}
        </p>
      )}
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3">S/N</th>
              <th className="p-3">Product</th>
              <th className="p-3">Category</th>
              {user?.role === "admin" && <th className="p-3">Customer</th>}
              <th className="p-3">Quantity</th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={user?.role === "admin" ? 8 : 7} className="p-6 text-center text-gray-500">
                  Loading orders...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={user?.role === "admin" ? 8 : 7} className="p-6 text-center text-gray-500">
                  No orders yet.
                </td>
              </tr>
            ) : (
              orders.map((order, index) => (
                <tr key={order._id} className="border-t border-gray-200">
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3">{order.productName}</td>
                  <td className="p-3">
                    {order.productId?.categoryId?.categoryName || "Unavailable"}
                  </td>
                  {user?.role === "admin" && (
                    <td className="p-3">{order.customerId?.name || "Unavailable"}</td>
                  )}
                  <td className="p-3">{order.quantity}</td>
                  <td className="p-3 whitespace-nowrap">
                    ${(order.unitPrice * order.quantity).toFixed(2)}
                  </td>
                  <td className="p-3">
                    {user?.role === "admin" ? (
                      <select
                        aria-label={`Status for ${order.productName} order`}
                        value={order.status}
                        disabled={updatingOrderId === order._id}
                        onChange={(event) =>
                          handleStatusChange(order._id, event.target.value)
                        }
                        className={`rounded-full border-0 px-3 py-1.5 text-sm font-medium capitalize outline-none ring-1 ring-inset ring-black/5 disabled:cursor-wait disabled:opacity-60 ${
                          statusStyles[order.status] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-flex rounded-full px-3 py-1.5 text-sm font-medium capitalize ${
                          statusStyles[order.status] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {order.status}
                      </span>
                    )}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default Orders;
