import { forwardRef, InputHTMLAttributes } from "react";
import { controlClassName } from "@/components/ui/control-styles";

/**
 * Set aria-invalid when validation fails. The calling field pattern should
 * associate textual error content with the input through aria-describedby.
 */
export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = "", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={`${controlClassName} placeholder:text-content-muted ${className}`}
      {...props}
    />
  );
});
