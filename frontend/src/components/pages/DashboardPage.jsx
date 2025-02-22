import { useAuth } from "../../context/AuthContext";

const DashboardPage = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <p>Loading user data...</p>;
  }

  return (
    <div className="container mt-5">
      <h2>Welcome, {user.username || "User"}!</h2>
      <p>
        <strong>Email:</strong> {user.email}
      </p>
      <p>
        <strong>Role:</strong> {user.role || "N/A"}
      </p>
      <p>
        <strong>Token Expiry:</strong>{" "}
        {new Date(user.exp * 1000).toLocaleString()}
      </p>
    </div>
  );
};

export default DashboardPage;
