import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";

const Root = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
    } else if (user.role === "admin") {
      navigate("/admin-dashboard", { replace: true });
    } else if (user.role === "customer") {
      navigate("/customer/dashboard", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  return null;
};

export default Root;
