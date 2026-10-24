
const API_BASE_URL = "http://127.0.0.1:8000";

export async function checkBackendHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);

  if (!response.ok) {
    throw new Error(`Backend health check failed: ${response.status}`);
  }

  return response.json();
}

export async function sendMeasurement(measurement) {
  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(measurement),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || `Request failed: ${response.status}`);
  }

  return data;
}
