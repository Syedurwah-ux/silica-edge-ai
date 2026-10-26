
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  UserPlus,
  Search,
  RefreshCw,
  Phone,
  ShieldCheck,
  Users,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  ClipboardList,
  ArrowUpRight,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { createPatient, getPatients } from "../api";

const emptyForm = {
  full_name: "",
  age: "",
  occupation: "",
  exposure_years: "",
  patient_phone: "",
  guardian_phone: "",
  notes: "",
};

const inputClass =
  "w-full rounded-xl border border-slate-700/80 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/20";

function Worker() {
  const { auth } = useApp();
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadPatients = useCallback(async () => {
    if (!auth?.token) {
      setError("Your session is missing. Please sign in again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await getPatients(auth.token);
      setPatients(Array.isArray(data) ? data : data.items ?? []);
    } catch (err) {
      setError(err.message || "Could not load patients.");
    } finally {
      setLoading(false);
    }
  }, [auth?.token]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!auth?.token) {
      setError("Your session has expired. Please sign in again.");
      return;
    }

    const age = Number(form.age);
    const exposureYears =
      form.exposure_years.trim() === ""
        ? null
        : Number(form.exposure_years);

    if (
      !form.full_name.trim() ||
      form.age === "" ||
      !Number.isInteger(age) ||
      age < 0 ||
      age > 130
    ) {
      setError("Enter a full name and a valid age between 0 and 130.");
      return;
    }

    if (
      exposureYears !== null &&
      (!Number.isFinite(exposureYears) || exposureYears < 0)
    ) {
      setError("Exposure years must be a valid number greater than or equal to 0.");
      return;
    }

    if (
      exposureYears !== null &&
      exposureYears > age
    ) {
      setError("Exposure years cannot exceed the patient's age.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        full_name: form.full_name.trim(),
        age,
        occupation: form.occupation.trim() || null,
        exposure_years: exposureYears,
        patient_phone: form.patient_phone.trim() || null,
        guardian_phone: form.guardian_phone.trim() || null,
        notes: form.notes.trim() || null,
      };

      const created = await createPatient(auth.token, payload);

      setPatients((current) => [
        created,
        ...current.filter((patient) => patient.id !== created.id),
      ]);

      setForm({ ...emptyForm });
      setSuccess(
        `Patient ${created.patient_code} registered successfully.`
      );
    } catch (err) {
      setError(err.message || "Could not register patient.");
    } finally {
      setSaving(false);
    }
  }

  const filteredPatients = patients.filter((patient) => {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    return (
      patient.full_name?.toLowerCase().includes(query) ||
      patient.patient_code?.toLowerCase().includes(query) ||
      String(patient.age ?? "").includes(query) ||
      patient.occupation?.toLowerCase().includes(query) ||
      String(patient.exposure_years ?? "").includes(query) ||
      patient.patient_phone?.toLowerCase().includes(query) ||
      patient.guardian_phone?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="relative min-h-screen space-y-8 pb-12 text-slate-100">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 top-24 h-96 w-96 rounded-full bg-cyan-500/[0.06] blur-3xl" />
        <div className="absolute right-0 top-80 h-80 w-80 rounded-full bg-teal-500/[0.04] blur-3xl" />
      </div>

      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"
      >
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-cyan-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
            Clinic Workspace
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Patient Management
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
            Register patients and manage their profiles before starting an
            assessment.
          </p>
        </div>

        <button
          type="button"
          onClick={loadPatients}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300 disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh patients
        </button>
      </motion.header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Registered patients</p>
              <p className="mt-3 text-3xl font-semibold tabular-nums">
                {loading ? "—" : patients.length}
              </p>
            </div>
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-300">
              <Users size={22} />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Patients available to your clinic account
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Registration service</p>
              <p className="mt-3 text-xl font-semibold">
                {loading
                  ? "Connecting..."
                  : error
                    ? "Needs attention"
                    : "Connected"}
              </p>
            </div>
            <div
              className={`rounded-xl border p-3 ${
                error
                  ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
                  : "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
              }`}
            >
              {error ? <AlertCircle size={22} /> : <CheckCircle2 size={22} />}
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Live connection to the patient API
          </p>
        </div>
      </div>

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

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-7"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-300">
              <UserPlus size={21} />
            </div>
            <div>
              <h2 className="font-semibold">Register a patient</h2>
              <p className="mt-1 text-xs text-slate-500">
                Required fields are marked with *
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="full_name" className="mb-2 block text-xs font-medium text-slate-400">
                  Full name *
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  required
                  maxLength={150}
                  autoComplete="name"
                  placeholder="Patient's full name"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="age" className="mb-2 block text-xs font-medium text-slate-400">
                  Age *
                </label>
                <input
                  id="age"
                  name="age"
                  value={form.age}
                  onChange={handleChange}
                  required
                  type="number"
                  min="0"
                  max="130"
                  step="1"
                  placeholder="Age in years"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="occupation" className="mb-2 block text-xs font-medium text-slate-400">
                  Occupation
                </label>
                <input
                  id="occupation"
                  name="occupation"
                  value={form.occupation}
                  onChange={handleChange}
                  maxLength={150}
                  placeholder="e.g. Construction worker"
                  autoComplete="organization-title"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="exposure_years" className="mb-2 block text-xs font-medium text-slate-400">
                  Years of occupational exposure
                </label>
                <input
                  id="exposure_years"
                  name="exposure_years"
                  value={form.exposure_years}
                  onChange={handleChange}
                  type="number"
                  min="0"
                  max={form.age || undefined}
                  step="0.1"
                  placeholder="e.g. 5 or 2.5"
                  className={inputClass}
                />
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Enter the estimated time spent in work involving dust or
                  silica. Leave blank if unknown.
                </p>
              </div>

              <div>
                <label htmlFor="patient_phone" className="mb-2 block text-xs font-medium text-slate-400">
                  Patient phone
                </label>
                <div className="relative">
                  <Phone
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    id="patient_phone"
                    name="patient_phone"
                    value={form.patient_phone}
                    onChange={handleChange}
                    type="tel"
                    maxLength={20}
                    autoComplete="tel"
                    placeholder="Contact number"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="guardian_phone" className="mb-2 block text-xs font-medium text-slate-400">
                  Guardian phone <span className="text-slate-600">(optional)</span>
                </label>
                <input
                  id="guardian_phone"
                  name="guardian_phone"
                  value={form.guardian_phone}
                  onChange={handleChange}
                  type="tel"
                  maxLength={20}
                  placeholder="Guardian or alternate contact"
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="notes" className="mb-2 block text-xs font-medium text-slate-400">
                  Notes <span className="text-slate-600">(optional)</span>
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                  maxLength={2000}
                  placeholder="Relevant administrative or assessment notes"
                  className={`${inputClass} resize-y`}
                />
              </div>
            </div>

            <div className="flex gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <ShieldCheck size={19} className="mt-0.5 shrink-0 text-cyan-300" />
              <p className="text-xs leading-5 text-slate-500">
                Patient IDs are assigned automatically by the backend.
                Patient records are restricted to your authenticated clinic.
                Experimental screening results must not be treated as a
                medical diagnosis.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" />
                  Registering patient...
                </>
              ) : (
                <>
                  <UserPlus size={17} />
                  Register patient
                </>
              )}
            </button>
          </form>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-7"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl border border-teal-400/20 bg-teal-400/10 p-3 text-teal-300">
              <ClipboardList size={21} />
            </div>
            <div>
              <h2 className="font-semibold">Patient directory</h2>
              <p className="mt-1 text-xs text-slate-500">
                Records belonging to your clinic
              </p>
            </div>
          </div>

          <div className="relative mb-5">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, ID, occupation or phone..."
              aria-label="Search patients"
              className={`${inputClass} pl-11`}
            />
          </div>

          {loading ? (
            <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-slate-400">
              <LoaderCircle size={20} className="animate-spin text-cyan-300" />
              Loading patient records...
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-slate-500">
                <Users size={26} />
              </div>
              <p className="text-sm font-medium text-slate-300">
                {search ? "No matching patients" : "No patients registered yet"}
              </p>
              <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">
                {search
                  ? "Try another name or patient ID."
                  : "Register your first patient using the form."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPatients.map((patient) => (
                <article
                  key={patient.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 transition hover:border-cyan-400/30"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/10 text-sm font-semibold text-cyan-300">
                      {(patient.full_name || "P")
                        .trim()
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-slate-100">
                        {patient.full_name}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {patient.patient_code} · Age {patient.age}
                      </p>

                      {patient.occupation && (
                        <p className="mt-2 text-xs text-slate-300">
                          Occupation: {patient.occupation}
                        </p>
                      )}

                      {patient.exposure_years !== null &&
                        patient.exposure_years !== undefined && (
                          <p className="mt-1 text-xs text-slate-400">
                            Exposure: {patient.exposure_years} years
                          </p>
                        )}

                      {patient.patient_phone && (
                        <p className="mt-2 flex items-center gap-2 break-all text-xs text-slate-400">
                          <Phone size={13} />
                          {patient.patient_phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/patients/${patient.id}`)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-400/25 bg-cyan-400/[0.07] px-4 py-2.5 text-sm font-medium text-cyan-300 transition hover:border-cyan-300/60 hover:bg-cyan-400/15 hover:text-cyan-200"
                  >
                    Open patient profile
                    <ArrowUpRight size={16} />
                  </button>
                </article>
              ))}

              <p className="pt-2 text-center text-xs text-slate-500">
                Showing {filteredPatients.length} of {patients.length} patients
              </p>
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
}

export default Worker;
