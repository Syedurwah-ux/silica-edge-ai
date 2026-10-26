
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  UserRound,
  Phone,
  CalendarDays,
  ClipboardList,
  Plus,
  RefreshCw,
  LoaderCircle,
  AlertCircle,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  FileText,
  Activity,
  ChevronDown,
  ChevronUp,
  Database,
  Waves,
} from "lucide-react";
import {
  getPatient,
  getPatientVisits,
  createPatientVisit,
  getSensorAssessments,
} from "../api";
import { useApp } from "../context/AppContext";

const inputClass =
  "w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/20";

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatNumber(value, digits = 2) {
  const number = Number(value);

  return Number.isFinite(number) ? number.toFixed(digits) : "--";
}

function SensorAssessmentCard({ assessment }) {
  const [expanded, setExpanded] = useState(false);
  const samples = Array.isArray(assessment.samples)
    ? assessment.samples
    : [];

  return (
    <article className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40 transition hover:border-cyan-500/25">
      <div className="p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex items-start gap-3">
            <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/10 p-3 text-cyan-300">
              <Activity size={20} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-slate-100">
                  Sensor Session #{assessment.id}
                </h3>

                <span className="rounded-full border border-amber-400/20 bg-amber-400/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                  {assessment.source || "UNKNOWN"}
                </span>
              </div>

              <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <CalendarDays size={14} />
                {formatDate(assessment.completed_at)}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Visit #{assessment.visit_id}
                {" · "}
                {samples.length} samples
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300"
            aria-expanded={expanded}
          >
            {expanded ? (
              <>
                Hide samples <ChevronUp size={15} />
              </>
            ) : (
              <>
                View samples <ChevronDown size={15} />
              </>
            )}
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs text-slate-500">Impedance</p>
            <p className="mt-2 text-xl font-bold text-cyan-300">
              {formatNumber(assessment.impedance_ohms)}
              <span className="ml-1 text-sm font-normal text-slate-500">
                Ω
              </span>
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs text-slate-500">Phase</p>
            <p className="mt-2 text-xl font-bold text-slate-100">
              {formatNumber(assessment.phase_degrees)}
              <span className="ml-1 text-sm font-normal text-slate-500">
                °
              </span>
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs text-slate-500">Session duration</p>
            <p className="mt-2 text-sm font-semibold text-slate-200">
              {assessment.started_at && assessment.completed_at
                ? (() => {
                    const start = new Date(assessment.started_at).getTime();
                    const end = new Date(assessment.completed_at).getTime();

                    if (
                      !Number.isFinite(start) ||
                      !Number.isFinite(end) ||
                      end < start
                    ) {
                      return "Unavailable";
                    }

                    const seconds = Math.round((end - start) / 1000);
                    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
                  })()
                : "Unavailable"}
            </p>
          </div>
        </div>

        {expanded && (
          <div className="mt-5 border-t border-slate-800 pt-5">
            <div className="mb-3 flex items-center gap-2">
              <Waves size={16} className="text-cyan-300" />
              <h4 className="text-sm font-semibold">Collected samples</h4>
            </div>

            {samples.length === 0 ? (
              <p className="rounded-lg bg-slate-900/60 p-4 text-sm text-slate-500">
                No sample details are available for this session.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full min-w-[540px] text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">Sample</th>
                      <th className="px-4 py-3 font-medium">Time</th>
                      <th className="px-4 py-3 font-medium">
                        Impedance (Ω)
                      </th>
                      <th className="px-4 py-3 font-medium">Phase (°)</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800">
                    {samples.map((sample, index) => (
                      <tr
                        key={`${assessment.id}-${sample.sampleNumber ?? index}`}
                        className="bg-slate-950/40 transition hover:bg-slate-900/70"
                      >
                        <td className="px-4 py-3 text-slate-300">
                          {sample.sampleNumber ?? index + 1}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {sample.timestamp
                            ? new Date(
                                sample.timestamp
                              ).toLocaleTimeString()
                            : "--"}
                        </td>
                        <td className="px-4 py-3 font-medium text-cyan-300">
                          {formatNumber(sample.impedance)}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {formatNumber(sample.phase)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
          <Database size={13} />
          <span>Saved record #{assessment.id}</span>
          {assessment.created_at && (
            <>
              <span>·</span>
              <span>Recorded {formatDate(assessment.created_at)}</span>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function PatientProfile() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { auth } = useApp();

  const [patient, setPatient] = useState(null);
  const [visits, setVisits] = useState([]);
  const [sensorAssessments, setSensorAssessments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingAssessments, setLoadingAssessments] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [assessmentError, setAssessmentError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [visitForm, setVisitForm] = useState({
    assessment_status: "pending",
    assessment_result: "",
    notes: "",
  });

  const loadProfile = useCallback(async () => {
    if (!auth?.token) {
      setError("Your session is missing. Please sign in again.");
      setLoading(false);
      setLoadingAssessments(false);
      return;
    }

    setLoading(true);
    setLoadingAssessments(true);
    setError("");
    setAssessmentError("");

    const patientIdNumber = Number(patientId);

    try {
      const [patientData, visitData] = await Promise.all([
        getPatient(auth.token, patientIdNumber),
        getPatientVisits(auth.token, patientIdNumber),
      ]);

      setPatient(patientData);
      setVisits(
        Array.isArray(visitData) ? visitData : visitData.items ?? []
      );
    } catch (err) {
      setError(err.message || "Could not load patient profile.");
      setLoading(false);
      setLoadingAssessments(false);
      return;
    } finally {
      setLoading(false);
    }

    try {
      const assessmentData = await getSensorAssessments(auth.token, {
        patient_id: patientIdNumber,
        limit: 200,
      });

      setSensorAssessments(
        Array.isArray(assessmentData)
          ? assessmentData
          : assessmentData.items ?? []
      );
    } catch (err) {
      setAssessmentError(
        err.message || "Could not load sensor assessment history."
      );
    } finally {
      setLoadingAssessments(false);
    }
  }, [auth?.token, patientId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  function handleVisitChange(event) {
    const { name, value } = event.target;

    setVisitForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  async function handleCreateVisit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!auth?.token) {
      setError("Your session has expired. Please sign in again.");
      return;
    }

    setSaving(true);

    try {
      const created = await createPatientVisit(auth.token, {
        patient_id: Number(patientId),
        assessment_status: visitForm.assessment_status,
        assessment_result: visitForm.assessment_result.trim() || null,
        notes: visitForm.notes.trim() || null,
      });

      setVisits((current) => [created, ...current]);

      setVisitForm({
        assessment_status: "pending",
        assessment_result: "",
        notes: "",
      });

      setShowForm(false);
      setSuccess("New visit recorded successfully.");
    } catch (err) {
      setError(err.message || "Could not record the visit.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-3 text-slate-400">
        <LoaderCircle className="animate-spin text-cyan-400" size={22} />
        Loading patient profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-7 pb-12 text-slate-100">
      <button
        type="button"
        onClick={() => navigate("/worker")}
        className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-cyan-300"
      >
        <ArrowLeft size={17} />
        Back to patients
      </button>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm text-emerald-200"
        >
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {!patient ? (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8">
          <h1 className="text-xl font-semibold">Patient unavailable</h1>
          <p className="mt-2 text-sm text-slate-400">
            The patient could not be loaded. Check the patient ID and try again.
          </p>
          <button
            type="button"
            onClick={loadProfile}
            className="mt-5 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950"
          >
            Try again
          </button>
        </section>
      ) : (
        <>
          <motion.header
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"
          >
            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.22em] text-cyan-400">
                Clinic workspace / Patient profile
              </p>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {patient.full_name}
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                Patient ID:{" "}
                <span className="font-medium text-cyan-300">
                  {patient.patient_code}
                </span>
              </p>
            </div>

            <button
              type="button"
              onClick={loadProfile}
              disabled={loading || loadingAssessments}
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300 disabled:opacity-50 sm:self-auto"
            >
              <RefreshCw
                size={16}
                className={loading || loadingAssessments ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </motion.header>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-cyan-400/10 p-3 text-cyan-300">
                  <UserRound size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Age</p>
                  <p className="mt-1 font-semibold">
                    {patient.age} years
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-teal-400/10 p-3 text-teal-300">
                  <Phone size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Patient phone</p>
                  <p className="mt-1 break-all text-sm font-medium">
                    {patient.patient_phone || "Not provided"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-indigo-400/10 p-3 text-indigo-300">
                  <ClipboardList size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Recorded visits</p>
                  <p className="mt-1 font-semibold">{visits.length}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-7">
            <div className="mb-5 flex items-center gap-3">
              <Phone size={19} className="text-cyan-300" />
              <h2 className="font-semibold">Contact & registration details</h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-500">Patient ID</p>
                <p className="mt-1 text-sm">{patient.patient_code}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Guardian phone</p>
                <p className="mt-1 text-sm">
                  {patient.guardian_phone || "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Clinic record number</p>
                <p className="mt-1 text-sm">{patient.id}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Clinic reference</p>
                <p className="mt-1 text-sm">{patient.clinic_id}</p>
              </div>
            </div>
          </section>

          {/* Sensor assessment history */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-7">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/10 p-3 text-cyan-300">
                  <Activity size={21} />
                </div>
                <div>
                  <h2 className="font-semibold">Sensor assessment history</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Saved acquisition sessions associated with this patient
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start rounded-full border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-amber-300 sm:self-auto">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Simulated data
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-xs text-slate-500">Saved sessions</p>
                <p className="mt-2 text-2xl font-bold text-cyan-300">
                  {sensorAssessments.length}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-xs text-slate-500">Total stored samples</p>
                <p className="mt-2 text-2xl font-bold text-slate-100">
                  {sensorAssessments.reduce(
                    (total, assessment) =>
                      total +
                      (Array.isArray(assessment.samples)
                        ? assessment.samples.length
                        : 0),
                    0
                  )}
                </p>
              </div>
            </div>

            {assessmentError && (
              <div
                role="alert"
                className="mt-5 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200"
              >
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <div>
                  <p>{assessmentError}</p>
                  <button
                    type="button"
                    onClick={loadProfile}
                    className="mt-2 text-xs font-semibold text-cyan-300 hover:text-cyan-200"
                  >
                    Retry loading history
                  </button>
                </div>
              </div>
            )}

            {loadingAssessments ? (
              <div className="mt-6 flex min-h-32 items-center justify-center gap-3 text-sm text-slate-400">
                <LoaderCircle
                  className="animate-spin text-cyan-400"
                  size={20}
                />
                Loading sensor assessment history...
              </div>
            ) : !assessmentError && sensorAssessments.length === 0 ? (
              <div className="mt-6 flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 px-5 text-center">
                <Activity size={25} className="mb-3 text-slate-500" />
                <p className="text-sm font-medium text-slate-300">
                  No sensor assessments yet
                </p>
                <p className="mt-2 max-w-md text-xs leading-5 text-slate-500">
                  Saved sessions for this patient will appear here after
                  acquisition is completed and saved from Sensor Monitoring.
                </p>
              </div>
            ) : (
              !assessmentError && (
                <div className="mt-6 space-y-4">
                  {[...sensorAssessments]
                    .sort(
                      (a, b) =>
                        new Date(b.completed_at || b.created_at || 0).getTime() -
                        new Date(a.completed_at || a.created_at || 0).getTime()
                    )
                    .map((assessment) => (
                      <SensorAssessmentCard
                        key={assessment.id}
                        assessment={assessment}
                      />
                    ))}
                </div>
              )
            )}

            <div className="mt-5 flex items-start gap-2 rounded-xl border border-amber-400/10 bg-amber-400/5 p-4 text-xs leading-5 text-slate-400">
              <ShieldCheck
                size={16}
                className="mt-0.5 shrink-0 text-amber-300"
              />
              These records contain simulated prototype readings. They are
              not validated measurements, screening conclusions, or medical
              diagnoses.
            </div>
          </section>

          {/* Visit history */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-7">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-cyan-400/10 p-3 text-cyan-300">
                  <CalendarDays size={21} />
                </div>
                <div>
                  <h2 className="font-semibold">Visit history</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Previous and current clinic visits
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowForm((current) => !current)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                <Plus size={17} />
                {showForm ? "Cancel" : "Record new visit"}
              </button>
            </div>

            {showForm && (
              <form
                onSubmit={handleCreateVisit}
                className="mt-6 space-y-5 rounded-xl border border-slate-700 bg-slate-950/50 p-5"
              >
                <h3 className="font-medium">New visit details</h3>

                <div>
                  <label
                    htmlFor="assessment_status"
                    className="mb-2 block text-xs text-slate-400"
                  >
                    Visit / assessment status
                  </label>
                  <select
                    id="assessment_status"
                    name="assessment_status"
                    value={visitForm.assessment_status}
                    onChange={handleVisitChange}
                    className={inputClass}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="assessment_result"
                    className="mb-2 block text-xs text-slate-400"
                  >
                    Assessment result{" "}
                    <span className="text-slate-600">(optional)</span>
                  </label>
                  <textarea
                    id="assessment_result"
                    name="assessment_result"
                    value={visitForm.assessment_result}
                    onChange={handleVisitChange}
                    rows={3}
                    maxLength={5000}
                    placeholder="Enter a verified result, if available"
                    className={`${inputClass} resize-y`}
                  />
                </div>

                <div>
                  <label
                    htmlFor="notes"
                    className="mb-2 block text-xs text-slate-400"
                  >
                    Visit notes{" "}
                    <span className="text-slate-600">(optional)</span>
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={visitForm.notes}
                    onChange={handleVisitChange}
                    rows={3}
                    maxLength={2000}
                    placeholder="Administrative or visit-related notes"
                    className={`${inputClass} resize-y`}
                  />
                </div>

                <div className="flex items-start gap-2 rounded-lg border border-slate-800 p-3 text-xs leading-5 text-slate-500">
                  <ShieldCheck
                    size={16}
                    className="mt-0.5 shrink-0 text-cyan-300"
                  />
                  Only enter results supported by an actual assessment. An
                  experimental AI output is not a confirmed medical diagnosis.
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60 sm:w-auto"
                >
                  {saving ? (
                    <LoaderCircle size={17} className="animate-spin" />
                  ) : (
                    <Plus size={17} />
                  )}
                  {saving ? "Saving visit..." : "Save visit"}
                </button>
              </form>
            )}

            <div className="mt-6 space-y-4">
              {visits.length === 0 ? (
                <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 px-5 text-center">
                  <Clock3 size={25} className="mb-3 text-slate-500" />
                  <p className="text-sm font-medium text-slate-300">
                    No visits recorded yet
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Record a visit to start this patient's history.
                  </p>
                </div>
              ) : (
                visits.map((visit) => (
                  <article
                    key={visit.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/40 p-5"
                  >
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg border border-cyan-400/15 bg-cyan-400/10 p-2 text-cyan-300">
                          <FileText size={18} />
                        </div>
                        <div>
                          <p className="font-medium">Visit #{visit.id}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatDate(visit.visited_at)}
                          </p>
                        </div>
                      </div>

                      <span className="w-fit rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-cyan-300">
                        {(visit.assessment_status || "unknown").replace(
                          /_/g,
                          " "
                        )}
                      </span>
                    </div>

                    {visit.assessment_result && (
                      <div className="mt-4">
                        <p className="text-xs text-slate-500">
                          Assessment result
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                          {visit.assessment_result}
                        </p>
                      </div>
                    )}

                    {visit.notes && (
                      <div className="mt-4 border-t border-slate-800 pt-4">
                        <p className="text-xs text-slate-500">Visit notes</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                          {visit.notes}
                        </p>
                      </div>
                    )}

                    <p className="mt-4 text-xs text-slate-600">
                      Staff ID: {visit.staff_id}
                      {visit.device_id ? ` · Device ID: ${visit.device_id}` : ""}
                    </p>
                  </article>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default PatientProfile;
