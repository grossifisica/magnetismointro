import React from 'react';

interface CompassProps {
  angleDeg: number;
  size?: number;
  label?: string;
  showCardinals?: boolean;
  interactive?: boolean;
  className?: string;
}

export const Compass: React.FC<CompassProps> = ({
  angleDeg,
  size = 72,
  label,
  showCardinals = true,
  className = '',
}) => {
  const radius = size / 2;
  const needleLength = radius * 0.72;
  const needleWidth = Math.max(3, radius * 0.16);

  return (
    <div
      className={`inline-flex flex-col items-center select-none ${className}`}
      style={{ width: size }}
    >
      <div
        className="relative rounded-full shadow-md transition-shadow bg-slate-900 border border-slate-700/80"
        style={{ width: size, height: size }}
      >
        {/* Compass dial markings */}
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="absolute inset-0 pointer-events-none"
        >
          {/* Subtle outer ring */}
          <circle
            cx={radius}
            cy={radius}
            r={radius - 2}
            fill="#0f172a"
            stroke="#334155"
            strokeWidth="2"
          />
          <circle
            cx={radius}
            cy={radius}
            r={radius - 6}
            fill="none"
            stroke="#1e293b"
            strokeWidth="1"
            strokeDasharray="2,3"
          />

          {/* Degree ticks */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const isMajor = deg % 90 === 0;
            const r1 = radius - (isMajor ? 8 : 6);
            const r2 = radius - 3;
            const x1 = radius + r1 * Math.cos(rad);
            const y1 = radius + r1 * Math.sin(rad);
            const x2 = radius + r2 * Math.cos(rad);
            const y2 = radius + r2 * Math.sin(rad);
            return (
              <line
                key={deg}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isMajor ? '#94a3b8' : '#475569'}
                strokeWidth={isMajor ? 1.5 : 1}
              />
            );
          })}

          {/* Cardinal markers on dial */}
          {showCardinals && size >= 50 && (
            <>
              <text
                x={radius}
                y={radius - radius * 0.55}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#f87171"
                fontSize={Math.max(9, radius * 0.26)}
                fontWeight="700"
              >
                N
              </text>
              <text
                x={radius}
                y={radius + radius * 0.55}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#60a5fa"
                fontSize={Math.max(9, radius * 0.26)}
                fontWeight="700"
              >
                S
              </text>
              <text
                x={radius + radius * 0.55}
                y={radius}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#94a3b8"
                fontSize={Math.max(8, radius * 0.22)}
              >
                L
              </text>
              <text
                x={radius - radius * 0.55}
                y={radius}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#94a3b8"
                fontSize={Math.max(8, radius * 0.22)}
              >
                O
              </text>
            </>
          )}

          {/* Center pivot and rotating needle */}
          <g
            transform={`translate(${radius}, ${radius}) rotate(${angleDeg})`}
            style={{ transition: 'transform 0.1s ease-out' }}
          >
            {/* North needle tip (Red) */}
            <polygon
              points={`0,0 -${needleWidth},0 0,-${needleLength} ${needleWidth},0`}
              fill="#ef4444"
              stroke="#b91c1c"
              strokeWidth="0.5"
            />
            {/* North label inside needle */}
            {size >= 60 && (
              <text
                x="0"
                y={-needleLength * 0.45}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#ffffff"
                fontSize={Math.max(7, radius * 0.22)}
                fontWeight="800"
              >
                N
              </text>
            )}

            {/* South needle tip (Blue/Silver) */}
            <polygon
              points={`0,0 -${needleWidth},0 0,${needleLength} ${needleWidth},0`}
              fill="#3b82f6"
              stroke="#1d4ed8"
              strokeWidth="0.5"
            />
            {/* South label inside needle */}
            {size >= 60 && (
              <text
                x="0"
                y={needleLength * 0.45}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#ffffff"
                fontSize={Math.max(7, radius * 0.22)}
                fontWeight="800"
              >
                S
              </text>
            )}

            {/* Brass / Metallic center cap */}
            <circle cx="0" cy="0" r={Math.max(3, radius * 0.14)} fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
            <circle cx="0" cy="0" r={Math.max(1.5, radius * 0.07)} fill="#78350f" />
          </g>
        </svg>
      </div>
      {label && (
        <span className="mt-1 text-[11px] font-medium text-slate-300 text-center tracking-tight leading-tight">
          {label}
        </span>
      )}
    </div>
  );
};
