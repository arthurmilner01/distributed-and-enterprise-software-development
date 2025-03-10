import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./routes/PrivateRoute";
import PublicRoute from "./routes/PublicRoute";
import LoginPage from "./components/pages/LoginPage";
import DashboardPage from "./components/pages/DashboardPage";
import MainLayout from "./components/layout/MainLayout";
import RoleBasedRoute from "./routes/RoleBasedRoute";
import RegisterPage from "./components/pages/RegisterPage";
import AccountActivationPage from "./components/pages/AccountActivationPage";
import PasswordResetPage from "./components/pages/PasswordResetPage";
import PasswordResetConfirmPage from "./components/pages/PasswordResetConfirmPage";
import UnauthLayout from "./components/layout/UnauthLayout";
import ProfilePage from "./components/pages/ProfilePage";
import CreateCommunityPage from "./components/pages/CreateCommunityPage"; 
import CommunitiesDashboard from "./components/pages/CommunitiesDashboard"; 
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/*Public Routes (No Layout)*/}
          <Route element={<PublicRoute />}>
            <Route path="/" element={<UnauthLayout />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/auth/activate" element={<AccountActivationPage />} />
                  <Route path="/auth/password-reset" element={<PasswordResetPage />} />
                  <Route path="/auth/password-reset-confirm" element={<PasswordResetConfirmPage />} />
                  
            </Route>
          </Route>

          {/*Private Routes (With MainLayout) */}
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<MainLayout />}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="profile/:userId" element={<ProfilePage />} />
              <Route path="create-community" element={<CreateCommunityPage />} />

              {/*Role-Based Routes (Only allow specific roles)*/}
              <Route element={<RoleBasedRoute allowedRoles={["C"]} />}>
                <Route
                  path="community-leader-dashboard"
                  element={<h1>Community Leader can only see this</h1>}
                />
              </Route>
              <Route path="communities" element={<CommunitiesDashboard />} />

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
