import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Globe,
  Compass as CompassIcon,
  Layers,
  Info,
  Shield,
  Sun,
  Eye,
  RotateCw,
} from 'lucide-react';
import { Compass } from './Compass';

interface FieldLineLoop {
  d: string;
  arrows: Array<{ x: number; y: number; angleDeg: number }>;
}

export const EarthMagnetismTab: React.FC = () => {
  // Visual layer toggles
  const [showInternalMagnet, setShowInternalMagnet] = useState(true);
  const [showFieldLines, setShowFieldLines] = useState(true);
  const [showGeographicAxis, setShowGeographicAxis] = useState(true);
  const [showMagneticAxis, setShowMagneticAxis] = useState(true);
  const [showSolarWind, setShowSolarWind] = useState(false);

  // Earth tilt parameters (in degrees)
  // Geographic axis tilt ~ 23.4° from orbital vertical, but we can display it tilted ~15° on screen for clear visualization
  const geoAxisAngleDeg = -12; // tilt slightly counter-clockwise
  // Magnetic axis is tilted about 11.5° relative to geographic axis
  const magDeclinationAngleDeg = 11.5;
  const magAxisAngleDeg = geoAxisAngleDeg + magDeclinationAngleDeg; // approx -0.5°

  // User interactive compass position in polar coordinates around Earth center
  // r is distance from earth center, theta is angle from vertical
  const [compassAngle, setCompassAngle] = useState(38); // degrees
  const [compassRadius, setCompassRadius] = useState(195); // pixels from center

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [stageSize, setStageSize] = useState({ width: 780, height: 500 });
  const earthCenter = { x: stageSize.width / 2, y: stageSize.height / 2 };
  const earthRadius = 120;

  // Track dragging of the orbital compass
  const [isDraggingCompass, setIsDraggingCompass] = useState(false);

  // Update stage size responsively
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const w = Math.min(960, Math.max(340, Math.floor(rect.width)));
        const h = Math.min(540, Math.max(420, Math.floor(w * 0.62)));
        setStageSize({ width: w, height: h });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Compute needle orientation at any point around Earth
  // Earth's magnetic dipole has:
  // - South Magnetic Pole in the Arctic (top): attracted to compass North needle (red tip)
  // - North Magnetic Pole in the Antarctic (bottom): attracted to compass South needle (blue tip)
  // Field lines exit from magnetic North (Antarctic region) and enter into magnetic South (Arctic region)
  const getEarthFieldAngle = (x: number, y: number) => {
    // Dipole tilt angle in radians
    const thetaRad = (magAxisAngleDeg * Math.PI) / 180;
    const poleDist = earthRadius * 0.7;

    // South Magnetic Pole (top, Arctic region):
    const smpX = earthCenter.x + poleDist * Math.sin(thetaRad);
    const smpY = earthCenter.y - poleDist * Math.cos(thetaRad);

    // North Magnetic Pole (bottom, Antarctic region):
    const nmpX = earthCenter.x - poleDist * Math.sin(thetaRad);
    const nmpY = earthCenter.y + poleDist * Math.cos(thetaRad);

    // Magnetic field vector from dipole poles
    const rNx = x - nmpX;
    const rNy = y - nmpY;
    const dN = Math.hypot(rNx, rNy);
    const dN3 = Math.max(10, Math.pow(dN, 3));

    const rSx = x - smpX;
    const rSy = y - smpY;
    const dS = Math.hypot(rSx, rSy);
    const dS3 = Math.max(10, Math.pow(dS, 3));

    // Field B from magnetic dipole:
    // Emerging from North pole (+), entering into South pole (-)
    const bx = 1e5 * (rNx / dN3 - rSx / dS3);
    const by = 1e5 * (rNy / dN3 - rSy / dS3);

    // Needle compass angle in SVG coordinates:
    // In Compass.tsx, 0° is red North needle pointing along -Y (UP).
    // Vector (0, -1) has atan2 = -90°. Adding +90° maps to 0° (pointing UP).
    return (Math.atan2(by, bx) * 180) / Math.PI + 90;
  };

  // High quality dipole induction lines with arrowheads located precisely on the curve
  const earthFieldLines = useMemo(() => {
    const lines: FieldLineLoop[] = [];
    const poleDist = earthRadius * 0.7;
    const scales = [1.32, 1.65, 2.05, 2.55, 3.2, 4.0];

    // Symmetrical loops on both sides
    scales.forEach((scale) => {
      const R0 = earthRadius * scale;
      const sinTheta0 = Math.min(0.98, Math.sqrt(poleDist / R0));
      const theta0 = Math.asin(sinTheta0);

      // We trace from Antarctic (bottom, theta = PI - theta0) to Arctic (top, theta = theta0)
      [1, -1].forEach((side) => {
        const points: Array<{ x: number; y: number }> = [];
        const numSamples = 54;

        for (let i = 0; i <= numSamples; i++) {
          const t = i / numSamples;
          // theta goes from (PI - theta0) down to theta0
          const theta = (Math.PI - theta0) * (1 - t) + theta0 * t;
          const r = R0 * Math.sin(theta) * Math.sin(theta);
          const px = side * r * Math.sin(theta);
          const py = -r * Math.cos(theta);
          points.push({
            x: earthCenter.x + px,
            y: earthCenter.y + py,
          });
        }

        // SVG path string
        const d = `M ${points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`;

        // Place arrows directly on the curve with exact tangent angles
        const arrowIndices = scale > 2.0 ? [14, 27, 40] : [27];
        const arrows: Array<{ x: number; y: number; angleDeg: number }> = [];

        arrowIndices.forEach((idx) => {
          if (idx > 0 && idx < points.length - 1) {
            const p = points[idx];
            const pPrev = points[idx - 1];
            const pNext = points[idx + 1];
            // Tangent direction along +B (flowing from Antarctic to Arctic)
            const angleDeg = (Math.atan2(pNext.y - pPrev.y, pNext.x - pPrev.x) * 180) / Math.PI + 90;
            arrows.push({ x: p.x, y: p.y, angleDeg });
          }
        });

        lines.push({ d, arrows });
      });
    });

    // Axial polar field lines (collinear through the poles)
    // 1. South/Antarctic outbound line (bottom):
    const southAxialPoints = [
      { x: earthCenter.x, y: earthCenter.y + poleDist },
      { x: earthCenter.x, y: earthCenter.y + earthRadius * 2.8 },
    ];
    lines.push({
      d: `M ${southAxialPoints[0].x.toFixed(1)},${southAxialPoints[0].y.toFixed(1)} L ${southAxialPoints[1].x.toFixed(1)},${southAxialPoints[1].y.toFixed(1)}`,
      arrows: [{ x: earthCenter.x, y: earthCenter.y + earthRadius * 1.55, angleDeg: 180 }],
    });

    // 2. North/Arctic inbound line (top):
    const northAxialPoints = [
      { x: earthCenter.x, y: earthCenter.y - earthRadius * 2.8 },
      { x: earthCenter.x, y: earthCenter.y - poleDist },
    ];
    lines.push({
      d: `M ${northAxialPoints[0].x.toFixed(1)},${northAxialPoints[0].y.toFixed(1)} L ${northAxialPoints[1].x.toFixed(1)},${northAxialPoints[1].y.toFixed(1)}`,
      arrows: [{ x: earthCenter.x, y: earthCenter.y - earthRadius * 1.55, angleDeg: 180 }],
    });

    return lines;
  }, [earthCenter.x, earthCenter.y, earthRadius]);

  // Compute current compass (x, y) in canvas coordinates
  const compassRad = ((compassAngle - 90) * Math.PI) / 180;
  const compassX = earthCenter.x + compassRadius * Math.cos(compassRad);
  const compassY = earthCenter.y + compassRadius * Math.sin(compassRad);
  const compassNeedleAngle = getEarthFieldAngle(compassX, compassY);

  // Mouse & touch drag handlers for compass
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Check if clicked near current compass
    if (Math.hypot(clickX - compassX, clickY - compassY) < 45) {
      setIsDraggingCompass(true);
      return;
    }

    // Otherwise click moves compass to this position!
    const dx = clickX - earthCenter.x;
    const dy = clickY - earthCenter.y;
    const dist = Math.hypot(dx, dy);
    if (dist > earthRadius * 0.75) {
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      setCompassAngle(angle);
      setCompassRadius(Math.max(earthRadius + 35, Math.min(240, dist)));
      setIsDraggingCompass(true);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingCompass) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const dx = currentX - earthCenter.x;
    const dy = currentY - earthCenter.y;
    const dist = Math.hypot(dx, dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;

    setCompassAngle(angle);
    setCompassRadius(Math.max(earthRadius + 30, Math.min(235, dist)));
  };

  const handlePointerUp = () => {
    setIsDraggingCompass(false);
  };

  return (
    <div className="space-y-6">
      {/* Concept Introduction Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              O Campo Magnético do Planeta
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              Magnetismo Terrestre
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              A Terra comporta-se como um imenso ímã dipolo. No{' '}
              <strong className="text-rose-700 font-semibold">Polo Norte Geográfico</strong> encontra-se,
              fisicamente, um{' '}
              <strong className="text-blue-700 font-semibold">Polo Sul Magnético</strong>, que atrai o
              polo norte da agulha de qualquer bússola!
            </p>
          </div>

          {/* Quick Info Pill */}
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-900 px-4 py-2.5 rounded-xl text-xs font-medium">
            <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <span className="font-bold">Declinação Magnética:</span>
              <span className="ml-1 text-indigo-800">
                O eixo magnético é inclinado ~11,5° em relação ao eixo geográfico de rotação.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Globe & Magnetism Stage */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 relative overflow-hidden shadow-md">
        {/* Top Control Bar */}
        <div className="p-3 sm:px-6 bg-slate-900/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            <label className="flex items-center gap-2 text-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showInternalMagnet}
                onChange={(e) => setShowInternalMagnet(e.target.checked)}
                className="w-4 h-4 rounded-sm accent-indigo-500 cursor-pointer"
              />
              <span className="font-medium">Ímã Fictício no Núcleo</span>
            </label>

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
                checked={showGeographicAxis}
                onChange={(e) => setShowGeographicAxis(e.target.checked)}
                className="w-4 h-4 rounded-sm accent-amber-500 cursor-pointer"
              />
              <span>Eixo Geográfico (PNG / PSG)</span>
            </label>

            <label className="flex items-center gap-2 text-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showMagneticAxis}
                onChange={(e) => setShowMagneticAxis(e.target.checked)}
                className="w-4 h-4 rounded-sm accent-cyan-400 cursor-pointer"
              />
              <span>Eixo Magnético (PSM / PNM)</span>
            </label>
          </div>

          <button
            onClick={() => setShowSolarWind(!showSolarWind)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              showSolarWind
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Magnetosfera & Vento Solar</span>
          </button>
        </div>

        {/* Viewport SVG Stage */}
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative w-full overflow-hidden select-none cursor-pointer touch-none"
          style={{ height: `${stageSize.height}px` }}
        >
          <svg
            width={stageSize.width}
            height={stageSize.height}
            className="absolute inset-0 pointer-events-none"
          >
            <defs>
              {/* Radial gradient for Earth sphere */}
              <radialGradient id="earthGrad" cx="35%" cy="35%" r="70%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="45%" stopColor="#0284c7" />
                <stop offset="85%" stopColor="#0369a1" />
                <stop offset="100%" stopColor="#0c4a6e" />
              </radialGradient>

              {/* Atmosphere glow */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              {/* Solar wind stream */}
              <linearGradient id="solarWindGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                <stop offset="60%" stopColor="#fbbf24" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Solar Wind particle streams on left */}
            {showSolarWind && (
              <g className="animate-pulse">
                {[-140, -100, -60, -20, 20, 60, 100, 140].map((yOff) => (
                  <path
                    key={yOff}
                    d={`M 10 ${earthCenter.y + yOff} Q ${earthCenter.x - 210} ${
                      earthCenter.y + yOff * 1.5
                    } ${earthCenter.x - 170} ${earthCenter.y + yOff * 2}`}
                    fill="none"
                    stroke="url(#solarWindGrad)"
                    strokeWidth="2.5"
                    strokeDasharray="4,6"
                  />
                ))}
                {/* Sun icon on left */}
                <circle cx={40} cy={earthCenter.y} r={28} fill="#f59e0b" opacity={0.8} />
                <text
                  x={40}
                  y={earthCenter.y + 42}
                  textAnchor="middle"
                  fill="#fcd34d"
                  fontSize="10"
                  fontWeight="bold"
                >
                  Vento Solar
                </text>
              </g>
            )}

            {/* Earth Field Lines (Linhas de Indução Terrestres) */}
            {showFieldLines && (
              <g opacity={0.82}>
                {/* Rotated by magnetic axis angle */}
                <g transform={`rotate(${magAxisAngleDeg}, ${earthCenter.x}, ${earthCenter.y})`}>
                  {earthFieldLines.map((line, li) => (
                    <g key={li}>
                      {/* Smooth Induction Line */}
                      <path
                        d={line.d}
                        fill="none"
                        stroke="#818cf8"
                        strokeWidth={1.5}
                      />
                      {/* Directional Chevron Arrows Sitting Exactly on the Line */}
                      {line.arrows.map((arr, ai) => (
                        <g
                          key={ai}
                          transform={`translate(${arr.x}, ${arr.y}) rotate(${arr.angleDeg})`}
                        >
                          <path
                            d="M -4 3 L 0 -5 L 4 3 L 0 1 Z"
                            fill="#c7d2fe"
                            stroke="#312e81"
                            strokeWidth={0.75}
                          />
                        </g>
                      ))}
                    </g>
                  ))}
                </g>
              </g>
            )}

            {/* Earth Atmosphere Glow */}
            <circle
              cx={earthCenter.x}
              cy={earthCenter.y}
              r={earthRadius + 6}
              fill="#38bdf8"
              opacity={0.2}
              filter="url(#glow)"
            />

            {/* Earth Main Sphere */}
            <circle
              cx={earthCenter.x}
              cy={earthCenter.y}
              r={earthRadius}
              fill="url(#earthGrad)"
              stroke="#0284c7"
              strokeWidth={1.5}
            />

            {/* Stylized Continents on Earth Globe (tilted with geographic axis) */}
            <g transform={`rotate(${geoAxisAngleDeg}, ${earthCenter.x}, ${earthCenter.y})`}>
              {/* Latitude parallels */}
              <ellipse
                cx={earthCenter.x}
                cy={earthCenter.y}
                rx={earthRadius}
                ry={earthRadius * 0.28}
                fill="none"
                stroke="#38bdf8"
                strokeWidth={0.8}
                strokeDasharray="3,3"
                opacity={0.4}
              />
              <ellipse
                cx={earthCenter.x}
                cy={earthCenter.y - 50}
                rx={earthRadius * 0.9}
                ry={earthRadius * 0.2}
                fill="none"
                stroke="#38bdf8"
                strokeWidth={0.6}
                strokeDasharray="2,3"
                opacity={0.3}
              />
              <ellipse
                cx={earthCenter.x}
                cy={earthCenter.y + 50}
                rx={earthRadius * 0.9}
                ry={earthRadius * 0.2}
                fill="none"
                stroke="#38bdf8"
                strokeWidth={0.6}
                strokeDasharray="2,3"
                opacity={0.3}
              />

              {/* Equator label */}
              <text
                x={earthCenter.x + earthRadius - 28}
                y={earthCenter.y + 12}
                fill="#7dd3fc"
                fontSize="9"
                fontWeight="600"
                opacity={0.8}
              >
                Equador
              </text>

              {/* South America & Africa landmass silhouettes (stylized green/emerald) */}
              {/* South America */}
              <path
                d={`M ${earthCenter.x - 45} ${earthCenter.y - 12} Q ${earthCenter.x - 20} ${
                  earthCenter.y - 8
                } ${earthCenter.x - 25} ${earthCenter.y + 25} Q ${earthCenter.x - 40} ${
                  earthCenter.y + 65
                } ${earthCenter.x - 46} ${earthCenter.y + 80} Q ${earthCenter.x - 52} ${
                  earthCenter.y + 40
                } ${earthCenter.x - 60} ${earthCenter.y + 10} Z`}
                fill="#15803d"
                opacity={0.85}
              />
              {/* North America */}
              <path
                d={`M ${earthCenter.x - 65} ${earthCenter.y - 20} Q ${earthCenter.x - 30} ${
                  earthCenter.y - 35
                } ${earthCenter.x - 40} ${earthCenter.y - 75} Q ${earthCenter.x - 70} ${
                  earthCenter.y - 65
                } ${earthCenter.x - 80} ${earthCenter.y - 35} Z`}
                fill="#15803d"
                opacity={0.85}
              />
              {/* Africa */}
              <path
                d={`M ${earthCenter.x + 10} ${earthCenter.y - 20} Q ${earthCenter.x + 45} ${
                  earthCenter.y - 25
                } ${earthCenter.x + 50} ${earthCenter.y + 25} Q ${earthCenter.x + 30} ${
                  earthCenter.y + 60
                } ${earthCenter.x + 22} ${earthCenter.y + 20} Z`}
                fill="#15803d"
                opacity={0.85}
              />
              {/* Europe */}
              <path
                d={`M ${earthCenter.x + 15} ${earthCenter.y - 35} Q ${earthCenter.x + 40} ${
                  earthCenter.y - 45
                } ${earthCenter.x + 35} ${earthCenter.y - 70} Q ${earthCenter.x + 10} ${
                  earthCenter.y - 60
                } ${earthCenter.x + 8} ${earthCenter.y - 40} Z`}
                fill="#15803d"
                opacity={0.85}
              />
              {/* Antarctica ice cap */}
              <ellipse
                cx={earthCenter.x}
                cy={earthCenter.y + earthRadius - 8}
                rx={earthRadius * 0.45}
                ry={14}
                fill="#e0f2fe"
                opacity={0.9}
              />
            </g>

            {/* INTERNAL EQUIVALENT MAGNET (Ímã no Interior da Terra) */}
            {showInternalMagnet && (
              <g transform={`rotate(${magAxisAngleDeg}, ${earthCenter.x}, ${earthCenter.y})`}>
                {/* Outer halo */}
                <rect
                  x={earthCenter.x - 22}
                  y={earthCenter.y - earthRadius * 0.72}
                  width={44}
                  height={earthRadius * 1.44}
                  rx={8}
                  fill="#090d16"
                  stroke="#fbbf24"
                  strokeWidth={2}
                  opacity={0.95}
                />

                {/* Top Half of Magnet: POLO SUL MAGNÉTICO (Blue) */}
                <rect
                  x={earthCenter.x - 19}
                  y={earthCenter.y - earthRadius * 0.7}
                  width={38}
                  height={earthRadius * 0.68}
                  rx={6}
                  fill="#2563eb"
                />
                <text
                  x={earthCenter.x}
                  y={earthCenter.y - earthRadius * 0.38}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="18"
                  fontWeight="900"
                >
                  S
                </text>
                <text
                  x={earthCenter.x}
                  y={earthCenter.y - earthRadius * 0.22}
                  textAnchor="middle"
                  fill="#bfdbfe"
                  fontSize="8"
                  fontWeight="bold"
                >
                  SUL MAGNÉTICO
                </text>

                {/* Bottom Half of Magnet: POLO NORTE MAGNÉTICO (Red) */}
                <rect
                  x={earthCenter.x - 19}
                  y={earthCenter.y + 2}
                  width={38}
                  height={earthRadius * 0.68}
                  rx={6}
                  fill="#dc2626"
                />
                <text
                  x={earthCenter.x}
                  y={earthCenter.y + earthRadius * 0.38}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="18"
                  fontWeight="900"
                >
                  N
                </text>
                <text
                  x={earthCenter.x}
                  y={earthCenter.y + earthRadius * 0.52}
                  textAnchor="middle"
                  fill="#fecaca"
                  fontSize="8"
                  fontWeight="bold"
                >
                  NORTE MAGNÉTICO
                </text>

                {/* Divider line between poles */}
                <line
                  x1={earthCenter.x - 19}
                  y1={earthCenter.y}
                  x2={earthCenter.x + 19}
                  y2={earthCenter.y}
                  stroke="#ffffff"
                  strokeWidth={1.5}
                />
              </g>
            )}

            {/* EIXO GEOGRÁFICO (Eixo de Rotação Terrestre) */}
            {showGeographicAxis && (
              <g transform={`rotate(${geoAxisAngleDeg}, ${earthCenter.x}, ${earthCenter.y})`}>
                {/* Axis line */}
                <line
                  x1={earthCenter.x}
                  y1={earthCenter.y - earthRadius - 40}
                  x2={earthCenter.x}
                  y2={earthCenter.y + earthRadius + 40}
                  stroke="#fbbf24"
                  strokeWidth={2}
                  strokeDasharray="5,4"
                />
                {/* Top: Polo Norte Geográfico */}
                <circle
                  cx={earthCenter.x}
                  cy={earthCenter.y - earthRadius - 25}
                  r={5}
                  fill="#fbbf24"
                />
                <rect
                  x={earthCenter.x - 65}
                  y={earthCenter.y - earthRadius - 52}
                  width={130}
                  height={22}
                  rx={6}
                  fill="#1e293b"
                  stroke="#fbbf24"
                  strokeWidth={1}
                />
                <text
                  x={earthCenter.x}
                  y={earthCenter.y - earthRadius - 38}
                  textAnchor="middle"
                  fill="#fef08a"
                  fontSize="10"
                  fontWeight="bold"
                >
                  Polo Norte Geográfico (PNG)
                </text>

                {/* Bottom: Polo Sul Geográfico */}
                <circle
                  cx={earthCenter.x}
                  cy={earthCenter.y + earthRadius + 25}
                  r={5}
                  fill="#fbbf24"
                />
                <rect
                  x={earthCenter.x - 65}
                  y={earthCenter.y + earthRadius + 32}
                  width={130}
                  height={22}
                  rx={6}
                  fill="#1e293b"
                  stroke="#fbbf24"
                  strokeWidth={1}
                />
                <text
                  x={earthCenter.x}
                  y={earthCenter.y + earthRadius + 46}
                  textAnchor="middle"
                  fill="#fef08a"
                  fontSize="10"
                  fontWeight="bold"
                >
                  Polo Sul Geográfico (PSG)
                </text>
              </g>
            )}

            {/* EIXO MAGNÉTICO (Magnetic Axis) */}
            {showMagneticAxis && (
              <g transform={`rotate(${magAxisAngleDeg}, ${earthCenter.x}, ${earthCenter.y})`}>
                {/* Magnetic axis line */}
                <line
                  x1={earthCenter.x}
                  y1={earthCenter.y - earthRadius - 70}
                  x2={earthCenter.x}
                  y2={earthCenter.y + earthRadius + 70}
                  stroke="#38bdf8"
                  strokeWidth={1.8}
                />

                {/* Top: Polo Sul Magnético da Terra (PSM) */}
                <circle
                  cx={earthCenter.x}
                  cy={earthCenter.y - earthRadius - 58}
                  r={5}
                  fill="#38bdf8"
                />
                <rect
                  x={earthCenter.x - 70}
                  y={earthCenter.y - earthRadius - 88}
                  width={140}
                  height={22}
                  rx={6}
                  fill="#0369a1"
                  stroke="#38bdf8"
                  strokeWidth={1}
                />
                <text
                  x={earthCenter.x}
                  y={earthCenter.y - earthRadius - 74}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="10"
                  fontWeight="bold"
                >
                  Polo Sul Magnético (PSM)
                </text>

                {/* Bottom: Polo Norte Magnético da Terra (PNM) */}
                <circle
                  cx={earthCenter.x}
                  cy={earthCenter.y + earthRadius + 58}
                  r={5}
                  fill="#f87171"
                />
                <rect
                  x={earthCenter.x - 70}
                  y={earthCenter.y + earthRadius + 68}
                  width={140}
                  height={22}
                  rx={6}
                  fill="#b91c1c"
                  stroke="#f87171"
                  strokeWidth={1}
                />
                <text
                  x={earthCenter.x}
                  y={earthCenter.y + earthRadius + 82}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="10"
                  fontWeight="bold"
                >
                  Polo Norte Magnético (PNM)
                </text>
              </g>
            )}
          </svg>

          {/* Interactive Movable Compass in Earth Orbit */}
          <div
            className="absolute z-30 -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing hover:scale-105 transition-transform"
            style={{ left: `${compassX}px`, top: `${compassY}px` }}
          >
            <Compass
              angleDeg={compassNeedleAngle}
              size={72}
              label="Sua Bússola"
              className="drop-shadow-2xl"
            />
          </div>

          {/* Canvas Bottom Interactive Hint */}
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] text-slate-300 pointer-events-none bg-slate-900/80 backdrop-blur-xs px-3.5 py-1.5 rounded-lg border border-slate-800">
            <span className="flex items-center gap-1.5">
              <CompassIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                <strong>Arraste ou clique</strong> ao redor do planeta para mover a bússola e
                ver a agulha alinhar-se ao campo terrestre.
              </span>
            </span>
            <span className="hidden sm:inline text-amber-300 font-medium">
              Observe que a ponta vermelha (Norte da agulha) é atraída para o Hemisfério Norte!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
