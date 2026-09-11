/**
 * Small "updating" indicator shown while a device is awaiting state
 * confirmation after a command (see usePending). Reuses the global `spin`
 * keyframe from index.css.
 */
interface Props {
  /** Hide the text label and render just the spinner (tight spaces / bubbles). */
  compact?: boolean;
  label?: string;
  size?: number;
}

export default function ProcessingBadge({ compact = false, label = 'Updating', size = 12 }: Props) {
  const spinner = (
    <span
      style={{
        width: size, height: size, flexShrink: 0,
        borderRadius: '50%',
        border: `2px solid rgba(224,153,47,.28)`,
        borderTopColor: '#C08A2E',
        display: 'inline-block',
        animation: 'spin .7s linear infinite',
      }}
    />
  );

  if (compact) return spinner;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontSize: 12, fontWeight: 600, color: '#B8772A',
      background: '#FBEAC9', borderRadius: 999, padding: '3px 10px',
    }}>
      {spinner}
      {label}
    </span>
  );
}
