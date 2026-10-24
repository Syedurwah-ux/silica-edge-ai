import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

function RiskAssessment() {
  const navigate = useNavigate();

  const { worker, sensor, signal, prediction, risk, setRisk } = useApp();

  const [calculating, setCalculating] = useState(false);
  const calculationTimeoutRef = useRef(null);

  const [environment, setEnvironment] = useState({
    dustLevel: 65,
    pollutionLevel: 58,
    ventilation: "Moderate",
  });

  // Demo index is separate from a genuine, validated risk prediction.
  const canCalculateDemo =
    Boolean(worker.workerId) &&
    signal.status === "PROCESSED" &&
    (signal.processedSignal || []).length > 0;

  useEffect(() => {
    return () => {
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }
    };
  }, []);

  function updateEnvironment(field, value) {
    setEnvironment((current) => ({
      ...current,
      [field]: value,
    }));

    setRisk({ score: null, level: null, source: null });
  }

  function calculateRisk() {
    if (calculating || !canCalculateDemo) return;

    setCalculating(true);
    setRisk({ score: null, level: null, source: null });

    const inputs = {
      exposureYears: Number(worker.exposureYears) || 0,
      dustLevel: environment.dustLevel,
      pollutionLevel: environment.pollutionLevel,
      ventilation: environment.ventilation,
      sampleCount: (signal.processedSignal || []).length,
    };

    calculationTimeoutRef.current = setTimeout(() => {
      // Arbitrary demonstration formula. Not a validated risk model.
      const exposureComponent = Math.min(
        Math.max(inputs.exposureYears, 0) * 2,
        30
      );

      const dustComponent = inputs.dustLevel * 0.3;
      const pollutionComponent = inputs.pollutionLevel * 0.1;

      const ventilationComponent = {
        Good: 0,
        Moderate: 5,
        Poor: 10,
      }[inputs.ventilation] ?? 5;

      const rawIndex =
        exposureComponent +
        dustComponent +
        pollutionComponent +
        ventilationComponent;

      const score = Math.max(0, Math.min(100, Math.round(rawIndex)));

      let level = "Lower";
      if (score >= 65) level = "Higher";
      else if (score >= 35) level = "Moderate";

      setRisk({
        score,
        level,
        source: "DEMO",
        inputs,
        calculatedAt: new Date().toISOString(),
      });

      setCalculating(false);
      calculationTimeoutRef.current = null;
    }, 800);
  }

  const hasResult =
    risk.score !== null &&
    risk.score !== undefined &&
    risk.source === "DEMO";

  const score = hasResult ? risk.score : 0;

  const levelStyle =
    risk.level === "Higher"
      ? "border-red-500/30 bg-red-500/10 text-red-400"
      : risk.level === "Moderate"
      ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
      : risk.level === "Lower"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
      : "border-slate-700 bg-slate-950 text-slate-500";

  const formatValue = (value) =>
    value === null || value === undefined || value === ""
      ? "--"
      : value;

  const backendStatus = prediction.status || "WAITING";
  const backendMessage =
    prediction.message ||
    prediction.error ||
    (backendStatus === "MODEL_NOT_READY"
      ? "Measurements were received, but a trained and validated model is not available."
      : backendStatus === "COMPLETED"
      ? "The backend returned a completed response. Check its prediction source before interpreting it."
      : backendStatus === "ERROR"
      ? "The backend reported an error. Check the server logs and try again."
      : "Waiting for a response from the prediction workflow.");

  const statusStyle =
    backendStatus === "MODEL_NOT_READY" || backendStatus === "ERROR"
      ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
      : backendStatus === "COMPLETED"
      ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
      : "border-slate-700 bg-slate-950 text-slate-400";

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
              Systems Integration Layer
            </p>
          </div>

          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            Risk Assessment
          </h1>

          <p className="mt-3 max-w-2xl text-sm text-slate-400 md:text-base">
            Reviewing worker information, prototype measurements, and
            backend readiness. The demonstration index is not a real risk score.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-6 py-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Assessment Mode
          </p>
          <div className="mt-2 flex items-center gap-3">
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
            <span className="font-semibold text-amber-400">
              PROTOTYPE / DEMO
            </span>
          </div>
        </div>
      </div>

      {/* Worker Summary */}
      <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Worker
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

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Age", value: worker.age },
              {
                label: "Exposure",
                value: worker.exposureYears
                  ? `${worker.exposureYears} yrs`
                  : "--",
              },
              { label: "Occupation", value: worker.occupation },
              { label: "Location", value: worker.workLocation },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3"
              >
                <p className="text-[10px] uppercase tracking-wider text-slate-500">
                  {item.label}
                </p>
                <p className="mt-1 truncate font-semibold">
                  {formatValue(item.value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Integration Inputs */}
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {/* Sensor */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">
            Sensor Data
          </p>
          <h2 className="mt-2 text-xl font-semibold">
            Impedance Measurements
          </h2>

          <div className="mt-6 space-y-3">
            {[
              { label: "Impedance", value: sensor.impedance, unit: "Ω" },
              { label: "Phase", value: sensor.phase, unit: "°" },
              { label: "Frequency", value: sensor.frequency, unit: "Hz" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-4"
              >
                <span className="text-sm text-slate-500">{item.label}</span>
                <span className="font-semibold text-cyan-400">
                  {formatValue(item.value)} {item.unit}
                </span>
              </div>
            ))}

            <p className="text-xs leading-5 text-amber-400/80">
              {sensor.source === "HARDWARE"
                ? "The application reports a hardware source. Verify the physical sensor connection and calibration before interpreting readings."
                : "Simulated readings; these are not actual silica concentration or biological measurements."}
            </p>
          </div>
        </div>

        {/* Backend Status */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">
            Prediction Backend
          </p>
          <h2 className="mt-2 text-xl font-semibold">
            Model Readiness
          </h2>

          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-5">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Current Backend Status
            </p>

            <div className={`mt-3 inline-flex rounded-full border px-3 py-2 text-xs font-semibold ${statusStyle}`}>
              {backendStatus.replaceAll("_", " ")}
            </div>

            <p className="mt-4 break-words text-sm leading-6 text-slate-300">
              {backendMessage}
            </p>

            <div className="mt-5 border-t border-slate-800 pt-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-500">Prediction</span>
                <span className="text-right text-sm font-semibold text-cyan-400">
                  {prediction.prediction ?? "Unavailable"}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-sm text-slate-500">Source</span>
                <span className="text-sm font-semibold text-slate-300">
                  {prediction.source || "--"}
                </span>
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <p className="text-xs leading-5 text-amber-400">
                A backend response does not itself establish a valid silica
                exposure or health-risk prediction. Model validation is required.
              </p>
            </div>
          </div>
        </div>

        {/* Environment */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">
            Environment
          </p>
          <h2 className="mt-2 text-xl font-semibold">
            Demonstration Inputs
          </h2>

          <p className="mt-3 text-xs leading-5 text-slate-500">
            These assumed values are for UI testing only, not measured workplace
            conditions or calibrated dust readings.
          </p>

          <div className="mt-6 space-y-5">
            <div>
              <div className="flex justify-between">
                <label className="text-sm text-slate-400">Dust Input</label>
                <span className="text-sm font-semibold text-cyan-400">
                  {environment.dustLevel}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={environment.dustLevel}
                onChange={(event) =>
                  updateEnvironment("dustLevel", Number(event.target.value))
                }
                className="mt-3 w-full accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between">
                <label className="text-sm text-slate-400">Pollution Input</label>
                <span className="text-sm font-semibold text-cyan-400">
                  {environment.pollutionLevel}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={environment.pollutionLevel}
                onChange={(event) =>
                  updateEnvironment("pollutionLevel", Number(event.target.value))
                }
                className="mt-3 w-full accent-cyan-400"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400">
                Ventilation Input
              </label>
              <select
                value={environment.ventilation}
                onChange={(event) =>
                  updateEnvironment("ventilation", event.target.value)
                }
                className="mt-3 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300 outline-none focus:border-cyan-500/50"
              >
                <option>Good</option>
                <option>Moderate</option>
                <option>Poor</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline */}
      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">
            Data Integration
          </p>
          <h2 className="mt-2 text-xl font-semibold">
            Prototype Processing Workflow
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            {
              number: "01",
              title: "Worker Data",
              description: "Registered worker information.",
            },
            {
              number: "02",
              title: "Sensor Samples",
              description: "Currently simulated impedance readings.",
            },
            {
              number: "03",
              title: "Backend Response",
              description: `Current status: ${backendStatus.replaceAll("_", " ")}.`,
            },
            {
              number: "04",
              title: "Demo Index",
              description: "Separate arbitrary formula for interface testing.",
            },
          ].map((stage, index) => (
            <div
              key={stage.number}
              className={
                index === 3
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

      {/* Demo Result */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">
            Demonstration Result
          </p>
          <h2 className="mt-2 text-xl font-semibold">Demo Integration Index</h2>

          <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="text-xs leading-5 text-amber-400">
              DEMO ONLY — not a validated silica exposure, disease probability,
              or medical risk assessment.
            </p>
          </div>

          <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 p-8">
            <div className="relative flex h-40 w-40 items-center justify-center rounded-full border-8 border-slate-800">
              <div
                className="absolute inset-[-8px] rounded-full border-8 border-transparent border-t-cyan-400 border-r-cyan-400 transition-all duration-1000"
                style={{
                  transform: `rotate(${score * 3.6}deg)`,
                  opacity: hasResult ? 1 : 0.15,
                }}
              />
              <div className="text-center">
                <p className="text-5xl font-bold text-cyan-400">
                  {hasResult ? score : "--"}
                </p>
                <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">
                  Demo Index / 100
                </p>
              </div>
            </div>

            <div className={`mt-6 rounded-full border px-5 py-2 text-sm font-semibold ${levelStyle}`}>
              {hasResult ? `${risk.level} Demo Band` : "Awaiting Demo Calculation"}
            </div>

            <p className="mt-4 max-w-sm text-center text-xs leading-5 text-slate-500">
              This number comes from arbitrary weights and assumed inputs. Do
              not use it to make workplace safety or health decisions.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">
            Calculation Inputs
          </p>
          <h2 className="mt-2 text-xl font-semibold">
            Inputs Used by Demo Formula
          </h2>

          <div className="mt-6 space-y-3">
            {[
              {
                label: "Recorded exposure duration",
                value: worker.exposureYears
                  ? `${worker.exposureYears} years`
                  : "--",
              },
              { label: "Dust input", value: `${environment.dustLevel}%` },
              {
                label: "Pollution input",
                value: `${environment.pollutionLevel}%`,
              },
              { label: "Ventilation input", value: environment.ventilation },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4"
              >
                <span className="text-sm text-slate-400">{item.label}</span>
                <span className="text-right font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold">Demo Index Calculation</p>
          <p className="mt-1 text-sm text-slate-500">
            This demo can run independently of whether the backend model is ready.
          </p>

          {!canCalculateDemo && (
            <p className="mt-2 text-xs text-amber-400">
              Required: a registered worker and at least one processed signal sample.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={calculateRisk}
            disabled={calculating || !canCalculateDemo}
            className={
              calculating || !canCalculateDemo
                ? "cursor-not-allowed rounded-xl border border-slate-800 bg-slate-900 px-6 py-3 text-sm font-semibold text-slate-600"
                : "rounded-xl bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all duration-300 hover:scale-105 hover:bg-cyan-300 hover:shadow-[0_0_30px_rgba(34,211,238,0.3)] active:scale-95"
            }
          >
            {calculating ? "Calculating..." : "Calculate Demo Index"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/report")}
            disabled={!hasResult}
            className={
              !hasResult
                ? "cursor-not-allowed rounded-xl border border-slate-800 bg-slate-900 px-6 py-3 text-sm font-semibold text-slate-600"
                : "rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-6 py-3 text-sm font-semibold text-cyan-400 transition-all duration-300 hover:scale-105 hover:bg-cyan-500/20 active:scale-95"
            }
          >
            Generate Demo Report →
          </button>
        </div>
      </div>

      {/* Notice */}
      <div className="mt-8 rounded-xl border border-amber-500/10 bg-amber-500/5 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-400/80">
          Important Prototype Notice
        </p>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          The backend model status and demonstration index are separate. This
          index uses arbitrary weights and assumed environmental inputs. It is
          not a validated occupational exposure measure, disease-risk score,
          or medical diagnosis. Real-world interpretation requires appropriate
          environmental measurements, suitable research data, and scientific
          validation.
        </p>
      </div>
    </div>
  );
}

export default RiskAssessment;