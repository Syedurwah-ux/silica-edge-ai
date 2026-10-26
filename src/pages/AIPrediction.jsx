
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { sendMeasurement } from "../api";

function AIPrediction() {
  const navigate = useNavigate();

  const {
    worker,
    sensor,
    signal,
    prediction,
    setPrediction,
    sensorSession,
    assessmentContext,
  } = useApp();

  const [running, setRunning] = useState(false);
  const [localError, setLocalError] = useState("");

  const patientId =
    sensorSession?.patientId ?? assessmentContext?.patientId ?? null;

  const visitId =
    sensorSession?.visitId ?? assessmentContext?.visitId ?? null;

  const assessmentId =
    sensorSession?.assessmentId ??
    assessmentContext?.assessmentId ??
    null;

  const hasPatientContext = Boolean(patientId && visitId);

  // Match the prediction to the currently processed signal.
  const currentSignature = useMemo(() => {
    if (!signal?.processed || !signal?.features) return null;

    return [
      patientId ?? "no-patient",
      visitId ?? "no-visit",
      signal.features.sampleCount ?? 0,
      signal.sourceSignature ?? "no-signature",
    ].join("|");
  }, [patientId, visitId, signal]);

  const signalIsCurrent =
    Boolean(currentSignature) &&
    signal?.processed === true &&
    signal?.status === "PROCESSED" &&
    signal?.patientId === patientId &&
    signal?.visitId === visitId &&
    Array.isArray(signal?.processedSignal) &&
    signal.processedSignal.length >= 2 &&
    Boolean(signal?.features);

  const features = signalIsCurrent ? signal.features : null;

  const canRunInference =
    hasPatientContext &&
    signalIsCurrent &&
    Number.isFinite(Number(features?.meanImpedance)) &&
    Number(features.meanImpedance) >= 0 &&
    Number.isFinite(Number(features?.phaseComponent)) &&
    Number.isFinite(Number(features?.frequencyComponent)) &&
    Number(features.frequencyComponent) > 0;

  // Hide a result when it belongs to a different signal or visit.
  const resultIsCurrent =
    prediction?.contextKey === currentSignature &&
    Boolean(prediction?.result);

  useEffect(() => {
    if (!currentSignature || !signalIsCurrent) {
      setPrediction((previous) => {
        if (
          !previous?.result &&
          !previous?.contextKey &&
          !previous?.loading
        ) {
          return previous;
        }

        return {
          loading: false,
          status: "WAITING",
          result: null,
          error: null,
          contextKey: null,
        };
      });

      return;
    }

    setPrediction((previous) => {
      if (
        previous?.contextKey === currentSignature ||
        previous?.loading
      ) {
        return previous;
      }

      return {
        loading: false,
        status: "READY",
        result: null,
        error: null,
        contextKey: null,
      };
    });
  }, [
    currentSignature,
    signalIsCurrent,
    setPrediction,
  ]);

  async function runInference() {
    setLocalError("");

    if (!hasPatientContext) {
      setLocalError(
        "No active patient visit. Select a patient and visit in Sensor Monitoring."
      );
      return;
    }

    if (!canRunInference || !features) {
      setLocalError(
        "Process the latest sensor samples in Signal Analysis before running inference."
      );
      return;
    }

    const requestSignature = currentSignature;

    setRunning(true);

    setPrediction({
      loading: true,
      status: "RUNNING",
      result: null,
      error: null,
      contextKey: requestSignature,
      source: "BACKEND",
    });

    try {
      // Keep the existing backend contract unchanged.
      // Patient/visit IDs are kept in the UI context, not sent to /predict.
      const response = await sendMeasurement({
        frequency_hz: Number(features.frequencyComponent),
        impedance_ohms: Number(features.meanImpedance),
        phase_degrees: Number(features.phaseComponent),
        temperature_c: 25,
      });

      // Do not attach a late response to a different patient or signal.
      const latestPatientId =
        sensorSession?.patientId ??
        assessmentContext?.patientId ??
        null;

      const latestVisitId =
        sensorSession?.visitId ??
        assessmentContext?.visitId ??
        null;

      const latestSignature = [
        latestPatientId ?? "no-patient",
        latestVisitId ?? "no-visit",
        signal?.features?.sampleCount ?? 0,
        signal?.sourceSignature ?? "no-signature",
      ].join("|");

      if (latestSignature !== requestSignature) {
        setPrediction({
          loading: false,
          status: "STALE",
          result: null,
          error:
            "The active signal changed while the request was running. Process the latest signal and try again.",
          contextKey: null,
        });
        return;
      }

      const modelReady =
        response?.model_ready === true ||
        response?.status === "completed" ||
        response?.status === "COMPLETED";

      setPrediction({
        loading: false,
        status: modelReady ? "COMPLETED" : "MODEL_NOT_READY",
        result: response,
        error: null,
        contextKey: requestSignature,
        source: "BACKEND",
        message: modelReady
          ? "The backend returned a result."
          : "The backend responded, but a validated prediction model may not be available.",
        inputFeatures: features,
        completedAt: new Date().toISOString(),
      });
    } catch (err) {
      setPrediction({
        loading: false,
        status: "ERROR",
        result: null,
        error: err.message || "The prediction request failed.",
        contextKey: requestSignature,
        source: "BACKEND",
      });

      setLocalError(
        err.message ||
          "Could not contact the prediction backend. Check that FastAPI is running."
      );
    } finally {
      setRunning(false);
    }
  }

  const displayStatus = running
    ? "RUNNING"
    : resultIsCurrent
      ? prediction.status ?? "COMPLETED"
      : signalIsCurrent
        ? "READY"
        : "WAITING";

  const displayPatient =
    sensorSession?.patient?.full_name ??
    sensorSession?.patient?.name ??
    (patientId ? `Patient #${patientId}` : "No patient selected");

  return (
    <main className="min-h-screen bg-slate-950 p-5 text-white md:p-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
            Edge-AI Monitoring System
          </p>
          <h1 className="mt-3 text-3xl font-bold md:text-4xl">
            AI Prediction
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400">
            Send the current signal features to the prediction backend
            and inspect the response.
          </p>
        </div>

        <span className="w-fit rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-300">
          {displayStatus.replaceAll("_", " ")}
        </span>
      </header>

      <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:p-6">
        <p className="text-xs uppercase tracking-wider text-slate-500">
          Active assessment
        </p>

        <h2 className="mt-2 text-xl font-semibold">{displayPatient}</h2>

        <p className="mt-2 text-sm text-slate-400">
          Patient ID: {patientId ?? "—"}{" "}
          <span className="mx-2 text-slate-700">|</span>
          Visit ID: {visitId ?? "—"}{" "}
          <span className="mx-2 text-slate-700">|</span>
          Assessment ID: {assessmentId ?? "Not saved yet"}
        </p>

        {worker && (
          <p className="mt-2 text-xs text-slate-500">
            Legacy worker profile: {worker.name ?? worker.workerId ?? "Available"}
          </p>
        )}
      </section>

      {!hasPatientContext && (
        <section className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200">
          Select a patient and visit in Sensor Monitoring first.
        </section>
      )}

      {!signalIsCurrent && (
        <section className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200">
          No current processed signal is available. Collect samples and
          process them in Signal Analysis before running a prediction.
        </section>
      )}

      {localError && (
        <section
          role="alert"
          className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-200"
        >
          {localError}
        </section>
      )}

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Mean impedance",
            value: features
              ? `${Number(features.meanImpedance).toFixed(2)} Ω`
              : "—",
          },
          {
            label: "Phase component",
            value: features
              ? `${Number(features.phaseComponent).toFixed(2)}°`
              : "—",
          },
          {
            label: "Frequency",
            value: features
              ? `${Number(features.frequencyComponent).toFixed(0)} Hz`
              : "—",
          },
          {
            label: "Samples processed",
            value: features?.sampleCount ?? "—",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
          >
            <p className="text-xs uppercase tracking-wider text-slate-500">
              {item.label}
            </p>
            <p className="mt-3 break-words text-2xl font-bold text-cyan-400">
              {item.value}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:p-6">
        <h2 className="text-lg font-semibold">Inference pipeline</h2>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            {
              number: "01",
              title: "Sensor acquisition",
              description: "Samples collected for the active visit.",
              done: Boolean(features?.sampleCount),
            },
            {
              number: "02",
              title: "Signal processing",
              description: "Features calculated from the current samples.",
              done: signalIsCurrent,
            },
            {
              number: "03",
              title: "Backend inference",
              description: "Request sent to the FastAPI prediction endpoint.",
              done: resultIsCurrent,
            },
          ].map((step) => (
            <div
              key={step.number}
              className={`rounded-xl border p-4 ${
                step.done
                  ? "border-cyan-500/30 bg-cyan-500/5"
                  : "border-slate-800 bg-slate-950/50"
              }`}
            >
              <p className="text-xs text-cyan-400">{step.number}</p>
              <h3 className="mt-3 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-500">
                {step.description}
              </p>
              <p className="mt-3 text-xs text-slate-400">
                {step.done ? "Complete" : "Pending"}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={runInference}
            disabled={!canRunInference || running}
            className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {running ? "Running inference..." : "Run AI Prediction"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/analysis")}
            className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-500/50 hover:bg-slate-800"
          >
            Back to Signal Analysis
          </button>

          <button
            type="button"
            onClick={() => navigate("/risk")}
            disabled={!resultIsCurrent}
            className="rounded-xl border border-cyan-500/30 px-5 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue to Risk Assessment
          </button>
        </div>
      </section>

      {resultIsCurrent && (
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:p-6">
          <h2 className="text-lg font-semibold">Backend response</h2>

          <p className="mt-2 text-sm text-slate-400">
            {prediction.message ??
              "The backend response is associated with the current processed signal."}
          </p>

          {prediction.error && (
            <p className="mt-3 text-sm text-red-300">
              {prediction.error}
            </p>
          )}

          <pre className="mt-4 max-h-96 overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-6 text-cyan-100">
            {JSON.stringify(prediction.result, null, 2)}
          </pre>
        </section>
      )}

      <p className="mt-6 rounded-xl border border-amber-500/10 bg-amber-500/5 p-4 text-xs leading-5 text-slate-500">
        Prototype notice: the current acquisition may contain simulated
        samples. A successful API response does not by itself mean a
        validated AI model is running or that the result is medically
        meaningful. This page is for software testing, not diagnosis.
      </p>
    </main>
  );
}

export default AIPrediction;
