'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import { revealUp } from '@/lib/motion';

/**
 * Scroll-reveal wrapper for below-the-fold sections: opacity + 12px rise on
 * first view only. Under reduced motion content renders in its final state.
 */
export function Reveal({
  children,
  className,
  as = 'div',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'li';
  delay?: number;
}) {
  const reduced = !!useReducedMotion();
  const Tag = as === 'section' ? motion.section : as === 'li' ? motion.li : motion.div;
  if (reduced) {
    const Static = as;
    return <Static className={className}>{children}</Static>;
  }
  return (
    <Tag
      className={className}
      variants={revealUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px 0px' }}
      transition={delay ? { delay } : undefined}
    >
      {children}
    </Tag>
  );
}
