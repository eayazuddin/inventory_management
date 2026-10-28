import { FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

const Logout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex items-center gap-3 p-4 text-left transition duration-200 hover:bg-gray-700"
    >
      <span className="text-xl">
        <FaSignOutAlt />
      </span>
      <span className="hidden md:block">Logout</span>
    </button>
  );
};

export default Logout;
