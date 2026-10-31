import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "quiet" | "text";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

const CLASS: Record<Variant, string> = {
  primary: "btn-primary",
  quiet: "btn-quiet",
  text: "btn-text",
};

export function Button({ variant = "primary", className, children, ...rest }: Props) {
  return (
    <button className={[CLASS[variant], className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </button>
  );
}
