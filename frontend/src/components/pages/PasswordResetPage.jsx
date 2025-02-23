import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const PasswordResetPage = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post("http://0.0.0.0:8000/auth/users/reset_password/", {
        email: email,
      });
      setMessage("Password reset link has been sent to your email. Redirecting to login...");
      setTimeout(() => navigate("/login"), 3000);
    } 
    catch (err)
    {
      setError("Error sending password reset email. Please try again.");
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
                        <label htmlFor="email" className="form-label">
                        Email
                        </label>
                        <input
                        type="email"
                        className="form-control"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-100">
                        Request Password Reset
                    </button>
                </form>
                {message && <p className="text-center text-red-500">{message}</p>}
                <div className="mt-3 text-center">
                    <p>
                        Changed your mind?
                        <Link to="/login" className="text-primary" style={{ marginLeft: "5px" }}>Return to login.</Link>
                    </p>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetPage;