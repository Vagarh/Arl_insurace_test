"use client";

import { BarChart2, Radio, Tag, Users, Zap, TrendingUp } from "lucide-react";
import type { View } from "@/app/page";
import clsx from "clsx";
import Image from "next/image";

interface Props {
  activeView: View;
  setActiveView: (v: View) => void;
}

const navItems: { id: View; label: string; icon: React.ReactNode; }[] = [
  { id: "resumen",      label: "Resumen Ejecutivo",    icon: <BarChart2 size={18} /> },
  { id: "canales",      label: "Análisis por Canal",   icon: <Radio size={18} /> },
  { id: "tematico",     label: "Análisis Temático",    icon: <Tag size={18} /> },
  { id: "recurrentes",  label: "Clientes Recurrentes", icon: <Users size={18} /> },
  { id: "clasificador", label: "Clasificador en Vivo", icon: <Zap size={18} /> },
  { id: "prediccion",   label: "Predicción & Dinámica", icon: <TrendingUp size={18} /> },
];

export default function Sidebar({ activeView, setActiveView }: Props) {
  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-brand-low border-r border-brand-gray3 flex flex-col p-4 space-y-1 z-50">
      {/* Logo Section */}
      <div className="mb-10 px-2 pt-4">
        <div className="relative w-32 h-10 mb-1">
          <Image 
            src="/logo.png" 
            alt="ARL SURA Logo" 
            fill
            className="object-contain object-left"
            priority
          />
        </div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-brand-gray1 font-bold mt-2 pl-0.5">
          Panel de Control
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={clsx(
                "nav-item w-full text-left",
                isActive && "active"
              )}
            >
              <span className={clsx(
                "shrink-0 transition-colors",
                isActive ? "text-sura-action" : "text-brand-gray1"
              )}>
                {item.icon}
              </span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="pt-4 mt-2 border-t border-brand-gray3 px-2 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-sura-ice flex items-center justify-center text-sura-navy text-xs font-black shrink-0">
            JC
          </div>
          <div>
            <p className="text-xs font-bold text-sura-navy leading-none">Usuario Institucional</p>
            <p className="text-[10px] text-brand-gray1 mt-0.5">Administrador</p>
          </div>
        </div>
        <p className="text-[10px] text-brand-gray1 leading-relaxed">
          Datos: <span className="font-semibold text-brand-muted">Ene–Jun 2025</span><br />
          1,841 quejas · 1,334 clientes
        </p>
      </div>
    </aside>
  );
}
