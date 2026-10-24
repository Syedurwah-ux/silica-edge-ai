import {
  LayoutDashboard,
  UserRound,
  Activity,
  ChartNoAxesCombined,
  BrainCircuit,
  TriangleAlert,
  FileText,
  Settings,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const menuItems = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    name: "Worker",
    icon: UserRound,
    path: "/worker",
  },
  {
    name: "Sensor",
    icon: Activity,
    path: "/sensor",
  },
  {
    name: "Signal Analysis",
    icon: ChartNoAxesCombined,
    path: "/analysis",
  },
  {
    name: "AI Prediction",
    icon: BrainCircuit,
    path: "/prediction",
  },
  {
    name: "Risk Assessment",
    icon: TriangleAlert,
    path: "/risk",
  },
  {
    name: "Report",
    icon: FileText,
    path: "/report",
  },
];

function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-50 h-screen w-64 border-r border-slate-800 bg-slate-950 text-white">

      {/* Logo */}
      <div className="flex h-20 items-center border-b border-slate-800 px-6">
        <NavLink
          to="/"
          className="group cursor-pointer"
        >
          <h1 className="text-xl font-bold tracking-wide text-white transition-all duration-300 group-hover:text-cyan-400">
            SILICA
          </h1>

          <p className="text-xs text-slate-400 transition-colors duration-300 group-hover:text-slate-300">
            Edge-AI Monitoring
          </p>
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-3">

        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `group relative mb-1 flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-all duration-300 ${isActive
                  ? "bg-cyan-400/10 text-cyan-400"
                  : "text-slate-400 hover:bg-slate-800/70 hover:text-white"
                }`
              }
            >

              {({ isActive }) => (
                <>
                  {/* Active indicator */}
                  <span
                    className={`absolute left-0 h-6 w-0.5 rounded-full bg-cyan-400 transition-all duration-300 ${isActive ? "opacity-100" : "opacity-0"
                      }`}
                  />

                  <Icon
                    size={19}
                    className={`transition-transform duration-300 ${isActive
                        ? "text-cyan-400"
                        : "group-hover:translate-x-0.5"
                      }`}
                  />

                  <span>{item.name}</span>

                  {/* Active glow */}
                  {isActive && (
                    <span className="ml-auto h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
                  )}
                </>
              )}

            </NavLink>
          );
        })}

      </nav>

      {/* Bottom */}
      <div className="absolute bottom-0 w-full border-t border-slate-800 p-4">

        <div className="group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-900 hover:text-slate-300">

          <Settings
            size={18}
            className="transition-transform duration-500 group-hover:rotate-90"
          />

          <span>System Settings</span>

        </div>

      </div>

    </aside>
  );
}

export default Sidebar;