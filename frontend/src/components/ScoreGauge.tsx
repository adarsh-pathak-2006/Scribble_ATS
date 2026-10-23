'use client';

import React from 'react';
import { Loader2, Award, AlertTriangle, XCircle } from 'lucide-react';

interface ScoreGaugeProps {
  score: number | null;
  size?: number;
  showDetails?: boolean;
}

export function ScoreGauge({ score, size = 120, showDetails = true }: ScoreGaugeProps) {
  const isCalculating = score === null;
  const validScore = score !== null ? Math.max(0, Math.min(100, score)) : 0;

  // SVG circular calculations
  const strokeWidth = size * 0.085;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (validScore / 100) * circumference;

  let color = '#06b6d4';
  let badgeClass = 'badge-indigo';
  let label = 'Calculating ATS...';
  let Icon = Loader2;

  if (!isCalculating) {
    if (validScore >= 80) {
      color = '#10b981';
      badgeClass = 'badge-emerald';
      label = 'ATS Ready (High Match)';
      Icon = Award;
    } else if (validScore >= 60) {
      color = '#f59e0b';
      badgeClass = 'badge-amber';
      label = 'Moderate Match (Needs Polish)';
      Icon = AlertTriangle;
    } else {
      color = '#f43f5e';
      badgeClass = 'badge-rose';
      label = 'Low ATS Score (< 80)';
      Icon = XCircle;
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
          />
          {/* Animated Value Ring */}
          {!isCalculating && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{
                transition: 'stroke-dashoffset 1s ease-in-out',
                filter: `drop-shadow(0 0 8px ${color}88)`,
              }}
            />
          )}
        </svg>

        {/* Center Label */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isCalculating ? (
            <Loader2
              size={size * 0.28}
              color="#06b6d4"
              style={{ animation: 'spin 1.5s linear infinite' }}
            />
          ) : (
            <>
              <span
                style={{
                  fontSize: `${size * 0.28}px`,
                  fontWeight: 800,
                  color: '#ffffff',
                  lineHeight: 1,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {validScore}
              </span>
              <span
                style={{
                  fontSize: `${size * 0.1}px`,
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  marginTop: '2px',
                }}
              >
                / 100
              </span>
            </>
          )}
        </div>
      </div>

      {showDetails && (
        <div className={`badge ${badgeClass}`} style={{ fontSize: '0.82rem' }}>
          <Icon size={14} className={isCalculating ? 'animate-spin' : ''} />
          <span>{label}</span>
        </div>
      )}
    </div>
  );
}
