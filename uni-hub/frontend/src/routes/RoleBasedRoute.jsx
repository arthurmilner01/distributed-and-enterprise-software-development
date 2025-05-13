import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RoleBasedRoute = ({ allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <p></p>; //Prevents UI flashing TODO: replacing with loading spinner component
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" />; //Redirect user if not logged in
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />; //Redirect if role is not allowed
  }

  return <Outlet />;
};

export default RoleBasedRoute;
