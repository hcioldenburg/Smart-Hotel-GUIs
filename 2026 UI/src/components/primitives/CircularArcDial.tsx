/**
 * A 270-degree arc dial used for lights and the heater.
 * The arc starts at ~135° (bottom-left) and sweeps clockwise 270° (bottom-right).
 */
interface Props {
  /** 0–100 percent fill */
  value: number;
  /** Whether the device is on (amber arc) or off (dim arc) */
  on: boolean;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}

export default function CircularArcDial({ value, on, size = 100, strokeWidth = 7, children }: Props) {
  const r = (size - strokeWidth * 2) / 2;
  const cx = size / 2;
  const cy = size / 2;

  // 270° sweep: from 135° to 45° (going clockwise, so sweep = 270)
  const totalDeg = 270;
  const circumference = 2 * Math.PI * r;
  const arcLength = (totalDeg / 360) * circumference;

  // Amount of arc filled
  const fillLength = (value / 100) * arcLength;
  const emptyLength = arcLength - fillLength;

  // strokeDasharray: [fill, empty, gap for the open part]
  // We use the trick: full circumference dash, then offset it
  const dashArray = `${arcLength} ${circumference - arcLength}`;
  const fillDashArray = `${fillLength} ${emptyLength + (circumference - arcLength)}`;

  // Rotate so the arc starts at bottom-left (135°)
  const rotateTransform = `rotate(135, ${cx}, ${cy})`;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      {/* Track */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="#E8E3D9"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={dashArray}
        transform={rotateTransform}
      />
      {/* Fill */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={on ? '#E0992F' : '#C8C2B6'}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={fillDashArray}
        transform={rotateTransform}
        style={{ transition: 'stroke-dasharray 0.35s ease, stroke 0.25s ease' }}
      />
      {/* Glow dot at tip when on */}
      {on && value > 0 && (() => {
        const tipAngleDeg = 135 + (value / 100) * 270;
        const tipAngleRad = (tipAngleDeg * Math.PI) / 180;
        const tx = cx + r * Math.cos(tipAngleRad);
        const ty = cy + r * Math.sin(tipAngleRad);
        return (
          <circle
            cx={tx} cy={ty} r={strokeWidth / 2 + 1.5}
            fill="#E0992F"
            style={{ filter: 'drop-shadow(0 0 4px rgba(224,153,47,0.7))' }}
          />
        );
      })()}
      {/* Center content */}
      {children && (
        <foreignObject x={cx - 24} y={cy - 24} width={48} height={48}>
          <div
            style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {children}
          </div>
        </foreignObject>
      )}
    </svg>
  );
}
