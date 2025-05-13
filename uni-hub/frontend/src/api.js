import axios from "axios";
import { useAuth } from "./context/AuthContext";

const useApi = () => {
  const { accessToken, refreshAccessToken } = useAuth();

  const axiosInstance = axios.create({
    baseURL: "http://localhost:8000/",
    withCredentials: true, //Include sending cookies
  });

  //Add auth token to every axios request
  axiosInstance.interceptors.request.use(
    (config) => {
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  //IF recieving an 401, retry the request with a fresh access token to ensure token expiration is not issue
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response.status === 401) {
        try {
          await refreshAccessToken();
          error.config.headers.Authorization = `Bearer ${accessToken}`;
          return axiosInstance(error.config);
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
        }
      }
      return Promise.reject(error);
    }
  );

  return axiosInstance;
};

export default useApi;
