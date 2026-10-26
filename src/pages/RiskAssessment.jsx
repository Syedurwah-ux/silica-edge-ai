
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

function RiskAssessment() {
  const navigate = useNavigate();

  const {
    worker,
    sensor,
    signal,
    prediction,
    risk,
    setRisk,
    sensorSession,
    assessmentContext,
  } = useApp();

  const [dustLevel, setDustLevel] = useState(50);
  const [pollutionLevel, setPollutionLevel] = useState(40);
  const [ventilation, setVentilation] = useState("moderate");
  const [error, setError] = useState("");

  const patientId =
    sensorSession?.patientId ?? assessmentContext?.patientId ?? null;

  const visitId =
    sensorSession?.visitId ?? assessmentContext?.visitId ?? null;

  const assessmentId =
    sensorSession?.assessmentId ??
    assessmentContext?.assessmentId ??
    null;

  const hasPatientContext = Boolean(patientId && visitId);

  const currentSignalKey = useMemo(() => {
    if (!signal?.processed || !signal?.features) return null;

    return [
      patientId ?? "no-patient",
      visitId ?? "no-visit",
      signal.features.sampleCount ?? 0,
      signal.sourceSignature ?? "no-signature",
    ].join("|");
  }, [patientId, visitId, signal]);

  const signalIsCurrent =
    Boolean(currentSignalKey) &&
    signal?.processed === true &&
    signal?.status === "PROCESSED" &&
    signal?.patientId === patientId &&
    signal?.visitId === visitId &&
    Array.isArray(signal?.processedSignal) &&
    signal.processedSignal.length >= 2 &&
    Boolean(signal?.features);

  const predictionIsCurrent =
    prediction?.contextKey === currentSignalKey &&
    Boolean(prediction?.result);

  // Invalidate a demo risk score if its underlying signal changes.
  useEffect(() => {
    setRisk((previous) => {
      if (
        previous?.contextKey &&
        previous.contextKey !== currentSignalKey
      ) {
        return {
          score: null,
          level: null,
          factors: [],
        };
      }

      return previous;
    });
  }, [currentSignalKey, setRisk]);

  const riskIsCurrent =
    signalIsCurrent &&
    risk?.contextKey === currentSignalKey &&
    Number.isFinite(Number(risk?.score));

  const displayPatient =
    sensorSession?.patient?.full_name ??
    sensorSession?.patient?.name ??
    (patientId ? `Patient #${patientId}` : "No patient selected");

  const latestSample = useMemo(() => {
    const samples = Array.isArray(sensorSession?.samples)
      ? sensorSession.samples
      : [];

    if (samples.length > 0) {
      return samples[samples.length - 1];
    }

    const history = Array.isArray(sensor?.history) ? sensor.history : [];

    return history.length > 0 ? history[history.length - 1] : null;
  }, [sensorSession?.samples, sensor?.history]);

  function calculateDemoRisk() {
    setError("");

    if (!hasPatientContext) {
      setError(
        "Select a patient and visit in Sensor Monitoring before calculating risk."
      );
      return;
    }

    if (!signalIsCurrent || !signal?.features) {
      setError(
        "Process the latest acquisition in Signal Analysis before calculating risk."
      );
      return;
    }

    const ventilationPenalty = {
      good: 0,
      moderate: 10,
      poor: 20,
    }[ventilation];

    // Illustrative software-demo formula only.
    // These weights are not clinically validated.
    const score = Math.round(
      dustLevel * 0.4 +
        pollutionLevel * 0.3 +
        ventilationPenalty
    );

    const boundedScore = Math.max(0, Math.min(100, score));

    let level = "LOW";

    if (boundedScore >= 65) {
      level = "HIGH";
    } else if (boundedScore >= 35) {
      level = "MODERATE";
    }

    const factors = [
      {
        name: "Dust exposure input",
        value: `${dustLevel}/100`,
      },
      {
        name: "Environmental pollution input",
        value: `${pollutionLevel}/100`,
      },
      {
        name: "Ventilation setting",
        value: ventilation.charAt(0).toUpperCase() + ventilation.slice(1),
      },
    ];

    setRisk({
      score: boundedScore,
      level,
      factors,
      source: "DEMO",
      contextKey: currentSignalKey,
      patientId,
      visitId,
      assessmentId,
      calculatedAt: new Date().toISOString(),
      inputs: {
        dustLevel,
        pollutionLevel,
        ventilation,
      },
      disclaimer: "Experimental demonstration only; not clinically validated.",
    });
  }

  const riskColor =
    riskIsCurrent && risk.level === "HIGH"
      ? "text-red-400"
      : riskIsCurrent && risk.level === "MODERATE"
        ? "text-amber-300"
        : "text-emerald-400";

  const cardClass =
    "rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:p-6";

  return (
    <main className="min-h-screen bg-slate-950 p-5 text-white md:p-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
            Edge-AI Monitoring System
          </p>

          <h1 className="mt-3 text-3xl font-bold md:text-4xl">
            Risk Assessment
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Review the active visit and explore an illustrative risk
            calculation using configurable environmental inputs.
          </p>
        </div>

        <span className="w-fit rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-300">
          DEMO MODE
        </span>
      </header>

      <section className={`${cardClass} mt-8`}>
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
            Legacy worker profile:{" "}
            {worker.name ?? worker.workerId ?? "Available"}
          </p>
        )}

        {!hasPatientContext && (
          <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200">
            No active patient visit. Return to Sensor Monitoring and select
            a patient and visit.
          </p>
        )}
      </section>

      {!signalIsCurrent && (
        <section className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200">
          The latest acquisition has not been processed. Open Signal
          Analysis and process the current samples before calculating risk.
        </section>
      )}

      {error && (
        <section
          role="alert"
          className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-200"
        >
          {error}
        </section>
      )}

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Current samples",
            value: signalIsCurrent
              ? signal.features.sampleCount
              : "—",
          },
          {
            label: "Mean impedance",
            value: signalIsCurrent
              ? `${Number(signal.features.meanImpedance).toFixed(2)} Ω`
              : "—",
          },
          {
            label: "Phase component",
            value: signalIsCurrent
              ? `${Number(signal.features.phaseComponent).toFixed(2)}°`
              : "—",
          },
          {
            label: "Latest sensor impedance",
            value:
              latestSample &&
              Number.isFinite(
                Number(
                  latestSample.impedance ??
                    latestSample.impedance_ohms
                )
              )
                ? `${Number(
                    latestSample.impedance ??
                      latestSample.impedance_ohms
                  ).toFixed(2)} Ω`
                : "—",
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

      <section className={`${cardClass} mt-6`}>
        <div>
          <h2 className="text-lg font-semibold">
            Environmental demo inputs
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Adjust the illustrative inputs below to see how the demo score
            changes. These values are not measurements from a calibrated
            environmental sensor.
          </p>
        </div>

        <div className="mt-7 space-y-7">
          <div>
            <div className="flex items-center justify-between gap-4">
              <label
                htmlFor="dust-level"
                className="text-sm font-medium text-slate-200"
              >
                Dust exposure input
              </label>

              <span className="font-semibold text-cyan-400">
                {dustLevel}/100
              </span>
            </div>

            <input
              id="dust-level"
              type="range"
              min="0"
              max="100"
              value={dustLevel}
              onChange={(event) =>
                setDustLevel(Number(event.target.value))
              }
              className="mt-4 w-full accent-cyan-400"
            />

            <div className="mt-1 flex justify-between text-xs text-slate-500">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-4">
              <label
                htmlFor="pollution-level"
                className="text-sm font-medium text-slate-200"
              >
                Environmental pollution input
              </label>

              <span className="font-semibold text-cyan-400">
                {pollutionLevel}/100
              </span>
            </div>

            <input
              id="pollution-level"
              type="range"
              min="0"
              max="100"
              value={pollutionLevel}
              onChange={(event) =>
                setPollutionLevel(Number(event.target.value))
              }
              className="mt-4 w-full accent-cyan-400"
            />

            <div className="mt-1 flex justify-between text-xs text-slate-500">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          <div>
            <label
              htmlFor="ventilation"
              className="text-sm font-medium text-slate-200"
            >
              Ventilation setting
            </label>

            <select
              id="ventilation"
              value={ventilation}
              onChange={(event) => setVentilation(event.target.value)}
              className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
            >
              <option value="good">Good</option>
              <option value="moderate">Moderate</option>
              <option value="poor">Poor</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={calculateDemoRisk}
          disabled={!hasPatientContext || !signalIsCurrent}
          className="mt-7 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Calculate Demo Risk Score
        </button>
      </section>

      <section className={`${cardClass} mt-6`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Risk score overview</h2>
            <p className="mt-1 text-sm text-slate-500">
              The score is an illustrative calculation, not a clinical risk
              estimate.
            </p>
          </div>

          {riskIsCurrent && (
            <span className="w-fit rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
              Current signal
            </span>
          )}
        </div>

        {riskIsCurrent ? (
          <>
            <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-32 w-32 shrink-0 flex-col items-center justify-center rounded-full border-4 border-slate-700">
                <span className={`text-4xl font-bold ${riskColor}`}>
                  {risk.score}
                </span>
                <span className="mt-1 text-xs text-slate-500">
                  out of 100
                </span>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Demo category
                </p>

                <h3 className={`mt-2 text-2xl font-bold ${riskColor}`}>
                  {risk.level}
                </h3>

                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                  This category is generated by the demonstration formula
                  and must not be used for medical or workplace safety
                  decisions.
                </p>
              </div>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(risk.factors ?? []).map((factor, index) => (
                <div
                  key={`${factor.name}-${index}`}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"
                >
                  <p className="text-xs text-slate-500">{factor.name}</p>
                  <p className="mt-2 font-semibold text-slate-200">
                    {factor.value}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-5 text-xs text-slate-500">
              Calculated:{" "}
              {risk.calculatedAt
                ? new Date(risk.calculatedAt).toLocaleString()
                : "—"}
            </p>
          </>
        ) : (
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/50 p-6 text-center">
            <p className="font-medium text-slate-300">
              No current risk score
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Process the current signal and calculate the demo score to
              see the result here.
            </p>
          </div>
        )}
      </section>

      <section className={`${cardClass} mt-6`}>
        <h2 className="text-lg font-semibold">Workflow navigation</h2>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate("/sensor")}
            className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-500/50 hover:bg-slate-800"
          >
            Sensor Monitoring
          </button>

          <button
            type="button"
            onClick={() => navigate("/analysis")}
            className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-500/50 hover:bg-slate-800"
          >
            Signal Analysis
          </button>

          <button
            type="button"
            onClick={() => navigate("/prediction")}
            className="rounded-xl border border-cyan-500/30 px-5 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/10"
          >
            AI Prediction
          </button>
        </div>
      </section>

      <p className="mt-6 rounded-xl border border-amber-500/10 bg-amber-500/5 p-4 text-xs leading-5 text-slate-500">
        Prototype disclaimer: this page uses simulated sensor data and
        manually adjustable demo inputs. The score and categories are not
        clinically validated, do not represent a diagnosis, and must not
        guide medical treatment or workplace safety decisions.
      </p>
    </main>
  );
}

export default RiskAssessment;
