"use client";

import {
  ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell, Line, LabelList
} from "recharts";
import { TrendingUp, AlertTriangle, Users, Activity } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

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
  { nombre: "Sin cambios",                      detalle: "Situación actual sin intervención",          backlog: 169, color: "#ef4444", reduccion: 0  },
  { nombre: "Más capacidad de resolución",      detalle: "Contratar o reasignar analistas",             backlog: 140, color: "#f97316", reduccion: 17 },
  { nombre: "Clasificador automático",          detalle: "IA prioriza las quejas más urgentes",         backlog: 148, color: "#eab308", reduccion: 12 },
  { nombre: "Portal de seguimiento",            detalle: "El cliente puede ver el estado de su caso",   backlog: 110, color: "#0049cb", reduccion: 35 },
  { nombre: "Portal + notificaciones",          detalle: "Avisos proactivos en cada cambio de estado",  backlog: 68,  color: "#085efe", reduccion: 60 },
  { nombre: "Plan completo (todas las mejoras)",detalle: "Portal + Notif. + Fast-track + Clasificador", backlog: 21,  color: "#00216e", reduccion: 88 },
];

// Análisis de sensibilidad — qué palancas mueven más el resultado
const sensibilidad = [
  { parametro: "Reducir la entrada de quejas",      detalle: "Portal de seguimiento evita que el cliente tenga que quejarse", impacto: 42 },
  { parametro: "Aumentar capacidad de resolución",  detalle: "Más analistas o procesos más rápidos",                          impacto: 28 },
  { parametro: "Mejorar retroalimentación",         detalle: "Comunicar al cliente el avance de su caso",                     impacto: 18 },
  { parametro: "Reducir escalamientos",             detalle: "Resolver antes de que llegue a Entes de Control",               impacto: 12 },
  { parametro: "Reducir insatisfacción",            detalle: "Resolver de fondo, no solo responder",                          impacto: 7  },
  { parametro: "Mejorar recuperación",              detalle: "Reconquistar clientes que ya se quejaron",                      impacto: 4  },
];

const MesLabel: Record<string, string> = {
  "2025-06-01": "Jun",
  "2025-07-01": "Jul",
  "2025-08-01": "Ago",
  "2025-09-01": "Sep",
};

// Datos estáticos representativos — se reemplazan con output real del NB05 cuando esté disponible
const FORECAST_FALLBACK: ForecastRow[] = [
  { fecha: "2025-06-01", forecast_base: 381, ic_bajo: 351, ic_alto: 411, escenario_optimista: 343, escenario_pesimista: 418 },
  { fecha: "2025-07-01", forecast_base: 404, ic_bajo: 368, ic_alto: 440, escenario_optimista: 351, escenario_pesimista: 447 },
  { fecha: "2025-08-01", forecast_base: 428, ic_bajo: 385, ic_alto: 471, escenario_optimista: 358, escenario_pesimista: 478 },
  { fecha: "2025-09-01", forecast_base: 453, ic_bajo: 403, ic_alto: 503, escenario_optimista: 364, escenario_pesimista: 511 },
];

// Datos históricos reales Ene–May 2025 (NB01) para el gráfico unificado
const HISTORICO_MENSUAL = [
  { mes: "Ene", real: 337 },
  { mes: "Feb", real: 349 },
  { mes: "Mar", real: 370 },
  { mes: "Abr", real: 358 },
  { mes: "May", real: 254 },
];

// Waterfall: camino acumulado del plan completo (derivado de escenarios)
const waterfallData = [
  { step: "Sin intervención",      base: 0,   valor: 169, color: "#ef4444", etiqueta: "169" },
  { step: "Portal seguimiento",    base: 110,  valor: 59,  color: "#0049cb", etiqueta: "−59" },
  { step: "+ Notificaciones",      base: 68,   valor: 42,  color: "#085efe", etiqueta: "−42" },
  { step: "+ Clasificador",        base: 21,   valor: 47,  color: "#00216e", etiqueta: "−47" },
  { step: "Plan completo",         base: 0,    valor: 21,  color: "#22c55e", etiqueta: "21" },
];

const ALERTAS_FALLBACK = {
  forecast_proximo_mes: 404,
  umbral_alerta: 369,
  umbral_critico: 450,
  clientes_criticos: 99,
  clientes_riesgo_legal: 23,
};

const CustomForecastTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-brand-gray3 rounded-xl p-3 shadow-card-lg text-xs space-y-1">
      <p className="font-black text-sura-navy mb-2">{label} 2025</p>
      {payload.filter((p: any) => p.value != null).map((p: any) => (
        <div key={p.name} className="flex items-center justify-between gap-6">
          <span className="text-brand-muted">{p.name}:</span>
          <span className="font-black" style={{ color: p.stroke || p.fill || "#00216e" }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const CustomWaterfallTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const base  = payload.find((p: any) => p.dataKey === "base")?.value  ?? 0;
  const valor = payload.find((p: any) => p.dataKey === "valor")?.value ?? 0;
  const total = base + valor;
  const ahorro = 169 - total;
  return (
    <div className="bg-white border border-brand-gray3 rounded-xl p-3 shadow-card-lg text-xs max-w-[200px]">
      <p className="font-black text-sura-navy mb-1">{label}</p>
      <p className="text-brand-muted">Casos pendientes al mes 12: <span className="font-black text-sura-navy">{total}</span></p>
      {ahorro > 0 && <p className="text-green-600 font-black mt-1">Ahorro acumulado: {ahorro} casos ({Math.round(ahorro / 169 * 100)}%)</p>}
    </div>
  );
};

const CustomScenarioTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const escenario = escenarios.find(e => e.nombre === label);
  return (
    <div className="bg-white border border-brand-gray3 rounded-xl p-3 shadow-card-lg text-xs max-w-[220px]">
      <p className="font-black text-sura-navy mb-1">{label}</p>
      {escenario && <p className="text-brand-gray1 mb-2 leading-relaxed">{escenario.detalle}</p>}
      <p className="text-brand-muted">Casos pendientes al mes 12: <span className="font-black text-sura-navy">{d.value}</span></p>
      {escenario && escenario.reduccion > 0 && (
        <p className="text-green-600 font-black mt-1">↓ {escenario.reduccion}% menos que hoy</p>
      )}
    </div>
  );
};

export default function Prediccion() {
  const [forecast, setForecast] = useState<ForecastRow[]>([]);
  const [alertas, setAlertas] = useState<Alertas | null>(null);
  const [sim, setSim] = useState<SimResumen | null>(null);

  useEffect(() => {
    fetch("/data/forecast_volumen.json").then(r => r.json()).then(setForecast).catch(() => setForecast(FORECAST_FALLBACK));
    fetch("/data/alertas.json").then(r => r.json()).then(setAlertas).catch(() => setAlertas(ALERTAS_FALLBACK));
    fetch("/data/resumen_simulacion.json").then(r => r.json()).then(setSim).catch(() => {});
  }, []);

  const forecastAlerta = alertas && alertas.forecast_proximo_mes > alertas.umbral_alerta;

  const chartUnificado = useMemo(() => {
    const fRows = forecast.length > 0 ? forecast : FORECAST_FALLBACK;
    const proj = fRows.map(f => ({
      mes: MesLabel[f.fecha] ?? f.fecha,
      base: f.forecast_base,
      ic_bajo: f.ic_bajo,
      ic_alto: f.ic_alto,
      optimista: f.escenario_optimista,
    }));
    return [...HISTORICO_MENSUAL, ...proj];
  }, [forecast]);

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-10 animate-page-in">

      {/* Header */}
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <span className="badge-blue text-[10px] font-black uppercase tracking-widest mb-3 inline-block">
            Proyección y Escenarios
          </span>
          <h1 className="text-4xl font-black text-sura-navy tracking-tighter">
            ¿Qué viene y <span className="text-sura-action">qué podemos hacer?</span>
          </h1>
          <p className="text-sm text-brand-muted font-medium mt-2 max-w-xl">
            Proyección de quejas para los próximos meses y comparativa de cuánto mejora cada acción posible.
            Pasa el cursor sobre cada barra para ver la explicación.
          </p>
        </div>
        <a
          href="/reports/informe_con_graficas.pdf"
          download
          className="flex items-center gap-2 px-4 py-2.5 bg-sura-navy text-white rounded-xl text-sm font-bold hover:bg-sura-blue transition-colors shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Descargar informe completo (PDF)
        </a>
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
              <h3 className="text-xl font-bold text-sura-navy">Histórico + Forecast de Volumen</h3>
              <p className="text-sm text-brand-muted">Real Ene–May 2025 · Proyección Jun–Sep 2025 (IC 80%)</p>
            </div>
            <div className="flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-wide">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-brand-gray1"></span> Histórico</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sura-navy"></span> Forecast</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sura-action opacity-40"></span> IC 80%</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Optimista</span>
            </div>
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartUnificado} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradCI" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#085efe" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#085efe" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradReal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#94a3b8" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e1e1f6" vertical={false} />
                <XAxis
                  dataKey="mes"
                  tick={{ fill: "#747684", fontSize: 11, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  tick={{ fill: "#747684", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[180, 560]}
                />
                <Tooltip content={<CustomForecastTooltip />} />
                <ReferenceLine
                  x="Jun"
                  stroke="#94a3b8"
                  strokeDasharray="4 3"
                  label={{ value: "▶ Forecast", fill: "#94a3b8", fontSize: 9, fontWeight: 700, position: "insideTopRight" }}
                />
                {alertas && (
                  <ReferenceLine
                    y={alertas.umbral_alerta}
                    stroke="#f59e0b"
                    strokeDasharray="5 3"
                    label={{ value: `Umbral ${alertas.umbral_alerta}`, fill: "#d97706", fontSize: 10, fontWeight: 700, position: "insideTopLeft" }}
                  />
                )}
                {/* Banda IC forecast */}
                <Area type="monotone" dataKey="ic_alto"  name="IC alto"  stroke="transparent" fill="url(#gradCI)"   activeDot={false} connectNulls={false} />
                <Area type="monotone" dataKey="ic_bajo"  name="IC bajo"  stroke="transparent" fill="#fbf8ff"        activeDot={false} connectNulls={false} />
                {/* Histórico real */}
                <Area
                  type="monotone"
                  dataKey="real"
                  name="Histórico real"
                  stroke="#94a3b8"
                  strokeWidth={2.5}
                  fill="url(#gradReal)"
                  dot={{ r: 4, fill: "#94a3b8", strokeWidth: 2, stroke: "#fff" }}
                  connectNulls={false}
                />
                {/* Forecast */}
                <Line
                  type="monotone"
                  dataKey="base"
                  name="Forecast base"
                  stroke="#00216e"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#00216e", strokeWidth: 2, stroke: "#fff" }}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="optimista"
                  name="Optimista (intervenciones)"
                  stroke="#22c55e"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={{ r: 4, fill: "#22c55e", strokeWidth: 2, stroke: "#fff" }}
                  connectNulls={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[10px] text-brand-gray1 mt-4 italic">
            La línea gris muestra el volumen real registrado. La línea azul oscuro proyecta el forecast a partir de Junio.
            La línea verde muestra el escenario con portal de seguimiento implementado.
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
          <h3 className="text-xl font-bold text-sura-navy mb-1">¿Cuánto mejora cada acción?</h3>
          <p className="text-sm text-brand-muted mb-1">
            Casos de quejas pendientes al cabo de 12 meses según qué se implemente.
          </p>
          <p className="text-xs text-brand-gray1 mb-6">Menos casos = mejor resultado. Pasa el cursor sobre cada barra para ver la explicación.</p>
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
                  width={200}
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
            Sin acción: ~169 casos pendientes al año. Con el plan completo: ~21 casos (−88%). La diferencia la hacen el portal de seguimiento y las notificaciones proactivas.
          </p>
        </div>

        {/* Tornado de sensibilidad */}
        <div className="lg:col-span-5 card animate-fade-up">
          <h3 className="text-lg font-bold text-sura-navy mb-1">¿Qué palanca mueve más el resultado?</h3>
          <p className="text-sm text-brand-muted mb-6">
            Qué tanto cambia el número de casos pendientes según cada tipo de acción
          </p>
          <div className="space-y-4">
            {sensibilidad.map((s, i) => (
              <div key={s.parametro} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-brand-charcoal">{s.parametro}</span>
                  <span className="font-black text-sura-navy">{s.impacto}%</span>
                </div>
                <div className="h-2 w-full bg-brand-gray3 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${s.impacto}%`,
                      backgroundColor: i === 0 ? "#ef4444" : i === 1 ? "#0049cb" : "#085efe",
                      opacity: 1 - i * 0.12,
                      transition: "width 700ms ease",
                    }}
                  />
                </div>
                <p className="text-[10px] text-brand-gray1 leading-relaxed">{s.detalle}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-sura-frost rounded-xl border border-brand-gray3">
            <p className="text-xs text-brand-muted leading-relaxed">
              <span className="font-black text-sura-navy">Conclusión:</span> La acción más poderosa es
              reducir la razón por la que los clientes se quejan en primer lugar —
              el portal de seguimiento elimina la queja de "no sé qué pasó con mi caso".
            </p>
          </div>
        </div>
      </div>

      {/* Waterfall: ruta acumulada del plan completo */}
      <div className="card animate-fade-up">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-sura-navy mb-1">Ruta hacia el Plan Completo</h3>
            <p className="text-sm text-brand-muted max-w-xl">
              Cuántos casos elimina cada intervención al encadenarlas en orden de impacto.
              De 169 sin cambios a 21 con el plan completo — una reducción del 88%.
            </p>
          </div>
          <div className="shrink-0 flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wide">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span> Sin intervención</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#0049cb]"></span> Reducción parcial</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]"></span> Plan completo</span>
          </div>
        </div>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={waterfallData} margin={{ top: 30, right: 20, left: -10, bottom: 5 }} barSize={52}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e1e1f6" vertical={false} />
              <XAxis
                dataKey="step"
                tick={{ fill: "#00216e", fontSize: 10, fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#747684", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                domain={[0, 200]}
              />
              <Tooltip content={<CustomWaterfallTooltip />} cursor={{ fill: "#f1f1ff" }} />
              {/* Base invisible — efecto waterfall */}
              <Bar dataKey="base" stackId="w" fill="transparent" isAnimationActive={false} />
              {/* Barra visible */}
              <Bar dataKey="valor" stackId="w" radius={[4, 4, 0, 0]}>
                {waterfallData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
                <LabelList dataKey="etiqueta" position="top" style={{ fill: "#00216e", fontSize: 11, fontWeight: 800 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[10px] text-brand-gray1 mt-3 italic">
          Cada barra arranca donde terminó la anterior — muestra el ahorro incremental de cada paso.
          El portal de seguimiento y las notificaciones proactivas aportan el 60% de la mejora total.
        </p>
      </div>

    </div>
  );
}
