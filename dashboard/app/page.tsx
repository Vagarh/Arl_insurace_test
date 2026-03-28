"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import ResumenEjecutivo from "@/components/views/ResumenEjecutivo";
import AnalisisCanales from "@/components/views/AnalisisCanales";
import AnalisisTematico from "@/components/views/AnalisisTematico";
import ClientesRecurrentes from "@/components/views/ClientesRecurrentes";
import ClasificadorVivo from "@/components/views/ClasificadorVivo";
import Prediccion from "@/components/views/Prediccion";

export type View = "resumen" | "canales" | "tematico" | "recurrentes" | "clasificador" | "prediccion";

const viewLabels: Record<View, string> = {
  resumen:       "Resumen Ejecutivo",
  canales:       "Análisis por Canal",
  tematico:      "Análisis Temático",
  recurrentes:   "Clientes Recurrentes",
  clasificador:  "Clasificador en Vivo",
  prediccion:    "Predicción & Dinámica",
};

export default function Home() {
  const [activeView, setActiveView] = useState<View>("resumen");

  const renderView = () => {
    switch (activeView) {
      case "resumen":      return <ResumenEjecutivo />;
      case "canales":      return <AnalisisCanales />;
      case "tematico":     return <AnalisisTematico />;
      case "recurrentes":  return <ClientesRecurrentes />;
      case "clasificador": return <ClasificadorVivo />;
      case "prediccion":   return <Prediccion />;
      default:             return <ResumenEjecutivo />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-brand-surface">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />

      {/* Main area pushed right of fixed sidebar */}
      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <TopBar label={viewLabels[activeView]} />
        <main className="flex-1 overflow-y-auto animate-page-in">
          {renderView()}
        </main>
      </div>
    </div>
  );
}
