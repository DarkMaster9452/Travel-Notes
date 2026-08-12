import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans text-xs font-semibold uppercase tracking-[0.14em] transition-all duration-200 disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "bg-ink text-paper hover:bg-ember active:translate-y-px",
        light:
          "bg-paper text-ink hover:bg-ember hover:text-paper active:translate-y-px",
        ember: "bg-ember text-paper hover:bg-ember-light active:translate-y-px",
        outline:
          "border border-ink/25 bg-transparent text-ink hover:border-ink hover:bg-ink hover:text-paper",
        outlineLight:
          "border border-paper/35 bg-transparent text-paper hover:border-paper hover:bg-paper hover:text-ink",
        ghost: "bg-transparent text-ink hover:bg-ink/8",
        ghostLight: "bg-transparent text-paper hover:bg-paper/12",
        link: "bg-transparent text-ink underline underline-offset-4 hover:text-ember",
      },
      size: {
        sm: "h-9 px-4",
        md: "h-12 px-6",
        lg: "h-14 px-8 text-sm",
        xl: "h-16 px-10 text-sm tracking-[0.16em]",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
