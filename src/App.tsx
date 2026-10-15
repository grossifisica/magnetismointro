import React, { useState } from 'react';
import { TabType } from './types';
import { Header } from './components/Header';
import { MagnetsTab } from './components/MagnetsTab';
import { InseparabilityTab } from './components/InseparabilityTab';
import { InductionLinesTab } from './components/InductionLinesTab';
import { IronFilingsTab } from './components/IronFilingsTab';
import { EarthMagnetismTab } from './components/EarthMagnetismTab';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('magnets');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Header with main didactic tabs */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'magnets' && <MagnetsTab />}
        {activeTab === 'inseparability' && <InseparabilityTab />}
        {activeTab === 'induction' && <InductionLinesTab />}
        {activeTab === 'iron-filings' && <IronFilingsTab />}
        {activeTab === 'earth' && <EarthMagnetismTab />}
      </main>

      {/* Educational Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Introdução ao Magnetismo</span>
            <span>•</span>
            <span>Laboratório Didático Interativo</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span>Convenção: Vermelho = Polo Norte (N) • Azul = Polo Sul (S)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
