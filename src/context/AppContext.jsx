
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { getCurrentStaff } from "../api";

const AppContext = createContext(null);
const AUTH_STORAGE_KEY = "aeroedge_staff_session";

export const initialAssessmentContext = {
  patientId: null,
  visitId: null,
  assessmentId: null,
  savedAt: null,
};

export const initialSensorSession = {
  patientId: "",
  visitId: "",
  samples: [],
  startedAt: null,
  stoppedAt: null,
  saved: false,
  assessmentId: null,
  patient: null,
};

function readStoredSession() {
  try {
    const value = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!value) return null;

    const parsed = JSON.parse(value);

    if (
      !parsed?.token ||
      !parsed?.expiresAt ||
      Date.now() >= parsed.expiresAt
    ) {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

function readStoredSensorSession() {
  try {
    const value = sessionStorage.getItem("aeroedge_sensor_session");
    if (!value) return { ...initialSensorSession };

    const parsed = JSON.parse(value);

    return {
      ...initialSensorSession,
      ...parsed,
      samples: Array.isArray(parsed.samples) ? parsed.samples : [],
    };
  } catch {
    return { ...initialSensorSession };
  }
}

const initialSensor = () => ({
  status: "STANDBY",
  deviceId: "ESP32-001",
  frequency: 10000,
  impedance: null,
  phase: null,
  samples: 0,
  history: [],
  source: "SIMULATED",
});

export function AppProvider({ children }) {
  const [worker, setWorker] = useState(null);
  const [patient, setPatient] = useState(null);

  const [sensor, setSensor] = useState(initialSensor);

  const [signal, setSignal] = useState({
    status: "EMPTY",
    processed: false,
    features: null,
    rawSignal: [],
    processedSignal: [],
  });

  const [prediction, setPrediction] = useState({
    status: "WAITING",
    loading: false,
    result: null,
    prediction: null,
    error: null,
    message: "",
    source: null,
  });

  const [risk, setRisk] = useState({
    score: null,
    level: null,
    factors: [],
    source: null,
  });

  const [assessmentContext, setAssessmentContext] = useState(
    initialAssessmentContext
  );

  const [sensorSession, setSensorSession] = useState(
    readStoredSensorSession
  );

  const [auth, setAuth] = useState(readStoredSession);

  const [authLoading, setAuthLoading] = useState(
    () => Boolean(readStoredSession()?.token)
  );

  useEffect(() => {
    let cancelled = false;

    async function validateSession() {
      if (!auth?.token) {
        setAuthLoading(false);
        return;
      }

      setAuthLoading(true);

      try {
        const staff = await getCurrentStaff(auth.token);
        if (cancelled) return;

        const updated = {
          ...auth,
          staffId: staff.id ?? auth.staffId,
          clinicId: staff.clinic_id ?? auth.clinicId,
          fullName: staff.full_name ?? auth.fullName,
          role: staff.role ?? auth.role,
        };

        setAuth(updated);
        sessionStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify(updated)
        );
      } catch {
        if (cancelled) return;
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
        setAuth(null);
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    }

    validateSession();

    return () => {
      cancelled = true;
    };
  }, []);

  function loginStaffSession(response) {
    const expiresIn = Number(response.expires_in ?? 1800);

    const session = {
      token: response.access_token,
      staffId: response.staff_id,
      clinicId: response.clinic_id,
      fullName: response.full_name,
      role: response.role,
      expiresAt: Date.now() + expiresIn * 1000,
    };

    sessionStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify(session)
    );

    setAuth(session);
    setAuthLoading(false);
  }

  function resetAssessment() {
    setSensor(initialSensor());

    setSignal({
      status: "EMPTY",
      processed: false,
      features: null,
      rawSignal: [],
      processedSignal: [],
    });

    setPrediction({
      status: "WAITING",
      loading: false,
      result: null,
      prediction: null,
      error: null,
      message: "",
      source: null,
    });

    setRisk({
      score: null,
      level: null,
      factors: [],
      source: null,
    });
  }

  function resetAssessmentContext() {
    setAssessmentContext(initialAssessmentContext);
  }

  function beginNewAcquisition(context) {
    resetAssessment();

    setAssessmentContext({
      patientId: context.patientId,
      visitId: context.visitId,
      assessmentId: null,
      savedAt: null,
    });
  }

  function registerWorker(workerData) {
    setWorker(workerData);
    setPatient(null);
    resetAssessment();
    resetAssessmentContext();
    setSensorSession({ ...initialSensorSession });
  }

  function logoutStaff() {
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.removeItem("aeroedge_sensor_session");

  setAuth(null);
  setAuthLoading(false);

  setPatient(null);
  setWorker(null);
  setSensorSession({ ...initialSensorSession });

  resetAssessmentContext();
  resetAssessment();
}

  const value = {
    worker,
    setWorker,
    patient,
    setPatient,

    sensor,
    setSensor,
    signal,
    setSignal,
    prediction,
    setPrediction,
    risk,
    setRisk,

    assessmentContext,
    setAssessmentContext,
    sensorSession,
    setSensorSession,

    beginNewAcquisition,
    resetAssessmentContext,
    resetAssessment,
    registerWorker,

    auth,
    authLoading,
    isAuthenticated: Boolean(auth?.token),
    loginStaffSession,
    logoutStaff,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useApp must be used inside AppProvider");
  }

  return context;
}

export default AppContext;
