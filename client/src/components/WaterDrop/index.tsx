interface WaterDropProps {
  remaining: number;
  total: number;
}

export default function WaterDrop({ remaining, total }: WaterDropProps) {
  const ratio = total > 0 ? remaining / total : 0;
  const isLow = remaining < total * 0.5;
  const isEmpty = remaining <= 0;

  return (
    <div>
      <div style={{ fontSize: 24, fontWeight: 'bold', color: remaining < 0 ? '#ff4d4f' : isEmpty ? '#d9d9d9' : isLow ? '#fa8c16' : '#1677ff' }}>
        ¥{remaining.toFixed(0)}
        <span style={{ fontSize: 14, color: '#999', fontWeight: 'normal' }}>
          {' '}/ ¥{total.toFixed(0)}
        </span>
      </div>
      <div style={{ marginTop: 4, fontSize: 12, color: remaining < 0 ? '#ff4d4f' : '#999' }}>
        {remaining < 0 ? '⚠️ 备用金已透支' : isEmpty ? '备用金已耗尽' : isLow ? '备用金不足 50%' : '安全储备中'}
      </div>
    </div>
  );
}
