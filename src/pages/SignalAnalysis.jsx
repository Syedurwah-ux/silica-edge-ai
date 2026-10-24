
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

function SignalAnalysis() {
  const navigate = useNavigate();
  const { sensor, signal, setSignal } = useApp();

  const [processing, setProcessing] = useState(false);
  const processingTimeoutRef = useRef(null);

  const history = sensor.history || [];

  // Use the latest sensor samples for the waveform.
  const rawSignal = history.map((sample) => sample.impedance);

  // Keep the shared signal synchronized with incoming sensor samples.
  useEffect(() => {
    if (history.length === 0) return;

    setSignal((current) => {
      const currentLastSample =
        current.rawSignal?.[current.rawSignal.length - 1];

      const nextLastSample = rawSignal[rawSignal.length - 1];

      if (
        current.rawSignal?.length === rawSignal.length &&
        currentLastSample === nextLastSample
      ) {
        return current;
      }

      return {
        ...current,
        status: "WAITING",
        rawSignal: [...rawSignal],
        processedSignal: [],
        features: {},
      };
    });
  }, [history.length, rawSignal[rawSignal.length - 1], setSignal]);

  // Cancel pending processing if the page unmounts.
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  function processSignal() {
    if (processing || rawSignal.length === 0) return;

    if (sensor.source !== "SIMULATED" && sensor.source !== "HARDWARE") {
      return;
    }

    const capturedSamples = [...rawSignal];
    const capturedFrequency = sensor.frequency;
    const capturedPhase = sensor.phase;

    setProcessing(true);

    setSignal((current) => ({
      ...current,
      status: "PROCESSING",
      processedSignal: [],
      features: {},
    }));

    processingTimeoutRef.current = setTimeout(() => {
      // Simple demo transformation; this is not validated signal filtering.
      const baseline =
        capturedSamples.reduce((sum, value) => sum + value, 0) /
        capturedSamples.length;

      const processedSignal = capturedSamples.map((value) =>
        Number((value - baseline).toFixed(2))
      );

      const minimum = Math.min(...capturedSamples);
      const maximum = Math.max(...capturedSamples);

      const features = {
        meanImpedance: Number(baseline.toFixed(2)),
        phaseComponent:
          Number.isFinite(capturedPhase) ? capturedPhase : null,
        signalAmplitude: Number((maximum - minimum).toFixed(2)),
        frequencyComponent:
          Number.isFinite(capturedFrequency) ? capturedFrequency : null,
      };

      setSignal((current) => ({
        ...current,
        status: "PROCESSED",
        rawSignal: capturedSamples,
        processedSignal,
        features,
      }));

      setProcessing(false);
      processingTimeoutRef.current = null;
    }, 800);
  }

  const chartValues = rawSignal.slice(-60);
  const chartMin = chartValues.length
    ? Math.min(...chartValues)
    : 0;
  const chartMax = chartValues.length
    ? Math.max(...chartValues)
    : 1;
  const chartRange = chartMax - chartMin || 1;

  const waveformPoints = chartValues
    .map((value, index) => {
      const x =
        chartValues.length > 1
          ? (index / (chartValues.length - 1)) * 1000
          : 500;

      const y = 150 - ((value - chartMin) / chartRange) * 220;

      return `${x},${y}`;
    })
    .join(" ");

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
              Signal Processing Layer
            </p>
          </div>

          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            Signal Analysis
          </h1>

          <p className="mt-3 max-w-2xl text-sm text-slate-400 md:text-base">
            Processing impedance measurements from the ESP32-S3 + AD5933
            prototype platform.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-6 py-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Data Source
          </p>
          <div className="mt-2 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
            <span className="font-semibold">
              {sensor.deviceId || "ESP32-001"}
            </span>
          </div>
          <p className="mt-2 text-xs text-amber-400">
            {sensor.source === "HARDWARE"
              ? "Hardware source"
              : "Simulated source"}
          </p>
        </div>
      </div>

      {/* Status */}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Processing Status
          </p>
          <p
            className={
              processing
                ? "mt-3 text-2xl font-bold text-cyan-400"
                : "mt-3 text-2xl font-bold text-slate-200"
            }
          >
            {processing ? "PROCESSING" : signal.status || "WAITING"}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Signal pipeline state
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Input Frequency
          </p>
          <p className="mt-3 text-2xl font-bold">
            {sensor.frequency ?? "--"}
            <span className="ml-2 text-sm font-normal text-slate-500">
              Hz
            </span>
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Acquisition frequency
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Samples
          </p>
          <p className="mt-3 text-2xl font-bold text-cyan-400">
            {history.length}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Available in the current sample history
          </p>
        </div>
      </div>

      {/* Signal Chart */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
        <div className="flex flex-col gap-3 border-b border-slate-800 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">
              Raw EIS Signal
            </p>
            <h2 className="mt-2 text-xl font-semibold">
              Impedance Sample Visualization
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              The plot updates when new sensor samples become available.
            </p>
          </div>

          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-amber-400">
              {sensor.source === "HARDWARE"
                ? "Hardware Data"
                : "Simulated Data"}
            </p>
          </div>
        </div>

        <div className="p-6">
          <div className="relative h-80 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)",
                backgroundSize: "50px 50px",
              }}
            />

            <div className="absolute left-0 right-0 top-1/2 h-px bg-slate-800" />

            {chartValues.length > 0 ? (
              <svg
                viewBox="0 0 1000 300"
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full"
              >
                <polyline
                  points={waveformPoints}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  className="text-cyan-400"
                />
                <polyline
                  points={waveformPoints}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  opacity="0.15"
                  className="text-cyan-400"
                />
              </svg>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-slate-500">
                No sensor samples yet. Open Sensor Monitoring and start the
                simulated acquisition first.
              </div>
            )}

            <div className="absolute left-4 top-4 rounded-md border border-slate-800 bg-slate-950/80 px-3 py-1.5 text-[10px] uppercase tracking-wider text-slate-500">
              IMPEDANCE SAMPLES
            </div>

            <div className="absolute bottom-4 left-4 text-[10px] uppercase tracking-wider text-slate-600">
              SAMPLE ORDER →
            </div>

            <div className="absolute right-4 top-4 text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-600">
                Signal State
              </p>
              <p className="mt-1 text-xs font-semibold text-cyan-400">
                {chartValues.length ? "SAMPLES AVAILABLE" : "WAITING"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Processing Pipeline */}
      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">
            Processing Pipeline
          </p>
          <h2 className="mt-2 text-xl font-semibold">
            From raw signal to prototype features
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            {
              number: "01",
              title: "Raw Samples",
              description: "Impedance samples from the current acquisition.",
            },
            {
              number: "02",
              title: "Baseline Removal",
              description: "Subtract the sample mean for a simple demo transform.",
            },
            {
              number: "03",
              title: "Feature Extraction",
              description: "Calculate mean, range, phase and frequency values.",
            },
            {
              number: "04",
              title: "AI Input",
              description: "Prototype features for later model integration.",
            },
          ].map((stage, index) => (
            <div
              key={stage.number}
              className={
                index === 0
                  ? "rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-5"
                  : "rounded-xl border border-slate-700 bg-slate-950/50 p-5"
              }
            >
              <span className="text-xs text-cyan-400">{stage.number}</span>
              <h3 className="mt-4 font-semibold">{stage.title}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {stage.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">
            Extracted Features
          </p>
          <h2 className="mt-2 text-xl font-semibold">AI Input Features</h2>
          <p className="mt-1 text-sm text-slate-500">
            Features appear after processing the available samples.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Mean Impedance",
              value: signal.features?.meanImpedance,
              unit: "Ω",
            },
            {
              label: "Phase Component",
              value: signal.features?.phaseComponent,
              unit: "°",
            },
            {
              label: "Signal Amplitude",
              value: signal.features?.signalAmplitude,
              unit: "",
            },
            {
              label: "Frequency Component",
              value: signal.features?.frequencyComponent,
              unit: "Hz",
            },
          ].map((feature) => (
            <div
              key={feature.label}
              className="rounded-xl border border-slate-800 bg-slate-950/60 p-5"
            >
              <p className="text-xs text-slate-500">{feature.label}</p>
              <p className="mt-3 break-words text-2xl font-bold text-cyan-400">
                {feature.value ?? "--"}
                {feature.unit && (
                  <span className="ml-2 text-sm font-normal text-slate-500">
                    {feature.unit}
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold">Signal Processing</p>
          <p className="mt-1 text-sm text-slate-500">
            Process the samples collected during sensor acquisition.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={processSignal}
            disabled={processing || rawSignal.length === 0}
            className={
              processing || rawSignal.length === 0
                ? "cursor-not-allowed rounded-xl border border-slate-800 bg-slate-900 px-6 py-3 text-sm font-semibold text-slate-600"
                : "rounded-xl bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all duration-300 hover:scale-105 hover:bg-cyan-300 hover:shadow-[0_0_30px_rgba(34,211,238,0.3)] active:scale-95"
            }
          >
            {processing ? "Processing..." : "Process Signal"}
          </button>

          <button
            onClick={() => navigate("/prediction")}
            disabled={signal.status !== "PROCESSED"}
            className={
              signal.status !== "PROCESSED"
                ? "cursor-not-allowed rounded-xl border border-slate-800 bg-slate-900 px-6 py-3 text-sm font-semibold text-slate-600"
                : "rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-6 py-3 text-sm font-semibold text-cyan-400 transition-all duration-300 hover:scale-105 hover:bg-cyan-500/20 active:scale-95"
            }
          >
            Continue to AI →
          </button>
        </div>
      </div>

      {/* Notice */}
      <div className="mt-8 rounded-xl border border-amber-500/10 bg-amber-500/5 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-400/80">
          Prototype Data Notice
        </p>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          The current sensor stream is simulated. Baseline removal and feature
          calculations are demonstration logic, not a validated EIS signal
          processing pipeline. Clinical interpretation is not supported.
        </p>
      </div>
    </div>
  );
}

export default SignalAnalysis;
