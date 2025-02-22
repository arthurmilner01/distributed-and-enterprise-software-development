import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./routes/PrivateRoute";
import PublicRoute from "./routes/PublicRoute";
import LoginPage from "./components/pages/LoginPage";
import Dashboard from "./components/pages/Dashboard";
import MainLayout from "./components/layout/MainLayout";
import RoleBasedRoute from "./routes/RoleBasedRoute";
import RegisterPage from "./components/pages/RegisterPage";
import AccountActivation from "./components/pages/AccountActivation";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/*Public Routes (No Layout)*/}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/activate" element={<AccountActivation />} />
          </Route>

          {/*Private Routes (With MainLayout) */}
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<MainLayout />}>
              <Route path="dashboard" element={<Dashboard />} />

              {/*Role-Based Routes (Only allow specific roles)*/}
              <Route element={<RoleBasedRoute allowedRoles={["C"]} />}>
                <Route
                  path="community-leader-dashboard"
                  element={<h1>Community Leader can only see this</h1>}
                />
              </Route>

              <Route element={<RoleBasedRoute allowedRoles={["E", "C"]} />}>
                <Route
                  path="event-manager-dashboard"
                  element={<h1>Only event managers and above can see this</h1>}
                />
              </Route>
            </Route>
          </Route>

          {/*Unauthorized Page*/}
          <Route path="/unauthorized" element={<h1>Unauthorized</h1>} />

          {/*404 Page*/}
          <Route path="*" element={<h1>404 - Not Found</h1>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
