import React from 'react';
import { Magnet, Compass as CompassIcon, Globe, Scissors, Sparkles } from 'lucide-react';
import { TabType } from '../types';

interface HeaderProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const tabs = [
    {
      id: 'magnets' as TabType,
      label: 'Ímãs',
      subtitle: 'Atração & Repulsão',
      icon: Magnet,
    },
    {
      id: 'inseparability' as TabType,
      label: 'Inseparabilidade dos Polos',
      subtitle: 'Cortes & Mini Ímãs',
      icon: Scissors,
    },
    {
      id: 'induction' as TabType,
      label: 'Linhas de Indução',
      subtitle: 'Vetor B & Bússola',
      icon: CompassIcon,
    },
    {
      id: 'iron-filings' as TabType,
      label: 'Limalha de Ferro',
      subtitle: 'Experimento Real',
      icon: Sparkles,
    },
    {
      id: 'earth' as TabType,
      label: 'Magnetismo Terrestre',
      subtitle: 'Polos & Campo da Terra',
      icon: Globe,
    },
  ];

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title Bar (Top Row) */}
        <div className="flex items-center justify-between py-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Magnet className="w-4.5 h-4.5 text-red-400 rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Introdução ao Magnetismo
                </h1>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Laboratório Didático
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Simulador interativo de fenômenos magnéticos, atração, corte de ímãs, limalha de ferro e campo terrestre
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 font-medium">
              5 Módulos Didáticos
            </span>
          </div>
        </div>

        {/* Navigation Tabs Bar (Below Title Row) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 py-2.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left border ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs font-semibold'
                    : 'bg-slate-50/80 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                    isActive ? 'bg-slate-800 text-red-400' : 'bg-white text-slate-600 shadow-2xs border border-slate-200/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className={`leading-snug truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>
                    {tab.label}
                  </div>
                  <div
                    className={`text-[10px] truncate ${
                      isActive ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {tab.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
