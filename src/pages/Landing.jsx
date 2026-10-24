import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Cpu,
  Mail,
  MapPin,
  Radio,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

function Landing() {
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">

      {/* ================= BACKGROUND ================= */}

      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[130px]" />

        <div className="absolute right-[-180px] top-[35%] h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[130px]" />

        <div className="absolute bottom-[-180px] left-[25%] h-[450px] w-[450px] rounded-full bg-cyan-400/5 blur-[130px]" />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(34,211,238,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.7) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* ================= NAVBAR ================= */}

      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-slate-800/60 bg-slate-950/75 backdrop-blur-xl">

        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 md:px-10">

          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="group text-left"
          >
            <h1 className="text-xl font-bold tracking-[0.2em] transition-colors duration-300 group-hover:text-cyan-400">
              SILICA
            </h1>

            <p className="text-[9px] uppercase tracking-[0.28em] text-slate-500">
              Edge-AI Monitoring
            </p>
          </button>

          <div className="hidden items-center gap-8 md:flex">

            <button
              onClick={() => scrollToSection("overview")}
              className="text-sm text-slate-400 transition-colors hover:text-white"
            >
              Overview
            </button>

            <button
              onClick={() => scrollToSection("workflow")}
              className="text-sm text-slate-400 transition-colors hover:text-white"
            >
              Workflow
            </button>

            <button
              onClick={() => scrollToSection("about")}
              className="text-sm text-slate-400 transition-colors hover:text-white"
            >
              About
            </button>

            <button
              onClick={() => scrollToSection("contact")}
              className="text-sm text-slate-400 transition-colors hover:text-white"
            >
              Contact
            </button>

          </div>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-bold text-slate-950 transition-all duration-300 hover:bg-cyan-300 hover:shadow-[0_0_25px_rgba(34,211,238,0.25)] md:px-5 md:py-3 md:text-sm"
          >
            Launch System
            <ArrowRight size={16} />
          </motion.button>

        </div>
      </nav>

      {/* ================= HERO ================= */}

      <section className="relative mx-auto max-w-7xl px-6 pb-24 pt-36 md:px-10 md:pt-44">

        <div className="grid items-center gap-16 lg:grid-cols-2">

          {/* Hero text */}

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-2 text-xs font-medium text-cyan-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
              Intelligent Occupational Monitoring
            </div>

            <h2 className="text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">

              Detect.
              <br />

              <span className="bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
                Analyze.
              </span>

              <br />

              Protect.

            </h2>

            <p className="mt-7 max-w-xl text-base leading-8 text-slate-400 md:text-lg">
              An experimental Edge-AI system designed to explore real-time
              silica exposure monitoring, intelligent signal analysis, and
              prototype occupational risk assessment.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">

              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate("/dashboard")}
                className="group flex items-center justify-center gap-3 rounded-xl bg-cyan-400 px-7 py-4 text-sm font-bold text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.12)] transition-all duration-300 hover:bg-cyan-300 hover:shadow-[0_0_40px_rgba(34,211,238,0.3)]"
              >
                Launch Monitoring System

                <ArrowRight
                  size={18}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </motion.button>

              <button
                onClick={() => scrollToSection("workflow")}
                className="rounded-xl border border-slate-700 bg-slate-900/60 px-7 py-4 text-sm font-semibold text-slate-300 transition-all duration-300 hover:border-cyan-500/30 hover:bg-slate-800 hover:text-white"
              >
                Explore Workflow
              </button>

            </div>

            <div className="mt-12 flex flex-wrap gap-10 border-t border-slate-800 pt-7">

              <Stat value="Edge AI" label="Processing" />
              <Stat value="EIS" label="Signal Analysis" />
              <Stat value="TinyML" label="Inference" />
              <Stat value="Real-Time" label="Monitoring" />

            </div>

          </motion.div>

          {/* Hero visualization */}

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="relative"
          >

            <div className="absolute inset-10 rounded-full bg-cyan-400/10 blur-[100px]" />

            <div className="relative rounded-3xl border border-slate-700/80 bg-slate-900/70 p-6 shadow-2xl backdrop-blur-xl">

              <div className="flex items-center justify-between border-b border-slate-800 pb-5">

                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
                    System Architecture
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    Real-Time Processing Pipeline
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-cyan-400">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
                  LIVE
                </div>

              </div>

              <div className="space-y-3 py-7">

                <PipelineCard
                  icon={Radio}
                  number="01"
                  title="Sensor Acquisition"
                  subtitle="ESP32-S3 + AD5933"
                />

                <FlowLine />

                <PipelineCard
                  icon={BarChart3}
                  number="02"
                  title="Signal Processing"
                  subtitle="EIS + Feature Extraction"
                />

                <FlowLine />

                <PipelineCard
                  icon={BrainCircuit}
                  number="03"
                  title="Edge AI"
                  subtitle="TinyML Prediction"
                />

                <FlowLine />

                <PipelineCard
                  icon={ShieldCheck}
                  number="04"
                  title="Risk Assessment"
                  subtitle="Data Fusion + Prototype Score"
                />

              </div>

              <div className="rounded-2xl border border-cyan-500/10 bg-cyan-500/5 p-4">

                <div className="flex items-center gap-3">

                  <div className="rounded-xl bg-cyan-400/10 p-2.5">
                    <Cpu size={20} className="text-cyan-400" />
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-semibold">
                      Edge Processing Ready
                    </p>

                    <p className="text-xs text-slate-500">
                      ESP32-S3 inference pipeline
                    </p>
                  </div>

                  <span className="text-xs font-semibold text-cyan-400">
                    READY
                  </span>

                </div>

              </div>

            </div>

          </motion.div>

        </div>
      </section>

      {/* ================= OVERVIEW ================= */}

      <section
        id="overview"
        className="scroll-mt-24 border-t border-slate-800/70"
      >

        <div className="mx-auto max-w-7xl px-6 py-24 md:px-10">

          <SectionHeading
            eyebrow="System Overview"
            title="One pipeline. Multiple layers of intelligence."
            description="SILICA brings sensing, signal processing, Edge-AI inference, and data fusion together into a unified experimental monitoring workflow."
          />

          <div className="mt-12 grid gap-5 md:grid-cols-3">

            <FeatureCard
              icon={Radio}
              title="Real-Time Sensing"
              text="Capture electrical impedance measurements through the ESP32-S3 and AD5933 based acquisition system."
            />

            <FeatureCard
              icon={BrainCircuit}
              title="Edge Intelligence"
              text="Process signal features through a lightweight TinyML inference pipeline designed for edge deployment."
            />

            <FeatureCard
              icon={ShieldCheck}
              title="Risk Stratification"
              text="Combine worker, environmental, sensor, and AI outputs into an experimental prototype risk score."
            />

          </div>

        </div>

      </section>

      {/* ================= WORKFLOW ================= */}

      <section
        id="workflow"
        className="scroll-mt-24 border-t border-slate-800/70"
      >

        <div className="mx-auto max-w-7xl px-6 py-24 md:px-10">

          <SectionHeading
            eyebrow="How It Works"
            title="From sensor signal to intelligent assessment."
            description="The system follows a structured pipeline where each stage transforms the information before passing it to the next layer."
          />

          <div className="relative mt-16">

            {/* Connecting line */}

            <div className="absolute left-[10%] right-[10%] top-12 hidden h-px bg-gradient-to-r from-cyan-500/10 via-cyan-400/50 to-cyan-500/10 lg:block" />

            <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">

              <WorkflowCard
                number="01"
                icon={Radio}
                title="Sensor Acquisition"
                subtitle="Capture"
                text="The sensing hardware captures electrical impedance measurements from the electrochemical sensing interface."
              />

              <WorkflowCard
                number="02"
                icon={BarChart3}
                title="Signal Processing"
                subtitle="Analyze"
                text="Raw measurements are processed and relevant signal characteristics are extracted for downstream analysis."
              />

              <WorkflowCard
                number="03"
                icon={BrainCircuit}
                title="Edge AI"
                subtitle="Predict"
                text="A lightweight TinyML model processes the extracted information directly within the edge computing pipeline."
              />

              <WorkflowCard
                number="04"
                icon={ShieldCheck}
                title="Risk Assessment"
                subtitle="Integrate"
                text="Worker information, environmental variables, sensor outputs, and AI predictions are combined into a prototype score."
              />

            </div>

          </div>

        </div>

      </section>

      {/* ================= DATA FLOW ================= */}

      <section className="border-t border-slate-800/70">

        <div className="mx-auto max-w-5xl px-6 py-20 md:px-10">

          <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-8 text-center md:p-12">

            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
              Data Flow
            </p>

            <h3 className="mt-3 text-2xl font-bold md:text-3xl">
              Every layer contributes to the final assessment.
            </h3>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 md:flex-row">

              <FlowNode label="Sensor" />
              <FlowArrow />
              <FlowNode label="Signal" />
              <FlowArrow />
              <FlowNode label="Edge AI" />
              <FlowArrow />
              <FlowNode label="Data Fusion" />
              <FlowArrow />
              <FlowNode label="Risk Score" />

            </div>

          </div>

        </div>

      </section>

      {/* ================= ABOUT ================= */}

      <section
        id="about"
        className="scroll-mt-24 border-t border-slate-800/70"
      >

        <div className="mx-auto max-w-7xl px-6 py-24 md:px-10">

          <div className="grid gap-16 lg:grid-cols-2">

            <div>

              <SectionHeading
                eyebrow="About The Project"
                title="Technology designed around a real-world occupational challenge."
                description="SILICA is an experimental Edge-AI research prototype exploring how sensor technology, signal processing, embedded intelligence, and data fusion can work together for occupational exposure monitoring."
              />

              <div className="mt-8 space-y-4">

                <AboutPoint text="ESP32-S3 based edge computing" />
                <AboutPoint text="Electrochemical impedance sensing" />
                <AboutPoint text="Signal processing and feature extraction" />
                <AboutPoint text="Lightweight TinyML inference" />
                <AboutPoint text="Prototype data-fusion risk assessment" />

              </div>

            </div>

            <div>

              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-cyan-400/10 p-3">
                  <Users size={22} className="text-cyan-400" />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-cyan-400">
                    Team
                  </p>

                  <h3 className="mt-1 text-xl font-bold">
                    Four layers. One system.
                  </h3>
                </div>
              </div>

              <div className="space-y-4">

                <TeamCard
                  number="01"
                  title="Hardware & Embedded Systems"
                  text="ESP32-S3, AD5933, electrode interface and sensor acquisition."
                />

                <TeamCard
                  number="02"
                  title="Signal Processing & Data Engineering"
                  text="EIS processing, signal analysis, feature extraction and dataset preparation."
                />

                <TeamCard
                  number="03"
                  title="Edge AI & TinyML"
                  text="1D-CNN model development, optimization and edge inference."
                />

                <TeamCard
                  number="04"
                  title="Systems Integration"
                  text="Data fusion, prototype risk assessment, dashboard and system integration."
                />

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ================= CONTACT ================= */}

      <section
        id="contact"
        className="scroll-mt-24 border-t border-slate-800/70"
      >

        <div className="mx-auto max-w-7xl px-6 py-24 md:px-10">

          <SectionHeading
            eyebrow="Get In Touch"
            title="Have a question about the project?"
            description="Reach out to learn more about the research prototype, technology, or potential collaboration."
          />

          <div className="mt-12 grid gap-8 lg:grid-cols-2">

            {/* Contact info */}

            <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-8">

              <h3 className="text-xl font-bold">
                SILICA Research Prototype
              </h3>

              <p className="mt-3 text-sm leading-7 text-slate-500">
                An experimental project combining embedded systems,
                electrochemical sensing, signal processing, Edge-AI,
                and intelligent data fusion.
              </p>

              <div className="mt-8 space-y-5">

                <ContactItem
                  icon={Mail}
                  title="Email"
                  value="Project contact"
                />

                <ContactItem
                  icon={MapPin}
                  title="Location"
                  value="India"
                />

                <ContactItem
                  icon={Activity}
                  title="Project Status"
                  value="Research Prototype"
                />

              </div>

            </div>

            {/* Contact form */}

            <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-8">

              <div className="grid gap-5 md:grid-cols-2">

                <InputField label="Name" placeholder="Your name" />

                <InputField label="Email" placeholder="Your email" />

              </div>

              <div className="mt-5">

                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Message
                </label>

                <textarea
                  rows="5"
                  placeholder="Write your message..."
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                />

              </div>

              <button
                type="button"
                onClick={() => {
                  alert("Contact form is currently a prototype feature.");
                }}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3.5 text-sm font-bold text-slate-950 transition-all duration-300 hover:bg-cyan-300 hover:shadow-[0_0_25px_rgba(34,211,238,0.2)] active:scale-[0.98]"
              >
                <Send size={17} />
                Send Message
              </button>

            </div>

          </div>

        </div>

      </section>

      {/* ================= CTA ================= */}

      <section className="border-t border-slate-800/70">

        <div className="mx-auto max-w-5xl px-6 py-20 text-center md:px-10">

          <div className="rounded-3xl border border-cyan-500/10 bg-cyan-500/5 px-6 py-14 md:px-12">

            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
              Explore The Prototype
            </p>

            <h3 className="mt-4 text-3xl font-bold md:text-4xl">
              Ready to enter the monitoring system?
            </h3>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-500">
              Explore the dashboard and follow the complete sensor-to-risk
              assessment workflow.
            </p>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate("/dashboard")}
              className="mt-8 inline-flex items-center gap-3 rounded-xl bg-cyan-400 px-7 py-4 text-sm font-bold text-slate-950 transition-all duration-300 hover:bg-cyan-300 hover:shadow-[0_0_35px_rgba(34,211,238,0.25)]"
            >
              Launch Monitoring System
              <ArrowRight size={18} />
            </motion.button>

          </div>

        </div>

      </section>

      {/* ================= FOOTER ================= */}

      <footer className="border-t border-slate-800/70">

        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 md:flex-row md:items-center md:justify-between md:px-10">

          <div>
            <p className="text-sm font-bold tracking-[0.2em]">
              SILICA
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Edge-AI Occupational Monitoring
            </p>
          </div>

          <p className="text-xs text-slate-600">
            Experimental Research Prototype • 2026
          </p>

        </div>

      </footer>

    </div>
  );
}


/* ================= COMPONENTS ================= */

function Stat({ value, label }) {
  return (
    <div>
      <p className="text-lg font-bold text-white">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {label}
      </p>
    </div>
  );
}


function PipelineCard({
  icon: Icon,
  number,
  title,
  subtitle,
}) {
  return (
    <motion.div
      whileHover={{ x: 5 }}
      className="group flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 transition-all duration-300 hover:border-cyan-500/30 hover:bg-slate-900"
    >
      <div className="rounded-xl bg-cyan-400/10 p-3">
        <Icon
          size={20}
          className="text-cyan-400 transition-transform duration-300 group-hover:scale-110"
        />
      </div>

      <div className="flex-1">
        <p className="text-sm font-semibold">
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {subtitle}
        </p>
      </div>

      <span className="font-mono text-xs text-slate-600">
        {number}
      </span>
    </motion.div>
  );
}


function FlowLine() {
  return (
    <div className="ml-7 h-5 w-px bg-gradient-to-b from-cyan-500/40 to-transparent" />
  );
}


function SectionHeading({
  eyebrow,
  title,
  description,
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
        {eyebrow}
      </p>

      <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
        {title}
      </h2>

      <p className="mt-4 text-sm leading-7 text-slate-500 md:text-base">
        {description}
      </p>
    </div>
  );
}


function FeatureCard({
  icon: Icon,
  title,
  text,
}) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="rounded-2xl border border-slate-800 bg-slate-900/50 p-7 transition-all duration-300 hover:border-cyan-500/20 hover:bg-slate-900"
    >
      <div className="mb-5 inline-flex rounded-xl bg-cyan-400/10 p-3">
        <Icon size={22} className="text-cyan-400" />
      </div>

      <h3 className="text-lg font-semibold">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-7 text-slate-500">
        {text}
      </p>
    </motion.div>
  );
}


function WorkflowCard({
  number,
  icon: Icon,
  title,
  subtitle,
  text,
}) {
  return (
    <motion.div
      whileHover={{ y: -7 }}
      className="relative z-10 rounded-2xl border border-slate-800 bg-slate-950 p-6 transition-all duration-300 hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(34,211,238,0.05)]"
    >
      <div className="flex items-center justify-between">

        <div className="rounded-xl bg-cyan-400/10 p-3">
          <Icon size={22} className="text-cyan-400" />
        </div>

        <span className="font-mono text-sm text-cyan-500/50">
          {number}
        </span>

      </div>

      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
        {subtitle}
      </p>

      <h3 className="mt-2 text-lg font-bold">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-7 text-slate-500">
        {text}
      </p>
    </motion.div>
  );
}


function FlowNode({ label }) {
  return (
    <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-5 py-3 text-sm font-semibold text-cyan-300">
      {label}
    </div>
  );
}


function FlowArrow() {
  return (
    <ArrowRight
      size={17}
      className="rotate-90 text-cyan-500/50 md:rotate-0"
    />
  );
}


function AboutPoint({ text }) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-400">
      <CheckCircle2
        size={17}
        className="shrink-0 text-cyan-400"
      />
      {text}
    </div>
  );
}


function TeamCard({
  number,
  title,
  text,
}) {
  return (
    <motion.div
      whileHover={{ x: 5 }}
      className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 transition-all duration-300 hover:border-cyan-500/20"
    >
      <div className="flex gap-4">

        <span className="font-mono text-xs text-cyan-500/60">
          {number}
        </span>

        <div>
          <h4 className="text-sm font-semibold">
            {title}
          </h4>

          <p className="mt-2 text-xs leading-6 text-slate-500">
            {text}
          </p>
        </div>

      </div>
    </motion.div>
  );
}


function ContactItem({
  icon: Icon,
  title,
  value,
}) {
  return (
    <div className="flex items-center gap-4">

      <div className="rounded-xl bg-cyan-400/10 p-3">
        <Icon size={18} className="text-cyan-400" />
      </div>

      <div>
        <p className="text-xs text-slate-600">
          {title}
        </p>

        <p className="mt-1 text-sm text-slate-300">
          {value}
        </p>
      </div>

    </div>
  );
}


function InputField({
  label,
  placeholder,
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-slate-400">
        {label}
      </label>

      <input
        type="text"
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
      />
    </div>
  );
}

export default Landing;