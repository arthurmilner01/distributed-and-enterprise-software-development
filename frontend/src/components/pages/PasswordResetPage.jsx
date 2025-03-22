import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const PasswordResetPage = () => {
  // Stores user's edited email
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();



  // On submit send request to handle sending password reset email to given email input
  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("Sending password reset email...");

    try {
      // Calling the endpoint which generates the password reset link and sends email
      await axios.post("http://0.0.0.0:8000/auth/users/reset_password/", {
        email: email,
      });
      setMessage("Password reset link has been sent to your email.");
      setTimeout(() => navigate("/login"), 3000);
    } 
    catch (err)
    {
      setError("Error sending password reset email. Please try again.");
      setLoading(false);
    }
  };


  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h2 className="text-center mb-4">Request Password Reset</h2>
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
                    <button
                    type="submit"
                    className="btn btn-info text-white w-100"
                    disabled={loading}
                    >
                      {loading ? "Sending email..." : "Request Password Reset"}
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