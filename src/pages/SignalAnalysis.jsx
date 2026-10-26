
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

function normalizeSample(sample, index) {
  return {
    sampleNumber: Number(sample.sampleNumber ?? index + 1),
    timestamp:
      typeof sample.timestamp === "number"
        ? sample.timestamp
        : new Date(sample.timestamp ?? Date.now()).getTime(),
    impedance: Number(
      sample.impedance ?? sample.impedance_ohms
    ),
    phase: Number(sample.phase ?? sample.phase_degrees),
  };
}

function SignalAnalysis() {
  const navigate = useNavigate();

  const {
    sensor,
    signal,
    setSignal,
    sensorSession,
    assessmentContext,
    setPrediction,
    setRisk,
  } = useApp();

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  // Use the active acquisition session as the source of truth.
  // Do not fall back to old sensor history when a patient visit
  // has an active session with zero samples.
  const sessionIsSelected = Boolean(
    sensorSession?.patientId && sensorSession?.visitId
  );

  const rawSignal = useMemo(() => {
    const samples = Array.isArray(sensorSession?.samples)
      ? sensorSession.samples
      : [];

    if (sessionIsSelected) {
      return samples
        .map(normalizeSample)
        .filter(
          (sample) =>
            Number.isFinite(sample.impedance) &&
            Number.isFinite(sample.phase)
        );
    }

    // Compatibility fallback for the older, non-visit workflow.
    return (sensor?.history ?? [])
      .map(normalizeSample)
      .filter(
        (sample) =>
          Number.isFinite(sample.impedance) &&
          Number.isFinite(sample.phase)
      );
  }, [
    sensorSession?.samples,
    sensorSession?.patientId,
    sensorSession?.visitId,
    sessionIsSelected,
    sensor?.history,
  ]);

  const sampleSignature = useMemo(
    () =>
      rawSignal
        .map(
          (sample) =>
            `${sample.sampleNumber}:${sample.timestamp}:${sample.impedance}:${sample.phase}`
        )
        .join("|"),
    [rawSignal]
  );

  const currentPatientId =
    sensorSession?.patientId ?? assessmentContext?.patientId ?? null;

  const currentVisitId =
    sensorSession?.visitId ?? assessmentContext?.visitId ?? null;

  const currentAssessmentId =
    sensorSession?.assessmentId ??
    assessmentContext?.assessmentId ??
    null;

  const hasContext = Boolean(currentPatientId && currentVisitId);

  // Invalidate results when the active samples or visit change.
  // This prevents a previous processed signal from being treated
  // as the result of a new acquisition.
  useEffect(() => {
    setSignal((previous) => {
      if (
        previous.sourceSignature === sampleSignature &&
        previous.patientId === currentPatientId &&
        previous.visitId === currentVisitId
      ) {
        return previous;
      }

      return {
        processed: false,
        status: rawSignal.length ? "WAITING" : "EMPTY",
        features: null,
        rawSignal: [],
        processedSignal: [],
        sourceSignature: sampleSignature,
        patientId: currentPatientId,
        visitId: currentVisitId,
        assessmentId: currentAssessmentId,
      };
    });

    setPrediction({
      loading: false,
      status: "WAITING",
      result: null,
      error: null,
    });

    setRisk({
      score: null,
      level: null,
      factors: [],
    });
    // The signature changes only when the input data or context changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sampleSignature,
    currentPatientId,
    currentVisitId,
    currentAssessmentId,
    setSignal,
    setPrediction,
    setRisk,
  ]);

  const isAlreadyProcessed =
    signal?.processed === true &&
    signal?.sourceSignature === sampleSignature &&
    signal?.patientId === currentPatientId &&
    signal?.visitId === currentVisitId;

  const processedSignal = isAlreadyProcessed
    ? signal.processedSignal ?? []
    : [];

  const features = isAlreadyProcessed ? signal.features : null;

  function processSignal() {
    setError("");

    if (!hasContext) {
      setError("Return to Sensor Monitoring and select a patient and visit.");
      return;
    }

    if (rawSignal.length < 2) {
      setError("Collect at least two samples before processing the signal.");
      return;
    }

    setProcessing(true);

    try {
      const impedanceValues = rawSignal.map(
        (sample) => sample.impedance
      );

      const phaseValues = rawSignal.map((sample) => sample.phase);

      const mean = (values) =>
        values.reduce((total, value) => total + value, 0) /
        values.length;

      const meanImpedance = mean(impedanceValues);
      const meanPhase = mean(phaseValues);

      // Remove the DC component to produce a centred signal.
      const centeredSignal = impedanceValues.map(
        (value) => value - meanImpedance
      );

      const signalAmplitude =
        Math.max(...centeredSignal) -
        Math.min(...centeredSignal);

      const meanAbsoluteDeviation =
        centeredSignal.reduce(
          (total, value) => total + Math.abs(value),
          0
        ) / centeredSignal.length;

      const latestSample = rawSignal[rawSignal.length - 1];

      const calculatedFeatures = {
        meanImpedance,
        phaseComponent: meanPhase,
        signalAmplitude,
        meanAbsoluteDeviation,
        frequencyComponent: Number(sensor?.frequency ?? 10000),
        sampleCount: rawSignal.length,
        latestImpedance: latestSample.impedance,
        latestPhase: latestSample.phase,
      };

      setSignal({
        processed: true,
        status: "PROCESSED",
        features: calculatedFeatures,
        rawSignal,
        processedSignal: centeredSignal,
        sourceSignature: sampleSignature,
        patientId: currentPatientId,
        visitId: currentVisitId,
        assessmentId: currentAssessmentId,
      });

      // A new signal needs a new prediction and risk assessment.
      setPrediction({
        loading: false,
        status: "WAITING",
        result: null,
        error: null,
      });

      setRisk({
        score: null,
        level: null,
        factors: [],
      });
    } catch (err) {
      setError(err.message || "Signal processing failed.");
    } finally {
      setProcessing(false);
    }
  }

  const chartPoints = useMemo(() => {
    if (processedSignal.length < 2) return "";

    const values = processedSignal.slice(-100);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    return values
      .map((value, index) => {
        const x = (index / (values.length - 1)) * 1000;
        const y = 220 - ((value - min) / range) * 180;
        return `${x},${y}`;
      })
      .join(" ");
  }, [processedSignal]);

  const inputClass =
    "rounded-xl border border-slate-800 bg-slate-950/70 p-5";

  return (
    <main className="min-h-screen bg-slate-950 p-5 text-white md:p-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
            Edge-AI Monitoring System
          </p>
          <h1 className="mt-3 text-3xl font-bold md:text-4xl">
            Signal Analysis
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400">
            Inspect the current sensor acquisition, remove the signal's
            mean component, and calculate basic numerical features.
          </p>
        </div>

        <span className="w-fit rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-300">
          {isAlreadyProcessed ? "SIGNAL PROCESSED" : "AWAITING PROCESSING"}
        </span>
      </header>

      <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Active assessment context
            </p>
            <h2 className="mt-2 text-xl font-semibold">
              {sensorSession?.patient?.full_name ??
                sensorSession?.patient?.name ??
                (currentPatientId
                  ? `Patient #${currentPatientId}`
                  : "No patient selected")}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Patient ID: {currentPatientId ?? "—"}{" "}
              <span className="mx-2 text-slate-700">|</span>
              Visit ID: {currentVisitId ?? "—"}{" "}
              <span className="mx-2 text-slate-700">|</span>
              Assessment ID: {currentAssessmentId ?? "Not saved yet"}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
            <p className="text-xs text-slate-500">Current sample count</p>
            <p className="mt-1 text-2xl font-bold text-cyan-400">
              {rawSignal.length}
            </p>
          </div>
        </div>

        {!hasContext && (
          <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200">
            No patient visit is active. Select a patient and visit in Sensor
            Monitoring first.
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-200"
          >
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={processSignal}
            disabled={
              processing ||
              !hasContext ||
              rawSignal.length < 2
            }
            className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {processing
              ? "Processing..."
              : isAlreadyProcessed
                ? "Reprocess Current Signal"
                : "Process Signal"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/sensor")}
            className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-500/50 hover:bg-slate-800"
          >
            Back to Sensor Monitoring
          </button>

          <button
            type="button"
            onClick={() => navigate("/prediction")}
            disabled={!isAlreadyProcessed}
            className="rounded-xl border border-cyan-500/30 px-5 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue to AI Prediction
          </button>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Samples",
            value: rawSignal.length,
            unit: "current acquisition",
          },
          {
            label: "Mean impedance",
            value: features
              ? features.meanImpedance.toFixed(2)
              : "—",
            unit: "Ω · simulated data",
          },
          {
            label: "Mean phase",
            value: features
              ? features.phaseComponent.toFixed(2)
              : "—",
            unit: "degrees",
          },
          {
            label: "Signal amplitude",
            value: features
              ? features.signalAmplitude.toFixed(4)
              : "—",
            unit: "Ω · centred signal",
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
            <p className="mt-2 text-xs text-slate-500">{item.unit}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Processed signal</h2>
            <p className="mt-1 text-sm text-slate-500">
              Mean-centred impedance trace from the current acquisition.
            </p>
          </div>
          <span className="text-xs text-slate-500">
            Showing up to the latest 100 points
          </span>
        </div>

        <div className="relative mt-5 h-64 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)",
              backgroundSize: "50px 50px",
            }}
          />

          {chartPoints ? (
            <svg
              viewBox="0 0 1000 260"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full"
            >
              <polyline
                points={chartPoints}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-cyan-400"
              />
            </svg>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-slate-500">
              {rawSignal.length < 2
                ? "Collect at least two samples to begin signal analysis."
                : "Process the current signal to display its waveform."}
            </div>
          )}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:p-6">
        <h2 className="text-lg font-semibold">Extracted features</h2>

        {features ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(features).map(([key, value]) => (
              <div key={key} className={inputClass}>
                <p className="text-xs text-slate-500">
                  {key.replace(/([A-Z])/g, " $1")}
                </p>
                <p className="mt-2 break-words font-semibold text-slate-100">
                  {typeof value === "number"
                    ? value.toFixed(4)
                    : String(value)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">
            Features will appear after processing the current acquisition.
          </p>
        )}
      </section>

      <p className="mt-6 rounded-xl border border-amber-500/10 bg-amber-500/5 p-4 text-xs leading-5 text-slate-500">
        Prototype notice: this page processes simulated sensor samples.
        The calculated features are for software testing only and are not
        validated clinical measurements or diagnostic indicators.
      </p>
    </main>
  );
}

export default SignalAnalysis;
