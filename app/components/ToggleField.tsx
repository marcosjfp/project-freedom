import { useId } from 'react';

interface ToggleFieldProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}
export function ToggleField({
  label,
  description,
  checked,
  onChange,
}: ToggleFieldProps) {
  const id = useId();
  return (
    <label className="toggle-field">
      <span>
        <span className="toggle-label">{label}</span>
        <span id={id} className="toggle-description">
          {description}
        </span>
      </span>
      <input
        type="checkbox"
        aria-label={label}
        aria-describedby={id}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}
