"use client";

import { Bell, Download } from "lucide-react";

interface TopBarProps {
  label: string;
}

export default function TopBar({ label }: TopBarProps) {
  return (
    <header className="w-full sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-brand-gray3 flex justify-between items-center px-8 h-14 shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-brand-gray1 font-medium">Dashboard</span>
        <span className="text-brand-gray2">/</span>
        <span className="font-semibold text-sura-navy">{label}</span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <span className="badge-blue text-[11px] font-semibold px-3 py-1">
          Ene – Jun 2025
        </span>
        <button className="p-2 rounded-lg text-brand-muted hover:bg-brand-low hover:text-sura-navy transition-colors">
          <Bell size={16} />
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sura-action text-white text-xs font-bold hover:bg-sura-navy transition-colors shadow-card">
          <Download size={13} />
          Exportar
        </button>
      </div>
    </header>
  );
}
