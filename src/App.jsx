import { BrowserRouter, Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Worker from "./pages/Worker";
import SensorPage from "./pages/SensorPage.jsx";
import SignalAnalysis from "./pages/SignalAnalysis.jsx";
import AIPrediction from "./pages/AIPrediction.jsx";
import RiskAssessment from "./pages/RiskAssessment.jsx";
import Report from "./pages/Report.jsx";
import BackendTest from "./BackendTest";

import { AppProvider } from "./context/AppContext";

function App() {
  return (
    <AppProvider>
      <BrowserRouter>

        <Routes>

          {/* PUBLIC LANDING PAGE */}
          <Route path="/" element={<Landing />} />

          {/* APPLICATION */}
          <Route
            path="/dashboard"
            element={
              <div className="min-h-screen bg-slate-950">
                <Sidebar />

                <main className="ml-64 min-h-screen p-8">
                  <Dashboard />
                </main>
              </div>
            }
          />

          <Route
            path="/worker"
            element={
              <div className="min-h-screen bg-slate-950">
                <Sidebar />
                <main className="ml-64 min-h-screen p-8">
                  <Worker />
                </main>
              </div>
            }
          />

          <Route
            path="/sensor"
            element={
              <div className="min-h-screen bg-slate-950">
                <Sidebar />
                <main className="ml-64 min-h-screen p-8">
                  <SensorPage />
                </main>
              </div>
            }
          />

          <Route
            path="/analysis"
            element={
              <div className="min-h-screen bg-slate-950">
                <Sidebar />
                <main className="ml-64 min-h-screen p-8">
                  <SignalAnalysis />
                </main>
              </div>
            }
          />

          <Route
            path="/prediction"
            element={
              <div className="min-h-screen bg-slate-950">
                <Sidebar />
                <main className="ml-64 min-h-screen p-8">
                  <AIPrediction />
                </main>
              </div>
            }
          />

          <Route
            path="/risk"
            element={
              <div className="min-h-screen bg-slate-950">
                <Sidebar />
                <main className="ml-64 min-h-screen p-8">
                  <RiskAssessment />
                </main>
              </div>
            }
          />

          <Route
            path="/report"
            element={
              <div className="min-h-screen bg-slate-950">
                <Sidebar />
                <main className="ml-64 min-h-screen p-8">
                  <Report />
                </main>
              </div>
            }
          />
          <Route path="/backend-test" element={<BackendTest />} />

        </Routes>

      </BrowserRouter>
    </AppProvider>
  );
}

export default App;