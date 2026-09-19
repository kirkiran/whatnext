import { HTMLAttributes } from "react";

export type SurfaceVariant =
  | "default"
  | "subtle"
  | "brand-subtle"
  | "elevated"
  | "recommendation";

export type SurfaceProps = HTMLAttributes<HTMLDivElement> & {
  variant?: SurfaceVariant;
};

const variantClassNames: Record<SurfaceVariant, string> = {
  default: "border-line bg-surface-primary",
  subtle: "border-line-subtle bg-surface-secondary",
  "brand-subtle": "border-line-brand bg-surface-brand-subtle",
  elevated: "border-line bg-surface-elevated shadow-1",
  recommendation:
    "border-line-brand bg-surface-recommendation shadow-1",
};

export function Surface({
  children,
  className = "",
  variant = "default",
  ...props
}: SurfaceProps) {
  return (
    <div
      className={`rounded-card border ${variantClassNames[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
