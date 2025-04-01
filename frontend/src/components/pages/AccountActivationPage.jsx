import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

// Component for account activation
const AccountActivationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const uid = searchParams.get("uid");
  const token = searchParams.get("token");
  const [message, setMessage] = useState("Activating your account...");

  useEffect(() => {
    const activateAccount = async () => {
      if (uid && token) {
        try {
          // Send activation request
          const response = await axios.post(
            "http://127.0.0.1:8000/auth/users/activation/",
            {
              uid,
              token,
            }
          );
          setMessage("Account successfully activated! Redirecting to login...");
          // Redirect to login after 3 seconds
          setTimeout(() => navigate("/login"), 3000); 
        } catch (error) {
          setMessage("Activation failed. Invalid or expired link.");
        }
      } else {
        setMessage("Invalid activation URL.");
      }
    };
    activateAccount();
  }, [uid, token, navigate]);

  return (
    <div className="text-center">
      <h2>{message}</h2>
    </div>
  );
};

export default AccountActivationPage;
