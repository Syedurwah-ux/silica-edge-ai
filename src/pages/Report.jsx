
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

const safeValue = (value, fallback = "Not available") => {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
};

const formatNumber = (value, digits = 2) => {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(digits) : "—";
};

const getValue = (object, keys, fallback = "Not available") => {
  for (const key of keys) {
    const value = object?.[key];
    if (value !== null && value !== undefined && value !== "") return value;
  }
  return fallback;
};

function InfoCard({ label, value, detail }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-2 break-words text-lg font-semibold text-white">
        {value}
      </p>
      {detail && <p className="mt-1 text-xs text-slate-400">{detail}</p>}
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <section className="mb-6 break-inside-avoid rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function DataRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-800 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="break-words text-sm font-medium text-slate-100 sm:text-right">
        {safeValue(value)}
      </span>
    </div>
  );
}

export default function Report() {
  const navigate = useNavigate();

  const app = useApp() || {};
  const worker = app.worker || {};
  const sensor = app.sensor || {};
  const signal = app.signal || {};
  const prediction = app.prediction || {};
  const risk = app.risk || {};

  const reportId = useMemo(() => {
    const stamp = new Date()
      .toISOString()
      .replace(/[-:TZ.]/g, "")
      .slice(0, 14);

    return `SEA-${stamp}`;
  }, []);

  const generatedAt = useMemo(() => new Date(), []);

  const workerName = getValue(
    worker,
    ["name", "workerName", "fullName", "id"],
    "Demo Worker"
  );

  const workerId = getValue(
    worker,
    ["workerId", "id", "employeeId"],
    "DEMO-001"
  );

  const sensorStatus = getValue(sensor, ["status"], "SIMULATED");
  const deviceId = getValue(sensor, ["deviceId", "id"], "Demo Sensor");

  const impedance = getValue(sensor, ["impedance"], null);
  const phase = getValue(sensor, ["phase"], null);
  const frequency = getValue(sensor, ["frequency"], null);
  const samples = getValue(sensor, ["samples"], null);

  const predictionStatus = getValue(
    prediction,
    ["status", "modelStatus"],
    "MODEL_NOT_READY"
  );

  const predictionSource = getValue(
    prediction,
    ["source"],
    "BACKEND"
  );

  const predictionLabel = getValue(
    prediction,
    ["label", "className", "predictionLabel", "result"],
    null
  );

  const predictionValue = getValue(
    prediction,
    ["prediction"],
    null
  );

  const predictionMessage = getValue(
    prediction,
    ["message", "detail"],
    "No validated model result is available."
  );

  const demoIndex = getValue(
    risk,
    ["demoIndex", "index", "score", "value"],
    null
  );

  const riskStatus = getValue(
    risk,
    ["status", "level", "category"],
    "DEMO ONLY"
  );

  const signalFeatures = [
    ["Signal quality", getValue(signal, ["quality", "signalQuality"])],
    ["Mean", getValue(signal, ["mean", "meanValue"])],
    ["Standard deviation", getValue(signal, ["std", "standardDeviation"])],
    ["RMS", getValue(signal, ["rms", "rootMeanSquare"])],
    ["Peak-to-peak", getValue(signal, ["peakToPeak", "peak_to_peak"])],
    ["Feature status", getValue(signal, ["status"], "Demo signal analysis")],
  ];

  const handlePrint = () => {
    window.print();
  };

  const displayPrediction =
    predictionLabel ??
    (predictionValue !== null && predictionValue !== "null"
      ? predictionValue
      : "Unavailable");

  const isModelReady =
    String(predictionStatus).toUpperCase() === "COMPLETED" ||
    String(predictionStatus).toUpperCase() === "READY";

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-10">
      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 12mm;
            }

            body {
              background: #ffffff !important;
              color: #111827 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            body * {
              visibility: hidden;
            }

            #assessment-report,
            #assessment-report * {
              visibility: visible;
            }

            #assessment-report {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 0;
              border: none;
              border-radius: 0;
              box-shadow: none;
              background: #ffffff !important;
              color: #111827 !important;
            }

            #assessment-report .print-card {
              background: #ffffff !important;
              border-color: #d1d5db !important;
            }

            #assessment-report .print-text {
              color: #111827 !important;
            }

            #assessment-report .print-muted {
              color: #4b5563 !important;
            }

            #assessment-report section {
              break-inside: avoid;
              page-break-inside: avoid;
            }

            .no-print {
              display: none !important;
            }
          }
        `}
      </style>

      <div className="mx-auto max-w-6xl">
        <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
          >
            ← Back
          </button>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Generate Demo Report / Print PDF
            </button>
          </div>
        </div>

        <div
          id="assessment-report"
          className="rounded-2xl border border-slate-700 bg-slate-950 p-5 shadow-2xl shadow-black/20 sm:p-8"
        >
          <header className="mb-8 border-b border-slate-700 pb-6">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cyan-300 print-text">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  Silica Edge-AI System
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-white print-text sm:text-4xl">
                  Assessment Report
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 print-muted">
                  Sensor measurements, signal features, model status and
                  demonstration index for the current assessment session.
                </p>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 print-card">
                <p className="text-xs uppercase tracking-wider text-slate-400 print-muted">
                  Report reference
                </p>
                <p className="mt-1 font-mono text-sm font-semibold text-cyan-300 print-text">
                  {reportId}
                </p>
                <p className="mt-3 text-xs text-slate-400 print-muted">
                  Generated
                </p>
                <p className="mt-1 text-sm text-white print-text">
                  {generatedAt.toLocaleString()}
                </p>
              </div>
            </div>
          </header>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard label="Worker" value={workerName} detail={`ID: ${workerId}`} />
            <InfoCard label="Sensor" value={deviceId} detail={`Status: ${sensorStatus}`} />
            <InfoCard
              label="AI model"
              value={isModelReady ? "Model response received" : "Not ready"}
              detail={`Status: ${predictionStatus}`}
            />
            <InfoCard
              label="Demo index"
              value={
                demoIndex !== null && demoIndex !== "null"
                  ? `${formatNumber(demoIndex, 0)} / 100`
                  : "Not calculated"
              }
              detail="Demonstration only"
            />
          </div>

          <Section
            title="1. Worker and Session Details"
            subtitle="Identification information available in the current application state."
          >
            <DataRow label="Worker name" value={workerName} />
            <DataRow label="Worker identifier" value={workerId} />
            <DataRow label="Report reference" value={reportId} />
            <DataRow label="Report date" value={generatedAt.toLocaleDateString()} />
            <DataRow label="Report time" value={generatedAt.toLocaleTimeString()} />
          </Section>

          <Section
            title="2. Sensor Measurements"
            subtitle="Values captured by the interface. Simulated values must not be interpreted as validated hardware measurements."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <InfoCard
                label="Impedance"
                value={impedance === null ? "—" : `${formatNumber(impedance)} Ω`}
              />
              <InfoCard
                label="Phase"
                value={phase === null ? "—" : `${formatNumber(phase)}°`}
              />
              <InfoCard
                label="Frequency"
                value={
                  frequency === null
                    ? "—"
                    : `${formatNumber(frequency)} Hz`
                }
              />
            </div>

            <div className="mt-4">
              <DataRow label="Sensor device" value={deviceId} />
              <DataRow label="Sensor state" value={sensorStatus} />
              <DataRow label="Samples recorded" value={samples} />
            </div>
          </Section>

          <Section
            title="3. Signal Analysis"
            subtitle="Feature values from the current application state; unavailable features are shown as such."
          >
            {signalFeatures.map(([label, value]) => (
              <DataRow key={label} label={label} value={value} />
            ))}
          </Section>

          <Section
            title="4. AI Prediction Status"
            subtitle="A backend response is not the same as a validated prediction."
          >
            <div className="mb-4 rounded-xl border border-slate-700 bg-slate-950 p-4 print-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400 print-muted">
                    Prediction output
                  </p>
                  <p className="mt-2 text-xl font-semibold text-white print-text">
                    {displayPrediction}
                  </p>
                </div>

                <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300 print-text">
                  {isModelReady ? "RESPONSE RECEIVED" : "MODEL NOT READY"}
                </span>
              </div>
            </div>

            <DataRow label="Prediction status" value={predictionStatus} />
            <DataRow label="Prediction source" value={predictionSource} />
            <DataRow label="Backend message" value={predictionMessage} />

            {!isModelReady && (
              <p className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm leading-6 text-amber-200 print-text">
                No validated model prediction is available for this report.
                Do not treat the unavailable output as a diagnosis or a
                confirmed exposure-risk classification.
              </p>
            )}
          </Section>

          <Section
            title="5. Demonstration Index"
            subtitle="This index is a UI demonstration and is not a scientifically validated exposure or health-risk score."
          >
            <div className="rounded-xl border border-slate-700 bg-slate-950 p-5 print-card">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-400 print-muted">
                    Demo index result
                  </p>
                  <p className="mt-2 text-4xl font-bold text-cyan-300 print-text">
                    {demoIndex !== null && demoIndex !== "null"
                      ? `${formatNumber(demoIndex, 0)}`
                      : "—"}
                    <span className="ml-2 text-base font-medium text-slate-400 print-muted">
                      / 100
                    </span>
                  </p>
                </div>

                <span className="rounded-full border border-slate-600 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-300 print-text">
                  {safeValue(riskStatus, "DEMO ONLY")}
                </span>
              </div>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-cyan-400"
                  style={{
                    width:
                      demoIndex !== null &&
                      demoIndex !== "null" &&
                      Number.isFinite(Number(demoIndex))
                        ? `${Math.max(0, Math.min(100, Number(demoIndex)))}%`
                        : "0%",
                  }}
                />
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-400 print-muted">
                The displayed value is for demonstrating the interface only.
                It must not be used for workplace clearance, medical decisions
                or real-world risk classification.
              </p>
            </div>
          </Section>

          <Section
            title="6. System Summary"
            subtitle="Current software and data readiness."
          >
            <DataRow label="Frontend report" value="Generated from current session state" />
            <DataRow label="Sensor data source" value="May be simulated" />
            <DataRow label="Signal feature availability" value="Depends on current session state" />
            <DataRow label="Validated AI model" value={isModelReady ? "Backend returned a ready/completed status; validation must be confirmed separately" : "Unavailable"} />
            <DataRow label="Report classification" value="Demonstration report — not a medical or occupational diagnosis" />
          </Section>

          <footer className="border-t border-slate-700 pt-5">
            <h2 className="text-sm font-semibold text-white print-text">
              Important Disclaimer
            </h2>
            <p className="mt-2 text-xs leading-6 text-slate-400 print-muted">
              This report is generated by a development demonstration of the
              Silica Edge-AI interface. Sensor values may be simulated, the
              signal features may be incomplete, and the demonstration index
              is not validated. The report does not establish actual silica
              exposure, diagnose a health condition, or replace calibrated
              equipment, validated models, professional assessment or
              applicable workplace safety procedures.
            </p>

            <div className="mt-6 flex flex-col justify-between gap-2 text-xs text-slate-500 print-muted sm:flex-row">
              <span>Silica Edge-AI • Assessment Report</span>
              <span>{reportId}</span>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}
