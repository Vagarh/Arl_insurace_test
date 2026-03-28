"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell,
  LineChart, Line, Legend
} from "recharts";
import { TrendingUp, AlertTriangle, Users, Activity } from "lucide-react";
import { useState, useEffect } from "react";

interface ForecastRow {
  fecha: string;
  forecast_base: number;
  ic_bajo: number;
  ic_alto: number;
  escenario_optimista: number;
  escenario_pesimista: number;
}

interface Alertas {
  forecast_proximo_mes: number;
  umbral_alerta: number;
  umbral_critico: number;
  clientes_criticos: number;
  clientes_riesgo_legal: number;
}

interface SimResumen {
  parametros_base: {
    entrada_base: number;
    capacidad: number;
    tasa_escalamiento: number;
  };
  equilibrio_asis_mes12: number;
  equilibrio_tobe_mes12: number;
  reduccion_pct: number;
  sensibilidad_mayor: string;
}

// Resultados de simulación ODE por escenario al mes 12 (NB06)
const escenarios = [
  { nombre: "AS-IS",                    backlog: 169, color: "#ef4444", reduccion: 0 },
  { nombre: "I3: +Capacidad",           backlog: 140, color: "#f97316", reduccion: 17 },
  { nombre: "I4: Clasificador",         backlog: 148, color: "#eab308", reduccion: 12 },
  { nombre: "I1: Portal tracking",      backlog: 110, color: "#0049cb", reduccion: 35 },
  { nombre: "I2: Tracking + notif.",    backlog: 68,  color: "#085efe", reduccion: 60 },
  { nombre: "TO-BE completo",           backlog: 21,  color: "#00216e", reduccion: 88 },
];

// Análisis de sensibilidad (tornado) — variación ±20% sobre parámetro
const sensibilidad = [
  { parametro: "Entrada de quejas",    impacto: 42 },
  { parametro: "Capacidad resolución", impacto: 28 },
  { parametro: "Retroalimentación",    impacto: 18 },
  { parametro: "Tasa escalamiento",    impacto: 12 },
  { parametro: "Insatisfacción",       impacto: 7  },
  { parametro: "Recuperación",         impacto: 4  },
];

const MesLabel: Record<string, string> = {
  "2025-06-01": "Jun",
  "2025-07-01": "Jul",
  "2025-08-01": "Ago",
  "2025-09-01": "Sep",
};

const CustomForecastTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-brand-gray3 rounded-xl p-3 shadow-card-lg text-xs space-y-1">
      <p className="font-black text-sura-navy mb-2">{MesLabel[label] ?? label} 2025</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center justify-between gap-6">
          <span className="text-brand-muted">{p.name}:</span>
          <span className="font-black" style={{ color: p.stroke || p.fill || "#00216e" }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const CustomScenarioTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white border border-brand-gray3 rounded-xl p-3 shadow-card-lg text-xs">
      <p className="font-black text-sura-navy mb-1">{label}</p>
      <p className="text-brand-muted">Backlog mes 12: <span className="font-black text-sura-navy">{d.value} quejas</span></p>
    </div>
  );
};

export default function Prediccion() {
  const [forecast, setForecast] = useState<ForecastRow[]>([]);
  const [alertas, setAlertas] = useState<Alertas | null>(null);
  const [sim, setSim] = useState<SimResumen | null>(null);

  useEffect(() => {
    fetch("/data/forecast_volumen.json").then(r => r.json()).then(setForecast).catch(() => {});
    fetch("/data/alertas.json").then(r => r.json()).then(setAlertas).catch(() => {});
    fetch("/data/resumen_simulacion.json").then(r => r.json()).then(setSim).catch(() => {});
  }, []);

  const forecastAlerta = alertas && alertas.forecast_proximo_mes > alertas.umbral_alerta;

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-10 animate-page-in">

      {/* Header */}
      <div>
        <span className="badge-blue text-[10px] font-black uppercase tracking-widest mb-3 inline-block">
          Predicción & Dinámica de Sistemas
        </span>
        <h1 className="text-4xl font-black text-sura-navy tracking-tighter">
          Forecast y <span className="text-sura-action">Simulación</span>
        </h1>
        <p className="text-sm text-brand-muted font-medium mt-2 max-w-xl">
          Proyección de volumen de quejas (Jul–Sep 2025) + simulación de impacto de intervenciones
          mediante modelo de Dinámica de Sistemas (ODEs calibradas con datos reales).
        </p>
      </div>

      {/* KPI Row */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          {
            label: "Forecast próximo mes",
            value: alertas ? `${alertas.forecast_proximo_mes}` : "–",
            sub: alertas ? `Umbral alerta: ${alertas.umbral_alerta}` : "Cargando...",
            color: forecastAlerta ? "#ef4444" : "#0049cb",
            bg: forecastAlerta ? "#fef2f2" : "#dce1ff",
            icon: <TrendingUp size={16} />,
            alerta: forecastAlerta,
          },
          {
            label: "Clientes críticos",
            value: alertas ? `${alertas.clientes_criticos}` : "–",
            sub: "Score > 0.75 · Acción < 48h",
            color: "#ef4444",
            bg: "#fef2f2",
            icon: <AlertTriangle size={16} />,
            alerta: false,
          },
          {
            label: "Riesgo acción legal",
            value: alertas ? `${alertas.clientes_riesgo_legal}` : "–",
            sub: "Score > 0.5 + lenguaje legal",
            color: "#d97706",
            bg: "#fef3c7",
            icon: <Users size={16} />,
            alerta: false,
          },
          {
            label: "Reducción TO-BE",
            value: sim ? `${sim.reduccion_pct.toFixed(0)}%` : "88%",
            sub: "Backlog mes 12 vs AS-IS",
            color: "#00216e",
            bg: "#f4f2ff",
            icon: <Activity size={16} />,
            alerta: false,
          },
        ].map((kpi, i) => (
          <div
            key={kpi.label}
            className="card-hover animate-fade-up flex flex-col justify-between"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: kpi.bg, color: kpi.color }}>
                {kpi.icon}
              </div>
              {kpi.alerta && (
                <span className="text-[9px] font-black uppercase tracking-widest bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                  Alerta
                </span>
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold text-brand-gray1 uppercase tracking-tighter mb-1">{kpi.label}</p>
              <h3 className="text-3xl font-black leading-none" style={{ color: kpi.color }}>{kpi.value}</h3>
              <p className="text-[11px] text-brand-muted mt-2">{kpi.sub}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Forecast Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 card animate-fade-up">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-bold text-sura-navy">Forecast de Volumen</h3>
              <p className="text-sm text-brand-muted">Proyección Jun–Sep 2025 con intervalo de confianza 80%</p>
            </div>
            <div className="flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-wide">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sura-navy"></span> Base</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sura-action opacity-40"></span> IC 80%</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Optimista</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400"></span> Pesimista</span>
            </div>
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecast} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradCI" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#085efe" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#085efe" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e1e1f6" vertical={false} />
                <XAxis
                  dataKey="fecha"
                  tickFormatter={(v) => MesLabel[v] ?? v}
                  tick={{ fill: "#747684", fontSize: 11, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  tick={{ fill: "#747684", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[280, 560]}
                />
                <Tooltip content={<CustomForecastTooltip />} />
                {alertas && (
                  <ReferenceLine
                    y={alertas.umbral_alerta}
                    stroke="#f59e0b"
                    strokeDasharray="5 3"
                    label={{ value: `Umbral ${alertas.umbral_alerta}`, fill: "#d97706", fontSize: 10, fontWeight: 700, position: "insideTopLeft" }}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="ic_alto"
                  name="IC alto"
                  stroke="transparent"
                  fill="url(#gradCI)"
                  activeDot={false}
                />
                <Area
                  type="monotone"
                  dataKey="ic_bajo"
                  name="IC bajo"
                  stroke="transparent"
                  fill="#fbf8ff"
                  activeDot={false}
                />
                <Line
                  type="monotone"
                  dataKey="forecast_base"
                  name="Forecast base"
                  stroke="#00216e"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#00216e", strokeWidth: 2, stroke: "#fff" }}
                />
                <Line
                  type="monotone"
                  dataKey="escenario_optimista"
                  name="Optimista (intervenciones)"
                  stroke="#22c55e"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={{ r: 4, fill: "#22c55e", strokeWidth: 2, stroke: "#fff" }}
                />
                <Line
                  type="monotone"
                  dataKey="escenario_pesimista"
                  name="Pesimista"
                  stroke="#f87171"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  dot={{ r: 4, fill: "#f87171", strokeWidth: 2, stroke: "#fff" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[10px] text-brand-gray1 mt-4 italic">
            Modelo: Exponential Smoothing (Holt, tendencia amortiguada). Entrenado Ene–May 2025.
            El escenario optimista asume implementación del portal de tracking (-10% entrada).
          </p>
        </div>

        {/* Segmentación de riesgo */}
        <div className="lg:col-span-4 bg-sura-navy text-white p-6 rounded-xl shadow-xl animate-fade-up space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sura-action/20 rounded-full blur-3xl -mr-10 -mt-10" />
          <div className="relative z-10">
            <h3 className="text-lg font-bold mb-1">Segmentación de Riesgo</h3>
            <p className="text-xs text-white/60">Clientes activos por probabilidad de escalamiento</p>
          </div>
          <div className="relative z-10 space-y-4">
            {[
              { seg: "Crítico",  score: "> 0.75", accion: "Contacto proactivo < 48h", count: alertas?.clientes_criticos ?? 99,  color: "#ef4444", pct: 36 },
              { seg: "Alto",     score: "0.50–0.75", accion: "Fast-track si recontacta",   count: 62,   color: "#f97316", pct: 22 },
              { seg: "Medio",    score: "0.25–0.50", accion: "Monitoreo semanal",           count: 65,   color: "#eab308", pct: 24 },
              { seg: "Bajo",     score: "< 0.25",    accion: "Flujo normal",                count: 51,   color: "#22c55e", pct: 18 },
            ].map(s => (
              <div key={s.seg} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <div>
                    <span className="font-black">{s.seg}</span>
                    <span className="text-white/50 ml-1.5">score {s.score}</span>
                  </div>
                  <span className="font-black">{s.count} clientes</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
                </div>
                <p className="text-[10px] text-white/50">{s.accion}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Escenarios Dinámica de Sistemas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 card animate-fade-up">
          <h3 className="text-xl font-bold text-sura-navy mb-1">Simulación de Escenarios</h3>
          <p className="text-sm text-brand-muted mb-6">
            Backlog de quejas al mes 12 según intervención — modelo ODE calibrado (NB06)
          </p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={escenarios}
                layout="vertical"
                margin={{ top: 0, right: 50, left: 20, bottom: 0 }}
                barSize={26}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e1e1f6" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#747684", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="nombre"
                  width={150}
                  tick={{ fill: "#00216e", fontSize: 10, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomScenarioTooltip />} cursor={{ fill: "#f1f1ff" }} />
                <Bar dataKey="backlog" name="Backlog mes 12" radius={[0, 4, 4, 0]}>
                  {escenarios.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-brand-gray1 mt-4 italic">
            AS-IS converge a ~169 quejas en backlog. TO-BE completo (portal + notif. + fast-track + clasificador) lo reduce a ~21 quejas (−88%).
          </p>
        </div>

        {/* Tornado de sensibilidad */}
        <div className="lg:col-span-5 card animate-fade-up">
          <h3 className="text-lg font-bold text-sura-navy mb-1">Análisis de Sensibilidad</h3>
          <p className="text-sm text-brand-muted mb-6">
            Impacto sobre el backlog ante variación ±20% en cada parámetro
          </p>
          <div className="space-y-3">
            {sensibilidad.map((s, i) => (
              <div key={s.parametro} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-brand-muted">{s.parametro}</span>
                  <span className="font-black text-sura-navy">{s.impacto}%</span>
                </div>
                <div className="h-2 w-full bg-brand-gray3 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${s.impacto}%`,
                      backgroundColor: i === 0 ? "#ef4444" : i === 1 ? "#0049cb" : "#085efe",
                      opacity: 1 - i * 0.12,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-sura-frost rounded-xl border border-brand-gray3">
            <p className="text-xs text-brand-muted leading-relaxed">
              <span className="font-black text-sura-navy">Insight clave:</span> La tasa de entrada de quejas
              es el parámetro más sensible del sistema. Intervenciones que reducen la entrada (portal de tracking)
              tienen mayor impacto estructural que aumentar la capacidad de resolución.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
