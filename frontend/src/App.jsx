import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router";
import Root from "./utils/Root.jsx";
import Login from "../src/pages/Login.jsx";
import ProtectedRoute from "./utils/ProtectedRoute.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Categories from "./components/Categories.jsx";
import Suppliers from "./components/Suppliers.jsx";
import Products from "./components/Products.jsx";
import CustomerProducts from "./components/CustomerProducts.jsx";
import Users from "./components/Users.jsx";
import Orders from "./components/Orders.jsx";
import Profile from "./components/Profile.jsx";
import AdminOverview from "./pages/AdminOverview.jsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Root />} />
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute requireRole={"admin"}>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminOverview />} />

          <Route path="categories" element={<Categories />} />

          <Route path="products" element={<Products />} />

          <Route path="suppliers" element={<Suppliers />} />

          <Route path="orders" element={<Orders />} />
          <Route path="users" element={<Users />} />

          <Route path="profile" element={<Profile />} />
        </Route>
        <Route
          path="/customer/dashboard"
          element={
            <ProtectedRoute requireRole={"customer"}>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<CustomerProducts />} />
          <Route path="products" element={<CustomerProducts />} />
          <Route path="orders" element={<Orders />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route
          path="/unauthorized"
          element={
            <p className="font-bold text-3xl mt-20 ml-20">Unauthorized</p>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
