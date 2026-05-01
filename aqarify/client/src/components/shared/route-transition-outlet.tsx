import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { motionTransitions } from "@/components/motion/presets";

/**
 * Mount once at the router root (pathless parent). Keys on full location so any
 * navigation animates without adding transition markup inside each layout.
 */
export function RouteTransitionOutlet() {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const routeKey = `${location.pathname}${location.search}`;

  if (reduceMotion) {
    return <Outlet />;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={routeKey}
        className="w-full"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={motionTransitions.navigation}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}
