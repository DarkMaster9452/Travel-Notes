"use client";

import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** Dropdown (design/DESIGN-SYSTEM.md §7.9): raised surface, 36 px items. */
export const Dropdown = DropdownPrimitive.Root;
export const DropdownTrigger = DropdownPrimitive.Trigger;

export function DropdownContent({
  className,
  sideOffset = 8,
  ...props
}: ComponentProps<typeof DropdownPrimitive.Content>) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "z-dropdown min-w-40 animate-fade-in rounded-control border border-border bg-surface-raised p-1 text-text shadow-2",
          className,
        )}
        {...props}
      />
    </DropdownPrimitive.Portal>
  );
}

export function DropdownItem({ className, ...props }: ComponentProps<typeof DropdownPrimitive.Item>) {
  return (
    <DropdownPrimitive.Item
      className={cn(
        "flex min-h-9 cursor-pointer select-none items-center gap-2 rounded-xs px-3 text-body-sm outline-none",
        "data-highlighted:bg-surface-sunken [&_svg]:size-4",
        className,
      )}
      {...props}
    />
  );
}
