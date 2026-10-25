interface ProgressBarProps {
  percent: number;
  height?: number;
  showText?: boolean;
  label?: string;
}

const getColor = (percent: number): string => {
  if (percent > 1) return '#a8071a';
  if (percent >= 0.8) return '#ff4d4f';
  if (percent >= 0.5) return '#fa8c16';
  return '#52c41a';
};

export default function ProgressBar({ percent, height = 8, showText = true, label }: ProgressBarProps) {
  const displayPercent = Math.max(percent, 0);
  const barWidth = Math.min(displayPercent * 100, 100);
  const color = getColor(percent);

  return (
    <div style={{ width: '100%' }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12, color: '#999' }}>
          <span>{label}</span>
          {showText && <span style={{ color: percent > 1 ? '#ff4d4f' : '#999' }}>{Math.round(percent * 100)}%</span>}
        </div>
      )}
      <div style={{
        width: '100%',
        height,
        background: '#f0f0f0',
        borderRadius: height / 2,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${barWidth}%`,
          height: '100%',
          background: color,
          borderRadius: height / 2,
          transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  );
}
