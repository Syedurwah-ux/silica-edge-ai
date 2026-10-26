
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext";
import {
  Activity,
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  LockKeyhole,
  UserRound,
  ShieldCheck,
} from "lucide-react";
import { loginStaff } from "../api";

export default function Login() {
  const navigate = useNavigate();
  const { loginStaffSession } = useApp();

  const [form, setForm] = useState({
    clinic_code: "",
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  }

  async function handleSubmit(event) {
  event.preventDefault();
  setError("");
  setLoading(true);

  try {
    const result = await loginStaff(form);

    // Save the authenticated staff session in AppContext.
    loginStaffSession(result);

    // Continue to the dashboard after successful authentication.
    navigate("/dashboard", { replace: true });
  } catch (err) {
    setError(err.message || "Unable to sign in. Please try again.");
  } finally {
    setLoading(false);
  }
}
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070b12] px-5 py-12 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]" />

        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.35) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900/75 shadow-2xl shadow-black/40 backdrop-blur-xl md:grid-cols-2"
      >
        <section className="relative hidden flex-col justify-between overflow-hidden border-r border-white/10 bg-gradient-to-br from-cyan-500/10 via-slate-900 to-blue-500/10 p-10 md:flex">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-300">
                <Activity size={25} />
              </div>

              <div>
                <h1 className="text-xl font-bold tracking-wide">
                  AeroEdge <span className="text-cyan-300">AI</span>
                </h1>
                <p className="text-xs tracking-[0.2em] text-slate-500">
                  EDGE INTELLIGENCE
                </p>
              </div>
            </div>

            <div className="mt-24">
              <p className="text-xs font-semibold tracking-[0.25em] text-cyan-300">
                CLINICAL WORKSPACE
              </p>

              <h2 className="mt-5 max-w-sm text-4xl font-semibold leading-tight">
                Intelligent monitoring.
                <span className="text-slate-400">
                  {" "}Thoughtful screening.
                </span>
              </h2>

              <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">
                Sign in to manage patient profiles, review experimental
                sensor measurements, and access assessment reports.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
            <ShieldCheck className="shrink-0 text-cyan-300" size={22} />
            <div>
              <p className="text-sm font-medium">Protected workspace</p>
              <p className="mt-1 text-xs text-slate-500">
                Access controlled by your clinic account
              </p>
            </div>
          </div>
        </section>

        <section className="p-7 sm:p-10">
          <div className="mb-9 flex items-center gap-3 md:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
              <Activity size={23} />
            </div>

            <div>
              <h1 className="font-bold">
                AeroEdge <span className="text-cyan-300">AI</span>
              </h1>
              <p className="text-xs text-slate-500">
                EDGE INTELLIGENCE
              </p>
            </div>
          </div>

          <p className="text-xs font-semibold tracking-[0.2em] text-cyan-300">
            STAFF ACCESS
          </p>

          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            Welcome back
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Enter your clinic credentials to continue.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="clinic_code"
                className="mb-2 block text-sm text-slate-300"
              >
                Clinic code
              </label>

              <div className="relative">
                <Building2
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  id="clinic_code"
                  name="clinic_code"
                  value={form.clinic_code}
                  onChange={handleChange}
                  autoComplete="organization"
                  required
                  maxLength={30}
                  placeholder="Enter clinic code"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/70 py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/10"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm text-slate-300"
              >
                Username
              </label>

              <div className="relative">
                <UserRound
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  id="username"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  autoComplete="username"
                  required
                  maxLength={100}
                  placeholder="Enter your username"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/70 py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/10"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm text-slate-300"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                  maxLength={128}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/70 py-3.5 pl-11 pr-12 text-sm outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in to AeroEdge"}
              {!loading && (
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs leading-5 text-slate-500">
            Authorized clinic staff only. Use your assigned account.
          </p>
        </section>
      </motion.div>
    </div>
  );
}
