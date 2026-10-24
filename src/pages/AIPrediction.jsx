
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { sendMeasurement } from "../api";

function AIPrediction() {
  const navigate = useNavigate();
  const { worker, signal, prediction, setPrediction } = useApp();
  const [running, setRunning] = useState(false);

  const features = signal.features || {};
  const processedSignal = signal.processedSignal || [];

  const canRunInference =
    signal.status === "PROCESSED" &&
    processedSignal.length > 0 &&
    Number.isFinite(features.meanImpedance) &&
    features.meanImpedance >= 0 &&
    Number.isFinite(features.signalAmplitude) &&
    features.signalAmplitude >= 0 &&
    Number.isFinite(features.frequencyComponent) &&
    features.frequencyComponent > 0 &&
    Number.isFinite(features.phaseComponent);

  async function runInference() {
    if (running || !canRunInference) return;

    setRunning(true);
    setPrediction({
      status: "RUNNING",
      prediction: null,
      confidence: null,
      modelVersion: null,
      source: "BACKEND",
      message: "",
    });

    try {
      const result = await sendMeasurement({
        frequency_hz: Number(features.frequencyComponent),
        impedance_ohms: Number(features.meanImpedance),
        phase_degrees: Number(features.phaseComponent),
        // TEST PLACEHOLDER ONLY. Replace before real sensor integration.
        temperature_c: 25,
      });

      setPrediction({
        status:
          result.status === "model_not_ready"
            ? "MODEL_NOT_READY"
            : result.status === "success"
              ? "COMPLETED"
              : "ERROR",
        prediction: result.prediction ?? null,
        confidence: null,
        modelVersion: null,
        source: "BACKEND",
        message: result.message || result.status || "",
        inputFeatures: { ...features },
      });
    } catch (error) {
      setPrediction({
        status: "ERROR",
        prediction: null,
        confidence: null,
        modelVersion: null,
        source: "BACKEND",
        message: error.message || "Could not connect to the backend.",
      });
    } finally {
      setRunning(false);
    }
  }

  const featureCount = Object.values(features).filter(
    (value) => Number.isFinite(value)
  ).length;

  const hasResult =
    prediction.source === "BACKEND" &&
    ["MODEL_NOT_READY", "COMPLETED", "ERROR"].includes(prediction.status);

  const canContinueToRisk =
    !running &&
    prediction.source === "BACKEND" &&
    ["MODEL_NOT_READY", "COMPLETED"].includes(prediction.status);

  const displayValue = (value) =>
    Number.isFinite(value) ? value : "--";

  const statusText = running
    ? "REQUEST RUNNING"
    : prediction.status === "MODEL_NOT_READY" &&
        prediction.source === "BACKEND"
      ? "MODEL NOT READY"
      : prediction.status === "COMPLETED" &&
          prediction.source === "BACKEND"
        ? "RESPONSE RECEIVED"
        : prediction.status === "ERROR" &&
            prediction.source === "BACKEND"
          ? "REQUEST FAILED"
          : "AWAITING INPUT";

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 p-8 text-white md:p-10">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(34,211,238,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.5) 1px, transparent 1px)",
            backgroundSize: "45px 45px",
          }}
        />
      </div>

      {/* Header */}
      <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-400">
              Edge Inference Layer
            </p>
          </div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            AI Prediction
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400 md:text-base">
            Processed signal features are sent to the FastAPI backend.
            A trained model is not yet available.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-6 py-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Inference Status
          </p>
          <div className="mt-2 flex items-center gap-3">
            <span
              className={`h-2 w-2 rounded-full ${
                running
                  ? "animate-ping bg-cyan-400"
                  : prediction.status === "ERROR" &&
                      prediction.source === "BACKEND"
                    ? "bg-red-400"
                    : prediction.status === "MODEL_NOT_READY" &&
                        prediction.source === "BACKEND"
                      ? "bg-amber-400"
                      : "bg-slate-600"
              }`}
            />
            <span className="font-semibold text-slate-300">
              {statusText}
            </span>
          </div>
        </div>
      </div>

      {/* Worker Context */}
      <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Assessment Subject
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-semibold">
                {worker.name || "No worker selected"}
              </h2>
              <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-400">
                {worker.workerId || "WRK----"}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-400">
              Numeric features: {featureCount}
            </span>
            <span className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-400">
              Input samples: {processedSignal.length}
            </span>
          </div>
        </div>
      </div>

      {/* Main Panels */}
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm xl:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">
                Backend Inference
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                Edge Processing
              </h2>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-amber-400">
                Prototype Mode
              </p>
            </div>
          </div>

          <div className="relative mt-6 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-8">
            <div className="flex min-h-64 flex-col items-center justify-center">
              <div className="relative flex h-32 w-32 items-center justify-center">
                {running && (
                  <>
                    <div className="absolute inset-0 animate-ping rounded-full border border-cyan-400/30" />
                    <div className="absolute inset-3 animate-pulse rounded-full border border-cyan-400/40" />
                  </>
                )}
                <div
                  className={`relative flex h-24 w-24 items-center justify-center rounded-full border ${
                    running
                      ? "border-cyan-400/50 bg-cyan-400/10 shadow-[0_0_45px_rgba(34,211,238,0.25)]"
                      : "border-slate-700 bg-slate-900"
                  }`}
                >
                  <span className="text-3xl font-bold text-cyan-400">
                    AI
                  </span>
                </div>
              </div>

              <p className="mt-6 text-sm font-semibold">
                {running
                  ? "Sending Measurements..."
                  : hasResult
                    ? statusText
                    : canRunInference
                      ? "Ready to Connect"
                      : "Awaiting Processed Signal"}
              </p>
              <p className="mt-2 max-w-md text-center text-xs leading-5 text-slate-500">
                {canRunInference
                  ? "Processed features are available to send to the backend."
                  : "Complete signal acquisition and processing before sending a request."}
              </p>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Mean Impedance", value: features.meanImpedance, unit: "Ω" },
              { label: "Phase", value: features.phaseComponent, unit: "°" },
              { label: "Signal Range", value: features.signalAmplitude, unit: "" },
              { label: "Frequency", value: features.frequencyComponent, unit: "Hz" },
            ].map((feature) => (
              <div
                key={feature.label}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
              >
                <p className="text-[10px] uppercase tracking-wider text-slate-500">
                  {feature.label}
                </p>
                <p className="mt-2 break-words font-semibold text-cyan-400">
                  {displayValue(feature.value)}
                  {feature.unit && (
                    <span className="ml-1 text-xs font-normal text-slate-500">
                      {feature.unit}
                    </span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Result */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">
            Backend Response
          </p>
          <h2 className="mt-2 text-xl font-semibold">Result</h2>

          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center">
            {hasResult ? (
              <>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Response Status
                </p>
                <p
                  className={`mt-4 break-words text-xl font-bold ${
                    prediction.status === "ERROR"
                      ? "text-red-400"
                      : "text-cyan-400"
                  }`}
                >
                  {prediction.status === "MODEL_NOT_READY"
                    ? "Model Not Ready"
                    : prediction.status === "COMPLETED"
                      ? prediction.prediction || "Response received"
                      : "Request Failed"}
                </p>

                <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <p className="text-xs font-semibold text-amber-400">
                    {prediction.status === "MODEL_NOT_READY"
                      ? "Backend connected successfully"
                      : prediction.status === "ERROR"
                        ? "Check the connection"
                        : "Backend response received"}
                  </p>
                  <p className="mt-2 break-words text-xs leading-5 text-slate-400">
                    {prediction.message}
                  </p>
                </div>

                {prediction.status === "MODEL_NOT_READY" && (
                  <p className="mt-4 text-xs leading-5 text-slate-500">
                    No prediction was produced because a trained and
                    validated model has not been integrated.
                  </p>
                )}
              </>
            ) : (
              <div className="py-10">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-slate-700 bg-slate-900">
                  <span className="text-xl text-slate-600">AI</span>
                </div>
                <p className="mt-5 text-sm font-semibold text-slate-400">
                  Awaiting backend response
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  Process a signal and send it to the backend.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline */}
      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">
            Inference Pipeline
          </p>
          <h2 className="mt-2 text-xl font-semibold">
            Current workflow and future integration
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { number: "01", title: "Input", description: "Processed impedance sample data." },
            { number: "02", title: "API Request", description: "Send measurement features to FastAPI." },
            { number: "03", title: "Validation", description: "Backend validates the submitted values." },
            { number: "04", title: "Trained Model", description: "Future step requiring training and validation." },
          ].map((stage, index) => (
            <div
              key={stage.number}
              className={
                index === 1
                  ? "rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-5"
                  : "rounded-xl border border-slate-700 bg-slate-950/50 p-5"
              }
            >
              <span className="text-xs text-cyan-400">{stage.number}</span>
              <h3 className="mt-3 font-semibold">{stage.title}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {stage.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold">Inference Control</p>
          <p className="mt-1 text-sm text-slate-500">
            Send processed features to the FastAPI backend.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={runInference}
            disabled={running || !canRunInference}
            className={
              running || !canRunInference
                ? "cursor-not-allowed rounded-xl border border-slate-800 bg-slate-900 px-6 py-3 text-sm font-semibold text-slate-600"
                : "rounded-xl bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all duration-300 hover:scale-105 hover:bg-cyan-300 hover:shadow-[0_0_30px_rgba(34,211,238,0.3)] active:scale-95"
            }
          >
            {running ? "Sending..." : "Send to Backend"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/risk")}
            disabled={!canContinueToRisk}
            className={
              !canContinueToRisk
                ? "cursor-not-allowed rounded-xl border border-slate-800 bg-slate-900 px-6 py-3 text-sm font-semibold text-slate-600"
                : "rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-6 py-3 text-sm font-semibold text-cyan-400 transition-all duration-300 hover:scale-105 hover:bg-cyan-500/20 active:scale-95"
            }
          >
            Continue to Risk →
          </button>
        </div>
      </div>

      {/* Notice */}
      <div className="mt-8 rounded-xl border border-amber-500/10 bg-amber-500/5 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-400/80">
          Prototype Notice
        </p>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          The backend connection is active, but a trained TinyML model is
          not integrated. Signal samples are simulated. Temperature is a
          temporary test placeholder, not a hardware reading. This prototype
          does not estimate silica exposure, diagnose disease, or provide
          a medically validated risk prediction.
        </p>
      </div>
    </div>
  );
}

export default AIPrediction;
