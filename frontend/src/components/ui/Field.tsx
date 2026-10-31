import type { InputHTMLAttributes, ReactNode } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  full?: boolean;
}

export function Field({ label, full, id, className, ...rest }: FieldProps) {
  const fieldId = id ?? rest.name ?? label;
  return (
    <div className={["field", full ? "full" : "", className].filter(Boolean).join(" ")}>
      <label htmlFor={fieldId}>{label}</label>
      <input id={fieldId} {...rest} />
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  full?: boolean;
  id?: string;
}

export function SelectField({ label, value, onChange, children, full, id }: SelectFieldProps) {
  const fieldId = id ?? label;
  return (
    <div className={["field", full ? "full" : ""].filter(Boolean).join(" ")}>
      <label htmlFor={fieldId}>{label}</label>
      <select id={fieldId} value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
    </div>
  );
}
