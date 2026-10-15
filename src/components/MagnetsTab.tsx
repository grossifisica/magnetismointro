import React, { useState, useRef, useEffect } from 'react';
import {
  RotateCw,
  RotateCcw,
  RotateCcw as ResetIcon,
  MoveHorizontal,
} from 'lucide-react';

export const MagnetsTab: React.FC = () => {
  // Magnet polarity state
  // mag1Reversed: false = [S | N], true = [N | S]
  const [mag1Reversed, setMag1Reversed] = useState(false);
  // mag2Reversed: false = [S | N], true = [N | S]
  const [mag2Reversed, setMag2Reversed] = useState(false);

  // Track stage container size
  const benchRef = useRef<HTMLDivElement | null>(null);
  const [benchWidth, setBenchWidth] = useState(780);

  // Magnet physical dimensions
  const magnetWidth = 150;
  const magnetHeight = 56;

  // Horizontal center positions of the two magnets
  const [pos1, setPos1] = useState(200); // Magnet 1 center X
  const [pos2, setPos2] = useState(480); // Magnet 2 center X

  // Track dragging state: which magnet is currently controlled by the mouse
  const [draggingMagnet, setDraggingMagnet] = useState<'mag1' | 'mag2' | null>(null);
  const dragOffsetRef = useRef(0);

  // Are magnets currently snapped together in contact?
  const [isSnapped, setIsSnapped] = useState(false);

  // Update bench width responsively
  useEffect(() => {
    const updateSize = () => {
      if (benchRef.current) {
        const w = benchRef.current.getBoundingClientRect().width;
        setBenchWidth(Math.max(340, Math.floor(w)));
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Initialize magnet positions nicely centered on first load or resize
  useEffect(() => {
    if (benchWidth > 0 && !draggingMagnet) {
      setPos1((prev) => Math.min(prev, benchWidth / 2 - magnetWidth / 2 - 20));
      setPos2((prev) => Math.max(prev, benchWidth / 2 + magnetWidth / 2 + 20));
    }
  }, [benchWidth]);

  // Determine facing poles
  // Magnet 1: right-facing pole is N if not reversed, S if reversed
  const mag1FacingPole = mag1Reversed ? 'S' : 'N';
  // Magnet 2: left-facing pole is S if not reversed, N if reversed
  const mag2FacingPole = mag2Reversed ? 'N' : 'S';

  const isAttraction = mag1FacingPole !== mag2FacingPole;
  const isRepulsion = !isAttraction;

  // Gap between the two facing faces in pixels
  // pos1 is center of Mag 1, right face is pos1 + magnetWidth / 2
  // pos2 is center of Mag 2, left face is pos2 - magnetWidth / 2
  const currentGap = Math.max(0, Math.round(pos2 - pos1 - magnetWidth));

  // Magnetic force calculation (inversely proportional to distance squared)
  // Distance range: 0px to 300px
  const effectiveDist = Math.max(15, currentGap);
  const rawForce = Math.min(100, Math.round((14000 / (effectiveDist * effectiveDist)) * 10) / 10);
  const forceScale = Math.min(100, Math.max(6, Math.round(rawForce * 8)));

  // Continuous physics response loop
  // If the user drags Magnet 1 or Magnet 2, or when forces act on the other magnet
  useEffect(() => {
    let animId: number;

    const updatePhysics = () => {
      // Thresholds:
      // In repulsion: magnets push each other away if too close
      // In attraction: magnets pull each other together if within capture radius
      const minRepulsionGap = 55; // minimum comfort gap under repulsion
      const attractionCaptureRange = 175; // pixels gap where attraction overcomes friction
      const minContactGap = 0;

      // Handle Repulsion consequences
      if (isRepulsion) {
        setIsSnapped(false);

        if (draggingMagnet === 'mag1') {
          // User is dragging Magnet 1. If pushing towards Magnet 2, Magnet 2 is pushed away!
          const gap = pos2 - pos1 - magnetWidth;
          if (gap < minRepulsionGap) {
            const desiredPos2 = pos1 + magnetWidth + minRepulsionGap;
            const maxPos2 = benchWidth - magnetWidth / 2 - 16;
            const clampedPos2 = Math.min(maxPos2, desiredPos2);
            setPos2(clampedPos2);

            // If Magnet 2 is against the wall, don't let Magnet 1 overlap
            if (clampedPos2 === maxPos2 && pos1 > maxPos2 - magnetWidth - minRepulsionGap) {
              setPos1(maxPos2 - magnetWidth - minRepulsionGap);
            }
          }
        } else if (draggingMagnet === 'mag2') {
          // User is dragging Magnet 2. If pushing towards Magnet 1, Magnet 1 is pushed away!
          const gap = pos2 - pos1 - magnetWidth;
          if (gap < minRepulsionGap) {
            const desiredPos1 = pos2 - magnetWidth - minRepulsionGap;
            const minPos1 = magnetWidth / 2 + 16;
            const clampedPos1 = Math.max(minPos1, desiredPos1);
            setPos1(clampedPos1);

            // If Magnet 1 is against left wall, don't let Magnet 2 overlap
            if (clampedPos1 === minPos1 && pos2 < minPos1 + magnetWidth + minRepulsionGap) {
              setPos2(minPos1 + magnetWidth + minRepulsionGap);
            }
          }
        }
      }

      // Handle Attraction consequences
      if (isAttraction) {
        const gap = pos2 - pos1 - magnetWidth;

        // If they are in contact (snapped)
        if (gap <= 2 || isSnapped) {
          if (!isSnapped) setIsSnapped(true);

          if (draggingMagnet === 'mag1') {
            // Dragging Magnet 1 carries Magnet 2 along
            const targetPos2 = Math.min(
              benchWidth - magnetWidth / 2 - 16,
              pos1 + magnetWidth
            );
            setPos2(targetPos2);
          } else if (draggingMagnet === 'mag2') {
            // Dragging Magnet 2 carries Magnet 1 along
            const targetPos1 = Math.max(
              magnetWidth / 2 + 16,
              pos2 - magnetWidth
            );
            setPos1(targetPos1);
          }
        } else if (gap < attractionCaptureRange && !isSnapped) {
          // Free magnet is pulled towards the held magnet
          const pullSpeed = Math.min(18, Math.max(3, (attractionCaptureRange - gap) * 0.18));

          if (draggingMagnet === 'mag1') {
            // Pull Magnet 2 towards Magnet 1
            const newPos2 = Math.max(pos1 + magnetWidth, pos2 - pullSpeed);
            setPos2(newPos2);
            if (newPos2 - pos1 - magnetWidth <= 2) {
              setIsSnapped(true);
            }
          } else if (draggingMagnet === 'mag2') {
            // Pull Magnet 1 towards Magnet 2
            const newPos1 = Math.min(pos2 - magnetWidth, pos1 + pullSpeed);
            setPos1(newPos1);
            if (pos2 - newPos1 - magnetWidth <= 2) {
              setIsSnapped(true);
            }
          }
        }
      }

      animId = requestAnimationFrame(updatePhysics);
    };

    animId = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(animId);
  }, [draggingMagnet, pos1, pos2, benchWidth, isRepulsion, isAttraction, isSnapped]);

  // Pointer Down on Magnet 1
  const handlePointerDownMag1 = (e: React.PointerEvent) => {
    e.stopPropagation();
    const rect = benchRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.clientX - rect.left;
    dragOffsetRef.current = clientX - pos1;
    setDraggingMagnet('mag1');
  };

  // Pointer Down on Magnet 2
  const handlePointerDownMag2 = (e: React.PointerEvent) => {
    e.stopPropagation();
    const rect = benchRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.clientX - rect.left;
    dragOffsetRef.current = clientX - pos2;
    setDraggingMagnet('mag2');
  };

  // Pointer Move on Bench
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingMagnet || !benchRef.current) return;
    const rect = benchRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;

    if (draggingMagnet === 'mag1') {
      const minX = magnetWidth / 2 + 16;
      // If repulsion, max is bounded by pos2 - minRepulsionGap
      const maxX = isRepulsion
        ? Math.min(benchWidth - magnetWidth * 1.5 - 45, pos2 - magnetWidth - 30)
        : benchWidth - magnetWidth / 2 - 16;

      const newPos1 = Math.max(minX, Math.min(maxX, currentX - dragOffsetRef.current));
      setPos1(newPos1);
    } else if (draggingMagnet === 'mag2') {
      // If repulsion, min is bounded by pos1 + minRepulsionGap
      const minX = isRepulsion
        ? Math.max(magnetWidth * 1.5 + 45, pos1 + magnetWidth + 30)
        : magnetWidth / 2 + 16;
      const maxX = benchWidth - magnetWidth / 2 - 16;

      const newPos2 = Math.max(minX, Math.min(maxX, currentX - dragOffsetRef.current));
      setPos2(newPos2);
    }
  };

  const handlePointerUp = () => {
    setDraggingMagnet(null);
  };

  // Separate magnets if stuck together
  const handleSeparateMagnets = () => {
    setIsSnapped(false);
    setPos1(benchWidth * 0.28);
    setPos2(benchWidth * 0.72);
  };

  // Reset positions to default center
  const handleResetPositions = () => {
    setIsSnapped(false);
    setPos1(benchWidth * 0.3);
    setPos2(benchWidth * 0.7);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Concept Title */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Laboratório Prático de Interação
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              Ímãs: Atração e Repulsão em Movimento
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              <strong>Arraste qualquer um dos ímãs com o mouse</strong>. Observe como o outro ímã reage
              imediatamente como consequência da força magnética (sendo empurrado na repulsão ou puxado na atração).
            </p>
          </div>

          {/* Dynamic Status Pill */}
          <div
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border font-semibold text-sm transition-all ${
              isAttraction
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                : 'bg-rose-50 text-rose-800 border-rose-300 shadow-xs'
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full ${
                isAttraction ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500 animate-pulse'
              }`}
            />
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Interação Mútua
              </div>
              <div className="text-base font-bold">
                {isAttraction ? 'ATRAÇÃO MAGNÉTICA' : 'REPULSÃO MAGNÉTICA'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Physics Bench Stage (Clean surface with NO induction lines) */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 relative overflow-hidden shadow-md">
        {/* The Laboratory Work Table / Track */}
        <div
          ref={benchRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="relative w-full h-[280px] sm:h-[320px] select-none overflow-hidden touch-none"
          style={{
            background:
              'radial-gradient(ellipse at center, #1e293b 0%, #0f172a 65%, #020617 100%)',
          }}
        >
          {/* Subtle guide track / bench ruler line */}
          <div className="absolute top-1/2 left-8 right-8 h-1 -translate-y-1/2 bg-slate-700/60 rounded-full" />

          {/* Metric ruler ticks on the table bench */}
          <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 pointer-events-none flex justify-between">
            {Array.from({ length: 25 }).map((_, i) => (
              <div
                key={i}
                className={`w-px ${i % 5 === 0 ? 'h-5 -mt-2 bg-slate-500' : 'h-2 bg-slate-700'}`}
              />
            ))}
          </div>

          {/* Dynamic Interactive Drag Hint Banner */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700 text-[11px] text-slate-300 pointer-events-none shadow-sm">
            <MoveHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {draggingMagnet === 'mag1' && (
                <strong className="text-amber-300">
                  Movendo Ímã 1 com o mouse → Ímã 2 reagindo por {isAttraction ? 'atração' : 'repulsão'}!
                </strong>
              )}
              {draggingMagnet === 'mag2' && (
                <strong className="text-amber-300">
                  Movendo Ímã 2 com o mouse → Ímã 1 reagindo por {isAttraction ? 'atração' : 'repulsão'}!
                </strong>
              )}
              {!draggingMagnet && (
                <span>
                  <strong>Clique e arraste</strong> qualquer um dos ímãs com o mouse para ver a reação física do outro.
                </span>
              )}
            </span>
          </div>

          {/* MAGNET 1 (Left) */}
          <div
            onPointerDown={handlePointerDownMag1}
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 transition-shadow ${
              draggingMagnet === 'mag1' ? 'cursor-grabbing scale-102 z-30' : 'cursor-grab hover:scale-101'
            }`}
            style={{ left: `${pos1}px` }}
          >
            {/* Magnet Body */}
            <div
              className={`relative rounded-xl overflow-hidden shadow-2xl flex border-2 ${
                draggingMagnet === 'mag1'
                  ? 'border-amber-400 ring-4 ring-amber-400/20'
                  : 'border-slate-400/40'
              }`}
              style={{
                width: `${magnetWidth}px`,
                height: `${magnetHeight}px`,
              }}
            >
              {/* Left Pole */}
              <div
                className={`w-1/2 h-full flex flex-col items-center justify-center font-black text-xl text-white select-none transition-colors ${
                  mag1Reversed ? 'bg-red-600' : 'bg-blue-600'
                }`}
              >
                <span>{mag1Reversed ? 'N' : 'S'}</span>
                <span className="text-[9px] uppercase tracking-tighter opacity-80 font-normal">
                  {mag1Reversed ? 'Norte' : 'Sul'}
                </span>
              </div>
              {/* Right Pole */}
              <div
                className={`w-1/2 h-full flex flex-col items-center justify-center font-black text-xl text-white select-none transition-colors ${
                  mag1Reversed ? 'bg-blue-600' : 'bg-red-600'
                }`}
              >
                <span>{mag1Reversed ? 'S' : 'N'}</span>
                <span className="text-[9px] uppercase tracking-tighter opacity-80 font-normal">
                  {mag1Reversed ? 'Sul' : 'Norte'}
                </span>
              </div>

              {/* Metallic gloss */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/25 pointer-events-none" />

              {/* Drag Handle Tab */}
              <div className="absolute top-1 left-2 bg-slate-900/80 text-slate-300 text-[9px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-1 pointer-events-none">
                <MoveHorizontal className="w-2.5 h-2.5 text-amber-400" />
                <span>Ímã 1</span>
              </div>
            </div>

            {/* Dynamic Force Vector Arrow F1 */}
            <div className="h-8 flex items-center justify-center mt-1.5 pointer-events-none">
              <div
                className={`flex items-center transition-all ${
                  isAttraction ? 'text-emerald-400' : 'text-rose-400'
                }`}
                style={{
                  transform: isAttraction ? 'translateX(6px)' : 'translateX(-6px)',
                }}
              >
                {isRepulsion && <span className="text-base font-bold mr-1">◀</span>}
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    isAttraction ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                  style={{ width: `${Math.max(14, forceScale * 0.45)}px` }}
                />
                {isAttraction && <span className="text-base font-bold ml-1">▶</span>}
                <span className="text-[11px] font-mono font-bold ml-1.5">F₁</span>
              </div>
            </div>
          </div>

          {/* MAGNET 2 (Right) */}
          <div
            onPointerDown={handlePointerDownMag2}
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 transition-shadow ${
              draggingMagnet === 'mag2' ? 'cursor-grabbing scale-102 z-30' : 'cursor-grab hover:scale-101'
            }`}
            style={{ left: `${pos2}px` }}
          >
            {/* Magnet Body */}
            <div
              className={`relative rounded-xl overflow-hidden shadow-2xl flex border-2 ${
                draggingMagnet === 'mag2'
                  ? 'border-amber-400 ring-4 ring-amber-400/20'
                  : 'border-slate-400/40'
              }`}
              style={{
                width: `${magnetWidth}px`,
                height: `${magnetHeight}px`,
              }}
            >
              {/* Left Pole */}
              <div
                className={`w-1/2 h-full flex flex-col items-center justify-center font-black text-xl text-white select-none transition-colors ${
                  mag2Reversed ? 'bg-red-600' : 'bg-blue-600'
                }`}
              >
                <span>{mag2Reversed ? 'N' : 'S'}</span>
                <span className="text-[9px] uppercase tracking-tighter opacity-80 font-normal">
                  {mag2Reversed ? 'Norte' : 'Sul'}
                </span>
              </div>
              {/* Right Pole */}
              <div
                className={`w-1/2 h-full flex flex-col items-center justify-center font-black text-xl text-white select-none transition-colors ${
                  mag2Reversed ? 'bg-blue-600' : 'bg-red-600'
                }`}
              >
                <span>{mag2Reversed ? 'S' : 'N'}</span>
                <span className="text-[9px] uppercase tracking-tighter opacity-80 font-normal">
                  {mag2Reversed ? 'Sul' : 'Norte'}
                </span>
              </div>

              {/* Metallic gloss */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/25 pointer-events-none" />

              {/* Drag Handle Tab */}
              <div className="absolute top-1 right-2 bg-slate-900/80 text-slate-300 text-[9px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-1 pointer-events-none">
                <MoveHorizontal className="w-2.5 h-2.5 text-amber-400" />
                <span>Ímã 2</span>
              </div>
            </div>

            {/* Dynamic Force Vector Arrow F2 */}
            <div className="h-8 flex items-center justify-center mt-1.5 pointer-events-none">
              <div
                className={`flex items-center transition-all ${
                  isAttraction ? 'text-emerald-400' : 'text-rose-400'
                }`}
                style={{
                  transform: isAttraction ? 'translateX(-6px)' : 'translateX(6px)',
                }}
              >
                {isAttraction && <span className="text-base font-bold mr-1">◀</span>}
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    isAttraction ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                  style={{ width: `${Math.max(14, forceScale * 0.45)}px` }}
                />
                {isRepulsion && <span className="text-base font-bold ml-1">▶</span>}
                <span className="text-[11px] font-mono font-bold ml-1.5">F₂</span>
              </div>
            </div>
          </div>

          {/* Contact Snapped Notification */}
          {isSnapped && isAttraction && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-emerald-500/90 text-slate-950 font-bold text-xs px-3.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce">
              <span>🧲 Ímãs Unidos por Atração! Arraste um para puxar o outro.</span>
            </div>
          )}
        </div>

        {/* Bottom Interactive Toolbar */}
        <div className="p-3.5 sm:px-6 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Polarity inversion buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setMag2Reversed(!mag2Reversed)}
              className="flex items-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Virar Ímã 2 (Inverter Polos N ↔ S)</span>
            </button>

            <button
              onClick={() => setMag1Reversed(!mag1Reversed)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-all border border-slate-700 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Inverter Ímã 1</span>
            </button>
          </div>

          {/* Auxiliary actions */}
          <div className="flex items-center gap-2">
            {isSnapped && (
              <button
                onClick={handleSeparateMagnets}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <span>Desgrudar Ímãs</span>
              </button>
            )}

            <button
              onClick={handleResetPositions}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded-lg border border-slate-700 transition-colors cursor-pointer"
              title="Voltar ímãs para posições iniciais"
            >
              <ResetIcon className="w-3.5 h-3.5" />
              <span>Centralizar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
