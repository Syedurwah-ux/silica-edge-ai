import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext";

import {
UserRound,
BriefcaseBusiness,
Clock3,
MapPin,
ShieldCheck,
ArrowRight,
CheckCircle2,
} from "lucide-react";

function Worker() {
const navigate = useNavigate();
const { registerWorker } = useApp();

const [formData, setFormData] = useState({
    workerId: "",
    name: "",
    age: "",
    occupation: "",
    exposureYears: "",
    workLocation: "",
});

const [error, setError] = useState("");

const [saved, setSaved] = useState(false);

const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
        ...previous,
        [name]: value,
    }));

    setError("");
};

const handleSubmit = (event) => {
    event.preventDefault();

    if (
        !formData.workerId ||
        !formData.name ||
        !formData.age ||
        !formData.occupation ||
        !formData.exposureYears ||
        !formData.workLocation
    ) {
        setError("Please complete all worker information before continuing.");
        return;
    }

    // Save temporarily in browser storage.
    // Register the worker and reset previous assessment results.
registerWorker({
...formData,
age: Number(formData.age),
exposureYears: Number(formData.exposureYears),
});

setSaved(true);

    // Give the success animation a moment before navigation.
    setTimeout(() => {
        navigate("/sensor");
    }, 700);
};

return (
    <div className="relative min-h-screen overflow-hidden">

        {/* Background grid */}
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
            className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl"
            animate={{
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut",
            }}
        />

        <div className="relative z-10 max-w-5xl space-y-8">

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="mb-2 flex items-center gap-2">

                    <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />

                    <span className="text-xs uppercase tracking-[0.25em] text-cyan-400">
                        Worker Intelligence
                    </span>

                </div>

                <h1 className="text-4xl font-bold text-white">
                    Worker Profile
                </h1>

                <p className="mt-2 text-sm text-slate-400">
                    Register worker information for personalized exposure
                    risk analysis.
                </p>
            </motion.div>

            {/* Form */}
            <motion.form
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-8 backdrop-blur-xl"
            >

                {/* Section heading */}
                <div className="flex items-center gap-4">

                    <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3">
                        <UserRound
                            className="text-cyan-400"
                            size={22}
                        />
                    </div>

                    <div>
                        <h2 className="font-semibold text-white">
                            Basic Information
                        </h2>

                        <p className="text-xs text-slate-500">
                            Worker identification details
                        </p>
                    </div>

                </div>

                {/* Fields */}
                <div className="mt-8 grid gap-6 md:grid-cols-2">

                    {/* Worker ID */}
                    <div>
                        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
                            Worker ID
                        </label>

                        <input
                            name="workerId"
                            value={formData.workerId}
                            onChange={handleChange}
                            type="text"
                            placeholder="e.g. WRK-001"
                            className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20"
                        />
                    </div>

                    {/* Name */}
                    <div>
                        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
                            Worker Name
                        </label>

                        <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            type="text"
                            placeholder="Enter worker name"
                            className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20"
                        />
                    </div>

                    {/* Age */}
                    <div>
                        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
                            Age
                        </label>

                        <input
                            name="age"
                            value={formData.age}
                            onChange={handleChange}
                            type="number"
                            min="1"
                            placeholder="Enter age"
                            className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20"
                        />
                    </div>

                    {/* Occupation */}
                    <div>
                        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
                            Occupation
                        </label>

                        <div className="relative">

                            <BriefcaseBusiness
                                size={17}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
                            />

                            <input
                                name="occupation"
                                value={formData.occupation}
                                onChange={handleChange}
                                type="text"
                                placeholder="e.g. Stone cutter"
                                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20"
                            />

                        </div>
                    </div>

                    {/* Exposure */}
                    <div>
                        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
                            Occupational Exposure
                        </label>

                        <div className="relative">

                            <Clock3
                                size={17}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
                            />

                            <input
                                name="exposureYears"
                                value={formData.exposureYears}
                                onChange={handleChange}
                                type="number"
                                min="0"
                                placeholder="Years of exposure"
                                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20"
                            />

                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
                            Work Location
                        </label>

                        <div className="relative">

                            <MapPin
                                size={17}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
                            />

                            <input
                                name="workLocation"
                                value={formData.workLocation}
                                onChange={handleChange}
                                type="text"
                                placeholder="e.g. Construction site"
                                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20"
                            />

                        </div>
                    </div>

                </div>

                {/* Error */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300"
                    >
                        {error}
                    </motion.div>
                )}

                {/* Notice */}
                <div className="mt-8 flex gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4">

                    <ShieldCheck
                        size={20}
                        className="mt-0.5 shrink-0 text-cyan-400"
                    />

                    <div>

                        <p className="text-sm font-medium text-slate-300">
                            Prototype Data Notice
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                            Worker information is used as an input to the
                            prototype's experimental risk-assessment pipeline.
                            It is not a medical diagnosis.
                        </p>

                    </div>

                </div>

                {/* Continue */}
                <div className="mt-8 flex justify-end">

                    <motion.button
                        type="submit"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        disabled={saved}
                        className={`group flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${saved
                                ? "bg-emerald-400 text-slate-950"
                                : "bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                            }`}
                    >

                        {saved ? (
                            <>
                                <CheckCircle2 size={17} />
                                Worker Saved
                            </>
                        ) : (
                            <>
                                Continue to Sensor
                                <ArrowRight
                                    size={17}
                                    className="transition-transform group-hover:translate-x-1"
                                />
                            </>
                        )}

                    </motion.button>

                </div>

            </motion.form>

        </div>
    </div>
);
}

export default Worker;