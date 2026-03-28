"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { ChevronRight, Radio, Info, AlertTriangle, Zap } from "lucide-react";
import clsx from "clsx";

const canalDistrib = [
  { canal: "SEGUROSSURA.COM.CO",    count: 1012, pct: 54.9, color: "#00216e" },
  { canal: "LINEA DE ATENCIÓN",      count: 645,  pct: 35.0, color: "#0049cb" },
  { canal: "ENTES DE CONTROL",       count: 157,  pct: 8.5,  color: "#ef4444" },
  { canal: "PLATAFORMA DE ATENCIÓN", count: 27,   pct: 1.5,  color: "#e6eb2d" },
];

const evolucionCanal = [
  { mes: "Ene", web: 210, linea: 125, entes: 32, plataforma: 8 },
  { mes: "Feb", web: 152, linea: 108, entes: 24, plataforma: 4 },
  { mes: "Mar", web: 168, linea: 110, entes: 27, plataforma: 3 },
  { mes: "Abr", web: 185, linea: 120, entes: 30, plataforma: 0 },
  { mes: "May", web: 200, linea: 130, entes: 29, plataforma: 3 },
  { mes: "Jun", web: 97,  linea: 52,  entes: 15, plataforma: 9 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-brand-gray3 rounded-xl p-3 shadow-card-lg text-xs">
        <p className="font-bold text-sura-navy mb-2">{label} 2025</p>
        <div className="space-y-1.5">
          {payload.map((p: any) => (
            <div key={p.dataKey} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: p.fill }}></div>
                <span className="text-brand-muted">{p.name}:</span>
              </div>
              <span className="font-bold text-sura-navy">{p.value}</span>
            </div>
          ))}
          <div className="pt-1.5 mt-1.5 border-t border-brand-gray3 flex justify-between items-center font-black">
            <span>Total:</span>
            <span>{payload.reduce((acc: number, curr: any) => acc + curr.value, 0)}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function AnalisisCanales() {
  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-10 animate-page-in">
      
      {/* Header section with icon */}
      <div className="flex items-end gap-4">
        <div className="w-14 h-14 bg-sura-ice rounded-2xl flex items-center justify-center text-sura-action shadow-sm">
          <Radio size={28} />
        </div>
        <div>
          <span className="badge-blue text-[10px] font-black uppercase tracking-widest mb-1.5 inline-block">Distribución</span>
          <h1 className="text-4xl font-black text-sura-navy tracking-tight">Análisis por <span className="text-sura-action">Canal</span></h1>
          <p className="text-sm text-brand-muted font-medium mt-1">Monitoreo de la eficiencia en los diferentes puntos de contacto con el cliente.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Donut Chart with Legend */}
        <div className="lg:col-span-5 card space-y-8 h-full flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-sura-navy flex items-center gap-2">
              Volumen por Canal <Info size={14} className="text-brand-gray1" />
            </h2>
            <p className="text-xs text-brand-muted">Distribución porcentual del semestre</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="h-[240px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={canalDistrib} 
                    cx="50%" cy="50%" 
                    innerRadius={65} outerRadius={95} 
                    dataKey="count" 
                    paddingAngle={6}
                    stroke="none"
                  >
                    {canalDistrib.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any, props: any) => [`${value} quejas (${props.payload.pct}%)`, props.payload.canal]}
                    contentStyle={{ border: "none", borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center total */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[12px] font-black text-brand-gray1 uppercase tracking-tighter">Total</span>
                <span className="text-2xl font-black text-sura-navy">1,841</span>
              </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-4 mt-6">
              {canalDistrib.map((c) => (
                <div key={c.canal} className="p-3 rounded-xl bg-brand-low border border-brand-gray3 hover:border-sura-ice transition-all">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: c.color }}></div>
                    <span className="text-[10px] font-black text-brand-gray1 uppercase truncate">{c.canal.split('.')[0]}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-lg font-black text-sura-navy">{c.count}</span>
                    <span className="text-xs font-bold text-brand-muted mb-0.5">{c.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Detailed Table & Critical Alert */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="card h-full flex flex-col">
            <h2 className="text-lg font-bold text-sura-navy mb-6">Métricas Comparativas</h2>
            
            <div className="overflow-hidden rounded-xl border border-brand-gray3 flex-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-brand-low text-left border-b border-brand-gray3">
                    <th className="px-6 py-4 table-header">Canal de Entrada</th>
                    <th className="px-6 py-4 table-header text-right">Volumen</th>
                    <th className="px-6 py-4 table-header text-right">% Participación</th>
                    <th className="px-6 py-4 table-header text-center">Nivel Riesgo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-gray3">
                  {canalDistrib.map((c) => (
                    <tr key={c.canal} className="hover:bg-brand-low/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-[12px] font-bold text-sura-navy underline decoration-sura-ice underline-offset-4 decoration-2">
                          {c.canal}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-[13px] font-black" style={{ color: c.color }}>
                          {c.count.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <span className="text-[11px] font-bold text-brand-muted">{c.pct}%</span>
                          <div className="w-16 h-1 bg-brand-gray4 rounded-full overflow-hidden shrink-0">
                            <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: c.color }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={clsx(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold",
                          c.pct > 40 ? "badge-blue" : c.pct > 8 ? "badge-yellow" : "badge-red"
                        )}>
                          {c.pct > 40 ? "ALTO" : c.pct > 8 ? "MEDIO" : "CRÍTICO"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 p-6 rounded-2xl bg-red-50/50 border border-red-100 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shrink-0 shadow-sm">
                <AlertTriangle size={20} />
              </div>
              <div>
                <p className="text-xs font-black text-red-700 tracking-wider uppercase mb-1">Punto crítico detectado</p>
                <p className="text-sm text-red-900/80 leading-relaxed">
                  Las quejas vía <span className="font-bold underline">Entes de Control</span> representan el 8.5% pero consumen el 40% de los recursos legales. Es prioritaria la contención en canales directos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Evolution Chart with Stacked Bars */}
      <section className="card">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <h2 className="text-xl font-bold text-sura-navy tracking-tight">Evolución Histórica Acumulada</h2>
            <p className="text-sm text-brand-muted">Crecimiento y mix de canales por mes — Semestre 1 2025</p>
          </div>
          <div className="px-4 py-2 rounded-lg bg-brand-low border border-brand-gray3 text-[11px] font-bold text-brand-muted">
            Filtro: Todo el periodo
          </div>
        </div>

        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={evolucionCanal} margin={{ top: 0, right: 10, left: -20, bottom: 0 }} barGap={0}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e1e1f6" vertical={false} />
              <XAxis 
                dataKey="mes" 
                tick={{ fill: "#747684", fontSize: 11, fontWeight: 700 }} 
                axisLine={false} 
                tickLine={false} 
                dy={12}
              />
              <YAxis 
                tick={{ fill: "#747684", fontSize: 11 }} 
                axisLine={false} 
                tickLine={false} 
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f1ff" }} />
              <Legend verticalAlign="top" align="right" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', paddingBottom: '24px' }} />
              <Bar dataKey="web"        name="Digital Web"    fill="#00216e" stackId="a" barSize={32} />
              <Bar dataKey="linea"      name="Call Center"    fill="#0049cb" stackId="a" />
              <Bar dataKey="entes"      name="Entes Externos" fill="#ef4444" stackId="a" />
              <Bar dataKey="plataforma" name="Punto Físico"   fill="#e6eb2d" stackId="a" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Floating Insight Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
        <div className="bg-sura-yellow p-6 rounded-2xl shadow-xl flex items-center justify-between group overflow-hidden relative">
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
            <Radio size={120} />
          </div>
          <div className="relative z-10">
            <h5 className="text-[13px] font-black text-sura-navy uppercase tracking-widest mb-1">Predicción de Canal</h5>
            <p className="text-2xl font-black text-[#484a00] leading-none mb-2 tracking-tighter">Crecimiento Web +12%</p>
            <p className="text-xs text-brand-muted max-w-[280px]">Se estima que el canal digital superará el 60% de participación en Q3 2025.</p>
          </div>
          <button className="relative z-10 w-12 h-12 rounded-full bg-sura-navy flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
            <ChevronRight size={24} />
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-brand-gray3 shadow-card flex items-center gap-6 group hover:translate-x-2 transition-all">
          <div className="w-12 h-12 bg-sura-frost rounded-full flex items-center justify-center text-sura-action shrink-0 border border-sura-ice">
            <Zap size={24} fill="currentColor" />
          </div>
          <div>
            <h5 className="text-sm font-bold text-sura-navy">Optimización IA</h5>
            <p className="text-xs text-brand-muted mt-1 leading-relaxed">
              El asistente virtual en la Web resolvió el 42% de las consultas de estado de pago en Junio, bajando la carga de la Línea de Atención en un 15%.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
