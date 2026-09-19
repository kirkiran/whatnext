import { HTMLAttributes } from "react";

export type BadgeVariant =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "info";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variantClassNames: Record<BadgeVariant, string> = {
  neutral: "border-line bg-surface-secondary text-content-secondary",
  brand: "border-line-brand bg-surface-brand-subtle text-content-brand",
  success:
    "border-status-success-border bg-status-success-surface text-status-success-text",
  warning:
    "border-status-warning-border bg-status-warning-surface text-status-warning-text",
  danger:
    "border-status-danger-border bg-status-danger-surface text-status-danger-text",
  info: "border-status-info-border bg-status-info-surface text-status-info-text",
};

export function Badge({
  children,
  className = "",
  variant = "neutral",
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-badge border px-ds-2 py-ds-1 text-metadata ${variantClassNames[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
