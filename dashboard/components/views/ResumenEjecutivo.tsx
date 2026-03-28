"use client";

import KPICard from "@/components/KPICard";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from "recharts";
import { AlertTriangle, BarChart2, Users, Eye, ChevronRight, Zap } from "lucide-react";
import clsx from "clsx";
import { useState, useEffect } from "react";

// Datos reales extraídos del análisis EDA (NB01)
const volumenMensual = [
  { mes: "Ene", quejas: 337, escaladas: 29 },
  { mes: "Feb", quejas: 349, escaladas: 30 },
  { mes: "Mar", quejas: 370, escaladas: 31 },
  { mes: "Abr", quejas: 358, escaladas: 30 },
  { mes: "May", quejas: 254, escaladas: 22 },
  { mes: "Jun*", quejas: 173, escaladas: 15 },
];

interface Alertas {
  forecast_proximo_mes: number;
  umbral_alerta: number;
  umbral_critico: number;
  clientes_criticos: number;
  clientes_riesgo_legal: number;
  fecha_actualizacion: string;
}

const topCategorias = [
  { nombre: "Estado de trámite", count: 644, pct: 35 },
  { nombre: "Demora en pago",    count: 460, pct: 25 },
  { nombre: "Solicitud docs",    count: 276, pct: 15 },
  { nombre: "Radicación",        count: 184, pct: 10 },
  { nombre: "Error en monto",    count: 129, pct: 7  },
  { nombre: "Escalamiento legal",count: 92,  pct: 5  },
];

const CasosRecientes = [
  { id: "#CAS-88219", empresa: "Constructora Horizonte", idEmpresa: "900.234.111-5", motivo: "Reembolso médico pendiente", severidad: "Alta", estado: "En Proceso" },
  { id: "#CAS-88220", empresa: "Minería del Cauca", idEmpresa: "860.003.444-2", motivo: "Calificación de origen", severidad: "Media", estado: "Pendiente" },
  { id: "#CAS-88221", empresa: "Servicios Unidos S.A.S", idEmpresa: "901.442.001-0", motivo: "Incapacidad no liquidada", severidad: "Alta", estado: "En Proceso" },
  { id: "#CAS-88222", empresa: "Logística Global", idEmpresa: "800.211.998-3", motivo: "Cita especialista demorada", severidad: "Baja", estado: "Cerrado" },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-brand-gray3 rounded-xl p-3 shadow-card-lg text-xs">
        <p className="font-bold text-sura-navy mb-1">{label} 2025</p>
        <div className="space-y-1">
          {payload.map((p: any) => (
            <div key={p.name} className="flex items-center justify-between gap-4">
              <span className="text-brand-muted">{p.name}:</span>
              <span className="font-bold" style={{ color: p.color || p.fill || '#00216e' }}>
                {p.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function ResumenEjecutivo() {
  const [alertas, setAlertas] = useState<Alertas | null>(null);

  useEffect(() => {
    fetch("/data/alertas.json")
      .then(r => r.json())
      .then(setAlertas)
      .catch(() => {});
  }, []);

  const forecastAlerta = alertas && alertas.forecast_proximo_mes > alertas.umbral_alerta;
  const forecastCritico = alertas && alertas.forecast_proximo_mes > alertas.umbral_critico;

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-12">

      {/* Forecast Alert Banner */}
      {alertas && forecastAlerta && (
        <div className={clsx(
          "flex items-start gap-4 p-4 rounded-xl border text-sm font-medium animate-fade-up",
          forecastCritico
            ? "bg-red-50 border-red-200 text-red-800"
            : "bg-amber-50 border-amber-200 text-amber-800"
        )}>
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div>
            <span className="font-black">
              {forecastCritico ? "Alerta Crítica" : "Alerta de Volumen"}:
            </span>{" "}
            El forecast para el próximo mes es{" "}
            <span className="font-black">{alertas.forecast_proximo_mes} quejas</span>,
            superando el umbral de alerta de {alertas.umbral_alerta}.
            {" "}{alertas.clientes_criticos} clientes en segmento Crítico —
            {" "}{alertas.clientes_riesgo_legal} con riesgo de acción legal inminente.
          </div>
        </div>
      )}

      {/* Editorial Hero Section */}
      <section className="animate-fade-up">
        <span className="bg-sura-yellow/20 text-[#484a00] text-[10px] font-bold px-2 py-0.5 rounded-sm tracking-widest uppercase mb-4 inline-block">
          Actualización Tiempo Real
        </span>
        <h2 className="text-[3.5rem] font-black leading-[0.95] tracking-tighter text-sura-navy mb-4">
          Resumen <br />
          <span className="text-sura-action">Ejecutivo</span>
        </h2>
        <p className="text-brand-muted text-lg leading-relaxed max-w-xl">
          Visualización centralizada de la gestión de riesgos y satisfacción de clientes para ARL SURA. 
          Monitoreo de incapacidades temporales y escalamiento legal.
        </p>
      </section>

      {/* KPI Row */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Total Quejas" 
          value="1,841" 
          subtitle="Ene–Jun 2025" 
          trend="up" 
          trendLabel="+8% sem. anterior" 
          trendPositive={false}
          icon={<BarChart2 size={18} />} 
          delay={0}
        />
        <KPICard 
          title="Tasa Escalamiento" 
          value="8.5%" 
          subtitle="157 a Entes de Control" 
          trend="up" 
          trendLabel="Riesgo alto" 
          trendPositive={false}
          icon={<AlertTriangle size={18} />} 
          iconBg="#fee2e2"
          iconColor="#ef4444"
          delay={75}
        />
        <KPICard 
          title="Recurrencia" 
          value="20.7%" 
          subtitle="277 de 1,334 únicos" 
          trend="neutral" 
          trendLabel="Estable" 
          icon={<Users size={18} />} 
          iconBg="#fef3c7"
          iconColor="#d97706"
          delay={150}
        />
        <KPICard 
          title="FCR Estimado" 
          value="~79%" 
          subtitle="Objetivo: >90%" 
          trend="down" 
          trendLabel="Bajo objetivo" 
          trendPositive={true}
          icon={<Zap size={18} />} 
          iconBg="#fefce8"
          iconColor="#eab308"
          delay={225}
        />
      </section>

      {/* Bento Grid Insights */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Main Chart Card */}
        <div className="md:col-span-8 card animate-fade-up delay-300">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h4 className="text-xl font-bold text-sura-navy">Evolución Mensual</h4>
              <p className="text-sm text-brand-muted">Tendencia de quejas vs escalamiento legal</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sura-navy"></span> Quejas</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Escaladas</span>
            </div>
          </div>
          
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumenMensual} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradQuejas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00216e" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#00216e" stopOpacity={0} />
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
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="quejas" 
                  name="Total Quejas" 
                  stroke="#00216e" 
                  strokeWidth={3} 
                  fill="url(#gradQuejas)" 
                  dot={{ r: 4, fill: "#00216e", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="escaladas" 
                  name="Escalamiento" 
                  stroke="#ef4444" 
                  strokeWidth={2} 
                  fill="transparent" 
                  dot={{ r: 4, fill: "#ef4444", strokeWidth: 2, stroke: "#fff" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Bar Card */}
        <div className="md:col-span-4 bg-sura-navy text-white p-8 rounded-xl shadow-xl space-y-8 relative overflow-hidden animate-fade-up delay-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sura-action opacity-20 rounded-full blur-3xl -mr-16 -mt-16"></div>
          
          <div className="relative z-10">
            <h4 className="text-xl font-bold mb-1">Categorías Top</h4>
            <p className="text-xs text-white/60">Por nivel de criticidad e impacto</p>
          </div>

          <div className="space-y-6 relative z-10">
            {topCategorias.map((cat, i) => (
              <div key={cat.nombre} className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-medium opacity-80">{cat.nombre}</span>
                  <span className="font-bold">{cat.count}</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-sura-yellow rounded-full transition-all duration-1000" 
                    style={{ width: `${cat.pct}%`, backgroundColor: i === 0 ? '#e6eb2d' : 'rgba(255,255,255,0.6)' }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full py-3 rounded-lg border border-white/20 text-xs font-bold hover:bg-white/10 transition-colors flex items-center justify-center gap-2 relative z-10">
            Ver detalle temático <ChevronRight size={14} />
          </button>
        </div>
      </section>

      {/* Cases Table Section */}
      <section className="bg-white rounded-xl shadow-card border border-brand-gray3 overflow-hidden animate-fade-up">
        <div className="p-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h4 className="text-xl font-bold text-sura-navy">Gestión de Casos Críticos</h4>
            <p className="text-sm text-brand-muted">Últimas quejas con potencial de escalamiento legal</p>
          </div>
          <button className="px-4 py-2 rounded-lg text-sura-action font-bold text-xs hover:bg-sura-frost transition-colors flex items-center gap-1.5">
            Ver historial completo <ChevronRight size={14} />
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-brand-low border-y border-brand-gray3 text-[10px] uppercase font-black tracking-widest text-sura-navy">
                <th className="px-8 py-4">ID Caso</th>
                <th className="px-8 py-4">Empresa / Afiliado</th>
                <th className="px-8 py-4">Motivo Principal</th>
                <th className="px-8 py-4 text-center">Severidad</th>
                <th className="px-8 py-4">Estado</th>
                <th className="px-8 py-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-gray3">
              {CasosRecientes.map((caso) => (
                <tr key={caso.id} className="hover:bg-brand-low/50 transition-colors group">
                  <td className="px-8 py-5 text-sm font-mono text-sura-action font-semibold italic">{caso.id}</td>
                  <td className="px-8 py-5">
                    <p className="text-sm font-bold text-sura-navy leading-tight">{caso.empresa}</p>
                    <p className="text-[10px] text-brand-gray1 mt-0.5">{caso.idEmpresa}</p>
                  </td>
                  <td className="px-8 py-5 text-sm text-brand-muted">{caso.motivo}</td>
                  <td className="px-8 py-5 text-center">
                    <span className={clsx(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-bold",
                      caso.severidad === "Alta" ? "bg-red-50 text-red-700" : 
                      caso.severidad === "Media" ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"
                    )}>
                      {caso.severidad}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <span className={clsx(
                        "w-2 h-2 rounded-full",
                        caso.estado === "Cerrado" ? "bg-green-500" :
                        caso.estado === "Pendiente" ? "bg-amber-500" : "bg-sura-action"
                      )}></span>
                      <span className="text-xs font-medium text-brand-charcoal">{caso.estado}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <button className="p-2 rounded-full text-brand-gray1 hover:bg-sura-ice hover:text-sura-navy transition-all group-hover:scale-110">
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Insights Row for Bottom Detail */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-up">
        <div className="card border-l-4 border-l-red-500 bg-red-50/30">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-500 mb-4 font-bold text-lg">!</div>
          <h5 className="text-[14px] font-bold text-sura-navy mb-2">Alerta de Escalamiento</h5>
          <p className="text-xs text-brand-muted leading-relaxed">
            El 8.5% de quejas llegaron a Entes de Control. Si la tendencia continúa, el riesgo legal aumenta un 15% en Q3.
          </p>
        </div>
        <div className="card border-l-4 border-l-sura-yellow bg-yellow-50/20">
          <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center text-amber-600 mb-4">
            <Zap size={20} fill="currentColor" />
          </div>
          <h5 className="text-[14px] font-bold text-sura-navy mb-2">Acción Rápida Sugerida</h5>
          <p className="text-xs text-brand-muted leading-relaxed">
            El 35% de quejas son consultas de estado. Implementar un tracker en tiempo real reduciría el volumen masivo.
          </p>
        </div>
        <div className="card border-l-4 border-l-sura-action bg-sura-frost/50">
          <div className="w-10 h-10 rounded-lg bg-sura-ice flex items-center justify-center text-sura-blue mb-4">
            <Users size={20} />
          </div>
          <h5 className="text-[14px] font-bold text-sura-navy mb-2">Foco en Recurrencia</h5>
          <p className="text-xs text-brand-muted leading-relaxed">
            20% de clientes generan +40% de quejas. Un Fast-Track para los 277 clientes críticos reduciría la carga operativa.
          </p>
        </div>
      </section>

    </div>
  );
}
