'use client';

import React from 'react';
import { SkillScore } from '@/types/recruiter';

interface SkillRadarCanvasProps {
  scores: SkillScore[];
  size?: number;
}

export const SkillRadarCanvas: React.FC<SkillRadarCanvasProps> = ({ scores, size = 260 }) => {
  const center = size / 2;
  const radius = size * 0.38;
  const totalAxes = scores.length;

  if (totalAxes === 0) return null;

  // Convert polar coordinates to Cartesian
  const getCoordinates = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / totalAxes - Math.PI / 2;
    const distance = (value / 100) * radius;
    const x = center + distance * Math.cos(angle);
    const y = center + distance * Math.sin(angle);
    return { x, y, angle };
  };

  // Generate grid webs (20%, 40%, 60%, 80%, 100%)
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Polygon points for candidate scores
  const scorePoints = scores
    .map((s, i) => {
      const { x, y } = getCoordinates(i, s.score);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="relative flex flex-col items-center justify-center p-2">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background Grid webs */}
        {gridLevels.map((level, levelIdx) => {
          const points = scores
            .map((_, i) => {
              const { x, y } = getCoordinates(i, level * 100);
              return `${x},${y}`;
            })
            .join(' ');
          return (
            <polygon
              key={`grid-${levelIdx}`}
              points={points}
              fill="none"
              stroke="#334155"
              strokeDasharray={levelIdx === gridLevels.length - 1 ? 'none' : '3,3'}
              strokeWidth={levelIdx === gridLevels.length - 1 ? '1.5' : '1'}
              className="opacity-40"
            />
          );
        })}

        {/* Axes lines */}
        {scores.map((_, i) => {
          const { x, y } = getCoordinates(i, 100);
          return (
            <line
              key={`axis-${i}`}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#334155"
              strokeWidth="1.5"
              className="opacity-60"
            />
          );
        })}

        {/* Filled polygon of actual scores */}
        <polygon
          points={scorePoints}
          fill="url(#radarGradient)"
          stroke="#06b6d4"
          strokeWidth="2.5"
          className="transition-all duration-500 ease-out"
        />

        {/* Gradient Definition */}
        <defs>
          <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Score Data points */}
        {scores.map((s, i) => {
          const { x, y } = getCoordinates(i, s.score);
          return (
            <circle
              key={`dot-${i}`}
              cx={x}
              cy={y}
              r="4"
              fill="#06b6d4"
              stroke="#090d16"
              strokeWidth="2"
              className="glow-cyan"
            />
          );
        })}

        {/* Labels around chart */}
        {scores.map((s, i) => {
          const { x, y, angle } = getCoordinates(i, 118);
          let textAnchor: 'start' | 'middle' | 'end' = 'middle';
          if (Math.cos(angle) > 0.3) textAnchor = 'start';
          if (Math.cos(angle) < -0.3) textAnchor = 'end';

          return (
            <text
              key={`label-${i}`}
              x={x}
              y={y + 4}
              textAnchor={textAnchor}
              fill="#94a3b8"
              fontSize="11"
              fontWeight="600"
              className="font-sans select-none"
            >
              {s.label} ({s.score}%)
            </text>
          );
        })}
      </svg>
    </div>
  );
};
