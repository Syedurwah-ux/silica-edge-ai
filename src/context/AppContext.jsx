
import { createContext, useContext, useState } from "react";

const AppContext = createContext(null);

export const initialWorkerState = {
  workerId: "",
  name: "",
  age: "",
  occupation: "",
  exposureYears: "",
  workLocation: "",
};

export const initialSensorState = {
  status: "STANDBY",
  deviceId: "ESP32-001",
  frequency: 10000,
  impedance: null,
  phase: null,
  samples: 0,
  source: "SIMULATED",
  history: [],
};

export const initialSignalState = {
  status: "WAITING",
  rawSignal: [],
  processedSignal: [],
  features: {},
};

export const initialPredictionState = {
  status: "WAITING",
  prediction: null,
  confidence: null,
  modelVersion: null,
  source: null,
};

export const initialRiskState = {
  score: null,
  level: null,
};

export function AppProvider({ children }) {
  const [worker, setWorker] = useState(initialWorkerState);
  const [sensor, setSensor] = useState(initialSensorState);
  const [signal, setSignal] = useState(initialSignalState);
  const [prediction, setPrediction] = useState(initialPredictionState);
  const [risk, setRisk] = useState(initialRiskState);

  function resetAssessment() {
    setSensor(initialSensorState);
    setSignal(initialSignalState);
    setPrediction(initialPredictionState);
    setRisk(initialRiskState);
  }

  function registerWorker(workerData) {
    setWorker({ ...workerData });
    resetAssessment();
  }

  const value = {
    worker,
    setWorker,
    sensor,
    setSensor,
    signal,
    setSignal,
    prediction,
    setPrediction,
    risk,
    setRisk,
    resetAssessment,
    registerWorker,
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
