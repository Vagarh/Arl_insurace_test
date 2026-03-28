"use client";

import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip, PolarRadiusAxis } from "recharts";
import { Tag, Sparkles, ChevronRight, Hash, MessageSquareText } from "lucide-react";
import clsx from "clsx";

const temas = [
  { tema: "Estado de trámite", count: 644, pct: 35, words: ["estado","radicado","incapacidad","certificado","cuándo"], riesgo: "Medio",   color: "#00216e" },
  { tema: "Demora en pago",    count: 460, pct: 25, words: ["pago","meses","espera","semanas","fecha"],                riesgo: "Alto",    color: "#0049cb" },
  { tema: "Solicitud docs",    count: 276, pct: 15, words: ["certificado","soporte","carta","documento","enviar"],     riesgo: "Bajo",    color: "#085efe" },
  { tema: "Radicación",        count: 184, pct: 10, words: ["radicado","plataforma","error","subir","sistema"],        riesgo: "Medio",   color: "#659FFF" },
  { tema: "Error monto",       count: 129, pct: 7,  words: ["valor","monto","incorrecto","diferencia","empresa"],      riesgo: "Alto",    color: "#e6eb2d" },
  { tema: "Escalamiento legal",count: 92,  pct: 5,  words: ["tutela","petición","derecho","control","legal"],          riesgo: "Crítico", color: "#ef4444" },
  { tema: "Insatisfacción",    count: 55,  pct: 3,  words: ["trato","respuesta","atención","deficiente","mal"],        riesgo: "Medio",   color: "#91B8FF" },
];

const radarData = temas.map(t => ({ tema: t.tema.split(" ")[0], count: t.count }));

const riesgoBadge: Record<string, string> = {
  "Crítico": "badge-red",
  "Alto":    "badge-yellow",
  "Medio":   "badge-blue",
  "Bajo":    "badge-green",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-brand-gray3 rounded-xl p-3 shadow-card-lg text-xs">
        <p className="font-bold text-sura-navy mb-1 uppercase tracking-tighter">{label}</p>
        <p className="text-brand-muted">Volumen: <span className="font-black text-sura-action">{payload[0].value}</span> casos</p>
      </div>
    );
  }
  return null;
};

export default function AnalisisTematico() {
  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-12 animate-page-in">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-brand-gray3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-sura-yellow/20 flex items-center justify-center text-[#484a00]">
               <Sparkles size={18} />
             </div>
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray1">Inteligencia Artificial · NLP</span>
          </div>
          <h1 className="text-4xl font-black text-sura-navy tracking-tighter">Análisis <span className="text-sura-action">Temático</span></h1>
          <p className="text-sm text-brand-muted max-w-lg leading-relaxed">
            Categorización automática mediante <strong>Topic Modeling</strong> (LDA) sobre el texto libre de las quejas radicadas en el último semestre.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
             <p className="text-[10px] font-black text-brand-gray1 uppercase tracking-widest">Temas detectados</p>
             <p className="text-2xl font-black text-sura-navy leading-none mt-1">07 <span className="text-brand-gray2">/ Categorías</span></p>
          </div>
          <button className="p-3 rounded-full bg-sura-navy text-white shadow-xl hover:scale-110 transition-transform">
            <MessageSquareText size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Radar Chart Section */}
        <div className="lg:col-span-5 space-y-6 sticky top-20">
          <div className="card bg-white/40 backdrop-blur-sm border-dashed border-2">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-lg font-bold text-sura-navy tracking-tight">Perímetro de Quejas</h2>
                <p className="text-xs text-brand-muted">Distribución de volumen por categoría</p>
              </div>
              <Tag size={16} className="text-brand-gray1" />
            </div>

            <div className="h-[340px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#e1e1f6" />
                  <PolarAngleAxis dataKey="tema" tick={{ fill: "#747684", fontSize: 10, fontWeight: 700 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 700]} tick={false} axisLine={false} />
                  <Radar 
                    name="Volumen" 
                    dataKey="count" 
                    stroke="#00216e" 
                    fill="#085efe" 
                    fillOpacity={0.15} 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: "#00216e", stroke: "#fff", strokeWidth: 2 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-sura-navy text-white p-8 rounded-3xl shadow-xl space-y-6 overflow-hidden relative group">
             <div className="absolute right-0 top-0 w-32 h-32 bg-sura-yellow/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
             <p className="text-xs font-black uppercase tracking-widest text-sura-yellow">Hallazgo IA</p>
             <h4 className="text-2xl font-black leading-tight tracking-tight">El 60% son problemas de <span className="text-sura-yellow underline decoration-wavy decoration-1 underline-offset-4">comunicación</span></h4>
             <p className="text-sm text-white/70 leading-relaxed font-medium">
               Las quejas de "Estado de trámite" y "Demora en pago" nacen de la incertidumbre. Notificaciones automáticas en cada etapa reducirían drásticamente este volumen.
             </p>
             <button className="flex items-center gap-2 text-xs font-bold text-sura-yellow group-hover:gap-4 transition-all uppercase tracking-widest pt-2">
               Ver plan de mitigación <ChevronRight size={14} />
             </button>
          </div>
        </div>

        {/* Categories List Section */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex justify-between items-center mb-2 px-2">
             <h3 className="text-sm font-black text-brand-gray1 uppercase tracking-widest">Ranking de Categorías</h3>
             <span className="text-[10px] bg-brand-low px-2 py-0.5 rounded font-bold text-brand-muted border border-brand-gray3">Ordenar por: Volumen</span>
          </div>

          <div className="space-y-4">
            {temas.map((t, i) => (
              <div key={t.tema} className="card group hover:border-sura-ice hover:shadow-card-md transition-all duration-300 relative overflow-hidden flex flex-col sm:flex-row gap-6 p-6">
                <div className="absolute top-0 left-0 w-1 h-full" style={{ background: t.color }}></div>
                
                {/* Index & Basic Info */}
                <div className="sm:w-32 flex flex-col justify-between shrink-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-black text-brand-gray2 group-hover:text-sura-navy transition-colors">#{i + 1}</span>
                    <span className={clsx(riesgoBadge[t.riesgo], "text-[9px] font-black uppercase px-2")}>{t.riesgo}</span>
                  </div>
                  <div className="font-black text-sura-navy text-2xl group-hover:text-sura-action transition-colors leading-none tracking-tighter decoration-sura-ice/40 underline-offset-4 decoration-2">
                     {t.count}
                  </div>
                  <p className="text-[10px] font-bold text-brand-gray1 uppercase tracking-widest mt-1">Casos Detectados</p>
                </div>

                {/* Content & Progress */}
                <div className="flex-1 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <h4 className="text-lg font-black text-sura-navy group-hover:translate-x-1 transition-transform">{t.tema}</h4>
                    <span className="text-[11px] font-black text-brand-muted bg-brand-low px-2 py-1 rounded border border-brand-gray3 group-hover:bg-sura-frost group-hover:text-sura-navy transition-colors">
                      {t.pct}% del total
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="h-1.5 w-full bg-brand-gray4 rounded-full overflow-hidden">
                     <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${t.pct * 2.5}%`, background: t.color }}
                     ></div>
                  </div>

                  {/* Keywords / NLP Tags */}
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-brand-gray4/50">
                    <span className="flex items-center gap-1.5 py-1 pr-2 text-[10px] font-black text-brand-gray1 uppercase opacity-60">
                       <Hash size={10} /> Palabras Clave
                    </span>
                    {t.words.map(w => (
                      <span key={w} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f4f2ff] text-[#444653] group-hover:bg-sura-ice/50 group-hover:text-sura-navy transition-colors border border-transparent group-hover:border-sura-ice">
                        {w}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Quick Action Button */}
                <div className="flex items-center justify-center shrink-0">
                   <button className="w-10 h-10 rounded-xl bg-brand-low group-hover:bg-sura-action group-hover:text-white flex items-center justify-center text-brand-gray1 transition-all shadow-sm">
                      <ChevronRight size={18} />
                   </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
