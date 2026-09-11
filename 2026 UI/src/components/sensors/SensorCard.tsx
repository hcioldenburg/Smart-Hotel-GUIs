/**
 * Generic sensor card — shows a circular icon container with a status label.
 * Active state uses teal; inactive uses neutral gray.
 */
interface Props {
  label: string;
  sublabel?: string;
  status: 'active' | 'inactive' | 'loading';
  statusText: string;
  icon: React.ReactNode;
}

export default function SensorCard({ label, sublabel, status, statusText, icon }: Props) {
  const isActive = status === 'active';

  return (
    <div
      className="flex flex-col items-center gap-3 p-4 rounded-2xl select-none"
      style={{ background: '#FFFFFF', border: '1px solid #F0EBE1', minWidth: 120 }}
    >
      <div
        className="flex items-center justify-center rounded-2xl"
        style={{
          width: 64,
          height: 64,
          background: isActive ? 'rgba(13,148,136,0.10)' : '#F5F2EC',
          border: isActive ? '1.5px solid rgba(13,148,136,0.25)' : '1.5px solid transparent',
          transition: 'background 0.25s, border 0.25s',
        }}
      >
        <div style={{ color: isActive ? '#0d9488' : '#9A9082' }}>{icon}</div>
      </div>

      <div className="text-center">
        <div
          style={{ fontSize: 13, fontWeight: 600, color: isActive ? '#0d9488' : '#25242A', lineHeight: 1.3 }}
        >
          {statusText}
        </div>
        <div style={{ fontSize: 11, color: '#9A9082', marginTop: 2 }}>{label}</div>
        {sublabel && <div style={{ fontSize: 10, color: '#B8B2A8', marginTop: 1 }}>{sublabel}</div>}
      </div>
    </div>
  );
}
