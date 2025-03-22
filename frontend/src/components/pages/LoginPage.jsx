import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

const LoginPage = () => {
  // Stores inputted email and password
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { refreshAccessToken, loading } = useAuth();

  // On user log-in
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Calls the endpoints to create the access and refresh token, including cookie storage
      await axios.post(
        "http://localhost:8000/auth/jwt/create/",
        { email, password },
        { withCredentials: true }
      );
      
      await refreshAccessToken();
      // Attempt to navigate to home page, which should now be accessible
      navigate("/dashboard");
    } catch (err) {
      setError("Invalid login credentials. Please try again.");
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h2 className="text-center mb-4">Login</h2>
              {error && <div className="alert alert-danger">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-info text-white w-100">Login</button>
              </form>
              <div className="mt-3 text-center">
                <p>
                  Forgotten your password?
                  <Link to="/auth/password-reset" className="text-primary" style={{ marginLeft: "5px" }}>Reset password.</Link>
                </p>
                <p>
                  Don't have an account yet?
                  <Link to="/register" className="text-primary" style={{ marginLeft: "5px" }}>Sign up here.</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
