"use client";

import { motion, useScroll, useTransform, useSpring, useVelocity } from "motion/react";
import { useRef } from "react";

export default function RelevoManifesto() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  // stamp-in as the section enters, drift while crossing
  const stamp = useTransform(scrollYProgress, [0, 0.35], [1.18, 1]);
  const yDrift = useTransform(scrollYProgress, [0, 1], [70, -70]);
  const yEyebrow = useTransform(scrollYProgress, [0, 1], [110, -110]);

  const { scrollY } = useScroll();
  const vel = useVelocity(scrollY);
  const smoothVel = useSpring(vel, { stiffness: 120, damping: 32 });
  const skew = useTransform(smoothVel, [-2200, 0, 2200], [-2.4, 0, 2.4], { clamp: true });

  return (
    <section
      ref={ref}
      className="grain relative overflow-hidden py-28 md:py-40"
      style={{ background: "var(--kraft)" }}
    >
      {/* eyebrow */}
      <motion.p
        style={{ y: yEyebrow }}
        className="f-mono relative z-10 px-8 pt-4 text-xs tracking-[0.22em] text-[var(--ink-soft)] md:px-14 md:text-sm"
      >
        NO INK. NO GUESSING.
      </motion.p>

      {/* embossed statement blocks */}
      <motion.div style={{ y: yDrift, skewX: skew }} className="relative z-10 mt-8 px-8 md:px-14">
        <motion.div
          style={{ scale: stamp }}
          className="f-instrument mx-auto w-fit"
        >
          <motion.p
            initial={{ opacity: 0, y: 46 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-12%" }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="emboss px-10 py-5 text-[clamp(2.6rem,7.5vw,6.4rem)] font-bold leading-none tracking-tight md:px-14 md:py-7"
          >
            EXTRACT.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 46 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-12%" }}
            transition={{ duration: 0.85, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="deboss mt-6 w-fit text-[clamp(2.6rem,7.5vw,6.4rem)] font-bold leading-none tracking-tight"
          >
            TRANSMUTE.
          </motion.p>
        </motion.div>

        {/* paragraph + ctas, bottom-right like the reference */}
        <div className="mt-16 flex flex-col gap-8 md:mt-20 md:ml-auto md:max-w-md">
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="f-instrument text-xl leading-snug text-[var(--ink-brown)] md:text-2xl"
          >
            ReWeb reads computed styles straight from the DOM, then presses them
            into your stack. Your brand stays yours — the craft moves in.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-7"
          >
            <a href="#terminal" className="press-card f-instrument px-6 py-3.5 text-base font-semibold">
              Extract a site
            </a>
            <a href="#tools" className="k-link f-instrument text-base font-semibold text-[var(--ink-brown)]">
              See the tools
            </a>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
