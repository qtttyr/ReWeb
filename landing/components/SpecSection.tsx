"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

const SPEC = [
  {
    n: "01",
    label: "Typography Matrix",
    desc: "h1→p: family, weight, tracking to the hundredth of a pixel.",
    meta: "16 tokens",
  },
  {
    n: "02",
    label: "Color Roles",
    desc: "Canvas, borders, text tiers, accents — frequency-ranked.",
    meta: "6 roles",
  },
  {
    n: "03",
    label: "Material Bevels",
    desc: "Inset glows, ambient depth, directional light.",
    meta: "shadow types",
  },
  {
    n: "04",
    label: "Radius Scale",
    desc: "Pill, card, button, badge.",
    meta: "4 radii",
  },
  {
    n: "05",
    label: "Motion DNA",
    desc: "Hover diffs recorded live, with easing curves.",
    meta: "deltas",
  },
  {
    n: "06",
    label: "Section Bands",
    desc: "Navbar → hero → bento → cta → footer.",
    meta: "≤10 bands",
  },
];

export default function SpecSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const yHead = useTransform(scrollYProgress, [0, 1], [80, -80]);

  return (
    <section
      ref={ref}
      className="spec-bg relative overflow-hidden py-24 md:py-36"
      style={{ background: "rgb(239,240,241)", color: "rgb(47,48,50)" }}
    >
      {/* head */}
      <motion.div style={{ y: yHead }} className="px-8 md:px-14">
        <h2 className="f-instrument text-[clamp(2.8rem,7.5vw,6.5rem)] font-bold leading-none tracking-[-0.035em]">
          <span className="font-light">//</span> what is extracted
        </h2>
        <p className="f-instrument mt-6 max-w-md text-lg leading-snug opacity-70 md:text-xl">
          Nothing guessed from memory. The engine scans the DOM and returns
          the specimen sheet.
        </p>
      </motion.div>

      {/* spec rows */}
      <div className="mt-16 px-8 md:px-14">
        {SPEC.map((row, i) => (
          <motion.div
            key={row.n}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 0.65, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="spec-row group grid grid-cols-[auto_1fr_auto] items-baseline gap-6 border-t border-[rgba(47,48,50,0.18)] py-6 md:grid-cols-[3rem_14rem_1fr_auto] md:gap-10"
          >
            <span className="f-mono text-[11px] opacity-45">{row.n}</span>
            <span className="f-instrument inline-flex items-center gap-3 text-xl font-bold tracking-tight md:text-2xl">
              <span className="spec-dot" aria-hidden />
              {row.label}
            </span>
            <span className="f-instrument col-span-3 max-w-2xl text-sm leading-relaxed opacity-65 md:col-span-1 md:text-base">
              {row.desc}
            </span>
            <span className="f-mono hidden text-[11px] opacity-45 md:inline">{row.meta}</span>
          </motion.div>
        ))}
        <div className="border-t border-[rgba(47,48,50,0.18)]" />
      </div>
    </section>
  );
}
