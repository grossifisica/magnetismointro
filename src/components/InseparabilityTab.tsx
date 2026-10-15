import React, { useState, useRef, useEffect } from 'react';
import {
  Scissors,
  RotateCcw,
  Eye,
  EyeOff,
  MoveHorizontal,
  MoveVertical,
  Magnet as MagnetIcon,
  Sparkles,
} from 'lucide-react';

type CutMode = 'intact' | 'transversal' | 'longitudinal';

export const InseparabilityTab: React.FC = () => {
  // Current cut state
  const [cutMode, setCutMode] = useState<CutMode>('transversal');
  // Separation distance between cut halves (in pixels)
  const [separation, setSeparation] = useState<number>(60);
  // Toggle visibility of microscopic mini magnets / magnetic domains
  const [showDomains, setShowDomains] = useState<boolean>(true);

  // Stage dimensions tracking
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [stageWidth, setStageWidth] = useState<number>(780);
  const stageHeight = 460;

  // Responsive stage observer
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const w = containerRef.current.getBoundingClientRect().width;
        setStageWidth(Math.max(360, Math.floor(w)));
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Center coordinate of stage
  const centerX = stageWidth / 2;
  const centerY = stageHeight / 2 - 10;

  // Dimensions of the original magnet
  const totalLength = Math.min(stageWidth - 80, 420);
  const totalHeight = 100;
  const halfLength = (totalLength - 10) / 2;
  const halfHeight = (totalHeight - 10) / 2;

  // Dragging state for interactive separation on canvas
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ clientPos: number; initialSep: number }>({ clientPos: 0, initialSep: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    if (cutMode === 'intact') return;
    const clientPos = cutMode === 'transversal' ? e.clientX : e.clientY;
    dragStartRef.current = { clientPos, initialSep: separation };
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || cutMode === 'intact') return;
    const clientPos = cutMode === 'transversal' ? e.clientX : e.clientY;
    const delta = Math.abs(clientPos - dragStartRef.current.clientPos) * 1.5;
    const maxSep = cutMode === 'transversal' ? Math.min(180, stageWidth * 0.3) : 130;
    setSeparation(Math.max(0, Math.min(maxSep, dragStartRef.current.initialSep + (clientPos > dragStartRef.current.clientPos ? delta : -delta))));
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Helper to render mini magnets grid inside any piece
  const renderMiniMagnets = (
    startX: number,
    startY: number,
    pieceWidth: number,
    pieceHeight: number,
    cols: number,
    rows: number
  ) => {
    const miniWidth = (pieceWidth - 12) / cols;
    const miniHeight = (pieceHeight - 12) / rows;
    const padX = 6;
    const padY = 6;

    const miniList = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const mx = startX + padX + c * miniWidth + 1.5;
        const my = startY + padY + r * miniHeight + 1.5;
        const mw = miniWidth - 3;
        const mh = miniHeight - 3;
        const halfMw = mw / 2;

        miniList.push(
          <g key={`${r}-${c}`} className="transition-all duration-300">
            {/* Background pill */}
            <rect
              x={mx}
              y={my}
              width={mw}
              height={mh}
              rx={3}
              fill="#0f172a"
              stroke="#334155"
              strokeWidth={0.8}
            />

            {/* North half (red) - Left */}
            <rect
              x={mx}
              y={my}
              width={halfMw}
              height={mh}
              rx={2}
              fill="#ef4444"
              opacity={0.92}
            />

            {/* South half (blue) - Right */}
            <rect
              x={mx + halfMw}
              y={my}
              width={halfMw}
              height={mh}
              rx={2}
              fill="#3b82f6"
              opacity={0.92}
            />

            {/* Micro Dipole Arrow Vector (pointing S -> N inside magnet, left to right orientation) */}
            {mh >= 14 && mw >= 24 && (
              <g opacity={0.85}>
                <line
                  x1={mx + 3}
                  y1={my + mh / 2}
                  x2={mx + mw - 3}
                  y2={my + mh / 2}
                  stroke="#ffffff"
                  strokeWidth={1}
                />
                <polygon
                  points={`${mx + mw - 2},${my + mh / 2} ${mx + mw - 5},${my + mh / 2 - 2} ${mx + mw - 5},${my + mh / 2 + 2}`}
                  fill="#ffffff"
                />
              </g>
            )}

            {/* Micro N & S labels if large enough */}
            {mh >= 22 && mw >= 28 && (
              <>
                <text
                  x={mx + halfMw / 2}
                  y={my + mh / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#ffffff"
                  fontSize="8"
                  fontWeight="bold"
                >
                  N
                </text>
                <text
                  x={mx + halfMw + halfMw / 2}
                  y={my + mh / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#ffffff"
                  fontSize="8"
                  fontWeight="bold"
                >
                  S
                </text>
              </>
            )}
          </g>
        );
      }
    }

    return miniList;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Concept Title */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                Princípio Fundamental
              </span>
              <span className="text-xs text-slate-500">Inseparabilidade dos Polos</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
              Inseparabilidade dos Polos: O Mistério do Ímã Dividido
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Ao partir qualquer ímã ao meio, <strong>nunca se isola um polo Norte ou polo Sul</strong>.
              Cada pedaço regenera instantaneamente um novo polo oposto na superfície de corte,
              revelando a orientação ordenada dos <strong>mini ímãs internos</strong> (dipolos elementares).
            </p>
          </div>

          {/* Quick mode badges */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Não existem monopolos magnéticos
            </span>
          </div>
        </div>
      </div>

      {/* Main Interactive Stage & Control Panel */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden flex flex-col">
        {/* Top Control Bar */}
        <div className="p-3.5 sm:p-4 bg-slate-950/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          {/* Cut Mode Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                setCutMode('intact');
                setSeparation(0);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                cutMode === 'intact'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <MagnetIcon className="w-3.5 h-3.5" />
              <span>Ímã Inteiro</span>
            </button>

            <button
              onClick={() => {
                setCutMode('transversal');
                setSeparation(separation === 0 ? 55 : separation);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                cutMode === 'transversal'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Scissors className="w-3.5 h-3.5 rotate-90" />
              <span>Corte Transversal</span>
            </button>

            <button
              onClick={() => {
                setCutMode('longitudinal');
                setSeparation(separation === 0 ? 45 : separation);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                cutMode === 'longitudinal'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Corte Longitudinal</span>
            </button>
          </div>

          {/* Right Controls: Mini-Magnets Toggle & Separation */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            {/* Toggle Mini Magnets */}
            <button
              onClick={() => setShowDomains(!showDomains)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                showDomains
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/80 shadow-xs'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
            >
              {showDomains ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>Mini Ímãs Internos</span>
            </button>

            {/* Separation slider if cut */}
            {cutMode !== 'intact' && (
              <div className="flex items-center gap-2 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 text-xs text-slate-300">
                {cutMode === 'transversal' ? (
                  <MoveHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                ) : (
                  <MoveVertical className="w-3.5 h-3.5 text-indigo-400" />
                )}
                <span className="text-[11px] text-slate-400 hidden sm:inline">Afastamento:</span>
                <input
                  type="range"
                  min="0"
                  max={cutMode === 'transversal' ? 140 : 100}
                  value={separation}
                  onChange={(e) => setSeparation(Number(e.target.value))}
                  className="w-20 sm:w-28 accent-indigo-500 cursor-pointer"
                />
                <span className="text-[11px] font-mono w-7 text-right text-indigo-300">
                  {separation}px
                </span>
              </div>
            )}

            {/* Reset / Snap button */}
            <button
              onClick={() => {
                setCutMode('intact');
                setSeparation(0);
              }}
              title="Restaurar ímã inteiro"
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Interactive Visual Canvas */}
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="relative w-full select-none bg-radial from-slate-900 to-slate-950 overflow-hidden cursor-default"
          style={{ height: `${stageHeight}px` }}
        >
          <svg width={stageWidth} height={stageHeight} className="absolute inset-0 pointer-events-none">
            <defs>
              {/* Subtle grid pattern */}
              <pattern id="labGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.75" />
              </pattern>

              {/* Laser cut blade effect */}
              <linearGradient id="cutLineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
                <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
              </linearGradient>

              {/* Magnetic attraction force gradient */}
              <linearGradient id="attrGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#818cf8" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {/* Grid background */}
            <rect width="100%" height="100%" fill="url(#labGrid)" />

            {/* ========================================================= */}
            {/* MODE 1: ÍMÃ INTEIRO (INTACT)                              */}
            {/* ========================================================= */}
            {cutMode === 'intact' && (
              <g className="transition-transform duration-300">
                {/* Outer magnet container */}
                <g transform={`translate(${centerX - totalLength / 2}, ${centerY - totalHeight / 2})`}>
                  {/* Shadow */}
                  <rect
                    x="4"
                    y="6"
                    width={totalLength}
                    height={totalHeight}
                    rx="12"
                    fill="#000000"
                    opacity="0.4"
                  />

                  {/* Magnet Body Base */}
                  <rect
                    x="0"
                    y="0"
                    width={totalLength}
                    height={totalHeight}
                    rx="12"
                    fill="#0f172a"
                    stroke="#475569"
                    strokeWidth="2"
                  />

                  {/* Left Half: North Pole (Red) */}
                  <path
                    d={`M 0 12 Q 0 0 12 0 L ${totalLength / 2} 0 L ${totalLength / 2} ${totalHeight} L 12 ${totalHeight} Q 0 ${totalHeight} 0 ${totalHeight - 12} Z`}
                    fill="#dc2626"
                    opacity={showDomains ? 0.3 : 0.95}
                  />

                  {/* Right Half: South Pole (Blue) */}
                  <path
                    d={`M ${totalLength / 2} 0 L ${totalLength - 12} 0 Q ${totalLength} 0 ${totalLength} 12 L ${totalLength} ${totalHeight - 12} Q ${totalLength} ${totalHeight} ${totalLength - 12} ${totalHeight} L ${totalLength / 2} ${totalHeight} Z`}
                    fill="#2563eb"
                    opacity={showDomains ? 0.3 : 0.95}
                  />

                  {/* Divider line between poles */}
                  <line
                    x1={totalLength / 2}
                    y1="0"
                    x2={totalLength / 2}
                    y2={totalHeight}
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeDasharray={showDomains ? '4,3' : 'none'}
                    opacity={0.8}
                  />

                  {/* Mini-Magnets inside the intact magnet (8 cols x 3 rows = 24 mini dipoles) */}
                  {showDomains &&
                    renderMiniMagnets(0, 0, totalLength, totalHeight, 8, 3)}

                  {/* Macroscopic Pole Labels */}
                  <text
                    x={totalLength * 0.22}
                    y={totalHeight / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#ffffff"
                    fontSize="38"
                    fontWeight="900"
                    className="drop-shadow-md pointer-events-none select-none"
                    opacity={showDomains ? 0.85 : 1}
                  >
                    N
                  </text>
                  <text
                    x={totalLength * 0.78}
                    y={totalHeight / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#ffffff"
                    fontSize="38"
                    fontWeight="900"
                    className="drop-shadow-md pointer-events-none select-none"
                    opacity={showDomains ? 0.85 : 1}
                  >
                    S
                  </text>

                  {/* Subtitle labels */}
                  <text
                    x={totalLength * 0.22}
                    y={totalHeight - 12}
                    textAnchor="middle"
                    fill="#fecaca"
                    fontSize="10"
                    fontWeight="bold"
                    letterSpacing="0.05em"
                  >
                    POLO NORTE
                  </text>
                  <text
                    x={totalLength * 0.78}
                    y={totalHeight - 12}
                    textAnchor="middle"
                    fill="#bfdbfe"
                    fontSize="10"
                    fontWeight="bold"
                    letterSpacing="0.05em"
                  >
                    POLO SUL
                  </text>
                </g>

                {/* Laser cutting line guide in the center with scissor icon */}
                <g className="cursor-pointer" onClick={() => setCutMode('transversal')}>
                  <line
                    x1={centerX}
                    y1={centerY - totalHeight / 2 - 35}
                    x2={centerX}
                    y2={centerY + totalHeight / 2 + 35}
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    strokeDasharray="4,4"
                    opacity={0.7}
                  />
                  <circle cx={centerX} cy={centerY - totalHeight / 2 - 25} r="14" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
                  <text
                    x={centerX}
                    y={centerY - totalHeight / 2 - 24}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#ffffff"
                    fontSize="12"
                  >
                    ✂
                  </text>
                  <text
                    x={centerX}
                    y={centerY - totalHeight / 2 - 45}
                    textAnchor="middle"
                    fill="#7dd3fc"
                    fontSize="11"
                    fontWeight="600"
                  >
                    Linha de Corte Transversal
                  </text>
                </g>
              </g>
            )}

            {/* ========================================================= */}
            {/* MODE 2: CORTE TRANSVERSAL (VERTICAL SPLIT)                */}
            {/* ========================================================= */}
            {cutMode === 'transversal' && (
              <g>
                {/* Left Piece (Original North on left, NEW South on right cut face) */}
                {(() => {
                  const leftX = centerX - separation / 2 - halfLength;
                  const leftY = centerY - totalHeight / 2;

                  return (
                    <g transform={`translate(${leftX}, ${leftY})`} className="cursor-grab active:cursor-grabbing">
                      {/* Shadow */}
                      <rect x="4" y="6" width={halfLength} height={totalHeight} rx="8" fill="#000000" opacity="0.4" />

                      {/* Magnet Piece Base */}
                      <rect x="0" y="0" width={halfLength} height={totalHeight} rx="8" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />

                      {/* Left pole: Original North (Red) */}
                      <path
                        d={`M 0 8 Q 0 0 8 0 L ${halfLength / 2} 0 L ${halfLength / 2} ${totalHeight} L 8 ${totalHeight} Q 0 ${totalHeight} 0 ${totalHeight - 8} Z`}
                        fill="#dc2626"
                        opacity={showDomains ? 0.35 : 0.95}
                      />

                      {/* Right cut pole: NEW South (Blue) */}
                      <path
                        d={`M ${halfLength / 2} 0 L ${halfLength} 0 L ${halfLength} ${totalHeight} L ${halfLength / 2} ${totalHeight} Z`}
                        fill="#2563eb"
                        opacity={showDomains ? 0.35 : 0.95}
                      />

                      {/* Cut face highlight border */}
                      <line x1={halfLength} y1="0" x2={halfLength} y2={totalHeight} stroke="#60a5fa" strokeWidth="3" />

                      {/* Internal mini magnets (4 cols x 3 rows) */}
                      {showDomains && renderMiniMagnets(0, 0, halfLength, totalHeight, 4, 3)}

                      {/* Major labels */}
                      <text
                        x={halfLength * 0.28}
                        y={totalHeight / 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#ffffff"
                        fontSize="32"
                        fontWeight="900"
                        className="drop-shadow-md pointer-events-none"
                      >
                        N
                      </text>

                      {/* NEW SOUTH POLE ON CUT FACE */}
                      <text
                        x={halfLength * 0.74}
                        y={totalHeight / 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#ffffff"
                        fontSize="32"
                        fontWeight="900"
                        className="drop-shadow-md pointer-events-none"
                      >
                        S
                      </text>

                      {/* Badge: Novo Polo */}
                      <g transform={`translate(${halfLength - 42}, 8)`}>
                        <rect width="38" height="14" rx="3" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1" />
                        <text x="19" y="8" textAnchor="middle" dominantBaseline="central" fill="#93c5fd" fontSize="8" fontWeight="bold">
                          NOVO S
                        </text>
                      </g>

                      {/* Sub-labels */}
                      <text x={halfLength * 0.28} y={totalHeight - 10} textAnchor="middle" fill="#fecaca" fontSize="9" fontWeight="bold">
                        POLO N
                      </text>
                      <text x={halfLength * 0.74} y={totalHeight - 10} textAnchor="middle" fill="#bfdbfe" fontSize="9" fontWeight="bold">
                        POLO S
                      </text>
                    </g>
                  );
                })()}

                {/* Right Piece (NEW North on left cut face, Original South on right) */}
                {(() => {
                  const rightX = centerX + separation / 2;
                  const rightY = centerY - totalHeight / 2;

                  return (
                    <g transform={`translate(${rightX}, ${rightY})`} className="cursor-grab active:cursor-grabbing">
                      {/* Shadow */}
                      <rect x="4" y="6" width={halfLength} height={totalHeight} rx="8" fill="#000000" opacity="0.4" />

                      {/* Magnet Piece Base */}
                      <rect x="0" y="0" width={halfLength} height={totalHeight} rx="8" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />

                      {/* Left cut pole: NEW North (Red) */}
                      <path
                        d={`M 0 0 L ${halfLength / 2} 0 L ${halfLength / 2} ${totalHeight} L 0 ${totalHeight} Z`}
                        fill="#dc2626"
                        opacity={showDomains ? 0.35 : 0.95}
                      />

                      {/* Right pole: Original South (Blue) */}
                      <path
                        d={`M ${halfLength / 2} 0 L ${halfLength - 8} 0 Q ${halfLength} 0 ${halfLength} 8 L ${halfLength} ${totalHeight - 8} Q ${halfLength} ${totalHeight} ${halfLength - 8} ${totalHeight} L ${halfLength / 2} ${totalHeight} Z`}
                        fill="#2563eb"
                        opacity={showDomains ? 0.35 : 0.95}
                      />

                      {/* Cut face highlight border */}
                      <line x1="0" y1="0" x2="0" y2={totalHeight} stroke="#f87171" strokeWidth="3" />

                      {/* Internal mini magnets (4 cols x 3 rows) */}
                      {showDomains && renderMiniMagnets(0, 0, halfLength, totalHeight, 4, 3)}

                      {/* NEW NORTH POLE ON CUT FACE */}
                      <text
                        x={halfLength * 0.26}
                        y={totalHeight / 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#ffffff"
                        fontSize="32"
                        fontWeight="900"
                        className="drop-shadow-md pointer-events-none"
                      >
                        N
                      </text>

                      {/* Original South Pole */}
                      <text
                        x={halfLength * 0.72}
                        y={totalHeight / 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#ffffff"
                        fontSize="32"
                        fontWeight="900"
                        className="drop-shadow-md pointer-events-none"
                      >
                        S
                      </text>

                      {/* Badge: Novo Polo */}
                      <g transform={`translate(4, 8)`}>
                        <rect width="38" height="14" rx="3" fill="#7f1d1d" stroke="#f87171" strokeWidth="1" />
                        <text x="19" y="8" textAnchor="middle" dominantBaseline="central" fill="#fca5a5" fontSize="8" fontWeight="bold">
                          NOVO N
                        </text>
                      </g>

                      {/* Sub-labels */}
                      <text x={halfLength * 0.26} y={totalHeight - 10} textAnchor="middle" fill="#fecaca" fontSize="9" fontWeight="bold">
                        POLO N
                      </text>
                      <text x={halfLength * 0.72} y={totalHeight - 10} textAnchor="middle" fill="#bfdbfe" fontSize="9" fontWeight="bold">
                        POLO S
                      </text>
                    </g>
                  );
                })()}

                {/* Magnetic Attraction Lines between the cut faces (S on left <-> N on right) */}
                {separation > 12 && (
                  <g>
                    {[-30, -15, 0, 15, 30].map((yOff) => {
                      const x1 = centerX - separation / 2;
                      const x2 = centerX + separation / 2;
                      const y = centerY + yOff;
                      return (
                        <g key={yOff}>
                          {/* Force induction line across cut gap */}
                          <line
                            x1={x1}
                            y1={y}
                            x2={x2}
                            y2={y}
                            stroke="#818cf8"
                            strokeWidth={1.5}
                            strokeDasharray="4,3"
                            opacity={0.7}
                          />
                          {/* Arrow pointing from N (right) to S (left) externally, or showing mutual attraction */}
                          <polygon
                            points={`${centerX - 3},${y} ${centerX + 2},${y - 3} ${centerX + 2},${y + 3}`}
                            fill="#a5b4fc"
                          />
                        </g>
                      );
                    })}

                    {/* Attraction label badge */}
                    <g transform={`translate(${centerX - 48}, ${centerY - totalHeight / 2 - 32})`}>
                      <rect width="96" height="22" rx="6" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1" />
                      <text x="48" y="11" textAnchor="middle" dominantBaseline="central" fill="#c7d2fe" fontSize="10" fontWeight="bold">
                        ATRAÇÃO (S ↔ N)
                      </text>
                    </g>
                  </g>
                )}
              </g>
            )}

            {/* ========================================================= */}
            {/* MODE 3: CORTE LONGITUDINAL (HORIZONTAL SPLIT)             */}
            {/* ========================================================= */}
            {cutMode === 'longitudinal' && (
              <g>
                {/* Top Piece (Thinner complete magnet: Left N, Right S) */}
                {(() => {
                  const pieceX = centerX - totalLength / 2;
                  const topY = centerY - separation / 2 - halfHeight;

                  return (
                    <g transform={`translate(${pieceX}, ${topY})`} className="cursor-grab active:cursor-grabbing">
                      {/* Shadow */}
                      <rect x="4" y="4" width={totalLength} height={halfHeight} rx="6" fill="#000000" opacity="0.4" />

                      {/* Magnet Piece Base */}
                      <rect x="0" y="0" width={totalLength} height={halfHeight} rx="6" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />

                      {/* North Pole (Red) - Left half */}
                      <path
                        d={`M 0 6 Q 0 0 6 0 L ${totalLength / 2} 0 L ${totalLength / 2} ${halfHeight} L 0 ${halfHeight} Z`}
                        fill="#dc2626"
                        opacity={showDomains ? 0.35 : 0.95}
                      />

                      {/* South Pole (Blue) - Right half */}
                      <path
                        d={`M ${totalLength / 2} 0 L ${totalLength - 6} 0 Q ${totalLength} 0 ${totalLength} 6 L ${totalLength} ${halfHeight} L ${totalLength / 2} ${halfHeight} Z`}
                        fill="#2563eb"
                        opacity={showDomains ? 0.35 : 0.95}
                      />

                      {/* Cut surface bottom edge highlight */}
                      <line x1="0" y1={halfHeight} x2={totalLength} y2={halfHeight} stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="5,3" />

                      {/* Mini magnets (8 cols x 2 rows) */}
                      {showDomains && renderMiniMagnets(0, 0, totalLength, halfHeight, 8, 2)}

                      {/* Labels */}
                      <text
                        x={totalLength * 0.22}
                        y={halfHeight / 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#ffffff"
                        fontSize="22"
                        fontWeight="900"
                        className="drop-shadow-md pointer-events-none"
                      >
                        N
                      </text>
                      <text
                        x={totalLength * 0.78}
                        y={halfHeight / 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#ffffff"
                        fontSize="22"
                        fontWeight="900"
                        className="drop-shadow-md pointer-events-none"
                      >
                        S
                      </text>

                      {/* Top piece label */}
                      <text x={totalLength / 2} y="-8" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">
                        ÍMÃ SUPERIOR (Norte à esquerda, Sul à direita)
                      </text>
                    </g>
                  );
                })()}

                {/* Bottom Piece (Thinner complete magnet: Left N, Right S) */}
                {(() => {
                  const pieceX = centerX - totalLength / 2;
                  const bottomY = centerY + separation / 2;

                  return (
                    <g transform={`translate(${pieceX}, ${bottomY})`} className="cursor-grab active:cursor-grabbing">
                      {/* Shadow */}
                      <rect x="4" y="4" width={totalLength} height={halfHeight} rx="6" fill="#000000" opacity="0.4" />

                      {/* Magnet Piece Base */}
                      <rect x="0" y="0" width={totalLength} height={halfHeight} rx="6" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />

                      {/* North Pole (Red) - Left half */}
                      <path
                        d={`M 0 0 L ${totalLength / 2} 0 L ${totalLength / 2} ${halfHeight} L 6 ${halfHeight} Q 0 ${halfHeight} 0 ${halfHeight - 6} Z`}
                        fill="#dc2626"
                        opacity={showDomains ? 0.35 : 0.95}
                      />

                      {/* South Pole (Blue) - Right half */}
                      <path
                        d={`M ${totalLength / 2} 0 L ${totalLength} 0 L ${totalLength} ${halfHeight - 6} Q ${totalLength} ${halfHeight} ${totalLength - 6} ${halfHeight} L ${totalLength / 2} ${halfHeight} Z`}
                        fill="#2563eb"
                        opacity={showDomains ? 0.35 : 0.95}
                      />

                      {/* Cut surface top edge highlight */}
                      <line x1="0" y1="0" x2={totalLength} y2="0" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="5,3" />

                      {/* Mini magnets (8 cols x 2 rows) */}
                      {showDomains && renderMiniMagnets(0, 0, totalLength, halfHeight, 8, 2)}

                      {/* Labels */}
                      <text
                        x={totalLength * 0.22}
                        y={halfHeight / 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#ffffff"
                        fontSize="22"
                        fontWeight="900"
                        className="drop-shadow-md pointer-events-none"
                      >
                        N
                      </text>
                      <text
                        x={totalLength * 0.78}
                        y={halfHeight / 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#ffffff"
                        fontSize="22"
                        fontWeight="900"
                        className="drop-shadow-md pointer-events-none"
                      >
                        S
                      </text>

                      {/* Bottom piece label */}
                      <text x={totalLength / 2} y={halfHeight + 16} textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">
                        ÍMÃ INFERIOR (Norte à esquerda, Sul à direita)
                      </text>
                    </g>
                  );
                })()}

                {/* Lateral Repulsion Field between identical facing poles (N over N, S over S) */}
                {separation > 12 && (
                  <g>
                    {/* Left repulsion (N over N) */}
                    <g transform={`translate(${centerX - totalLength * 0.28}, ${centerY})`}>
                      <circle r="12" fill="#450a0a" stroke="#ef4444" strokeWidth="1" />
                      <text textAnchor="middle" dominantBaseline="central" fill="#fca5a5" fontSize="10" fontWeight="bold">
                        ↕ REP
                      </text>
                    </g>

                    {/* Right repulsion (S over S) */}
                    <g transform={`translate(${centerX + totalLength * 0.28}, ${centerY})`}>
                      <circle r="12" fill="#172554" stroke="#3b82f6" strokeWidth="1" />
                      <text textAnchor="middle" dominantBaseline="central" fill="#93c5fd" fontSize="10" fontWeight="bold">
                        ↕ REP
                      </text>
                    </g>

                    {/* Central explanation badge */}
                    <g transform={`translate(${centerX - 95}, ${centerY - 10})`}>
                      <rect width="190" height="20" rx="5" fill="#0f172a" stroke="#475569" strokeWidth="1" />
                      <text x="95" y="10" textAnchor="middle" dominantBaseline="central" fill="#e2e8f0" fontSize="9" fontWeight="bold">
                        POLOS IGUAIS FRENTE A FRENTE (REPULSÃO)
                      </text>
                    </g>
                  </g>
                )}
              </g>
            )}
          </svg>

          {/* Bottom Interactive Explanation Pill */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-slate-300 pointer-events-none bg-slate-900/85 backdrop-blur-xs px-3.5 py-2 rounded-lg border border-slate-800 shadow-sm">
            <span className="flex items-center gap-2">
              <Scissors className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                {cutMode === 'transversal' && (
                  <>
                    <strong>Corte Transversal:</strong> A linha de corte expõe os polos dos mini ímãs internos.
                    Formam-se <strong>dois ímãs novos e completos (N-S e N-S)</strong> que se atraem mutuamente pela face cortada!
                  </>
                )}
                {cutMode === 'longitudinal' && (
                  <>
                    <strong>Corte Longitudinal:</strong> Cada fatia mantém fileiras inteiras de mini ímãs orientados (N à esquerda e S à direita),
                    gerando <strong>dois ímãs mais finos</strong> com polos idênticos sobrepostos.
                  </>
                )}
                {cutMode === 'intact' && (
                  <>
                    <strong>Ímã Inteiro:</strong> No interior do material, cada polo N de um mini ímã se junta ao polo S do vizinho,
                    neutralizando o campo interno. Os polos livres aparecem somente nas extremidades!
                  </>
                )}
              </span>
            </span>

            <span className="hidden md:inline text-amber-300 font-medium text-[11px]">
              {cutMode !== 'intact'
                ? 'Arraste pelo palco ou use a barra para ajustar o afastamento dos pedaços.'
                : 'Clique nos botões de corte acima para partir o ímã ao meio.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
