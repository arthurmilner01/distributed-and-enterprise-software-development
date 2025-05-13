import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  //Decode the JWT token to get user details
  const decodeToken = (token) => {
    try {
      return jwtDecode(token);
    } catch (error) {
      console.error(error);
      return null;
    }
  };


   //SignOut
   const signOut = async () => {
    try {
        await axios.post(
            "http://localhost:8000/auth/logout",
            {},
            {
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
                withCredentials: true, 
            }
        );
    } catch (error) {
        console.error("Error logging out:", error);
    }
    setAccessToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };


  //Refresh the access token if the refresh token is present
  const refreshAccessToken = async () => {
    try {
      console.log("yay");
      const response = await axios.post(
        "http://localhost:8000/auth/jwt/refresh",
        {},
        { withCredentials: true }
      );
      console.log("yay2");
      const newAccessToken = response.data.access;
      setAccessToken(newAccessToken);
      setIsAuthenticated(true);
      console.log(newAccessToken);
      setUser(decodeToken(newAccessToken));
    } catch (error) {
      setIsAuthenticated(false);
      setAccessToken(null);
      setUser(null);
    } finally {
      setLoading(false); //Set loading to false even if refresh fails
    }
  };

  //On initial every new load (for persistance) try to refresh the token
  useEffect(() => {
    refreshAccessToken();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        isAuthenticated,
        user,
        refreshAccessToken,
        loading,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
