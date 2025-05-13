import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <p></p>; //Prevents UI flashing TODO: replacing with loading spinner component
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;
