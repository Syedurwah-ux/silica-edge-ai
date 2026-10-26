
const API_BASE_URL = "http://127.0.0.1:8000";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.detail || `Request failed: ${response.status}`
    );
  }

  return data;
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function checkBackendHealth() {
  return request("/health");
}

export async function sendMeasurement(measurement) {
  return request("/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(measurement),
  });
}

export async function loginStaff(credentials) {
  return request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clinic_code: credentials.clinic_code.trim(),
      username: credentials.username.trim(),
      password: credentials.password,
    }),
  });
}

export async function getCurrentStaff(token) {
  return request("/auth/me", {
    headers: authHeaders(token),
  });
}

export async function getPatients(token) {
  return request("/patients", {
    headers: authHeaders(token),
  });
}

export async function createPatient(token, patient) {
  return request("/patients", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(patient),
  });
}

export async function getPatient(token, patientId) {
  return request(`/patients/${encodeURIComponent(patientId)}`, {
    headers: authHeaders(token),
  });
}

export async function getPatientVisits(token, patientId) {
  const params = new URLSearchParams({
    patient_id: String(patientId),
    limit: "100",
  });

  return request(`/visits?${params}`, {
    headers: authHeaders(token),
  });
}

export async function createPatientVisit(token, visit) {
  return request("/visits", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(visit),
  });
}

export async function saveSensorAssessment(token, assessment) {
  return request("/sensor-assessments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(assessment),
  });
}

export async function getSensorAssessments(token, filters = {}) {
  const params = new URLSearchParams();

  if (filters.visit_id != null) {
    params.set("visit_id", filters.visit_id);
  }

  if (filters.patient_id != null) {
    params.set("patient_id", filters.patient_id);
  }

  if (filters.limit != null) {
    params.set("limit", filters.limit);
  }

  const query = params.toString();

  return request(
    `/sensor-assessments${query ? `?${query}` : ""}`,
    { headers: authHeaders(token) }
  );
}
