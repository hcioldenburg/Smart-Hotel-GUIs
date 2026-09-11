interface Props {
  on: boolean;
  icon: React.ReactNode;
  size?: number;
}

export default function ToggleTile({ on, icon, size = 72 }: Props) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 16, flexShrink: 0,
      background: on ? 'rgba(224,153,47,0.14)' : '#F2EDE4',
      border: on ? '1.5px solid rgba(224,153,47,0.35)' : '1.5px solid transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'background .2s, border .2s',
      color: on ? 'var(--c-amber)' : 'var(--c-quiet)',
    }}>
      {icon}
    </div>
  );
}
