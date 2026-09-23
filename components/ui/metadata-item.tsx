import { HTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type MetadataItemProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  icon?: LucideIcon;
  iconSize?: "compact" | "standard";
};

export function MetadataItem({
  children,
  className = "",
  icon: Icon,
  iconSize = "compact",
  ...props
}: MetadataItemProps) {
  const iconClassName =
    iconSize === "standard" ? "size-icon-standard" : "size-icon-compact";

  return (
    <span
      className={`inline-flex items-center gap-ds-2 text-metadata text-content-secondary ${className}`}
      {...props}
    >
      {Icon ? (
        <Icon
          aria-hidden="true"
          className={`shrink-0 text-content-muted ${iconClassName}`}
          strokeWidth={1.75}
        />
      ) : null}
      <span>{children}</span>
    </span>
  );
}
