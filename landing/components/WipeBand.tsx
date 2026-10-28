"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

export default function WipeBand({ color, words }: { color: string; words: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.06, 1, 1.06]);
  const x = useTransform(scrollYProgress, [0, 1], ["2%", "-6%"]);

  return (
    <div
      ref={ref}
      className="relative flex h-[26vh] min-h-44 items-center overflow-hidden md:h-[32vh]"
      style={{ background: color }}
      aria-hidden
    >
      <motion.div style={{ scale, x }} className="flex w-max">
        <p className="marquee-track f-mono whitespace-nowrap text-sm tracking-[0.3em] text-[rgba(17,13,25,0.35)] md:text-base">
          {`${words} · `.repeat(12)}
        </p>
      </motion.div>
    </div>
  );
}
