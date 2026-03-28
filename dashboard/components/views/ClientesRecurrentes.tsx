"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Users, UserMinus, ShieldAlert, Award, ChevronRight, TrendingUp } from "lucide-react";
import clsx from "clsx";
import { useState, useEffect } from "react";

interface ClienteScore {
  cliente_norm: string;
  n_quejas: number;
  n_escalados: number;
  score_riesgo: number;
  segmento: string;
  lenguaje_legal: number;
}

// Distribución real de recurrencia (NB01)
const recurrenciaDistrib = [
  { quejas: "2 quejas",  clientes: 189 },
  { quejas: "3 quejas",  clientes: 55  },
  { quejas: "4 quejas",  clientes: 22  },
  { quejas: "5+ quejas", clientes: 11  },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-brand-gray3 rounded-xl p-3 shadow-card-lg text-xs">
      <p className="font-bold text-sura-navy mb-1 uppercase tracking-tighter">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="flex items-center gap-2">
           <span className="w-2 h-2 rounded-full" style={{ background: p.fill }}></span>
           <span className="text-brand-muted">{p.name}:</span>
           <span className="font-black text-sura-navy">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function ClientesRecurrentes() {
  const [topClientes, setTopClientes] = useState<{ nombre: string; quejas: number; escalado: boolean }[]>([]);

  useEffect(() => {
    fetch("/data/scoring_clientes.json")
      .then(r => r.json())
      .then((data: ClienteScore[]) => {
        const sorted = [...data]
          .sort((a, b) => b.n_quejas - a.n_quejas)
          .slice(0, 10)
          .map(c => ({
            nombre: c.cliente_norm,
            quejas: c.n_quejas,
            escalado: c.segmento === "Crítico" || c.n_escalados > 0,
          }));
        setTopClientes(sorted);
      })
      .catch(() => {});
  }, []);

  const escalados = topClientes.filter(c => c.escalado).length;

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-10 animate-page-in">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
           <div className="w-14 h-14 bg-sura-yellow/20 rounded-2xl flex items-center justify-center text-[#484a00] shadow-sm">
             <Users size={28} />
           </div>
           <div>
             <span className="badge-yellow text-[10px] font-black uppercase tracking-widest mb-1 inline-block">Fidelización & Riesgo</span>
             <h1 className="text-4xl font-black text-sura-navy tracking-tighter">Clientes <span className="text-sura-action">Recurrentes</span></h1>
             <p className="text-sm text-brand-muted font-medium mt-1">Análisis de fricción acumulada en los 277 clientes con múltiples quejas.</p>
           </div>
        </div>
        <div className="flex gap-2">
           <button className="px-4 py-2 rounded-xl bg-white border border-brand-gray3 text-xs font-bold text-brand-muted hover:bg-brand-low transition-colors">
              Descargar PDF
           </button>
           <button className="px-4 py-2 rounded-xl bg-sura-navy text-white text-xs font-bold shadow-lg hover:shadow-xl transition-all">
              Gestionar Top 10
           </button>
        </div>
      </div>

      {/* Hero Stats Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Clientes únicos",    value: "1,334", sub: "Total semestre", icon: <Users size={16} />, color: "#00216e", bg: "#f4f2ff" },
          { label: "Con recurrencia",    value: "277",   sub: "20.7% del total", icon: <TrendingUp size={16} />, color: "#0049cb", bg: "#dce1ff" },
          { label: "Impacto Top 10",     value: "~70",   sub: "Quejas acumuladas", icon: <Award size={16} />, color: "#e6eb2d", bg: "#fefce8" },
          { label: "Escalado Crítico",   value: `${escalados}/10`, sub: "En el Top 10", icon: <ShieldAlert size={16} />, color: "#ef4444", bg: "#fef2f2" },
        ].map((s, i) => (
          <div key={s.label} className="card-hover animate-fade-up flex flex-col justify-between" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="flex justify-between items-start mb-4">
               <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: s.bg, color: s.color }}>
                  {s.icon}
               </div>
               <span className="text-[10px] font-black text-brand-gray2 uppercase tracking-widest">Semestral</span>
            </div>
            <div>
              <p className="text-[11px] font-bold text-brand-gray1 uppercase tracking-tighter mb-1">{s.label}</p>
              <h3 className="text-3xl font-black text-sura-navy leading-none" style={{ color: s.color === '#e6eb2d' ? '#484a00' : s.color }}>{s.value}</h3>
              <p className="text-xs text-brand-muted mt-2 font-medium">{s.sub}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Ranking Chart Card */}
        <div className="lg:col-span-7 card flex flex-col h-full animate-fade-up">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h2 className="text-xl font-black text-sura-navy tracking-tight">Top 10 Gestión de Crisis</h2>
              <p className="text-sm text-brand-muted">Clientes con mayor volumen de fricción operativa</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span> Escalado</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#00216e]"></span> Directo</span>
            </div>
          </div>

          <div className="flex-1 h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={topClientes} 
                layout="vertical" 
                margin={{ top: 0, right: 30, left: 20, bottom: 0 }} 
                barSize={24}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e1e1f6" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis 
                  type="category" 
                  dataKey="nombre" 
                  width={140} 
                  tick={{ fill: "#00216e", fontSize: 11, fontWeight: 700 }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f1ff" }} />
                <Bar dataKey="quejas" name="Quejas" radius={[0, 4, 4, 0]}>
                  {topClientes.map((c, i) => (
                    <Cell key={i} fill={c.escalado ? "#ef4444" : "#00216e"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 pt-6 border-t border-brand-gray3 flex items-center justify-between">
             <p className="text-xs text-brand-muted font-medium italic">
               Nota: El color rojo indica que el cliente ya escaló a Entes de Control en este periodo.
             </p>
             <button className="flex items-center gap-1.5 text-xs font-black text-sura-action uppercase tracking-widest hover:gap-3 transition-all">
                Ver detalle por cliente <ChevronRight size={14} />
             </button>
          </div>
        </div>

        {/* Right: Risk Analysis Section */}
        <div className="lg:col-span-5 flex flex-col gap-6 animate-fade-up">
          
          {/* Distribution Chart */}
          <div className="card bg-sura-navy text-white overflow-hidden relative group">
             <div className="absolute right-0 top-0 w-32 h-32 bg-sura-action/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
             
             <div className="relative z-10 space-y-6">
                <div>
                  <h2 className="text-lg font-bold">Concentración</h2>
                  <p className="text-xs text-white/60 uppercase tracking-widest font-black mt-1">Curva de Recurrencia</p>
                </div>

                <div className="h-[140px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={recurrenciaDistrib} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <XAxis dataKey="quejas" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        content={<CustomTooltip />} 
                        cursor={{ fill: "rgba(255,255,255,0.05)" }} 
                      />
                      <Bar dataKey="clientes" fill="#e6eb2d" radius={[4, 4, 0, 0]} barSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <p className="text-xs text-white/70 leading-relaxed italic">
                  "El 70% de la recurrencia se concentra en clientes que han duplicado queja una única vez."
                </p>
             </div>
          </div>

          {/* Segment Analysis */}
          <div className="card flex-1">
            <h3 className="text-sm font-black text-brand-gray1 uppercase tracking-[0.2em] mb-6">Segmentación de Riesgo</h3>
            <div className="space-y-4">
              {[
                { seg: "Zona Roja", desc: "Escalados + Alta Recurrencia", count: "45",  pct: 16, color: "#ef4444", bg: "#fef2f2" },
                { seg: "Zona Naranja", desc: "2–3 quejas directas", count: "150", pct: 54, color: "#d97706", bg: "#fef3c7" },
                { seg: "Zona Azul", desc: "2 quejas puntuales", count: "82",  pct: 30, color: "#0049cb", bg: "#dce1ff" },
              ].map(s => (
                <div key={s.seg} className="p-4 rounded-2xl border border-brand-gray4 hover:border-sura-ice transition-all group cursor-pointer">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm" style={{ background: s.bg, color: s.color }}>
                       <UserMinus size={20} />
                    </div>
                    <div className="flex-1">
                       <h5 className="text-[14px] font-black text-sura-navy group-hover:text-sura-action transition-colors">{s.seg}</h5>
                       <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">{s.desc}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-lg font-black text-sura-navy leading-none">{s.count}</p>
                       <p className="text-[10px] font-bold text-brand-gray1">{s.pct}%</p>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-brand-gray4 rounded-full overflow-hidden">
                     <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${s.pct}%`, background: s.color }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
