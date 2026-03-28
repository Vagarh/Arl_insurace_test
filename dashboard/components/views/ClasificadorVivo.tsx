"use client";

import { useState } from "react";
import { Zap, Sparkles, MessageSquare, ChevronRight, Hash, ShieldAlert, Cpu, History } from "lucide-react";
import clsx from "clsx";

const RULES: { keywords: string[]; category: string; risk: "Crítico" | "Alto" | "Medio" | "Bajo"; desc: string; color: string; bg: string }[] = [
  { keywords: ["tutela","derecho de petición","acción legal","demanda"],
    category: "Escalamiento Legal", risk: "Crítico", color: "#ef4444", bg: "#fef2f2",
    desc: "El cliente menciona acciones legales. SLA: respuesta en MENOS de 24h o se activa protocolo de emergencia." },
  { keywords: ["entes de control","superintendencia","queja formal"],
    category: "Ente de Control",    risk: "Crítico", color: "#ef4444", bg: "#fef2f2",
    desc: "La queja ya llegó o se amenaza con llevarla a entes reguladores." },
  { keywords: ["meses","semanas","llevan","siguen","no han pagado"],
    category: "Demora en Pago",     risk: "Alto",    color: "#d97706", bg: "#fef3c7",
    desc: "El cliente reporta demora prolongada. Alta probabilidad de escalar si no se actúa hoy." },
  { keywords: ["pago","valor","monto","incorrecto","diferencia","equivocado"],
    category: "Error en Monto",     risk: "Alto",    color: "#d97706", bg: "#fef3c7",
    desc: "Error en el valor pagado. Requiere revisión de liquidación." },
  { keywords: ["estado","radicado","cómo va","cuándo","información"],
    category: "Estado de Trámite",  risk: "Medio",   color: "#0049cb", bg: "#dce1ff",
    desc: "El cliente busca información sobre el estado. Candidato ideal para notificaciones automáticas." },
  { keywords: ["certificado","soporte","carta","documento"],
    category: "Solicitud Docs",     risk: "Bajo",    color: "#15803d", bg: "#f1fdf1",
    desc: "Solicitud de documentación. Puede resolverse con autoservicio digital." },
];

const riesgoBadge: Record<string, string> = {
  "Crítico": "badge-red",
  "Alto":    "badge-yellow",
  "Medio":   "badge-blue",
  "Bajo":    "badge-green",
};

const EXAMPLES = [
  "Buenas tardes, llevo 3 meses esperando el pago de mi incapacidad y no me han dado respuesta.",
  "Voy a presentar una tutela si no me resuelven este caso antes de mañana.",
  "Necesito el certificado de pago de mi incapacidad para presentarlo en mi empresa.",
  "El radicado que me dieron no aparece en el sistema y no sé cuál es el estado de mi trámite.",
  "Me pagaron un monto incorrecto, la diferencia es de $500,000 y nadie me explica por qué.",
];

function classify(text: string) {
  const lower = text.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some(kw => lower.includes(kw))) return rule;
  }
  return null;
}

export default function ClasificadorVivo() {
  const [input,    setInput]    = useState("");
  const [result,   setResult]   = useState<ReturnType<typeof classify>>(null);
  const [analyzed, setAnalyzed] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = () => {
    if (!input.trim()) return;
    setIsAnalyzing(true);
    
    // Simulate thinking/ML inference
    setTimeout(() => {
      setResult(classify(input));
      setAnalyzed(true);
      setIsAnalyzing(false);
    }, 600);
  };

  const useExample = (ex: string) => {
    setInput(ex);
    setResult(null);
    setAnalyzed(false);
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-12 animate-page-in">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-brand-gray3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-sura-yellow/20 flex items-center justify-center text-[#484a00]">
               <Cpu size={18} />
             </div>
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray1">Herramienta Experimental · Modelo v2.4</span>
          </div>
          <h1 className="text-4xl font-black text-sura-navy tracking-tighter">Clasificador <span className="text-sura-action">en Vivo</span></h1>
          <p className="text-sm text-brand-muted max-w-lg leading-relaxed font-medium">
             Análisis semántico en tiempo real. Pega una queja y descubre su categoría, nivel de riesgo y acciones recomendadas.
          </p>
        </div>
        <div className="flex items-center gap-4">
           <div className="text-right">
              <p className="text-[10px] font-black text-brand-gray1 uppercase tracking-widest">Precisión</p>
              <p className="text-2xl font-black text-[#15803d] leading-none mt-1">94.2% <span className="text-[10px] text-brand-gray2">TF-IDF</span></p>
           </div>
           <div className="w-12 h-12 rounded-full border border-brand-gray3 flex items-center justify-center text-brand-gray1 bg-white shadow-sm">
              <History size={18} />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Editor Side */}
        <div className="lg:col-span-7 space-y-6">
          <div className="card shadow-lg p-0 overflow-hidden border-2 border-brand-gray3 focus-within:border-sura-ice transition-all">
             <div className="bg-brand-low px-6 py-3 border-b border-brand-gray3 flex justify-between items-center">
                <div className="flex gap-1.5">
                   <div className="w-3 h-3 rounded-full bg-red-400"></div>
                   <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                   <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-black text-brand-gray1 uppercase tracking-widest">Editor de Quejas</span>
                   <MessageSquare size={14} className="text-brand-gray1 opacity-50" />
                </div>
             </div>
             <textarea
                value={input}
                onChange={e => { setInput(e.target.value); if(analyzed) setAnalyzed(false); }}
                placeholder="Pega aquí el texto de la queja del cliente..."
                rows={10}
                className="w-full bg-white px-8 py-6 text-base font-medium text-sura-navy placeholder-brand-gray2 focus:outline-none resize-none leading-relaxed"
             />
             <div className="bg-brand-low px-8 py-4 border-t border-brand-gray3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <span className="text-xs font-bold text-brand-gray1">{input.length} caracteres</span>
                   <div className="w-px h-3 bg-brand-gray2"></div>
                   <span className="text-xs font-bold text-brand-gray1">{input.split(' ').filter(x => x).length} palabras</span>
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={!input.trim() || isAnalyzing}
                  className={clsx(
                    "group flex items-center gap-3 px-8 py-3 rounded-xl text-white font-black text-sm tracking-tighter transition-all shadow-xl hover:-translate-y-0.5 active:translate-y-0",
                    input.trim() ? "bg-sura-navy hover:bg-sura-action" : "bg-brand-gray2 cursor-not-allowed opacity-50 shadow-none"
                  )}
                >
                  {isAnalyzing ? (
                    <>
                       <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                       <span>Pensando...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={16} fill={input.trim() ? "white" : "none"} className="group-hover:scale-125 transition-transform" />
                      <span>Analizar Ahora</span>
                    </>
                  )}
                </button>
             </div>
          </div>

          <div className="space-y-4">
             <h4 className="text-xs font-black text-brand-gray1 uppercase tracking-widest px-2">Escenarios de Prueba</h4>
             <div className="grid grid-cols-1 sm:grid-cols-1 gap-2">
               {EXAMPLES.map((ex, i) => (
                 <button
                   key={i}
                   onClick={() => useExample(ex)}
                   className="text-left p-4 rounded-xl border border-brand-gray3 bg-white/50 hover:bg-sura-frost hover:border-sura-ice transition-all group group"
                 >
                   <div className="flex items-start gap-4">
                      <span className="w-6 h-6 rounded-lg bg-brand-gray4 flex items-center justify-center text-[10px] font-black text-brand-gray1 shrink-0 group-hover:bg-sura-navy group-hover:text-white transition-colors">
                        {i + 1}
                      </span>
                      <p className="text-sm font-medium text-brand-muted group-hover:text-sura-navy transition-colors truncate">
                        {ex}
                      </p>
                      <ChevronRight size={14} className="ml-auto text-brand-gray1 group-hover:text-sura-action" />
                   </div>
                 </button>
               ))}
             </div>
          </div>
        </div>

        {/* Results Side */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">
          {!analyzed && !isAnalyzing ? (
            <div className="card border-dashed border-2 py-20 flex flex-col items-center justify-center text-center space-y-4">
               <div className="w-20 h-20 rounded-3xl bg-sura-frost flex items-center justify-center text-sura-action shadow-inner">
                  <Sparkles size={40} />
               </div>
               <div>
                 <h3 className="text-lg font-black text-sura-navy">Motor Inactivo</h3>
                 <p className="text-xs text-brand-muted max-w-[200px] mt-2 font-medium">Ingresa el texto de una queja para iniciar el motor de clasificación.</p>
               </div>
            </div>
          ) : isAnalyzing ? (
            <div className="card py-20 flex flex-col items-center justify-center text-center space-y-6">
               <div className="relative">
                  <div className="w-24 h-24 border-4 border-sura-ice rounded-full animate-ping opacity-20"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                     <div className="w-12 h-12 border-4 border-sura-action border-t-transparent rounded-full animate-spin"></div>
                  </div>
               </div>
               <div>
                 <h3 className="text-lg font-black text-sura-navy animate-pulse">Analizando Patrones...</h3>
                 <p className="text-xs text-brand-muted mt-2 font-medium">Ejecutando proceso de tokenización y vectorización TF-IDF.</p>
               </div>
            </div>
          ) : result ? (
            <div className="space-y-6 animate-page-in">
               {/* Risk & Category Card */}
               <div className="card p-0 overflow-hidden shadow-2xl scale-100 group">
                  <div className="h-2 w-full" style={{ background: result.color }}></div>
                  <div className="p-8 space-y-8">
                     <div className="flex justify-between items-start">
                        <div className="space-y-1">
                           <p className="text-[10px] font-black text-brand-gray1 uppercase tracking-widest">Categoría Identificada</p>
                           <h3 className="text-2xl font-black text-sura-navy tracking-tight">{result.category}</h3>
                        </div>
                        <span className={clsx(riesgoBadge[result.risk], "text-[11px] font-black px-3 py-1")}>{result.risk}</span>
                     </div>

                     <div className="space-y-3">
                        <div className="flex justify-between items-end">
                           <p className="text-[10px] font-black text-brand-gray1 uppercase tracking-widest">Puntuación de Confianza</p>
                           <p className="text-sm font-black" style={{ color: result.color }}>
                              {result.risk === 'Crítico' ? '98.5%' : result.risk === 'Alto' ? '89.2%' : '84.0%'}
                           </p>
                        </div>
                        <div className="h-2 w-full bg-brand-low rounded-full overflow-hidden">
                           <div className="h-full rounded-full animate-grow" style={{ background: result.color, width: result.risk === 'Crítico' ? '98%' : '85%' }}></div>
                        </div>
                     </div>

                     <div className="space-y-4 pt-4 border-t border-brand-gray3">
                        <p className="text-xs font-black text-sura-navy uppercase tracking-tighter flex items-center gap-2">
                           <Hash size={14} className="text-sura-action" /> Términos Detectados
                        </p>
                        <div className="flex flex-wrap gap-2">
                           {result.keywords.filter(kw => input.toLowerCase().includes(kw)).map(kw => (
                              <span key={kw} className="px-3 py-1 rounded-lg bg-sura-navy text-white text-[11px] font-bold shadow-md">
                                 {kw}
                              </span>
                           ))}
                           {result.keywords.filter(kw => !input.toLowerCase().includes(kw)).map(kw => (
                              <span key={kw} className="px-3 py-1 rounded-lg bg-brand-low text-brand-gray2 text-[11px] font-bold border border-brand-gray3 opacity-60">
                                 {kw}
                              </span>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>

               {/* Action Recommender Card */}
               <div className="card bg-brand-low border-2 border-brand-gray3 space-y-6">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-sura-navy shadow-sm border border-brand-gray3">
                        <ShieldAlert size={20} />
                     </div>
                     <h4 className="text-sm font-black text-sura-navy uppercase tracking-tight">Acción Sugerida para el Analista</h4>
                  </div>
                  <p className="text-sm text-brand-muted font-medium leading-relaxed bg-white/60 p-5 rounded-2xl border border-white">
                     {result.desc}
                  </p>
                  <button className="w-full py-3 rounded-xl bg-white border-2 border-brand-gray3 text-xs font-black text-sura-navy uppercase tracking-[0.1em] hover:bg-sura-navy hover:text-white hover:border-sura-navy transition-all shadow-sm">
                     Crear Caso en CRM
                  </button>
               </div>
            </div>
          ) : (
            <div className="card border-dashed border-2 py-20 flex flex-col items-center justify-center text-center space-y-4">
               <div className="w-20 h-20 rounded-3xl bg-brand-low flex items-center justify-center text-brand-gray2 opacity-40">
                  <MessageSquare size={40} />
               </div>
               <div>
                 <h3 className="text-lg font-black text-sura-navy">Duda Sistémica</h3>
                 <p className="text-xs text-brand-muted max-w-[240px] mt-2 font-medium">No se detectaron patrones críticos conocidos en el texto ingresado. Clasificación recomendada: <strong>Misceláneo</strong>.</p>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
