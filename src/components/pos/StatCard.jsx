import React from "react";

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendUp,
  color = "indigo",
}) {
  const colorMap = {
    indigo: {
      bg: "bg-indigo-50",
      icon: "bg-indigo-100 text-indigo-600",
      trend: "text-indigo-600",
    },
    emerald: {
      bg: "bg-emerald-50",
      icon: "bg-emerald-100 text-emerald-600",
      trend: "text-emerald-600",
    },
    amber: {
      bg: "bg-amber-50",
      icon: "bg-amber-100 text-amber-600",
      trend: "text-amber-600",
    },
    rose: {
      bg: "bg-rose-50",
      icon: "bg-rose-100 text-rose-600",
      trend: "text-rose-600",
    },
    violet: {
      bg: "bg-violet-50",
      icon: "bg-violet-100 text-violet-600",
      trend: "text-violet-600",
    },
    sky: {
      bg: "bg-sky-50",
      icon: "bg-sky-100 text-sky-600",
      trend: "text-sky-600",
    },
  };

  const c = colorMap[color] || colorMap.indigo;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-5 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
        {Icon && (
          <div
            className={`w-11 h-11 rounded-xl ${c.icon} flex items-center justify-center`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5">
          <span
            className={`text-xs font-semibold ${trendUp ? "text-emerald-600" : "text-rose-600"}`}
          >
            {trendUp ? "↑" : "↓"} {trend}
          </span>
          <span className="text-xs text-slate-400">vs last period</span>
        </div>
      )}
    </div>
  );
}
