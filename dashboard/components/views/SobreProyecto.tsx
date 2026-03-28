"use client";

import { Github, Download, ExternalLink, BookOpen, BarChart2, Cpu, GitBranch, FileText } from "lucide-react";

const REPO = "https://github.com/Vagarh/Arl_insurace_test";

const notebooks = [
  { id: "NB01", titulo: "EDA & Calidad de Datos", descripcion: "Exploración inicial, calidad, distribuciones y estadísticas descriptivas.", path: "notebooks/01_eda_calidad_datos.ipynb" },
  { id: "NB02", titulo: "NLP — Extracción de Temas", descripcion: "Limpieza de texto, 12 features temáticas por regex sobre el texto libre.", path: "notebooks/02_nlp_extraccion_temas.ipynb" },
  { id: "NB03", titulo: "Causas Raíz + ML Explicable", descripcion: "Random Forest + SHAP para cuantificar causas de insatisfacción.", path: "notebooks/03_causas_raiz_ml.ipynb" },
  { id: "NB04", titulo: "Clasificador de Quejas", descripcion: "Modelo de clasificación con scoring 0–100 y categorías de riesgo.", path: "notebooks/04_modelo_clasificacion.ipynb" },
  { id: "NB05", titulo: "Predicción Series de Tiempo", descripcion: "Forecast Exponential Smoothing con bandas de confianza 80%.", path: "notebooks/05_prediccion_series_tiempo.ipynb" },
  { id: "NB06", titulo: "Dinámica de Sistemas", descripcion: "Modelo ODE con 6 escenarios de intervención. TO-BE: -88% backlog.", path: "notebooks/06_dinamica_sistemas.ipynb" },
];

const pipeline = [
  { nombre: "Pipeline Airflow + Next.js", descripcion: "DAG semanal con 6 tareas. Retries automáticos, alerta por email.", path: "pipeline/airflow_nextjs/dags/dag_quejas_semanal.py", badge: "Escenario A" },
  { nombre: "Pipeline Standalone", descripcion: "Mismo flujo sin Airflow. Ejecutable con cron o manualmente.", path: "pipeline/airflow_nextjs/scripts/pipeline_standalone.py", badge: "Sin Airflow" },
  { nombre: "Pipeline Power BI", descripcion: "Genera star schema CSV + Excel para Power BI Service.", path: "pipeline/powerbi/scripts/pipeline_powerbi.py", badge: "Escenario B" },
];

const informes = [
  { nombre: "Resumen Ejecutivo", descripcion: "Multi-audiencia: C-Level, CFO y Técnico con traducción técnica a negocio.", url: "/reports/informe_ejecutivo.pdf", size: "10 KB" },
  { nombre: "Análisis con Gráficas", descripcion: "Paso a paso metodológico con las 10 gráficas embebidas y resultados.", url: "/reports/informe_con_graficas.pdf", size: "1.3 MB" },
];

export default function SobreProyecto() {
  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-12 animate-page-in">

      {/* Hero — Perfil */}
      <section className="flex flex-col md:flex-row items-center gap-8 p-8 bg-sura-navy rounded-2xl text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-sura-yellow/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="w-20 h-20 rounded-2xl bg-sura-yellow flex items-center justify-center text-sura-navy text-3xl font-black shrink-0 shadow-xl">
          JA
        </div>
        <div className="flex-1 relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sura-yellow mb-2">Desarrollado por</p>
          <h1 className="text-3xl font-black tracking-tight mb-1">Juan Felipe Arango</h1>
          <p className="text-white/70 text-sm mb-4">Analítica de Datos · Machine Learning · Business Intelligence</p>
          <a
            href="https://github.com/Vagarh"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm font-bold border border-white/20"
          >
            <Github size={16} /> github.com/Vagarh
          </a>
        </div>
        <div className="text-right relative z-10 shrink-0 space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Repositorio del proyecto</p>
          <a
            href={REPO}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sura-yellow font-bold text-sm hover:underline justify-end"
          >
            Arl_insurace_test <ExternalLink size={14} />
          </a>
          <p className="text-[10px] text-white/50">ARL SURA · Prueba Técnica · Marzo 2026</p>
        </div>
      </section>

      {/* Descargar Informes */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-sura-yellow/20 flex items-center justify-center text-[#484a00]">
            <FileText size={18} />
          </div>
          <h2 className="text-xl font-black text-sura-navy tracking-tight">Informes PDF</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {informes.map(inf => (
            <div key={inf.nombre} className="card flex items-center gap-5 group hover:border-sura-action transition-all">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shrink-0 group-hover:scale-110 transition-transform">
                <FileText size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sura-navy text-sm">{inf.nombre}</p>
                <p className="text-xs text-brand-muted leading-relaxed mt-0.5">{inf.descripcion}</p>
                <p className="text-[10px] text-brand-gray1 mt-1">{inf.size}</p>
              </div>
              <a
                href={inf.url}
                download
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sura-navy text-white text-xs font-bold hover:bg-sura-action transition-colors"
              >
                <Download size={14} /> PDF
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Notebooks */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-sura-yellow/20 flex items-center justify-center text-[#484a00]">
            <BookOpen size={18} />
          </div>
          <h2 className="text-xl font-black text-sura-navy tracking-tight">Notebooks de Análisis</h2>
          <span className="text-[10px] bg-brand-low px-2 py-0.5 rounded font-bold text-brand-muted border border-brand-gray3">Ejecutar en Google Colab</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notebooks.map((nb, i) => (
            <a
              key={nb.id}
              href={`${REPO}/blob/main/${nb.path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="card group hover:border-sura-action hover:shadow-card-md transition-all flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black bg-sura-navy text-white px-2 py-0.5 rounded">{nb.id}</span>
                <ExternalLink size={13} className="text-brand-gray2 group-hover:text-sura-action transition-colors" />
              </div>
              <div>
                <p className="font-bold text-sura-navy text-sm group-hover:text-sura-action transition-colors">{nb.titulo}</p>
                <p className="text-xs text-brand-muted leading-relaxed mt-1">{nb.descripcion}</p>
              </div>
              <div className="mt-auto pt-2 border-t border-brand-gray4 text-[10px] text-brand-gray1 font-mono truncate">{nb.path}</div>
            </a>
          ))}
        </div>
      </section>

      {/* Pipeline */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-sura-yellow/20 flex items-center justify-center text-[#484a00]">
            <GitBranch size={18} />
          </div>
          <h2 className="text-xl font-black text-sura-navy tracking-tight">Pipeline Automatizado</h2>
        </div>
        <div className="space-y-3">
          {pipeline.map(p => (
            <a
              key={p.nombre}
              href={`${REPO}/blob/main/${p.path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="card flex items-center gap-5 group hover:border-sura-action transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-sura-frost flex items-center justify-center text-sura-action shrink-0 group-hover:scale-110 transition-transform">
                <Cpu size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-bold text-sura-navy text-sm">{p.nombre}</p>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-sura-yellow/30 text-[#484a00]">{p.badge}</span>
                </div>
                <p className="text-xs text-brand-muted">{p.descripcion}</p>
              </div>
              <ExternalLink size={14} className="text-brand-gray2 group-hover:text-sura-action transition-colors shrink-0" />
            </a>
          ))}
        </div>
      </section>

      {/* Stack técnico */}
      <section className="bg-brand-low rounded-2xl p-6 border border-brand-gray3">
        <div className="flex items-center gap-3 mb-5">
          <BarChart2 size={18} className="text-sura-navy" />
          <h2 className="text-base font-black text-sura-navy">Stack Técnico</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {[
            { capa: "Análisis", techs: ["Python 3.9+", "pandas", "numpy"] },
            { capa: "ML / NLP", techs: ["scikit-learn", "SHAP", "regex NLP"] },
            { capa: "Predicción", techs: ["statsmodels", "scipy ODE", "Exp. Smoothing"] },
            { capa: "Dashboard", techs: ["Next.js 14", "TypeScript", "Recharts"] },
          ].map(({ capa, techs }) => (
            <div key={capa}>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-gray1 mb-2">{capa}</p>
              <div className="space-y-1">
                {techs.map(t => (
                  <span key={t} className="block px-2 py-1 rounded bg-white border border-brand-gray3 font-semibold text-sura-navy">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
