
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

// Safely convert values into something React can render.
const safeValue = (value, fallback = "Not available") => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return fallback;
    }
  }

  return String(value);
};

const formatNumber = (value, digits = 2) => {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    typeof value === "object"
  ) {
    return "—";
  }

  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(digits) : "—";
};

const getValue = (object, keys, fallback = "Not available") => {
  for (const key of keys) {
    const value = object?.[key];

    if (value !== null && value !== undefined && value !== "") {
      return value;
    }
  }

  return fallback;
};

const getTextValue = (object, keys, fallback = "Not available") => {
  return safeValue(getValue(object, keys, fallback), fallback);
};

const isAvailable = (value) =>
  value !== null && value !== undefined && value !== "";

function InfoCard({ label, value, detail }) {
  return (
    <div className="print-card rounded-xl border border-slate-700 bg-slate-900/70 p-4">
      <p className="print-muted text-xs font-medium uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="print-text mt-2 break-words whitespace-pre-wrap text-lg font-semibold text-white">
        {safeValue(value)}
      </p>

      {detail && (
        <p className="print-muted mt-1 break-words whitespace-pre-wrap text-xs text-slate-400">
          {safeValue(detail)}
        </p>
      )}
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <section className="mb-6 break-inside-avoid rounded-2xl border border-slate-700 bg-slate-900/70 p-5 print-card">
      <div className="mb-4">
        <h2 className="print-text text-lg font-semibold text-white">
          {title}
        </h2>

        {subtitle && (
          <p className="print-muted mt-1 text-sm text-slate-400">
            {subtitle}
          </p>
        )}
      </div>

      {children}
    </section>
  );
}

function DataRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-800 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="print-muted text-sm text-slate-400">{label}</span>

      <span className="print-text whitespace-pre-wrap break-words text-sm font-medium text-slate-100 sm:text-right">
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
  const predictionState = app.prediction || {};
  const risk = app.risk || {};

  // The prediction state can contain both metadata and the actual API result.
  // Handle either shape without assuming every field is a string.
  const apiResponse =
    predictionState.result &&
    typeof predictionState.result === "object" &&
    !Array.isArray(predictionState.result)
      ? predictionState.result
      : predictionState;

  const reportId = useMemo(() => {
    const stamp = new Date()
      .toISOString()
      .replace(/[-:TZ.]/g, "")
      .slice(0, 14);

    return `SEA-${stamp}`;
  }, []);

  const generatedAt = useMemo(() => new Date(), []);

  const workerName = getTextValue(
    worker,
    ["name", "workerName", "fullName"],
    "Demo Worker"
  );

  const workerId = getTextValue(
    worker,
    ["workerId", "id", "employeeId"],
    "DEMO-001"
  );

  const sensorStatus = getTextValue(sensor, ["status"], "SIMULATED");
  const deviceId = getTextValue(
    sensor,
    ["deviceId", "id"],
    "Demo Sensor"
  );

  const impedance = getValue(sensor, ["impedance"], null);
  const phase = getValue(sensor, ["phase"], null);
  const frequency = getValue(sensor, ["frequency"], null);
  const samples = getValue(sensor, ["samples"], null);

  const predictionStatus = getTextValue(
    apiResponse,
    ["modelStatus", "status"],
    getTextValue(predictionState, ["status"], "MODEL_NOT_READY")
  );

  const predictionSource = getTextValue(
    predictionState,
    ["source"],
    "BACKEND"
  );

  // Prefer the actual prediction field from the API response.
  // Do not use the whole response object as a prediction label.
  const predictionOutput = getValue(
    apiResponse,
    ["prediction", "label", "className", "predictionLabel"],
    null
  );

  const predictionMessage = getValue(
    apiResponse,
    ["message", "detail"],
    getValue(
      predictionState,
      ["error"],
      "No backend message available."
    )
  );

  const receivedMeasurements = getValue(
    apiResponse,
    ["received_measurements"],
    null
  );

  const demoIndex = getValue(
    risk,
    ["demoIndex", "index", "score", "value"],
    null
  );

  const riskStatus = getTextValue(
    risk,
    ["status", "level", "category"],
    "DEMO ONLY"
  );

  const signalFeatures = [
    ["Signal quality", getValue(signal, ["quality", "signalQuality"])],
    ["Mean impedance", getValue(signal.features, ["meanImpedance"])],
    ["Mean phase", getValue(signal.features, ["meanPhase"])],
    ["Standard deviation", getValue(signal, ["std", "standardDeviation"])],
    ["RMS", getValue(signal, ["rms", "rootMeanSquare"])],
    ["Peak-to-peak", getValue(signal, ["peakToPeak", "peak_to_peak"])],
    [
      "Feature status",
      getValue(signal, ["status"], "Signal features may be unavailable"),
    ],
  ];

  const handlePrint = () => {
    window.print();
  };

  const displayPrediction = isAvailable(predictionOutput)
    ? safeValue(predictionOutput)
    : "Unavailable";

  const normalizedStatus = String(predictionStatus).toUpperCase();

  // A completed API request does not by itself prove that a trained,
  // validated model is ready.
  const hasPrediction = isAvailable(predictionOutput);

  const isModelReady =
    hasPrediction &&
    (normalizedStatus === "COMPLETED" ||
      normalizedStatus === "READY");

  const formattedDemoIndex =
    isAvailable(demoIndex) && Number.isFinite(Number(demoIndex))
      ? Number(demoIndex)
      : null;

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

          <button
            type="button"
            onClick={handlePrint}
            className="rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            Generate Demo Report / Print PDF
          </button>
        </div>

        <div
          id="assessment-report"
          className="rounded-2xl border border-slate-700 bg-slate-950 p-5 shadow-2xl shadow-black/20 sm:p-8"
        >
          <header className="mb-8 border-b border-slate-700 pb-6">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div>
                <div className="print-text mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cyan-300">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  Silica Edge-AI System
                </div>

                <h1 className="print-text text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Assessment Report
                </h1>

                <p className="print-muted mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  Sensor measurements, signal features, model status and
                  demonstration index for the current assessment session.
                </p>
              </div>

              <div className="print-card rounded-xl border border-slate-700 bg-slate-900 p-4">
                <p className="print-muted text-xs uppercase tracking-wider text-slate-400">
                  Report reference
                </p>

                <p className="print-text mt-1 break-words font-mono text-sm font-semibold text-cyan-300">
                  {reportId}
                </p>

                <p className="print-muted mt-3 text-xs text-slate-400">
                  Generated
                </p>

                <p className="print-text mt-1 text-sm text-white">
                  {generatedAt.toLocaleString()}
                </p>
              </div>
            </div>
          </header>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard
              label="Worker"
              value={workerName}
              detail={`ID: ${workerId}`}
            />

            <InfoCard
              label="Sensor"
              value={deviceId}
              detail={`Status: ${sensorStatus}`}
            />

            <InfoCard
              label="AI model"
              value={isModelReady ? "Prediction received" : "Not ready"}
              detail={`Status: ${predictionStatus}`}
            />

            <InfoCard
              label="Demo index"
              value={
                formattedDemoIndex !== null
                  ? `${formattedDemoIndex.toFixed(0)} / 100`
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
            <DataRow
              label="Report date"
              value={generatedAt.toLocaleDateString()}
            />
            <DataRow
              label="Report time"
              value={generatedAt.toLocaleTimeString()}
            />
          </Section>

          <Section
            title="2. Sensor Measurements"
            subtitle="Values captured by the interface. Simulated values must not be interpreted as validated hardware measurements."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <InfoCard
                label="Impedance"
                value={
                  isAvailable(impedance)
                    ? `${formatNumber(impedance)} Ω`
                    : "—"
                }
              />

              <InfoCard
                label="Phase"
                value={
                  isAvailable(phase)
                    ? `${formatNumber(phase)}°`
                    : "—"
                }
              />

              <InfoCard
                label="Frequency"
                value={
                  isAvailable(frequency)
                    ? `${formatNumber(frequency)} Hz`
                    : "—"
                }
              />
            </div>

            <div className="mt-4">
              <DataRow label="Sensor device" value={deviceId} />
              <DataRow label="Sensor state" value={sensorStatus} />
              <DataRow
                label="Samples recorded"
                value={
                  Array.isArray(samples)
                    ? samples.length
                    : samples
                }
              />
            </div>
          </Section>

          <Section
            title="3. Signal Analysis"
            subtitle="Feature values from the current application state; unavailable features are shown as such."
          >
            {signalFeatures.map(([label, value]) => (
              <DataRow key={label} label={label} value={value} />
            ))}

            {Array.isArray(signal.processedSignal) &&
              signal.processedSignal.length > 0 && (
                <DataRow
                  label="Processed signal points"
                  value={signal.processedSignal.length}
                />
              )}
          </Section>

          <Section
            title="4. AI Prediction Status"
            subtitle="A backend response is not the same as a validated prediction."
          >
            <div className="print-card mb-4 rounded-xl border border-slate-700 bg-slate-950 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="print-muted text-xs uppercase tracking-wider text-slate-400">
                    Prediction output
                  </p>

                  <p className="print-text mt-2 break-words whitespace-pre-wrap text-xl font-semibold text-white">
                    {displayPrediction}
                  </p>
                </div>

                <span className="print-text rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
                  {isModelReady
                    ? "PREDICTION RECEIVED"
                    : "NOT VALIDATED"}
                </span>
              </div>
            </div>

            <DataRow
              label="Prediction status"
              value={predictionStatus}
            />

            <DataRow
              label="Prediction source"
              value={predictionSource}
            />

            <DataRow
              label="Backend message"
              value={predictionMessage}
            />

            {receivedMeasurements !== null &&
              receivedMeasurements !== undefined && (
                <div className="mt-4">
                  <h3 className="print-text mb-2 text-sm font-semibold text-white">
                    Measurements received by backend
                  </h3>

                  <pre className="print-card overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs leading-5 text-slate-300">
                    {safeValue(receivedMeasurements)}
                  </pre>
                </div>
              )}

            {!isModelReady && (
              <p className="print-text mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm leading-6 text-amber-200">
                No validated model prediction is available for this report.
                A successful backend response may only confirm that
                measurements were received. Do not treat an unavailable
                output as a diagnosis or confirmed exposure-risk
                classification.
              </p>
            )}

            {apiResponse &&
              typeof apiResponse === "object" &&
              Object.keys(apiResponse).length > 0 && (
                <details className="no-print mt-4 rounded-lg border border-slate-700 p-3">
                  <summary className="cursor-pointer text-sm font-medium text-cyan-300">
                    View raw backend response
                  </summary>

                  <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-xs leading-5 text-slate-300">
                    {safeValue(apiResponse)}
                  </pre>
                </details>
              )}
          </Section>

          <Section
            title="5. Demonstration Index"
            subtitle="This index is a UI demonstration and is not a scientifically validated exposure or health-risk score."
          >
            <div className="print-card rounded-xl border border-slate-700 bg-slate-950 p-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="print-muted text-sm text-slate-400">
                    Demo index result
                  </p>

                  <p className="print-text mt-2 text-4xl font-bold text-cyan-300">
                    {formattedDemoIndex !== null
                      ? formattedDemoIndex.toFixed(0)
                      : "—"}

                    <span className="print-muted ml-2 text-base font-medium text-slate-400">
                      / 100
                    </span>
                  </p>
                </div>

                <span className="print-text rounded-full border border-slate-600 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-300">
                  {riskStatus}
                </span>
              </div>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-cyan-400"
                  style={{
                    width:
                      formattedDemoIndex !== null
                        ? `${Math.max(
                            0,
                            Math.min(100, formattedDemoIndex)
                          )}%`
                        : "0%",
                  }}
                />
              </div>

              <p className="print-muted mt-3 text-xs leading-5 text-slate-400">
                The displayed value is for demonstrating the interface
                only. It must not be used for workplace clearance, medical
                decisions or real-world risk classification.
              </p>
            </div>
          </Section>

          <Section
            title="6. System Summary"
            subtitle="Current software and data readiness."
          >
            <DataRow
              label="Frontend report"
              value="Generated from current session state"
            />

            <DataRow
              label="Sensor data source"
              value="May be simulated"
            />

            <DataRow
              label="Signal feature availability"
              value="Depends on current session state"
            />

            <DataRow
              label="Validated AI model"
              value={
                isModelReady
                  ? "A prediction value and ready/completed status were returned; model validation must be confirmed separately."
                  : "Unavailable or not validated"
              }
            />

            <DataRow
              label="Report classification"
              value="Demonstration report — not a medical or occupational diagnosis"
            />
          </Section>

          <footer className="border-t border-slate-700 pt-5">
            <h2 className="print-text text-sm font-semibold text-white">
              Important Disclaimer
            </h2>

            <p className="print-muted mt-2 text-xs leading-6 text-slate-400">
              This report is generated by a development demonstration of
              the Silica Edge-AI interface. Sensor values may be simulated,
              signal features may be incomplete, and the demonstration
              index is not validated. The report does not establish actual
              silica exposure, diagnose a health condition, or replace
              calibrated equipment, validated models, professional
              assessment or applicable workplace safety procedures.
            </p>

            <div className="print-muted mt-6 flex flex-col justify-between gap-2 text-xs text-slate-500 sm:flex-row">
              <span>Silica Edge-AI • Assessment Report</span>
              <span>{reportId}</span>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}
