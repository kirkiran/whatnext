import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "destructive";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
  loadingLabel?: string;
  variant?: ButtonVariant;
};

const variantClassNames: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-action-primary text-content-inverse hover:bg-action-primary-hover active:bg-action-primary-pressed",
  secondary:
    "border-line bg-surface-primary text-content-primary hover:border-line-brand hover:bg-surface-brand-subtle active:bg-action-secondary-pressed",
  tertiary:
    "border-transparent bg-transparent text-content-secondary hover:bg-surface-secondary hover:text-content-primary active:bg-action-secondary-pressed",
  destructive:
    "border-status-danger-border bg-transparent text-status-danger-text hover:bg-status-danger-surface active:bg-status-danger-border",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      "aria-label": ariaLabel,
      children,
      className = "",
      disabled,
      isLoading = false,
      loadingLabel = "Loading",
      type = "button",
      variant = "secondary",
      ...props
    },
    ref,
  ) {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        {...props}
        type={type}
        className={`relative inline-flex min-h-control items-center justify-center rounded-control border px-ds-4 py-ds-2 text-label transition-colors duration-fast focus-visible:outline-none focus-visible:ring-system focus-visible:ring-focus focus-visible:ring-offset-system disabled:cursor-not-allowed disabled:opacity-disabled ${variantClassNames[variant]} ${className}`}
        disabled={isDisabled}
        aria-busy={isLoading || undefined}
        aria-label={isLoading ? loadingLabel : ariaLabel}
      >
        <span
          aria-hidden={isLoading || undefined}
          className={`inline-flex items-center justify-center gap-ds-2 ${isLoading ? "invisible" : ""}`}
        >
          {children}
        </span>
        {isLoading ? (
          <>
            <LoadingIndicator />
            <span className="sr-only" role="status">
              {loadingLabel}
            </span>
          </>
        ) : null}
      </button>
    );
  },
);

function LoadingIndicator(): ReactNode {
  return (
    <span
      aria-hidden="true"
      className="absolute size-icon-compact animate-spin rounded-badge border-2 border-current border-r-transparent motion-reduce:animate-none"
    />
  );
}
