import {
  FaBox,
  FaCog,
  FaHome,
  FaShoppingCart,
  FaTable,
  FaTruck,
  FaUsers,
} from "react-icons/fa";
import { NavLink } from "react-router";
import Logout from "./Logout";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const basePath = isAdmin ? "/admin-dashboard" : "/customer/dashboard";
  const menuItems = isAdmin
    ? [
        { name: "Dashboard", path: basePath, icon: <FaHome />, isParent: true },
        { name: "Categories", path: `${basePath}/categories`, icon: <FaTable /> },
        { name: "Products", path: `${basePath}/products`, icon: <FaBox /> },
        { name: "Suppliers", path: `${basePath}/suppliers`, icon: <FaTruck /> },
        { name: "Orders", path: `${basePath}/orders`, icon: <FaShoppingCart /> },
        { name: "Users", path: `${basePath}/users`, icon: <FaUsers /> },
        { name: "Profile", path: `${basePath}/profile`, icon: <FaCog /> },
      ]
    : [
        // { name: "Dashboard", path: basePath, icon: <FaHome />, isParent: true },
        { name: "Products", path: `${basePath}/products`, icon: <FaBox /> },
        { name: "Orders", path: `${basePath}/orders`, icon: <FaShoppingCart /> },
        { name: "Profile", path: `${basePath}/profile`, icon: <FaCog /> },
      ];

  return (
    <div className="fixed flex h-screen w-16 flex-col bg-black text-white md:w-64">
      <div className="flex h-16 items-center justify-center">
        <span className="hidden text-xl font-bold md:block">Inventory MS</span>
        <span className="text-xl font-bold md:hidden">IMS</span>
      </div>

      <nav aria-label={`${isAdmin ? "Admin" : "Customer"} navigation`} className="flex-1">
        <ul className="space-y-2 p-2">
          {menuItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                end={item.isParent}
                aria-label={item.name}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md p-2 transition duration-200 hover:bg-gray-700 ${
                    isActive ? "bg-gray-700" : ""
                  }`
                }
              >
                <span className="text-xl">{item.icon}</span>
                <span className="ml-4 hidden md:block">{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <Logout />
    </div>
  );
};

export default Sidebar;
