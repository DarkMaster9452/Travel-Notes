import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** Page containers (design/DESIGN-SYSTEM.md §6.2): max width + gutters. */
const containerVariants = cva("mx-auto w-full px-4 md:px-6 lg:px-8", {
  variants: {
    size: {
      marketing: "max-w-marketing",
      app: "max-w-app",
      text: "max-w-text",
      narrow: "max-w-narrow",
    },
  },
  defaultVariants: { size: "marketing" },
});

export function Container({
  className,
  size,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof containerVariants>) {
  return <div className={cn(containerVariants({ size }), className)} {...props} />;
}
