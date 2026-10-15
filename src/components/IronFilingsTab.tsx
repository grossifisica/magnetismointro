import React, { useState, useRef, MouseEvent, useEffect } from 'react';
import {
  Sparkles,
  ZoomIn,
  Eye,
  RotateCcw,
  Layers,
  CheckCircle2,
  Trash2,
  Lightbulb
} from 'lucide-react';

export const IronFilingsTab: React.FC = () => {
  // State: whether iron filings have been spread or not (initially false)
  const [hasFilings, setHasFilings] = useState<boolean>(false);
  const [isSprinkling, setIsSprinkling] = useState<boolean>(false);
  const [sprinkleProgress, setSprinkleProgress] = useState<number>(0);
  const [paperTapped, setPaperTapped] = useState<boolean>(false);

  // Overlay and viewing tools
  const [showTheoreticalLines, setShowTheoreticalLines] = useState<boolean>(true);
  const [showPolesLabels, setShowPolesLabels] = useState<boolean>(true);
  const [magnifierActive, setMagnifierActive] = useState<boolean>(false);
  const [magnifierPos, setMagnifierPos] = useState<{ x: number; y: number; relX: number; relY: number }>({
    x: 0,
    y: 0,
    relX: 0.5,
    relY: 0.5,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Particle positions for sprinkling effect
  const [sprinkleParticles, setSprinkleParticles] = useState<Array<{ id: number; x: number; y: number; delay: number; size: number }>>([]);

  useEffect(() => {
    // Pre-generate 60 particle positions for the sprinkling visual effect
    const particles = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: 15 + Math.random() * 70,
      y: 15 + Math.random() * 70,
      delay: Math.random() * 0.8,
      size: 1.5 + Math.random() * 2.5,
    }));
    setSprinkleParticles(particles);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Handle magnifying glass positioning
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const relX = Math.max(0, Math.min(1, x / rect.width));
    const relY = Math.max(0, Math.min(1, y / rect.height));

    setMagnifierPos({ x, y, relX, relY });
  };

  // Trigger sprinkling of iron filings
  const handleSpreadFilings = () => {
    if (isSprinkling) return;
    setIsSprinkling(true);
    setSprinkleProgress(0);

    const startTime = performance.now();
    const duration = 1600; // 1.6s realistic sprinkle and settling animation

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(100, Math.round((elapsed / duration) * 100));
      setSprinkleProgress(progress);

      if (elapsed < duration) {
        animationFrameRef.current = requestAnimationFrame(step);
      } else {
        setIsSprinkling(false);
        setHasFilings(true);
        setSprinkleProgress(100);
      }
    };

    animationFrameRef.current = requestAnimationFrame(step);
  };

  // Reset / Clear surface
  const handleClearSurface = () => {
    if (isSprinkling) return;
    setHasFilings(false);
    setPaperTapped(false);
  };

  // Simulate tapping paper to overcome static friction and align filings
  const handleTapPaper = () => {
    if (isSprinkling || !hasFilings) return;
    setPaperTapped(true);
    setTimeout(() => {
      setPaperTapped(false);
    }, 600);
  };

  const currentImageSrc = hasFilings
    ? '/src/assets/images/iron_filings_magnet_1791982179637.jpg'
    : '/src/assets/images/magnet_clean_surface_1791982509883.jpg';

  return (
    <div className="space-y-6">
      {/* Title & Introduction Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Experimento com Limalha de Ferro
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Fotografia Real em Alta Resolução
            </span>
          </div>
          <p className="text-sm text-slate-600 max-w-3xl">
            {hasFilings
              ? 'Limalha de ferro distribuída sobre o papel. Os minúsculos pedaços de ferro se imantam por indução e se alinham ao longo das linhas do campo magnético, tornando-as visíveis a olho nu!'
              : 'O ímã em barra repousa sobre a folha branca de laboratório. Clique no botão para espalhar a limalha de ferro e acompanhar a formação real das linhas de indução.'}
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {!hasFilings ? (
            <button
              onClick={handleSpreadFilings}
              disabled={isSprinkling}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-md shadow-indigo-200 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isSprinkling ? 'animate-spin' : ''}`} />
              {isSprinkling ? `Espalhando limalha (${sprinkleProgress}%)...` : 'Espalhar Limalha'}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleTapPaper}
                disabled={isSprinkling}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-900 active:scale-95 text-white shadow-2xs transition-all"
                title="Dar leves batidinhas no papel para diminuir o atrito estático"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${paperTapped ? 'animate-spin' : ''}`} />
                Vibrar Papel (Alinhar)
              </button>
              <button
                onClick={handleClearSurface}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 active:scale-95 transition-all shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpar Superfície
              </button>
            </div>
          )}

          <button
            onClick={() => setMagnifierActive(!magnifierActive)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border shadow-2xs ${
              magnifierActive
                ? 'bg-slate-900 text-white border-slate-900 shadow-slate-200'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ZoomIn className="w-4 h-4" />
            {magnifierActive ? 'Lupa Ativa' : 'Lupa de Detalhes'}
          </button>
        </div>
      </div>

      {/* Main Interactive Stage Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Realistic Image Container (Left 8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <div className="bg-slate-900 rounded-2xl p-2 sm:p-3 shadow-md border border-slate-800 flex flex-col">
            {/* Toolbar above image */}
            <div className="flex items-center justify-between px-2 py-1.5 text-xs text-slate-300 border-b border-slate-800 mb-2">
              <div className="flex items-center gap-3">
                <span className="font-medium text-slate-200 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                  Mesa de Laboratório
                </span>
                <span className="text-slate-500 hidden sm:inline">|</span>
                <span className="text-slate-400 hidden sm:inline">
                  {hasFilings
                    ? 'Limalha de ferro alinhada com as linhas de indução'
                    : 'Ímã em barra sobre papel limpo (aguardando limalha)'}
                </span>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                    hasFilings
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}
                >
                  {hasFilings ? 'Limalha Aplicada' : 'Sem Limalha'}
                </span>
              </div>
            </div>

            {/* Image Canvas with Relative Coordinates & Smooth Visual Transitions */}
            <div
              ref={containerRef}
              onMouseMove={handleMouseMove}
              className={`relative w-full aspect-16/9 rounded-xl overflow-hidden cursor-crosshair group select-none bg-slate-950 transition-transform ${
                paperTapped ? 'translate-y-0.5 translate-x-0.5' : ''
              }`}
            >
              {/* Base Clean Magnet Image */}
              <img
                src="/src/assets/images/magnet_clean_surface_1791982509883.jpg"
                alt="Ímã em barra sobre cartolina branca sem limalha"
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover select-none"
                draggable={false}
              />

              {/* Iron Filings Image (Crossfades smoothly on top when spread) */}
              <img
                src="/src/assets/images/iron_filings_magnet_1791982179637.jpg"
                alt="Ímã com limalha de ferro real formando linhas de indução"
                referrerPolicy="no-referrer"
                className={`absolute inset-0 w-full h-full object-cover select-none transition-opacity duration-1000 ${
                  hasFilings ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                draggable={false}
              />

              {/* Animated Sprinkling Visual Particles Effect */}
              {isSprinkling && (
                <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden bg-slate-900/30 backdrop-blur-[0.5px]">
                  {/* Falling / Sprinkling grain specks */}
                  {sprinkleParticles.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        animationDelay: `${p.delay}s`,
                      }}
                      className="absolute rounded-full bg-slate-950 shadow-xs opacity-90 animate-ping"
                    />
                  ))}

                  {/* Centered sprinkling progress alert */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-slate-900/95 text-white px-5 py-3 rounded-2xl text-xs font-semibold shadow-2xl border border-slate-700 flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-indigo-400 animate-spin" />
                      <div>
                        <div className="font-bold text-sm">Espalhando Limalha de Ferro...</div>
                        <div className="text-[11px] text-slate-300 font-normal">
                          Partículas de ferro orientando-se pelo campo magnético ({sprinkleProgress}%)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Initial Call-to-action overlay when magnet has NO filings */}
              {!hasFilings && !isSprinkling && (
                <div className="absolute inset-0 flex items-end justify-center pb-6 pointer-events-none">
                  <div className="bg-slate-900/85 text-white px-4 py-2 rounded-xl text-xs font-medium shadow-xl border border-slate-700/80 backdrop-blur-xs flex items-center gap-2 pointer-events-auto">
                    <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>O ímã está sem limalha. Clique em <strong>Espalhar Limalha</strong> acima para revelar as linhas!</span>
                  </div>
                </div>
              )}

              {/* Educational SVG Overlays (Aligned precisely with theoretical curves) */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 1000 562.5"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <marker
                    id="arrow-cyan"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
                  </marker>
                  <marker
                    id="arrow-emerald"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#34d399" />
                  </marker>
                  <filter id="field-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#0284c7" floodOpacity="0.8" />
                  </filter>
                </defs>

                {/* Theoretical Field Lines */}
                {showTheoreticalLines && (
                  <g filter="url(#field-glow)" opacity={hasFilings ? 0.8 : 0.65}>
                    {/* Upper curved field lines */}
                    <path
                      d="M 370 245 C 370 160, 620 160, 620 245"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2"
                      strokeDasharray="6 4"
                    />
                    <path
                      d="M 345 235 C 330 90, 660 90, 645 235"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2"
                      strokeDasharray="6 4"
                    />
                    <path
                      d="M 320 230 C 290 20, 700 20, 670 230"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1.8"
                      strokeDasharray="7 5"
                    />

                    {/* Direction arrow indicators on upper curves */}
                    <circle cx="495" cy="181" r="3" fill="#38bdf8" />
                    <path d="M 490 181 L 505 181" stroke="#38bdf8" strokeWidth="2.5" markerEnd="url(#arrow-cyan)" />
                    <circle cx="495" cy="127" r="3" fill="#38bdf8" />
                    <path d="M 490 127 L 505 127" stroke="#38bdf8" strokeWidth="2.5" markerEnd="url(#arrow-cyan)" />

                    {/* Lower curved field lines */}
                    <path
                      d="M 370 285 C 370 370, 620 370, 620 285"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2"
                      strokeDasharray="6 4"
                    />
                    <path
                      d="M 345 295 C 330 440, 660 440, 645 295"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2"
                      strokeDasharray="6 4"
                    />
                    <path
                      d="M 320 300 C 290 510, 700 510, 670 300"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1.8"
                      strokeDasharray="7 5"
                    />

                    {/* Direction arrow indicators on lower curves */}
                    <circle cx="495" cy="349" r="3" fill="#38bdf8" />
                    <path d="M 490 349 L 505 349" stroke="#38bdf8" strokeWidth="2.5" markerEnd="url(#arrow-cyan)" />
                    <circle cx="495" cy="403" r="3" fill="#38bdf8" />
                    <path d="M 490 403 L 505 403" stroke="#38bdf8" strokeWidth="2.5" markerEnd="url(#arrow-cyan)" />

                    {/* North lines exiting */}
                    <path d="M 350 265 L 120 265" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6 4" markerEnd="url(#arrow-cyan)" />
                    <path d="M 350 250 L 140 180" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeDasharray="6 4" markerEnd="url(#arrow-cyan)" />
                    <path d="M 350 280 L 140 350" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeDasharray="6 4" markerEnd="url(#arrow-cyan)" />

                    {/* South lines entering */}
                    <path d="M 870 265 L 650 265" fill="none" stroke="#34d399" strokeWidth="2" strokeDasharray="6 4" markerEnd="url(#arrow-emerald)" />
                    <path d="M 850 180 L 650 250" fill="none" stroke="#34d399" strokeWidth="1.8" strokeDasharray="6 4" markerEnd="url(#arrow-emerald)" />
                    <path d="M 850 350 L 650 280" fill="none" stroke="#34d399" strokeWidth="1.8" strokeDasharray="6 4" markerEnd="url(#arrow-emerald)" />
                  </g>
                )}

                {/* Polarity Identification Badges (positioned cleanly above poles to keep the real physical magnet fully visible) */}
                {showPolesLabels && (
                  <g>
                    {/* North Pole Badge above red half */}
                    <g transform="translate(433, 195)">
                      <rect x="-38" y="-14" width="76" height="28" rx="8" fill="#dc2626" fillOpacity="0.95" stroke="#ffffff" strokeWidth="1.5" />
                      <text x="0" y="5" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
                        POLO N
                      </text>
                      {/* Pointer line to pole */}
                      <path d="M 0 14 L 0 28" stroke="#dc2626" strokeWidth="2" strokeDasharray="2 2" />
                      <circle cx="0" cy="28" r="2.5" fill="#dc2626" />
                    </g>

                    {/* South Pole Badge above blue half */}
                    <g transform="translate(567, 195)">
                      <rect x="-38" y="-14" width="76" height="28" rx="8" fill="#2563eb" fillOpacity="0.95" stroke="#ffffff" strokeWidth="1.5" />
                      <text x="0" y="5" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
                        POLO S
                      </text>
                      {/* Pointer line to pole */}
                      <path d="M 0 14 L 0 28" stroke="#2563eb" strokeWidth="2" strokeDasharray="2 2" />
                      <circle cx="0" cy="28" r="2.5" fill="#2563eb" />
                    </g>
                  </g>
                )}
              </svg>

              {/* Magnifier Lens */}
              {magnifierActive && (
                <div
                  style={{
                    left: `${magnifierPos.x}px`,
                    top: `${magnifierPos.y}px`,
                    transform: 'translate(-50%, -50%)',
                    backgroundImage: `url(${currentImageSrc})`,
                    backgroundPosition: `${magnifierPos.relX * 100}% ${magnifierPos.relY * 100}%`,
                    backgroundSize: '350%',
                  }}
                  className="absolute w-44 h-44 rounded-full border-4 border-indigo-400 shadow-2xl pointer-events-none z-20 overflow-hidden ring-4 ring-black/40 bg-no-repeat"
                >
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                    <div className="w-full h-px bg-white"></div>
                    <div className="h-full w-px bg-white absolute"></div>
                  </div>
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 bg-slate-900/85 text-white px-2 py-0.5 rounded text-[10px] font-mono font-semibold">
                    Zoom 3.5×
                  </div>
                </div>
              )}
            </div>

            {/* Display Options Sub-bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-2 py-2 mt-2 bg-slate-800/60 rounded-xl text-xs text-slate-300">
              <span className="font-medium text-slate-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                Opções de visualização:
              </span>

              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                  <input
                    type="checkbox"
                    checked={showTheoreticalLines}
                    onChange={(e) => setShowTheoreticalLines(e.target.checked)}
                    className="rounded text-indigo-500 focus:ring-0"
                  />
                  <span>Linhas Matemáticas (Azul Claro)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                  <input
                    type="checkbox"
                    checked={showPolesLabels}
                    onChange={(e) => setShowPolesLabels(e.target.checked)}
                    className="rounded text-indigo-500 focus:ring-0"
                  />
                  <span>Identificação dos Polos (N / S)</span>
                </label>
              </div>
            </div>
          </div>

        </div>

        {/* Didactic Information & Scientific Principles (Right 4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card: Leis Físicas Observáveis */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Princípios Físicos Fundamentais
            </h3>

            <ul className="text-xs space-y-2 text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold mt-0.5">•</span>
                <span>
                  <strong className="text-white">As linhas nunca se cruzam:</strong> Em cada ponto do espaço ao redor do ímã existe apenas um único vetor de campo resultante.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold mt-0.5">•</span>
                <span>
                  <strong className="text-white">Densidade reflete intensidade:</strong> Onde a limalha fica mais densa e compactada (nos polos), o campo magnético é mais forte.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold mt-0.5">•</span>
                <span>
                  <strong className="text-white">Sentido Convencional:</strong> Fora do ímã, as linhas emergem do polo Norte e convergem para o polo Sul.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
