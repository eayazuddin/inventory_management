import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_URL = "http://localhost:3000/api";
const LOW_STOCK_THRESHOLD = 5;

const getErrorMessage = (error) =>
  axios.isAxiosError(error)
    ? error.response?.data?.message || error.message
    : error instanceof Error
      ? error.message
      : "Unable to load dashboard data";

const isToday = (dateValue) => {
  const date = new Date(dateValue);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);

const getOrderChartData = (orders) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const count = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return (
        orderDate.getFullYear() === date.getFullYear() &&
        orderDate.getMonth() === date.getMonth() &&
        orderDate.getDate() === date.getDate()
      );
    }).length;

    return {
      dateKey,
      label: date.toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
      }),
      count,
    };
  });
};

const MetricCard = ({ label, value, color }) => (
  <article className={`rounded-xl ${color} p-5 text-white shadow-sm`}>
    <p className="text-sm font-medium text-white/85">{label}</p>
    <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
  </article>
);

const DetailCard = ({ title, children }) => (
  <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
    <h2 className="mb-4 text-lg font-semibold text-gray-900">{title}</h2>
    {children}
  </section>
);

const EmptyMessage = ({ children }) => (
  <p className="text-sm text-gray-500">{children}</p>
);

const AdminOverview = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        const headers = {
          Authorization: `Bearer ${localStorage.getItem("pos-token") || ""}`,
        };
        const [productResponse, orderResponse] = await Promise.all([
          axios.get(`${API_URL}/product`, { headers }),
          axios.get(`${API_URL}/order`, { headers }),
        ]);

        if (!productResponse.data.success || !orderResponse.data.success) {
          throw new Error("Unable to load dashboard data");
        }

        if (active) {
          setProducts(productResponse.data.products);
          setOrders(orderResponse.data.orders);
          setErrorMessage("");
        }
      } catch (error) {
        if (active) {
          setErrorMessage(getErrorMessage(error));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadDashboard();
    return () => {
      active = false;
    };
  }, [user]);

  const totalStock = products.reduce(
    (total, product) => total + (Number(product.stock) || 0),
    0,
  );
  const ordersToday = orders.filter((order) => isToday(order.createdAt)).length;
  const revenue = orders.reduce(
    (total, order) =>
      order.status === "completed"
        ? total + Number(order.unitPrice) * Number(order.quantity)
        : total,
    0,
  );
  const soldByProduct = orders.reduce((sales, order) => {
    if (order.status !== "cancelled") {
      const productId = order.productId?._id || order.productId;
      if (productId) {
        sales.set(
          productId,
          (sales.get(productId) || 0) + (Number(order.quantity) || 0),
        );
      }
    }
    return sales;
  }, new Map());
  const highestSale = products.reduce(
    (highest, product) => {
      const unitsSold = soldByProduct.get(product._id) || 0;
      return unitsSold > highest.unitsSold
        ? { product, unitsSold }
        : highest;
    },
    { product: null, unitsSold: 0 },
  );
  const outOfStockProducts = products.filter(
    (product) => Number(product.stock) === 0,
  );
  const lowStockProducts = products.filter(
    (product) =>
      Number(product.stock) > 0 &&
      Number(product.stock) <= LOW_STOCK_THRESHOLD,
  );
  const orderChartData = getOrderChartData(orders);
  const chartMax = Math.max(1, ...orderChartData.map(({ count }) => count));
  const chartStep = Math.max(1, Math.ceil(chartMax / 4));
  const chartTop = chartStep * 4;
  const chartWidth = 720;
  const chartLeft = 44;
  const chartRight = 12;
  const chartTopPadding = 28;
  const chartBottom = 174;
  const chartPlotWidth = chartWidth - chartLeft - chartRight;
  const chartPlotHeight = chartBottom - chartTopPadding;
  const barWidth = 34;
  const barGap = (chartPlotWidth - orderChartData.length * barWidth) /
    (orderChartData.length * 2);

  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            A quick overview of your inventory and sales.
          </p>
        </header>

        {errorMessage && (
          <p
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {errorMessage}
          </p>
        )}

        <section
          aria-label="Inventory summary"
          className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <MetricCard
            label="Total Products"
            value={loading ? "—" : products.length}
            color="bg-blue-600"
          />
          <MetricCard
            label="Total Stock"
            value={loading ? "—" : totalStock}
            color="bg-green-600"
          />
          <MetricCard
            label="Orders Today"
            value={loading ? "—" : ordersToday}
            color="bg-amber-500"
          />
          <MetricCard
            label="Revenue"
            value={loading ? "—" : formatCurrency(revenue)}
            color="bg-purple-600"
          />
        </section>

        <section
          aria-label="Orders over the last 7 days"
          className="mb-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Orders - Last 7 Days
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Number of orders placed each day.
            </p>
          </div>
          {loading ? (
            <EmptyMessage>Loading order chart...</EmptyMessage>
          ) : (
            <div className="w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${chartWidth} 220`}
                role="img"
                aria-label={`Order counts for the last seven days: ${orderChartData
                  .map(({ label, count }) => `${label}: ${count}`)
                  .join(", ")}`}
                className="h-auto min-w-[560px] w-full"
              >
                {Array.from({ length: 5 }, (_, index) => {
                  const value = chartTop - index * chartStep;
                  const y = chartTopPadding + (chartPlotHeight * index) / 4;
                  return (
                    <g key={value}>
                      <text
                        x={chartLeft - 10}
                        y={y + 4}
                        textAnchor="end"
                        className="fill-gray-400 text-[11px]"
                      >
                        {value}
                      </text>
                      <line
                        x1={chartLeft}
                        x2={chartWidth - chartRight}
                        y1={y}
                        y2={y}
                        className="stroke-gray-100"
                      />
                    </g>
                  );
                })}
                {orderChartData.map(({ dateKey, label, count }, index) => {
                  const x =
                    chartLeft +
                    barGap +
                    index * (barWidth + 2 * barGap);
                  const barHeight = (count / chartTop) * chartPlotHeight;
                  const y = chartBottom - barHeight;
                  return (
                    <g key={dateKey}>
                      <rect
                        x={x}
                        y={count ? y : chartBottom - 2}
                        width={barWidth}
                        height={count ? barHeight : 2}
                        rx="5"
                        className="fill-blue-500"
                      >
                        <title>{`${label}: ${count} orders`}</title>
                      </rect>
                      <text
                        x={x + barWidth / 2}
                        y={count ? y - 7 : chartBottom - 9}
                        textAnchor="middle"
                        className="fill-gray-600 text-[11px] font-medium"
                      >
                        {count}
                      </text>
                      <text
                        x={x + barWidth / 2}
                        y={chartBottom + 22}
                        textAnchor="middle"
                        className="fill-gray-500 text-[11px]"
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
        </section>

        <section
          aria-label="Product and sales details"
          className="grid grid-cols-1 gap-4 lg:grid-cols-3"
        >
          <DetailCard title="Out of Stock Products">
            {loading ? (
              <EmptyMessage>Loading products...</EmptyMessage>
            ) : outOfStockProducts.length ? (
              <ul className="space-y-3">
                {outOfStockProducts.map((product) => (
                  <li
                    key={product._id}
                    className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm"
                  >
                    <span className="font-medium text-gray-800">
                      {product.name}
                    </span>
                    <span className="text-gray-500">
                      {product.categoryId?.categoryName || "Uncategorized"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyMessage>All products are in stock.</EmptyMessage>
            )}
          </DetailCard>

          <DetailCard title="Highest Sale Product">
            {loading ? (
              <EmptyMessage>Loading sales...</EmptyMessage>
            ) : highestSale.product ? (
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="inline font-semibold text-gray-800">Name: </dt>
                  <dd className="inline text-gray-600">
                    {highestSale.product.name}
                  </dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-gray-800">
                    Category:{" "}
                  </dt>
                  <dd className="inline text-gray-600">
                    {highestSale.product.categoryId?.categoryName ||
                      "Uncategorized"}
                  </dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-gray-800">
                    Total Units Sold:{" "}
                  </dt>
                  <dd className="inline text-gray-600">
                    {highestSale.unitsSold}
                  </dd>
                </div>
              </dl>
            ) : (
              <EmptyMessage>No sales recorded yet.</EmptyMessage>
            )}
          </DetailCard>

          <DetailCard title={`Low Stock Products (1–${LOW_STOCK_THRESHOLD} left)`}>
            {loading ? (
              <EmptyMessage>Loading products...</EmptyMessage>
            ) : lowStockProducts.length ? (
              <ul className="space-y-3">
                {lowStockProducts.map((product) => (
                  <li
                    key={product._id}
                    className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm"
                  >
                    <span className="font-medium text-gray-800">
                      {product.name}{" "}
                      <span className="font-normal text-gray-600">
                        - {product.stock} left
                      </span>
                    </span>
                    <span className="text-gray-500">
                      {product.categoryId?.categoryName || "Uncategorized"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyMessage>No low-stock products.</EmptyMessage>
            )}
          </DetailCard>
        </section>
      </div>
    </main>
  );
};

export default AdminOverview;
