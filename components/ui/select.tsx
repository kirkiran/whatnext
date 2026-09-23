import { forwardRef, SelectHTMLAttributes } from "react";
import { controlClassName } from "@/components/ui/control-styles";

/**
 * Set aria-invalid when validation fails. The calling field pattern should
 * associate textual error content with the select through aria-describedby.
 */
export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { children, className = "", ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={`${controlClassName} pr-ds-10 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
});
