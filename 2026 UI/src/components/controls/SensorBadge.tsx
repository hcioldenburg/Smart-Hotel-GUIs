interface Props {
  active: boolean;
  icon: React.ReactNode;
  size?: number;
}

export default function SensorBadge({ active, icon, size = 72 }: Props) {
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {/* Pulse ring */}
      {active && <div className="sense-pulse" />}
      {/* Badge */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        border: active ? '2px solid rgba(47,158,150,0.5)' : '2px solid #DDD8CE',
        background: active ? 'rgba(91,174,122,0.08)' : '#F5F2EC',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: active ? '#5BAE7A' : 'var(--c-quiet)',
        transition: 'border .25s, background .25s',
      }}>
        {icon}
      </div>
    </div>
  );
}
