interface Props {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

export default function Toggle({ checked, onChange, disabled }: Props) {
  return (
    <label className="hw-toggle" style={{ opacity: disabled ? 0.4 : 1 }}>
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} />
      <span className="hw-toggle-slider" />
    </label>
  );
}
