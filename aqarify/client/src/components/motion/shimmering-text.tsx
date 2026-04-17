import { motion } from "motion/react";

interface ShimmeringTextProps {
  text: string;
  className?: string;
}

export function ShimmeringText({ text, className }: ShimmeringTextProps) {
  return (
    <motion.span
      className={className}
      initial={{ backgroundPosition: "200% 0%" }}
      animate={{ backgroundPosition: "-200% 0%" }}
      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      style={{
        backgroundImage:
          "linear-gradient(90deg, var(--color-muted-foreground), var(--color-foreground), var(--color-muted-foreground))",
        backgroundSize: "200% 100%",
        WebkitBackgroundClip: "text",
        color: "transparent",
      }}
    >
      {text}
    </motion.span>
  );
}
