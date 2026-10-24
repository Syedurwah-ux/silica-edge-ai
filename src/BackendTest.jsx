
import { useState } from "react";
import { sendMeasurement } from "./api";

function BackendTest() {
  const [status, setStatus] = useState("Ready to test");
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  async function testPredictionEndpoint() {
    setLoading(true);
    setStatus("Sending test measurements...");
    setDetails(null);

    try {
      // Explicit test values only—not actual sensor readings.
      const result = await sendMeasurement({
        frequency_hz: 10000,
        impedance_ohms: 1250,
        phase_degrees: 32,
        temperature_c: 25,
      });

      setDetails(result);
      setStatus(
        result.status === "model_not_ready"
          ? "Backend connected; model not ready"
          : `Response received: ${result.status}`
      );
    } catch (error) {
      setStatus("Request failed");
      setDetails({ error: error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 p-10 text-white">
      <h1 className="text-2xl font-bold">
        Silica Edge-AI — API Test
      </h1>

      <p className="mt-4 text-cyan-400">{status}</p>

      <p className="mt-3 max-w-xl text-sm text-slate-400">
        Uses fixed test values only. These are not hardware
        measurements or a silica-exposure prediction.
      </p>

      <button
        type="button"
        onClick={testPredictionEndpoint}
        disabled={loading}
        className="mt-6 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50"
      >
        {loading ? "Testing..." : "Test Prediction API"}
      </button>

      {details && (
        <pre className="mt-6 overflow-auto rounded-xl bg-slate-900 p-4 text-sm">
          {JSON.stringify(details, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default BackendTest;
