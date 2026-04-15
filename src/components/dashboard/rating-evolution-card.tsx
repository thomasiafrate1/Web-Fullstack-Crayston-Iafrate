"use client";

import { useEffect, useMemo, useState } from "react";

const MONTHS = ["Oct", "Nov", "Dec", "Jan", "Fev", "Mar"] as const;
const MIN_RATING = 3.6;
const MAX_RATING = 5;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const nextSeries = (previous: number[]) =>
  previous.map((value, index) => {
    const variance = index === previous.length - 1 ? 0.26 : 0.2;
    const next = value + (Math.random() - 0.5) * variance;
    return Number(clamp(next, MIN_RATING, MAX_RATING).toFixed(2));
  });

const getY = (rating: number) => {
  const ratio = (MAX_RATING - rating) / (MAX_RATING - MIN_RATING);
  return 18 + ratio * 138;
};

export function RatingEvolutionCard() {
  const [series, setSeries] = useState<number[]>([4.32, 4.38, 4.44, 4.49, 4.55, 4.62]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSeries((previous) => nextSeries(previous));
    }, 3000);

    return () => window.clearInterval(interval);
  }, []);

  const points = useMemo(
    () =>
      series.map((rating, index) => {
        const x = 20 + index * 112;
        const y = getY(rating);
        return { rating, x, y };
      }),
    [series],
  );

  const linePath = useMemo(() => {
    return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  }, [points]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return "";
    const first = points[0];
    const last = points[points.length - 1];
    return `${linePath} L ${last.x} 172 L ${first.x} 172 Z`;
  }, [linePath, points]);

  const current = series[series.length - 1] ?? 0;

  return (
    <article className="rf-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="rf-section-title">Evolution de la note moyenne</h2>
        <span className="rf-badge rf-badge-success">{current.toFixed(2)} /5</span>
      </div>

      <div className="rf-graph-box mt-4">
        <svg viewBox="0 0 600 180" className="h-[230px] w-full" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="rating-line" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#8c52ff" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#b8a0ff" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="rating-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#8c52ff" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#8c52ff" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          <path d={areaPath} fill="url(#rating-area)" />
          <path d={linePath} fill="none" stroke="url(#rating-line)" strokeWidth="3.5" strokeLinecap="round" />

          {points.map((point, index) => (
            <circle key={`${MONTHS[index]}-${point.rating}`} cx={point.x} cy={point.y} r="4.8" fill="#ae92ff" />
          ))}
        </svg>

        <div className="absolute inset-x-0 bottom-4 grid grid-cols-6 px-5">
          {MONTHS.map((month, index) => (
            <span key={month} className="text-center text-xs text-[var(--rf-text-muted)]">
              {month}
              <span className="mt-1 block text-[11px] text-[#d6c8ff]">{series[index]?.toFixed(2)}</span>
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
