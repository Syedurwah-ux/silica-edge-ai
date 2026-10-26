
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext";
import {
  Activity,
  BrainCircuit,
  ShieldCheck,
  UserRound,
  Radio,
  ArrowUpRight,
} from "lucide-react";

function Dashboard() {
  const { worker, sensor, prediction, risk } = useApp();

  // Safely handle missing or not-yet-registered data.
  const activeWorker = worker ?? {};
  const sensorData = sensor ?? {};
  const predictionData = prediction ?? {};
  const riskData = risk ?? {};

  const cards = [
    {
      title: "Active Worker",
      value: activeWorker.name || "None",
      subtitle: activeWorker.workerId
        ? `Worker ID: ${activeWorker.workerId}`
        : "Register or select a worker",
      icon: UserRound,
    },
    {
      title: "Sensor Status",
      value: sensorData.status || "STANDBY",
      subtitle:
        sensorData.source === "SIMULATED"
          ? "Simulation mode · No live readings"
          : `Device: ${sensorData.deviceId || "Not connected"}`,
      icon: Activity,
    },
    {
      title: "Edge AI",
      value:
        predictionData.status === "WAITING"
          ? "NOT READY"
          : predictionData.status || "NOT READY",
      subtitle: predictionData.modelVersion
        ? `Model: ${predictionData.modelVersion}`
        : "Awaiting a trained model",
      icon: BrainCircuit,
    },
    {
      title: "Risk Score",
      value: riskData.score ?? "—",
      subtitle: riskData.level || "No assessment available",
      icon: ShieldCheck,
    },
  ];

  const pipeline = [
    ["01", "SENSOR", "AD5933"],
    ["02", "SIGNAL", "FFT / Features"],
    ["03", "EDGE AI", "1D-CNN"],
    ["04", "RISK ENGINE", "Data Fusion"],
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated background grid */}
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Ambient glow */}
      <motion.div
        className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="relative z-10 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-end justify-between"
        >
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
              <span className="text-xs font-medium uppercase tracking-[0.25em] text-cyan-400">
                Edge Intelligence System
              </span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-white">
              Command Center
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Real-time silica exposure monitoring &amp; AI risk analysis
            </p>
          </div>

          <div className="hidden items-center gap-3 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-4 py-2 md:flex">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>

            <span className="text-xs font-medium text-emerald-400">
              DEMO MODE · AWAITING LIVE DATA
            </span>
          </div>
        </motion.div>

        {/* Statistics cards */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card, index) => {
            const Icon = card.icon;

            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                }}
                whileHover={{ y: -5, scale: 1.01 }}
                className="group relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl"
              >
                <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-400/10 blur-2xl" />
                </div>

                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-2.5">
                      <Icon size={19} className="text-cyan-400" />
                    </div>

                    <ArrowUpRight
                      size={17}
                      className="text-slate-600 transition-colors group-hover:text-cyan-400"
                    />
                  </div>

                  <p className="mt-5 text-xs uppercase tracking-wider text-slate-500">
                    {card.title}
                  </p>

                  <p className="mt-1 text-2xl font-bold text-white">
                    {card.value}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {card.subtitle}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Processing pipeline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">
                Processing Pipeline
              </p>

              <h2 className="mt-1 text-xl font-semibold text-white">
                Edge-AI Monitoring Flow
              </h2>
            </div>

            <Radio className="animate-pulse text-cyan-400" size={22} />
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {pipeline.map(([number, title, subtitle], index) => (
              <div key={title} className="relative">
                <motion.div
                  animate={{
                    boxShadow: [
                      "0 0 0px rgba(34,211,238,0)",
                      "0 0 25px rgba(34,211,238,0.12)",
                      "0 0 0px rgba(34,211,238,0)",
                    ],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: index * 0.6,
                  }}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 p-5"
                >
                  <span className="text-xs text-cyan-400">{number}</span>
                  <h3 className="mt-4 font-semibold text-white">{title}</h3>
                  <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
                </motion.div>

                {index < 3 && (
                  <div className="absolute -right-3 top-1/2 hidden h-px w-6 bg-cyan-400/30 md:block" />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bottom panels */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="grid gap-4 lg:grid-cols-2"
        >
          {/* Sensor telemetry */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-cyan-400/10 p-2">
                <Activity size={18} className="text-cyan-400" />
              </div>

              <div>
                <h3 className="font-semibold text-white">Sensor Telemetry</h3>
                <p className="text-xs text-slate-500">
                  {sensorData.status === "RUNNING"
                    ? "Acquisition in progress"
                    : "Waiting for ESP32-S3 data"}
                </p>
              </div>
            </div>

            <div className="mt-8 flex h-24 items-center justify-center rounded-xl border border-dashed border-slate-800">
              <p className="text-xs text-slate-600">
                {sensorData.samples
                  ? `${sensorData.samples} SAMPLES COLLECTED`
                  : "LIVE SIGNAL WILL APPEAR HERE"}
              </p>
            </div>
          </div>

          {/* AI inference */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-cyan-400/10 p-2">
                <BrainCircuit size={18} className="text-cyan-400" />
              </div>

              <div>
                <h3 className="font-semibold text-white">AI Inference</h3>
                <p className="text-xs text-slate-500">
                  Model status: awaiting a trained model
                </p>
              </div>
            </div>

            <div className="mt-8 flex h-24 items-center justify-center rounded-xl border border-dashed border-slate-800">
              <p className="text-xs text-slate-600">
                {predictionData.result
                  ? "INFERENCE RESULT AVAILABLE"
                  : "MODEL AWAITING INPUT"}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Dashboard;
