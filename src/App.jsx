
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Worker from "./pages/Worker";
import SensorPage from "./pages/SensorPage.jsx";
import SignalAnalysis from "./pages/SignalAnalysis.jsx";
import AIPrediction from "./pages/AIPrediction.jsx";
import RiskAssessment from "./pages/RiskAssessment.jsx";
import Report from "./pages/Report.jsx";
import BackendTest from "./BackendTest";
import PatientProfile from "./pages/PatientProfile";

import { AppProvider, useApp } from "./context/AppContext";

function AuthLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
      <div className="text-center">
        <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-cyan-400/20 border-t-cyan-400" />
        <p className="text-sm">Restoring secure session...</p>
      </div>
    </div>
  );
}

function ProtectedRoute() {
  const { auth, authLoading, logoutStaff } = useApp();
  const location = useLocation();

  if (authLoading) {
    return <AuthLoadingScreen />;
  }

  const sessionIsValid =
    Boolean(auth?.token) && auth.expiresAt > Date.now();

  if (!sessionIsValid) {
    if (auth?.token) {
      logoutStaff();
    }

    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <Outlet />;
}

function ApplicationLayout() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <main className="ml-64 min-h-screen p-8">
        <Outlet />
      </main>
    </div>
  );
}

function LoginRoute() {
  const { auth, authLoading } = useApp();

  if (authLoading) {
    return <AuthLoadingScreen />;
  }

  const sessionIsValid =
    Boolean(auth?.token) && auth.expiresAt > Date.now();

  return sessionIsValid
    ? <Navigate to="/dashboard" replace />
    : <Login />;
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<LoginRoute />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<ApplicationLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/worker" element={<Worker />} />
              <Route
                path="/patients/:patientId"
                element={<PatientProfile />}
              />
              <Route path="/sensor" element={<SensorPage />} />
              <Route path="/analysis" element={<SignalAnalysis />} />
              <Route path="/prediction" element={<AIPrediction />} />
              <Route path="/risk" element={<RiskAssessment />} />
              <Route path="/report" element={<Report />} />
            </Route>

            <Route path="/backend-test" element={<BackendTest />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
