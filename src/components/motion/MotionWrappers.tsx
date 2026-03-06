import { motion, type HTMLMotionProps } from "framer-motion";
import React from "react";

const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/** Wrap dashboard page content — staggers children */
export function StaggerContainer({
  children,
  className,
  ...props
}: { children: React.ReactNode } & HTMLMotionProps<"div">) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Each animated block inside StaggerContainer */
export function FadeUpItem({
  children,
  className,
  ...props
}: { children: React.ReactNode } & HTMLMotionProps<"div">) {
  return (
    <motion.div variants={fadeUp} className={className} {...props}>
      {children}
    </motion.div>
  );
}
