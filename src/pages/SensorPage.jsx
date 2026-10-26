
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useApp } from "../context/AppContext";
import {
  getPatients,
  getPatientVisits,
  saveSensorAssessment,
  getSensorAssessments,
} from "../api";

const SESSION_KEY = "aeroedge_sensor_session";

function readSession() {
  try {
    const value = sessionStorage.getItem(SESSION_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function normalizeSamples(samples) {
  if (!Array.isArray(samples)) return [];

  return samples.map((sample, index) => ({
    sampleNumber: Number(sample.sampleNumber ?? index + 1),
    timestamp:
      typeof sample.timestamp === "number"
        ? sample.timestamp
        : new Date(sample.timestamp ?? Date.now()).getTime(),
    impedance: Number(sample.impedance ?? sample.impedance_ohms ?? 0),
    phase: Number(sample.phase ?? sample.phase_degrees ?? 0),
  }));
}

function getPatientLabel(patient) {
  if (!patient) return "No patient selected";

  return (
    patient.full_name ||
    patient.name ||
    patient.patient_name ||
    patient.patient_code ||
    `Patient ${patient.id}`
  );
}

function SensorPage() {
  const {
    sensor,
    setSensor,
    auth,
    sensorSession,
    setSensorSession,
    setAssessmentContext,
    setWorker,
    setSignal,
    setPrediction,
    setRisk,
  } = useApp();

  const [running, setRunning] = useState(false);
  const [patients, setPatients] = useState([]);
  const [visits, setVisits] = useState([]);

  const [selectedPatientId, setSelectedPatientId] = useState(
    () => String(sensorSession?.patientId ?? readSession()?.patientId ?? "")
  );

  const [selectedVisitId, setSelectedVisitId] = useState(
    () => String(sensorSession?.visitId ?? readSession()?.visitId ?? "")
  );

  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [loadingAssessment, setLoadingAssessment] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Only restore the active collection from browser storage.
  // Historical database assessments are displayed separately below.
  const initialSession = readSession();

  const initialMatchesStoredSelection =
    String(initialSession?.patientId ?? "") ===
      String(sensorSession?.patientId ?? initialSession?.patientId ?? "") &&
    String(initialSession?.visitId ?? "") ===
      String(sensorSession?.visitId ?? initialSession?.visitId ?? "");

  const [sessionSamples, setSessionSamples] = useState(() =>
    normalizeSamples(
      initialMatchesStoredSelection
        ? sensorSession?.samples ?? initialSession?.samples ?? []
        : []
    )
  );

  const [sessionStartedAt, setSessionStartedAt] = useState(
    initialMatchesStoredSelection
      ? sensorSession?.startedAt ?? initialSession?.startedAt ?? null
      : null
  );

  const [sessionStoppedAt, setSessionStoppedAt] = useState(
    initialMatchesStoredSelection
      ? sensorSession?.stoppedAt ?? initialSession?.stoppedAt ?? null
      : null
  );

  const [saved, setSaved] = useState(
    initialMatchesStoredSelection
      ? Boolean(sensorSession?.saved ?? initialSession?.saved)
      : false
  );

  const [assessmentId, setAssessmentId] = useState(
    initialMatchesStoredSelection
      ? sensorSession?.assessmentId ?? initialSession?.assessmentId ?? null
      : null
  );

  const [historicalAssessments, setHistoricalAssessments] = useState([]);

  const sessionSamplesRef = useRef(sessionSamples);
  const sessionStartedAtRef = useRef(sessionStartedAt);
  const sessionStoppedAtRef = useRef(sessionStoppedAt);
  const sampleCounterRef = useRef(sessionSamples.length);
  const savedRef = useRef(saved);
  const assessmentIdRef = useRef(assessmentId);

  const history = sensor.history || [];

  const selectedPatient = useMemo(
    () =>
      patients.find(
        (patient) => String(patient.id) === String(selectedPatientId)
      ) || null,
    [patients, selectedPatientId]
  );

  const selectedVisit = useMemo(
    () =>
      visits.find(
        (visit) => String(visit.id) === String(selectedVisitId)
      ) || null,
    [visits, selectedVisitId]
  );

  const persistSession = useCallback(
    (overrides = {}) => {
      const current = {
        patientId: selectedPatientId,
        visitId: selectedVisitId,
        patient: selectedPatient,
        samples: sessionSamplesRef.current,
        startedAt: sessionStartedAtRef.current,
        stoppedAt: sessionStoppedAtRef.current,
        saved: savedRef.current,
        assessmentId: assessmentIdRef.current,
        ...overrides,
      };

      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(current));
      } catch {
        // The React context remains available during navigation.
      }

      setSensorSession(current);
    },
    [
      selectedPatientId,
      selectedVisitId,
      selectedPatient,
      setSensorSession,
    ]
  );

  // Keep the shared patient/visit context synchronised for all pages.
  useEffect(() => {
    if (!selectedPatientId || !selectedVisitId || !selectedPatient) {
      return;
    }

    const patientCode =
      selectedPatient.patient_code ??
      selectedPatient.employee_id ??
      selectedPatient.id;

    setWorker({
      ...selectedPatient,
      id: selectedPatient.id,
      patientId: selectedPatient.id,
      workerId: String(patientCode),
      name: getPatientLabel(selectedPatient),
      age: selectedPatient.age ?? null,
      occupation: selectedPatient.occupation ?? null,
      exposureYears: selectedPatient.exposure_years ?? null,
      workLocation:
        selectedPatient.work_location ??
        selectedPatient.location ??
        null,
    });

    setSensorSession((current) => ({
      ...current,
      patientId: String(selectedPatientId),
      visitId: String(selectedVisitId),
      patient: selectedPatient,
      samples: sessionSamplesRef.current,
      startedAt: sessionStartedAtRef.current,
      stoppedAt: sessionStoppedAtRef.current,
      saved: savedRef.current,
      assessmentId: assessmentIdRef.current,
    }));

    setAssessmentContext((current) => ({
      ...current,
      patientId: Number(selectedPatientId),
      visitId: Number(selectedVisitId),
      assessmentId:
        String(current?.patientId) === String(selectedPatientId) &&
        String(current?.visitId) === String(selectedVisitId)
          ? current.assessmentId
          : null,
    }));
  }, [
    selectedPatientId,
    selectedVisitId,
    selectedPatient,
    setWorker,
    setSensorSession,
    setAssessmentContext,
  ]);

  const resetProcessingResults = useCallback(() => {
    setSignal({
      status: "WAITING",
      processed: false,
      features: null,
      rawSignal: [],
      processedSignal: [],
      patientId: null,
      visitId: null,
    });

    setPrediction({
      status: "WAITING",
      loading: false,
      result: null,
      error: null,
      patientId: null,
      visitId: null,
      assessmentId: null,
    });

    setRisk({
      score: null,
      level: null,
      factors: [],
      patientId: null,
      visitId: null,
      assessmentId: null,
    });
  }, [setSignal, setPrediction, setRisk]);

  const loadPatients = useCallback(async () => {
    if (!auth?.token) {
      setError("Your session is missing. Please sign in again.");
      return;
    }

    setLoadingPatients(true);
    setError("");

    try {
      const data = await getPatients(auth.token);
      const patientList = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : [];

      setPatients(patientList);

      setSelectedPatientId((currentId) => {
        const preferredId =
          currentId ||
          sensorSession?.patientId ||
          readSession()?.patientId ||
          "";

        return patientList.some(
          (patient) => String(patient.id) === String(preferredId)
        )
          ? String(preferredId)
          : "";
      });
    } catch (err) {
      setError(err.message || "Could not load patients.");
    } finally {
      setLoadingPatients(false);
    }
  }, [auth?.token, sensorSession?.patientId]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  // Load visits whenever the selected patient changes.
  useEffect(() => {
    if (!auth?.token || !selectedPatientId) {
      setVisits([]);
      setSelectedVisitId("");
      return;
    }

    let cancelled = false;

    async function loadVisits() {
      setLoadingVisits(true);
      setError("");

      try {
        const data = await getPatientVisits(
          auth.token,
          selectedPatientId
        );

        if (cancelled) return;

        const visitList = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : [];

        setVisits(visitList);

        setSelectedVisitId((currentId) => {
          const preferredId =
            currentId ||
            sensorSession?.visitId ||
            readSession()?.visitId ||
            "";

          return visitList.some(
            (visit) => String(visit.id) === String(preferredId)
          )
            ? String(preferredId)
            : "";
        });
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not load patient visits.");
        }
      } finally {
        if (!cancelled) setLoadingVisits(false);
      }
    }

    loadVisits();

    return () => {
      cancelled = true;
    };
  }, [auth?.token, selectedPatientId]);

  // Load historical assessments as history only.
  // Never place historical samples into the active collection automatically.
  useEffect(() => {
    if (!auth?.token || !selectedPatientId || !selectedVisitId) {
      setHistoricalAssessments([]);
      return;
    }

    let cancelled = false;

    async function loadHistoricalAssessments() {
      setLoadingAssessment(true);

      try {
        const result = await getSensorAssessments(auth.token, {
          visit_id: selectedVisitId,
          patient_id: selectedPatientId,
          limit: 10,
        });

        if (cancelled) return;

        const assessments = Array.isArray(result)
          ? result
          : Array.isArray(result?.items)
            ? result.items
            : [];

        setHistoricalAssessments(assessments);
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || "Could not load saved assessment history."
          );
        }
      } finally {
        if (!cancelled) setLoadingAssessment(false);
      }
    }

    loadHistoricalAssessments();

    return () => {
      cancelled = true;
    };
  }, [auth?.token, selectedPatientId, selectedVisitId]);

  // Keep the active session persisted as it changes.
  useEffect(() => {
    persistSession();
  }, [
    persistSession,
    sessionSamples,
    sessionStartedAt,
    sessionStoppedAt,
    saved,
    assessmentId,
  ]);

  // Simulated acquisition stream.
  useEffect(() => {
    if (!running) return undefined;

    const interval = setInterval(() => {
      if (sampleCounterRef.current >= 1000) {
        const stoppedAt = new Date().toISOString();

        sessionStoppedAtRef.current = stoppedAt;
        setSessionStoppedAt(stoppedAt);
        setRunning(false);

        setSensor((current) => ({
          ...current,
          status: "STANDBY",
        }));

        persistSession({ stoppedAt });

        setMessage(
          "The 1,000-sample limit was reached. Save the completed session when ready."
        );
        return;
      }

      const sampleNumber = sampleCounterRef.current + 1;

      const sample = {
        sampleNumber,
        timestamp: Date.now(),
        impedance: Number((1200 + Math.random() * 100).toFixed(2)),
        phase: Number((28 + Math.random() * 10).toFixed(2)),
      };

      sampleCounterRef.current = sampleNumber;

      const updatedSamples = [...sessionSamplesRef.current, sample];

      sessionSamplesRef.current = updatedSamples;
      setSessionSamples(updatedSamples);

      setSensor((current) => ({
        ...current,
        status: "SIMULATED",
        source: "SIMULATED",
        impedance: sample.impedance,
        phase: sample.phase,
        samples: sampleNumber,
        history: [...(current.history || []), sample].slice(-60),
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [running, setSensor, persistSession]);

  const waveformPoints = useMemo(() => {
    if (history.length < 2) {
      return "0,130 30,126 60,135 90,112 120,148 150,118 180,138 210,105 240,145 270,120 300,140 330,110 360,150 390,118 420,135 450,100 480,142 510,116 540,145 570,108 600,138 630,118 660,150 690,110 720,142 750,120 780,138 810,105 840,145 870,115 900,135 930,108 960,140 1000,125";
    }

    const min = Math.min(...history.map((sample) => sample.impedance));
    const max = Math.max(...history.map((sample) => sample.impedance));
    const range = max - min || 1;

    return history
      .map((sample, index) => {
        const x = (index / (history.length - 1)) * 1000;
        const normalized = (sample.impedance - min) / range;
        const y = 230 - normalized * 180;

        return `${x},${y}`;
      })
      .join(" ");
  }, [history]);

  function startSensor() {
    if (!auth?.token) {
      setError("Your session has expired. Please sign in again.");
      return;
    }

    if (!selectedPatientId || !selectedVisitId) {
      setError("Select a patient and visit before starting acquisition.");
      return;
    }

    const startedAt = new Date().toISOString();

    // Always start a brand-new active collection.
    // Existing database assessments are not deleted.
    sessionSamplesRef.current = [];
    sampleCounterRef.current = 0;
    sessionStartedAtRef.current = startedAt;
    sessionStoppedAtRef.current = null;
    savedRef.current = false;
    assessmentIdRef.current = null;

    setSessionSamples([]);
    setSessionStartedAt(startedAt);
    setSessionStoppedAt(null);
    setSaved(false);
    setAssessmentId(null);
    setError("");
    setMessage("Simulation started. No physical sensor is connected.");

    resetProcessingResults();

    setAssessmentContext({
      patientId: Number(selectedPatientId),
      visitId: Number(selectedVisitId),
      assessmentId: null,
      savedAt: null,
    });

    setSensor((current) => ({
      ...current,
      status: "SIMULATED",
      source: "SIMULATED",
      samples: 0,
      impedance: null,
      phase: null,
      history: [],
    }));

    persistSession({
      patientId: String(selectedPatientId),
      visitId: String(selectedVisitId),
      patient: selectedPatient,
      samples: [],
      startedAt,
      stoppedAt: null,
      saved: false,
      assessmentId: null,
    });

    setRunning(true);
  }

  function stopSensor() {
    if (!running) return;

    setRunning(false);

    const stoppedAt = new Date().toISOString();

    sessionStoppedAtRef.current = stoppedAt;
    setSessionStoppedAt(stoppedAt);

    setSensor((current) => ({
      ...current,
      status: "STANDBY",
    }));

    persistSession({ stoppedAt });

    setMessage(
      sessionSamplesRef.current.length > 0
        ? "Simulation stopped. Review the session and save it to the selected visit."
        : "Simulation stopped without collecting samples."
    );
  }

  async function handleSaveAssessment() {
    if (running) {
      setError("Stop the simulation before saving.");
      return;
    }

    if (saving) return;

    if (!auth?.token) {
      setError("Your session has expired. Please sign in again.");
      return;
    }

    if (!selectedPatientId || !selectedVisitId) {
      setError("Select a patient and visit before saving.");
      return;
    }

    if (
      !sessionStartedAtRef.current ||
      !sessionStoppedAtRef.current ||
      sessionSamplesRef.current.length === 0
    ) {
      setError("Complete a session before saving.");
      return;
    }

    if (savedRef.current) {
      setError("This session has already been saved.");
      return;
    }

    const samples = [...sessionSamplesRef.current];
    const latest = samples[samples.length - 1];

    setSaving(true);
    setError("");
    setMessage("");

    try {
      // Preserve the existing backend payload.
      const record = await saveSensorAssessment(auth.token, {
        visit_id: Number(selectedVisitId),
        impedance_ohms: latest.impedance,
        phase_degrees: latest.phase,
        samples,
        started_at: sessionStartedAtRef.current,
        completed_at: sessionStoppedAtRef.current,
      });

      savedRef.current = true;
      assessmentIdRef.current = record.id ?? null;

      setSaved(true);
      setAssessmentId(record.id ?? null);

      const context = {
        patientId: Number(selectedPatientId),
        visitId: Number(selectedVisitId),
        assessmentId: record.id ?? null,
        savedAt: record.created_at ?? new Date().toISOString(),
      };

      setAssessmentContext(context);

      persistSession({
        patientId: String(selectedPatientId),
        visitId: String(selectedVisitId),
        patient: selectedPatient,
        samples,
        startedAt: sessionStartedAtRef.current,
        stoppedAt: sessionStoppedAtRef.current,
        saved: true,
        assessmentId: record.id ?? null,
      });

      setMessage(
        `Simulated assessment saved successfully with ${samples.length} samples.`
      );

      // Refresh history so the new saved record appears immediately.
      try {
        const result = await getSensorAssessments(auth.token, {
          visit_id: selectedVisitId,
          patient_id: selectedPatientId,
          limit: 10,
        });

        const assessments = Array.isArray(result)
          ? result
          : Array.isArray(result?.items)
            ? result.items
            : [];

        setHistoricalAssessments(assessments);
      } catch {
        // Saving succeeded; a history-refresh failure should not undo it.
      }
    } catch (err) {
      setError(err.message || "Could not save the assessment.");
    } finally {
      setSaving(false);
    }
  }

  function handlePatientChange(event) {
    const nextPatientId = event.target.value;

    setSelectedPatientId(nextPatientId);
    setSelectedVisitId("");
    setVisits([]);
    setHistoricalAssessments([]);
    setError("");
    setMessage("");

    // Prevent the previous patient's session from appearing under a new patient.
    sessionSamplesRef.current = [];
    sampleCounterRef.current = 0;
    sessionStartedAtRef.current = null;
    sessionStoppedAtRef.current = null;
    savedRef.current = false;
    assessmentIdRef.current = null;

    setSessionSamples([]);
    setSessionStartedAt(null);
    setSessionStoppedAt(null);
    setSaved(false);
    setAssessmentId(null);

    setSensor((current) => ({
      ...current,
      status: "STANDBY",
      samples: 0,
      impedance: null,
      phase: null,
      history: [],
    }));

    resetProcessingResults();
    setAssessmentContext({
      patientId: nextPatientId ? Number(nextPatientId) : null,
      visitId: null,
      assessmentId: null,
      savedAt: null,
    });
  }

  function handleVisitChange(event) {
    const nextVisitId = event.target.value;

    setSelectedVisitId(nextVisitId);
    setHistoricalAssessments([]);
    setError("");
    setMessage("");

    // Changing visits creates a clean active collection.
    sessionSamplesRef.current = [];
    sampleCounterRef.current = 0;
    sessionStartedAtRef.current = null;
    sessionStoppedAtRef.current = null;
    savedRef.current = false;
    assessmentIdRef.current = null;

    setSessionSamples([]);
    setSessionStartedAt(null);
    setSessionStoppedAt(null);
    setSaved(false);
    setAssessmentId(null);

    setSensor((current) => ({
      ...current,
      status: "STANDBY",
      samples: 0,
      impedance: null,
      phase: null,
      history: [],
    }));

    resetProcessingResults();
    setAssessmentContext({
      patientId: selectedPatientId ? Number(selectedPatientId) : null,
      visitId: nextVisitId ? Number(nextVisitId) : null,
      assessmentId: null,
      savedAt: null,
    });
  }

  const inputClass =
    "w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60 disabled:cursor-not-allowed disabled:opacity-50";

  const occupation = selectedPatient?.occupation?.trim() || "Not provided";
  const exposureYears = selectedPatient?.exposure_years;

  const hasExposureYears =
    exposureYears !== null &&
    exposureYears !== undefined &&
    exposureYears !== "";

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 p-5 text-white md:p-10">
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
            Simulated impedance telemetry for the ESP32-S3 + AD5933 prototype.
            Hardware readings will be integrated separately.
          </p>
        </div>

        <div className={`flex items-center gap-4 rounded-2xl border px-6 py-4 ${running ? "border-cyan-500/30 bg-cyan-500/5 shadow-[0_0_30px_rgba(34,211,238,0.08)]" : "border-slate-800 bg-slate-900/70"}`}>
          <span className={`h-2.5 w-2.5 rounded-full ${running ? "bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)]" : "bg-slate-600"}`} />
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">System Status</p>
            <p className={`mt-1 text-sm font-bold ${running ? "text-cyan-400" : "text-slate-300"}`}>
              {running ? "SIMULATION RUNNING" : "SIMULATION STOPPED"}
            </p>
          </div>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm md:p-6">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">Assessment Context</p>
          <h2 className="mt-2 text-xl font-semibold">Select patient and visit</h2>
          <p className="mt-1 text-sm text-slate-500">
            Historical assessments remain saved in the database. Starting acquisition creates a new collection for this visit.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="sensor-patient" className="mb-2 block text-xs font-medium text-slate-400">Patient</label>
            <select
              id="sensor-patient"
              value={selectedPatientId}
              disabled={running || saving || loadingPatients}
              onChange={handlePatientChange}
              className={inputClass}
            >
              <option value="">{loadingPatients ? "Loading patients..." : "Choose a patient"}</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.patient_code || `PAT-${patient.id}`} — {getPatientLabel(patient)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={loadPatients}
              disabled={loadingPatients || running || saving}
              className="mt-2 text-xs text-cyan-400 transition hover:text-cyan-300 disabled:opacity-50"
            >
              {loadingPatients ? "Refreshing..." : "Refresh patient list"}
            </button>
          </div>

          <div>
            <label htmlFor="sensor-visit" className="mb-2 block text-xs font-medium text-slate-400">Patient visit</label>
            <select
              id="sensor-visit"
              value={selectedVisitId}
              disabled={running || saving || !selectedPatientId || loadingVisits}
              onChange={handleVisitChange}
              className={inputClass}
            >
              <option value="">
                {!selectedPatientId ? "Select a patient first" : loadingVisits ? "Loading visits..." : "Choose a visit"}
              </option>
              {visits.map((visit) => (
                <option key={visit.id} value={visit.id}>
                  Visit #{visit.id} · {visit.visited_at ? new Date(visit.visited_at).toLocaleDateString() : "Date unavailable"} · {visit.assessment_status || "pending"}
                </option>
              ))}
            </select>
            {selectedPatientId && !loadingVisits && visits.length === 0 && (
              <p className="mt-2 text-xs text-amber-400">
                No visits found. Create a visit in the patient profile first.
              </p>
            )}
          </div>
        </div>

        {(error || message || loadingAssessment) && (
          <div
            role={error ? "alert" : "status"}
            className={`mt-5 rounded-xl border p-4 text-sm ${error ? "border-red-400/20 bg-red-400/5 text-red-200" : "border-emerald-400/20 bg-emerald-400/5 text-emerald-200"}`}
          >
            {error || (loadingAssessment ? "Loading saved assessment history..." : message)}
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-slate-500">
            <p>Current collection: {sessionSamples.length} / 1000 samples</p>
            <p className="mt-1">
              {saved ? `Saved to database${assessmentId ? ` · ID ${assessmentId}` : ""}` : "Not yet saved"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveAssessment}
            disabled={running || saving || saved || sessionSamples.length === 0 || !selectedVisitId}
            className="rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Saving assessment..." : saved ? "Assessment Saved" : "Save Assessment"}
          </button>
        </div>
      </section>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/30">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-slate-500">Active Patient</p>
              <p className="mt-2 break-words text-xl font-semibold">{getPatientLabel(selectedPatient)}</p>
            </div>
            <div className="shrink-0 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2">
              <p className="text-xs text-cyan-400">{selectedPatient?.patient_code || "PAT------"}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-400">{occupation}</span>
            <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-400">
              Exposure: {hasExposureYears ? `${exposureYears} years` : "Not provided"}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">Acquisition Hardware</p>
              <p className="mt-2 text-xl font-semibold">ESP32-S3 + AD5933</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span className="text-xs text-amber-400">{running ? "SIMULATING" : "NOT CONNECTED"}</span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-400">Device: {sensor.deviceId || "ESP32-001"}</div>
            <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-400">I2C / EIS</div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Sensor Status", value: sensor.status, note: "Simulation state" },
          { label: "Frequency", value: `${sensor.frequency ?? "--"} Hz`, note: "Configured frequency" },
          { label: "Impedance", value: `${sensor.impedance ?? "--"} Ω`, note: "Latest simulated reading" },
          { label: "Phase", value: `${sensor.phase ?? "--"}°`, note: "Latest simulated phase" },
        ].map((item) => (
          <div key={item.label} className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-[0_0_25px_rgba(34,211,238,0.08)]">
            <p className="text-xs uppercase tracking-wider text-slate-500">{item.label}</p>
            <p className="mt-4 break-words text-2xl font-bold text-cyan-400">{item.value}</p>
            <p className="mt-3 text-xs text-slate-500">{item.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
        <div className="flex flex-col gap-4 border-b border-slate-800 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold">Sensor Stream</span>
              <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-400">Simulated</span>
            </div>
            <p className="mt-1 text-sm text-slate-500">Simulated impedance telemetry stream</p>
          </div>
          <div className="flex items-center gap-5">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Session Samples</p>
              <p className="mt-1 text-xl font-bold text-cyan-400">{sessionSamples.length}</p>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Graph Samples</p>
              <p className="mt-1 text-sm font-semibold text-slate-300">{history.length} / 60</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="relative h-72 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
            <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)", backgroundSize: "50px 50px" }} />
            <div className="absolute left-0 right-0 top-1/2 h-px bg-slate-800" />
            <svg viewBox="0 0 1000 260" preserveAspectRatio="none" className={`absolute inset-0 h-full w-full ${running ? "opacity-90" : "opacity-50"}`}>
              <polyline points={waveformPoints} fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400" />
            </svg>
            {running && (
              <div className="absolute bottom-0 left-0 top-0 w-px animate-[sensorScan_3s_linear_infinite] bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.9)]" />
            )}
            <div className="absolute left-4 top-4 rounded-md border border-slate-800 bg-slate-950/80 px-3 py-1.5 text-[10px] uppercase tracking-wider text-slate-500">Simulated impedance trace</div>
            <div className="absolute bottom-4 left-4 text-[10px] uppercase tracking-wider text-slate-600">SAMPLE INDEX →</div>
            <div className="absolute right-4 top-4 text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-600">Stream</p>
              <p className={`mt-1 text-xs font-semibold ${running ? "text-cyan-400" : "text-slate-500"}`}>{running ? "GENERATING DATA" : "PAUSED"}</p>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">Saved History</p>
          <h2 className="mt-2 text-xl font-semibold">Previous assessments for this visit</h2>
          <p className="mt-1 text-sm text-slate-500">
            These records are historical only. They are not copied into the active sample counter.
          </p>
        </div>

        {historicalAssessments.length === 0 ? (
          <p className="text-sm text-slate-500">
            {loadingAssessment ? "Loading history..." : "No saved assessments found for this visit."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="p-3">Assessment ID</th>
                  <th className="p-3">Samples</th>
                  <th className="p-3">Saved</th>
                  <th className="p-3">Source</th>
                </tr>
              </thead>
              <tbody>
                {historicalAssessments.map((record, index) => (
                  <tr key={record.id ?? index} className="border-t border-slate-800">
                    <td className="p-3">{record.id ?? "—"}</td>
                    <td className="p-3">
                      {Array.isArray(record.samples) ? record.samples.length : record.sample_count ?? "—"}
                    </td>
                    <td className="p-3">
                      {record.created_at
                        ? new Date(record.created_at).toLocaleString()
                        : record.completed_at
                          ? new Date(record.completed_at).toLocaleString()
                          : "—"}
                    </td>
                    <td className="p-3">{record.source ?? "SIMULATED"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-300">Acquisition Control</p>
          <p className="mt-1 text-xs text-slate-500">Select a patient and visit before starting the simulated stream.</p>
          {sessionStartedAt && (
            <p className="mt-2 text-xs text-slate-600">
              Started: {new Date(sessionStartedAt).toLocaleString()}
              {sessionStoppedAt && ` · Stopped: ${new Date(sessionStoppedAt).toLocaleString()}`}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={startSensor}
            disabled={running || saving || !selectedPatientId || !selectedVisitId}
            className="rounded-xl bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition-all duration-300 hover:scale-105 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {running ? "Simulation Running" : "Start Acquisition"}
          </button>
          <button
            type="button"
            onClick={stopSensor}
            disabled={!running}
            className="rounded-xl border border-slate-700 bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:border-cyan-500/40 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Stop
          </button>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-amber-500/10 bg-amber-500/5 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-400/80">Prototype Data Notice</p>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          All readings and waveform points on this page are simulated. The hardware is not connected by this interface. Saved values represent simulated prototype data and are not validated measurements, screening conclusions, or medical diagnoses.
        </p>
      </div>

      <style>{`
        @keyframes sensorScan {
          0% { transform: translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateX(100vw); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default SensorPage;
