
import { useEffect, useMemo, useState } from "react";
import { useApp } from "../context/AppContext";

function SensorPage() {
  const { worker, sensor, setSensor } = useApp();
  const [running, setRunning] = useState(false);

  const history = sensor.history || [];

  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      const impedance = Number(
        (1200 + Math.random() * 100).toFixed(2)
      );
      const phase = Number(
        (28 + Math.random() * 10).toFixed(2)
      );

      setSensor((current) => {
        const sampleNumber = (current.samples || 0) + 1;

        const sample = {
          sampleNumber,
          timestamp: Date.now(),
          impedance,
          phase,
        };

        return {
          ...current,
          status: "SIMULATED",
          source: "SIMULATED",
          impedance,
          phase,
          samples: sampleNumber,
          history: [
            ...(current.history || []),
            sample,
          ].slice(-60),
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [running, setSensor]);

  const waveformPoints = useMemo(() => {
    if (history.length < 2) {
      return "0,130 30,126 60,135 90,112 120,148 150,118 180,138 210,105 240,145 270,120 300,140 330,110 360,150 390,118 420,135 450,100 480,142 510,116 540,145 570,108 600,138 630,118 660,150 690,110 720,142 750,120 780,138 810,105 840,145 870,115 900,135 930,108 960,140 1000,125";
    }

    const min = 1200;
    const max = 1300;

    return history
      .map((sample, index) => {
        const x = (index / (history.length - 1)) * 1000;
        const normalized = Math.max(
          0,
          Math.min(1, (sample.impedance - min) / (max - min))
        );
        const y = 230 - normalized * 180;

        return `${x},${y}`;
      })
      .join(" ");
  }, [history]);

  function startSensor() {
    setRunning(true);
  }

  function stopSensor() {
    setRunning(false);

    setSensor((current) => ({
      ...current,
      status: "STANDBY",
    }));
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 p-8 text-white md:p-10">
      {/* Ambient Background */}
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
              Edge-AI Monitoring System
            </p>
          </div>

          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            Sensor Monitoring
          </h1>

          <p className="mt-3 max-w-2xl text-sm text-slate-400 md:text-base">
            Simulated impedance telemetry for the ESP32-S3 + AD5933
            prototype. Hardware readings will be integrated separately.
          </p>
        </div>

        {/* System Status */}
        <div
          className={
            running
              ? "flex items-center gap-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 px-6 py-4 shadow-[0_0_30px_rgba(34,211,238,0.08)]"
              : "flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 px-6 py-4"
          }
        >
          <div className="relative flex h-4 w-4 items-center justify-center">
            {running && (
              <span className="absolute h-4 w-4 animate-ping rounded-full bg-cyan-400 opacity-60" />
            )}

            <span
              className={
                running
                  ? "relative h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)]"
                  : "relative h-2.5 w-2.5 rounded-full bg-slate-600"
              }
            />
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">
              System Status
            </p>

            <p
              className={
                running
                  ? "mt-1 text-sm font-bold text-cyan-400"
                  : "mt-1 text-sm font-bold text-slate-300"
              }
            >
              {running ? "SIMULATION RUNNING" : "SIMULATION STOPPED"}
            </p>
          </div>
        </div>
      </div>

      {/* Worker + Device */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Active Worker
              </p>

              <p className="mt-2 text-xl font-semibold">
                {worker.name || "No worker selected"}
              </p>
            </div>

            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2">
              <p className="text-xs text-cyan-400">
                {worker.workerId || "WRK----"}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-400">
              {worker.occupation || "Occupation unavailable"}
            </span>

            <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-400">
              Exposure: {worker.exposureYears ?? "--"} years
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Acquisition Hardware
              </p>

              <p className="mt-2 text-xl font-semibold">
                ESP32-S3 + AD5933
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span className="text-xs text-amber-400">
                {running ? "SIMULATING" : "NOT CONNECTED"}
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-400">
              Device: {sensor.deviceId || "ESP32-001"}
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-400">
              I2C / EIS
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-[0_0_25px_rgba(34,211,238,0.08)]">
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Sensor Status
          </p>

          <p className="mt-4 text-2xl font-bold text-cyan-400">
            {sensor.status}
          </p>

          <div className="mt-4 h-1 overflow-hidden rounded-full bg-slate-800">
            <div
              className={
                running
                  ? "h-full w-full animate-pulse bg-cyan-400"
                  : "h-full w-1/4 bg-slate-600"
              }
            />
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Simulation state
          </p>
        </div>

        <div className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-[0_0_25px_rgba(34,211,238,0.08)]">
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Frequency
          </p>

          <p className="mt-4 text-3xl font-bold">
            {sensor.frequency ?? "--"}
            <span className="ml-2 text-sm font-normal text-slate-500">
              Hz
            </span>
          </p>

          <p className="mt-3 text-xs text-slate-500">
            Configured frequency
          </p>
        </div>

        <div className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-[0_0_25px_rgba(34,211,238,0.08)]">
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Impedance
          </p>

          <p className="mt-4 text-3xl font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.35)]">
            {sensor.impedance ?? "--"}
            <span className="ml-2 text-sm font-normal text-slate-500">
              Ω
            </span>
          </p>

          <p className="mt-3 text-xs text-slate-500">
            Latest simulated reading
          </p>
        </div>

        <div className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-[0_0_25px_rgba(34,211,238,0.08)]">
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Phase
          </p>

          <p className="mt-4 text-3xl font-bold">
            {sensor.phase ?? "--"}
            <span className="ml-2 text-sm font-normal text-slate-500">
              °
            </span>
          </p>

          <p className="mt-3 text-xs text-slate-500">
            Latest simulated phase
          </p>
        </div>
      </div>

      {/* Main Acquisition Panel */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
        <div className="flex flex-col gap-4 border-b border-slate-800 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold">
                Sensor Stream
              </span>

              {running && (
                <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                  Simulated
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Simulated impedance telemetry stream
            </p>
          </div>

          <div className="flex items-center gap-5">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                Samples
              </p>

              <p className="mt-1 text-xl font-bold text-cyan-400">
                {sensor.samples ?? 0}
              </p>
            </div>

            <div className="h-8 w-px bg-slate-800" />

            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                Stored
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-300">
                {history.length} / 60
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="relative h-72 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)",
                backgroundSize: "50px 50px",
              }}
            />

            <div className="absolute left-0 right-0 top-1/2 h-px bg-slate-800" />

            <svg
              viewBox="0 0 1000 260"
              preserveAspectRatio="none"
              className={
                running
                  ? "absolute inset-0 h-full w-full opacity-90"
                  : "absolute inset-0 h-full w-full opacity-30"
              }
            >
              <polyline
                points={waveformPoints}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-cyan-400"
              />
            </svg>

            {running && (
              <svg
                viewBox="0 0 1000 260"
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full opacity-30 blur-[5px]"
              >
                <polyline
                  points={waveformPoints}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  className="text-cyan-400"
                />
              </svg>
            )}

            {running && (
              <div className="absolute bottom-0 left-0 top-0 w-px animate-[sensorScan_3s_linear_infinite] bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.9)]" />
            )}

            <div className="absolute left-4 top-4 rounded-md border border-slate-800 bg-slate-950/80 px-3 py-1.5 text-[10px] uppercase tracking-wider text-slate-500">
              Simulated impedance trace
            </div>

            <div className="absolute bottom-4 left-4 text-[10px] uppercase tracking-wider text-slate-600">
              SAMPLE INDEX →
            </div>

            <div className="absolute right-4 top-4 text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-600">
                Stream
              </p>

              <p
                className={
                  running
                    ? "mt-1 text-xs font-semibold text-cyan-400"
                    : "mt-1 text-xs font-semibold text-slate-500"
                }
              >
                {running ? "GENERATING DATA" : "PAUSED"}
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
            Edge acquisition flow
          </h2>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          {[
            {
              number: "01",
              title: "AD5933",
              description: "Impedance acquisition",
            },
            {
              number: "02",
              title: "ESP32-S3",
              description: "Edge acquisition",
            },
            {
              number: "03",
              title: "Signal Processing",
              description: "Filtering + feature extraction",
            },
            {
              number: "04",
              title: "TinyML",
              description: "Planned edge inference",
            },
          ].map((item, index) => (
            <div
              key={item.number}
              className={
                running && index < 2
                  ? "rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4"
                  : "rounded-xl border border-slate-800 bg-slate-950/50 p-4"
              }
            >
              <p className="text-xs text-slate-500">{item.number}</p>
              <p className="mt-2 font-semibold">{item.title}</p>
              <p className="mt-1 text-xs text-slate-500">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-300">
            Acquisition Control
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Start the prototype stream to generate simulated readings.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={startSensor}
            disabled={running}
            className={
              running
                ? "cursor-not-allowed rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-6 py-3 text-sm font-semibold text-cyan-500"
                : "rounded-xl bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all duration-300 hover:scale-105 hover:bg-cyan-300 hover:shadow-[0_0_30px_rgba(34,211,238,0.3)] active:scale-95"
            }
          >
            {running ? "Simulation Running" : "Start Acquisition"}
          </button>

          <button
            type="button"
            onClick={stopSensor}
            disabled={!running}
            className={
              !running
                ? "cursor-not-allowed rounded-xl border border-slate-800 bg-slate-900 px-6 py-3 text-sm font-semibold text-slate-600"
                : "rounded-xl border border-slate-700 bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:border-cyan-500/40 hover:bg-slate-800 active:scale-95"
            }
          >
            Stop
          </button>
        </div>
      </div>

      {/* Prototype Notice */}
      <div className="mt-8 rounded-xl border border-amber-500/10 bg-amber-500/5 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-400/80">
          Prototype Data Notice
        </p>

        <p className="mt-2 text-xs leading-5 text-slate-500">
          All readings and waveform points on this page are simulated.
          The hardware is not connected by this interface, and the displayed
          values are not validated measurements or medical findings.
        </p>
      </div>

      <style>{`
        @keyframes sensorScan {
          0% {
            transform: translateX(0);
            opacity: 0;
          }

          10% {
            opacity: 1;
          }

          90% {
            opacity: 1;
          }

          100% {
            transform: translateX(100vw);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default SensorPage;
