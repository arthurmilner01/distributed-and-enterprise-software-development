import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

const PasswordResetPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submittedPassword = async (e) => {
    e.preventDefault();

    if(password !== confirmPassword)
    {
        setMessage("Passwords do not match.");
    }

    setLoading(true);
    setMessage("Attempting password reset...");

    try
    {
        const response = await axios.post("http://127.0.0.1:8000/auth/users/reset_password_confirm/", {
            uid,
            token,
            new_password: password,
        });

        setMessage("Password reset successful! Redirecting to login...");
        setTimeout(() => navigate("/login"), 3000);
    }
    catch(error)
    {
        if(error.response)
        {
            const errorDetails = error.response.data;
            setMessage(errorDetails.new_password[0])
        }
    }
    finally
    {
        setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-semibold text-center mb-4">Enter New Password:</h2>
        {message && <p className="text-center text-red-500">{message}</p>}
  
        <form onSubmit={submittedPassword} className="flex flex-col">
          <label className="mb-1 font-medium">New Password</label>
          <input
            type="password"
            className="p-2 border rounded mb-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
  
          <label className="mb-1 font-medium">Confirm New Password</label>
          <input
            type="password"
            className="p-2 border rounded mb-3"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
  
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded mt-3"
            disabled={loading}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
  
};

export default PasswordResetPage;
