import type { Transition, Variants } from "motion/react";

type MotionTier = "micro" | "layout" | "overlay" | "navigation";

export const motionDurations: Record<MotionTier, number> = {
  micro: 0.18,
  layout: 0.3,
  overlay: 0.24,
  navigation: 0.26,
};

export const motionEasing = {
  smoothOut: [0.16, 1, 0.3, 1] as const,
  smoothInOut: [0.4, 0, 0.2, 1] as const,
};

export const motionTransitions = {
  micro: {
    duration: motionDurations.micro,
    ease: motionEasing.smoothOut,
  } satisfies Transition,
  layout: {
    duration: motionDurations.layout,
    ease: motionEasing.smoothOut,
  } satisfies Transition,
  overlay: {
    duration: motionDurations.overlay,
    ease: motionEasing.smoothOut,
  } satisfies Transition,
  navigation: {
    duration: motionDurations.navigation,
    ease: motionEasing.smoothInOut,
  } satisfies Transition,
};

export const revealUpVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: motionTransitions.layout,
  },
};

export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: motionTransitions.layout,
  },
};

export const staggerChildren = (stagger = 0.05, delayChildren = 0): Transition => ({
  staggerChildren: stagger,
  delayChildren,
});
