"use client";

import { motion, useReducedMotion } from "framer-motion";
import * as React from "react";

/**
 * Scroll-triggered entrance. Deliberately understated — one short rise and
 * fade, once, and nothing at all for users who ask for reduced motion.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}) {
  const reduced = useReducedMotion();
  const Comp = motion[as];

  if (reduced) return React.createElement(as, { className }, children);

  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </Comp>
  );
}
