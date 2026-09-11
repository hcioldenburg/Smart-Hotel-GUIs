/**
 * Vertical fill bar used for curtains and roller shutters.
 * value = 0 means closed (empty), 100 = fully open (full fill).
 */
interface Props {
  value: number;
  height?: number;
  width?: number;
}

export default function VerticalBar({ value, height = 60, width = 16 }: Props) {
  const fillPct = Math.min(100, Math.max(0, value));

  return (
    <div
      style={{
        width,
        height,
        background: '#EDE8DF',
        borderRadius: 6,
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: `${fillPct}%`,
          background: '#E0992F',
          borderRadius: 6,
          transition: 'height 0.35s ease',
        }}
      />
    </div>
  );
}
