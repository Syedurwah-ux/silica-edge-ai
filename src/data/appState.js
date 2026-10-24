export const defaultAppState = {
  worker: {
    workerId: "",
    name: "",
    age: "",
    occupation: "",
    exposureYears: "",
    workLocation: "",
  },

  sensor: {
    status: "STANDBY",
    deviceId: null,
    frequency: null,
    impedance: null,
    phase: null,
  },

  prediction: {
    status: "READY",
    prediction: null,
    confidence: null,
    modelVersion: null,
  },

  risk: {
    score: null,
    level: null,
  },
};