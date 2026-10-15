import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  RotateCw,
  Compass as CompassIcon,
  Navigation,
  Trash2,
  Eye,
  Sliders,
  Sparkles,
  Grid,
  Info,
  Layers,
  Crosshair,
} from 'lucide-react';
import {
  calculateMagnetField,
  getFieldVectorAt,
  generateFieldLines,
  getMagnetPoles,
} from '../utils/physics';
import { Compass } from './Compass';
import { CompassInstance, VectorProbe } from '../types';

export const InductionLinesTab: React.FC = () => {
  // Magnet configuration
  const [magnetReversed, setMagnetReversed] = useState(false);
  const magnetLength = 160;
  const magnetWidth = 52;
  const magnetAngle = magnetReversed ? 180 : 0;

  // Visual toggles
  const [showFieldLines, setShowFieldLines] = useState(true);
  const [lineDensity, setLineDensity] = useState(8); // number of lines per side
  const [showVectorProbe, setShowVectorProbe] = useState(true);
  const [showMainCompass, setShowMainCompass] = useState(true);
  const [showCompassGrid, setShowCompassGrid] = useState(false);

  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Canvas dimensions
  const [canvasSize, setCanvasSize] = useState({ width: 780, height: 460 });

  // Center of the magnet in canvas coordinates
  const magnetCenter = { x: canvasSize.width / 2, y: canvasSize.height / 2 };

  // Vector probe location (user can drag or click)
  const [probe, setProbe] = useState<VectorProbe>({
    x: magnetCenter.x + 110,
    y: magnetCenter.y - 85,
    active: true,
    bx: 0,
    by: 0,
    magnitude: 0,
    angleDeg: 0,
  });

  // Main draggable compass location
  const [mainCompassPos, setMainCompassPos] = useState({
    x: magnetCenter.x - 115,
    y: magnetCenter.y - 95,
  });

  // Custom placed compasses
  const [placedCompasses, setPlacedCompasses] = useState<CompassInstance[]>([
    {
      id: 'comp-1',
      x: magnetCenter.x + 140,
      y: magnetCenter.y + 80,
      angle: 0,
    },
    {
      id: 'comp-2',
      x: magnetCenter.x,
      y: magnetCenter.y - 120,
      angle: 0,
    },
  ]);

  // Dragging state tracking
  const [draggingItem, setDraggingItem] = useState<'probe' | 'mainCompass' | string | null>(null);

  // Update canvas size responsively
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const w = Math.min(960, Math.max(340, Math.floor(rect.width)));
        const h = Math.min(520, Math.max(380, Math.floor(w * 0.58)));
        setCanvasSize({ width: w, height: h });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Recalculate probe field telemetry
  useEffect(() => {
    const vector = getFieldVectorAt(
      probe.x,
      probe.y,
      magnetCenter.x,
      magnetCenter.y,
      magnetLength,
      magnetAngle
    );

    setProbe((prev) => ({
      ...prev,
      bx: Math.round(vector.bx),
      by: Math.round(vector.by),
      magnitude: Math.round(vector.magnitude),
      angleDeg: Math.round(vector.angleDeg),
    }));
  }, [probe.x, probe.y, magnetCenter.x, magnetCenter.y, magnetAngle]);

  // Calculate orientation angle for any point (x, y)
  const getAngleAt = useCallback(
    (x: number, y: number) => {
      const v = calculateMagnetField(x, y, magnetCenter.x, magnetCenter.y, magnetLength, magnetAngle);
      // In canvas, y increases downward. Standard angle is atan2(by, bx)
      return (Math.atan2(v.by, v.bx) * 180) / Math.PI;
    },
    [magnetCenter.x, magnetCenter.y, magnetAngle]
  );

  // Main compass needle angle (in compass orientation, 0 deg is right, 90 deg down, 270 deg up)
  // Our Compass component rotates needle from 0 deg North pointing UP.
  // So angleForCompass = angleDeg + 90
  const mainCompassAngle = getAngleAt(mainCompassPos.x, mainCompassPos.y) + 90;

  // Render Canvas (Field lines, grid, arrows)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvasSize;
    ctx.clearRect(0, 0, width, height);

    // 1. Draw Compass Grid if enabled
    if (showCompassGrid) {
      const step = 44;
      for (let gx = step; gx < width; gx += step) {
        for (let gy = step; gy < height; gy += step) {
          // Skip if inside the magnet
          if (
            Math.abs(gx - magnetCenter.x) < magnetLength / 2 + 10 &&
            Math.abs(gy - magnetCenter.y) < magnetWidth / 2 + 10
          ) {
            continue;
          }

          const { bx, by } = calculateMagnetField(
            gx,
            gy,
            magnetCenter.x,
            magnetCenter.y,
            magnetLength,
            magnetAngle
          );
          const mag = Math.hypot(bx, by);
          if (mag === 0) continue;

          const ux = bx / mag;
          const uy = by / mag;
          const arrowLen = 12;

          // Tiny needle
          ctx.beginPath();
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 1;
          ctx.moveTo(gx - ux * arrowLen, gy - uy * arrowLen);
          ctx.lineTo(gx, gy);
          ctx.stroke();

          // North tip (Red)
          ctx.beginPath();
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.6;
          ctx.moveTo(gx, gy);
          ctx.lineTo(gx + ux * arrowLen, gy + uy * arrowLen);
          ctx.stroke();

          // Mini arrowhead
          const headLen = 4;
          const angle = Math.atan2(uy, ux);
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(gx + ux * arrowLen, gy + uy * arrowLen);
          ctx.lineTo(
            gx + ux * arrowLen - headLen * Math.cos(angle - Math.PI / 6),
            gy + uy * arrowLen - headLen * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            gx + ux * arrowLen - headLen * Math.cos(angle + Math.PI / 6),
            gy + uy * arrowLen - headLen * Math.sin(angle + Math.PI / 6)
          );
          ctx.fill();
        }
      }
    }

    // 2. Draw Magnetic Induction Lines (Streamlines)
    if (showFieldLines) {
      const lines = generateFieldLines(
        magnetCenter.x,
        magnetCenter.y,
        magnetLength,
        magnetAngle,
        width,
        height,
        lineDensity
      );

      ctx.lineWidth = 1.4;

      lines.forEach((line) => {
        if (line.length < 2) return;

        // Gradient or sleek indigo stroke
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.55)';
        ctx.beginPath();
        ctx.moveTo(line[0].x, line[0].y);

        for (let i = 1; i < line.length; i++) {
          ctx.lineTo(line[i].x, line[i].y);
        }
        ctx.stroke();

        // Draw directional arrows along the line (from North to South)
        const arrowIndices = line.length > 50
          ? [Math.floor(line.length * 0.3), Math.floor(line.length * 0.7)]
          : [Math.floor(line.length * 0.5)];

        arrowIndices.forEach((idx) => {
          if (idx < line.length - 1 && idx > 0) {
            const p1 = line[idx];
            const p2 = line[idx + 1];
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

            const arrowSize = 6;
            ctx.fillStyle = '#818cf8';
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(
              p1.x - arrowSize * Math.cos(angle - Math.PI / 5),
              p1.y - arrowSize * Math.sin(angle - Math.PI / 5)
            );
            ctx.lineTo(
              p1.x - arrowSize * Math.cos(angle + Math.PI / 5),
              p1.y - arrowSize * Math.sin(angle + Math.PI / 5)
            );
            ctx.closePath();
            ctx.fill();
          }
        });
      });
    }

    // 3. Draw Vector B arrow if vector probe is active
    if (showVectorProbe) {
      const { bx, by, magnitude } = probe;
      const mag = Math.hypot(bx, by);

      if (mag > 0.001) {
        const ux = bx / mag;
        const uy = by / mag;
        // Arrow length scaled visually
        const arrowLen = Math.min(85, Math.max(30, Math.log10(mag + 1) * 22));

        const targetX = probe.x + ux * arrowLen;
        const targetY = probe.y + uy * arrowLen;

        // White dotted line representing the tangent direction (direção tangente à linha de indução)
        const tangentSpan = 180;
        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.4;
        ctx.globalAlpha = 0.85;
        ctx.moveTo(probe.x - ux * tangentSpan, probe.y - uy * tangentSpan);
        ctx.lineTo(probe.x + ux * tangentSpan, probe.y + uy * tangentSpan);
        ctx.stroke();
        ctx.restore();

        // Tangent line segment
        ctx.beginPath();
        ctx.strokeStyle = '#10b981'; // vibrant emerald
        ctx.lineWidth = 3.5;
        ctx.moveTo(probe.x, probe.y);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();

        // Arrowhead for Vector B
        const headAngle = Math.atan2(uy, ux);
        const headSize = 10;
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.moveTo(targetX, targetY);
        ctx.lineTo(
          targetX - headSize * Math.cos(headAngle - Math.PI / 6),
          targetY - headSize * Math.sin(headAngle - Math.PI / 6)
        );
        ctx.lineTo(
          targetX - headSize * Math.cos(headAngle + Math.PI / 6),
          targetY - headSize * Math.sin(headAngle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();

        // Label: "B" with vector arrow
        ctx.fillStyle = '#ecfdf5';
        ctx.font = 'bold 13px monospace';
        ctx.fillText('B⃗', targetX + ux * 10 - 5, targetY + uy * 10 + 4);
      }
    }
  }, [
    canvasSize,
    showFieldLines,
    lineDensity,
    showCompassGrid,
    showVectorProbe,
    probe,
    magnetCenter.x,
    magnetCenter.y,
    magnetAngle,
  ]);

  // Mouse & Touch handling for moving probe, main compass, or placing compasses
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Check if clicked close to probe handle (within 24px)
    if (showVectorProbe && Math.hypot(clickX - probe.x, clickY - probe.y) < 26) {
      setDraggingItem('probe');
      return;
    }

    // Check if clicked close to main compass (within 40px)
    if (showMainCompass && Math.hypot(clickX - mainCompassPos.x, clickY - mainCompassPos.y) < 40) {
      setDraggingItem('mainCompass');
      return;
    }

    // Check placed compasses
    for (const comp of placedCompasses) {
      if (Math.hypot(clickX - comp.x, clickY - comp.y) < 32) {
        setDraggingItem(comp.id);
        return;
      }
    }

    // Otherwise, move the vector probe directly to the clicked point!
    if (showVectorProbe) {
      setProbe((prev) => ({ ...prev, x: clickX, y: clickY }));
      setDraggingItem('probe');
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingItem) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = Math.max(20, Math.min(canvasSize.width - 20, e.clientX - rect.left));
    const currentY = Math.max(20, Math.min(canvasSize.height - 20, e.clientY - rect.top));

    if (draggingItem === 'probe') {
      setProbe((prev) => ({ ...prev, x: currentX, y: currentY }));
    } else if (draggingItem === 'mainCompass') {
      setMainCompassPos({ x: currentX, y: currentY });
    } else {
      // Placed compass dragging
      setPlacedCompasses((prev) =>
        prev.map((c) => (c.id === draggingItem ? { ...c, x: currentX, y: currentY } : c))
      );
    }
  };

  const handlePointerUp = () => {
    setDraggingItem(null);
  };

  // Add a new compass at a friendly location
  const handleAddCompass = () => {
    const randomAngle = Math.random() * Math.PI * 2;
    const randomR = 120 + Math.random() * 80;
    const newX = Math.round(magnetCenter.x + randomR * Math.cos(randomAngle));
    const newY = Math.round(magnetCenter.y + randomR * Math.sin(randomAngle));

    const newComp: CompassInstance = {
      id: `comp-${Date.now()}`,
      x: Math.max(40, Math.min(canvasSize.width - 40, newX)),
      y: Math.max(40, Math.min(canvasSize.height - 40, newY)),
      angle: 0,
    };
    setPlacedCompasses((prev) => [...prev, newComp]);
  };

  const handleClearCompasses = () => {
    setPlacedCompasses([]);
  };

  return (
    <div className="space-y-6">
      {/* Concept Header Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Campo Magnético & Vetor Tangente
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              Linhas de Indução e Bússola
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              As linhas de indução saem do polo Norte e entram no polo Sul. O{' '}
              <strong className="text-emerald-700 font-semibold">
                vetor campo magnético (B⃗)
              </strong>{' '}
              é sempre tangente à linha em cada ponto, orientando com precisão a agulha de uma{' '}
              <strong className="text-indigo-700 font-semibold">bússola</strong>.
            </p>
          </div>

          {/* Quick Action Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setMagnetReversed(!magnetReversed)}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Inverter Ímã (N ↔ S)</span>
            </button>
            <button
              onClick={handleAddCompass}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              <CompassIcon className="w-4 h-4 text-indigo-600" />
              <span>+ Adicionar Bússola</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Stage with Canvas */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 relative overflow-hidden shadow-md">
        {/* Top Control Bar inside Stage */}
        <div className="p-3.5 sm:px-6 bg-slate-900/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Toggles */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <label className="flex items-center gap-2 text-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showFieldLines}
                onChange={(e) => setShowFieldLines(e.target.checked)}
                className="w-4 h-4 rounded-sm accent-indigo-500 cursor-pointer"
              />
              <span>Linhas de Indução</span>
            </label>

            <label className="flex items-center gap-2 text-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showVectorProbe}
                onChange={(e) => setShowVectorProbe(e.target.checked)}
                className="w-4 h-4 rounded-sm accent-emerald-500 cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                Vetor Campo (B⃗)
              </span>
            </label>

            <label className="flex items-center gap-2 text-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showMainCompass}
                onChange={(e) => setShowMainCompass(e.target.checked)}
                className="w-4 h-4 rounded-sm accent-indigo-500 cursor-pointer"
              />
              <span>Bússola Móvel</span>
            </label>

            <label className="flex items-center gap-2 text-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showCompassGrid}
                onChange={(e) => setShowCompassGrid(e.target.checked)}
                className="w-4 h-4 rounded-sm accent-amber-500 cursor-pointer"
              />
              <span>Grade de Mini-Bússolas</span>
            </label>
          </div>

          {/* Density & Clear Controls */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-slate-400">
              <span>Densidade:</span>
              <input
                type="range"
                min="4"
                max="12"
                value={lineDensity}
                onChange={(e) => setLineDensity(Number(e.target.value))}
                className="w-20 accent-indigo-500 cursor-pointer"
                disabled={!showFieldLines}
              />
            </div>

            {placedCompasses.length > 0 && (
              <button
                onClick={handleClearCompasses}
                className="flex items-center gap-1 text-rose-400 hover:text-rose-300 text-[11px] font-medium transition-colors cursor-pointer"
                title="Limpar bússolas adicionadas"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar Bússolas ({placedCompasses.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Interactive Canvas Viewport */}
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative w-full overflow-hidden select-none cursor-crosshair touch-none"
          style={{ height: `${canvasSize.height}px` }}
        >
          {/* Background Canvas (lines, arrows, mini-grid) */}
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            className="absolute inset-0 pointer-events-none"
          />

          {/* Centered Bar Magnet */}
          <div
            className="absolute pointer-events-none rounded-xl overflow-hidden shadow-2xl flex border-2 border-slate-400/40 z-10 transition-transform duration-300"
            style={{
              left: `${magnetCenter.x - magnetLength / 2}px`,
              top: `${magnetCenter.y - magnetWidth / 2}px`,
              width: `${magnetLength}px`,
              height: `${magnetWidth}px`,
            }}
          >
            {/* Left half */}
            <div
              className={`w-1/2 h-full flex flex-col items-center justify-center font-black text-xl text-white select-none transition-colors ${
                magnetReversed ? 'bg-red-600' : 'bg-blue-600'
              }`}
            >
              <span>{magnetReversed ? 'N' : 'S'}</span>
              <span className="text-[9px] uppercase tracking-tighter opacity-80 font-normal">
                {magnetReversed ? 'Norte' : 'Sul'}
              </span>
            </div>
            {/* Right half */}
            <div
              className={`w-1/2 h-full flex flex-col items-center justify-center font-black text-xl text-white select-none transition-colors ${
                magnetReversed ? 'bg-blue-600' : 'bg-red-600'
              }`}
            >
              <span>{magnetReversed ? 'S' : 'N'}</span>
              <span className="text-[9px] uppercase tracking-tighter opacity-80 font-normal">
                {magnetReversed ? 'Sul' : 'Norte'}
              </span>
            </div>

            {/* Subtle gloss */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/25 pointer-events-none" />
          </div>

          {/* Vector Probe Target Element (Draggable / Clickable) */}
          {showVectorProbe && (
            <div
              className="absolute z-20 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none group"
              style={{ left: `${probe.x}px`, top: `${probe.y}px` }}
            >
              {/* Probe center crosshair and ring */}
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-xs" />
              </div>
              <div className="absolute -bottom-5 bg-slate-900/90 text-emerald-400 font-mono text-[10px] px-1.5 py-0.5 rounded-sm border border-emerald-500/40 whitespace-nowrap shadow-xs">
                Sonda B⃗
              </div>
            </div>
          )}

          {/* Main Draggable Compass */}
          {showMainCompass && (
            <div
              className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing hover:scale-105 transition-transform"
              style={{ left: `${mainCompassPos.x}px`, top: `${mainCompassPos.y}px` }}
            >
              <Compass
                angleDeg={mainCompassAngle}
                size={68}
                label="Bússola Móvel"
                className="drop-shadow-xl"
              />
            </div>
          )}

          {/* User Placed Compasses */}
          {placedCompasses.map((comp) => {
            const angle = getAngleAt(comp.x, comp.y) + 90;
            return (
              <div
                key={comp.id}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing hover:scale-105 transition-transform"
                style={{ left: `${comp.x}px`, top: `${comp.y}px` }}
              >
                <Compass
                  angleDeg={angle}
                  size={54}
                  showCardinals={false}
                  label="Bússola"
                  className="drop-shadow-lg"
                />
              </div>
            );
          })}

          {/* Interactive Hint at Bottom of Canvas */}
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] text-slate-400 pointer-events-none bg-slate-900/70 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
              <span>Clique ou arraste pelo espaço para mover a sonda e ver o vetor <strong>B⃗</strong> e a reta tangente pontilhada.</span>
            </span>
            <span className="hidden sm:inline text-slate-400">
              A linha pontilhada branca indica a direção tangente à linha de indução no ponto da sonda.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
