import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

const PasswordResetConfirmPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  {/* Generated from password reset link */}
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if(password !== confirmPassword)
    {
        setMessage("Passwords do not match.");
    }

    setLoading(true);
    setMessage("Attempting password reset...");
    // Sending request with uid and token along with inputted new password for appropriate validation
    try
    {
      // Uses uid and token from password reset link to validate reset request
      const response = await axios.post("http://127.0.0.1:8000/auth/users/reset_password_confirm/", {
          uid,
          token,
          new_password: password,
      });
        // Redirect user to login page
        setMessage("Password reset successful! Redirecting to login...");
        setTimeout(() => navigate("/login"), 3000);
    }
    catch(error)
    {
        if(error.response)
        {
            const errorDetails = error.response.data;
            setMessage(errorDetails.new_password[0])
            setLoading(false);
        }
    }
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h2 className="text-center mb-4">Change Password</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    New Password
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <button
                type="submit"
                className="btn btn-info text-white w-100"
                disabled={loading}
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
              {message && <p className="text-center text-red-500">{message}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
};

export default PasswordResetConfirmPage;
