import type { QualitySample } from '../../types';

interface Props {
  samples: QualitySample[];
  metric: 'latencyMs' | 'stability';
  color: string;
  height?: number;
}

export function QualityChart({ samples, metric, color, height = 90 }: Props) {
  const width = 380;
  if (samples.length < 2) {
    return (
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
        <text x={width / 2} y={height / 2} fill="var(--text-2)" fontSize="11" textAnchor="middle">
          Not enough data
        </text>
      </svg>
    );
  }

  const values = samples.map((s) => s[metric]);
  const max = Math.max(...values, metric === 'stability' ? 100 : 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const step = width / (samples.length - 1);

  const points = values.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * (height - 10) - 5;
    return `${x},${y}`;
  });

  const areaPath = `M0,${height} L${points.join(' L')} L${width},${height} Z`;
  const linePath = `M${points.join(' L')}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
      <path d={areaPath} fill={color} opacity={0.12} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={2} />
    </svg>
  );
}
