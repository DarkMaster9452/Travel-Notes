"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Modal (design/DESIGN-SYSTEM.md §7.9): 440 / 560 / 720 wide, a bottom sheet
 * on a phone. Escape and the overlay both close it.
 */
const contentVariants = cva(
  [
    "fixed inset-x-0 bottom-0 z-modal flex max-h-dvh w-full flex-col overflow-y-auto bg-surface p-6 text-text shadow-3",
    "rounded-t-dialog animate-rise-in outline-none",
    "md:inset-auto md:left-1/2 md:top-1/2 md:max-h-screen md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-dialog md:p-8 md:animate-fade-in",
  ],
  {
    variants: {
      size: {
        sm: "md:max-w-dialog-sm",
        md: "md:max-w-dialog-md",
        lg: "md:max-w-dialog-lg",
      },
    },
    defaultVariants: { size: "sm" },
  },
);

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  closeLabel,
  size,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  /** Accessible name of the close button. */
  closeLabel: string;
  children?: ReactNode;
  /** Actions: secondary on the left, primary on the right; stacked on a phone. */
  footer?: ReactNode;
} & VariantProps<typeof contentVariants>) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-overlay animate-fade-in bg-overlay" />
        <DialogPrimitive.Content className={contentVariants({ size })}>
          <div className="flex items-start justify-between gap-4">
            <DialogPrimitive.Title className="font-display text-h2 font-bold">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label={closeLabel}
              className="-mr-2 -mt-2 grid size-10 shrink-0 cursor-pointer place-items-center rounded-control text-muted transition-colors duration-fast hover:bg-surface-sunken hover:text-text"
            >
              <X className="size-5" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>
          {description ? (
            <DialogPrimitive.Description className="mt-2 text-body-sm text-muted">
              {description}
            </DialogPrimitive.Description>
          ) : null}
          {children ? <div className={cn("mt-6")}>{children}</div> : null}
          {footer ? (
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">{footer}</div>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
