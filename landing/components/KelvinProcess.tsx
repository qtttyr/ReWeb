"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

const PHASES = [
  { n: "01", label: "CAPTURE", desc: "Two contexts. Fonts settled, walls dismissed." },
  { n: "02", label: "SECTION", desc: "The page splits into semantic bands." },
  { n: "03", label: "EXTRACT", desc: "800+ computed styles scanned. Nothing guessed." },
  { n: "04", label: "COMPILE", desc: "DNA pressed into your globals and config." },
  { n: "05", label: "DIFF", desc: "Pixel loop. Under 3% is a 1:1." },
];

export default function KelvinProcess() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  const yWord = useTransform(scrollYProgress, [0, 1], ["18%", "-14%"]);
  const yCard = useTransform(scrollYProgress, [0, 1], [90, -90]);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden pb-14 pt-24 md:pb-20 md:pt-32"
      style={{ background: "var(--paper)" }}
    >
      {/* micro header, kelvin style */}
      <div className="flex items-center justify-between border-b border-[rgba(17,13,25,0.35)] bg-[var(--paper)] px-8 py-4 md:px-14">
        <div className="flex items-baseline gap-4">
          <p className="f-display text-xl font-bold tracking-tight text-[var(--ink-dark)]">REWEB</p>
          <p className="f-mono hidden text-[11px] tracking-[0.18em] text-[var(--ink-dark)] opacity-60 md:inline">
            DESIGN IN HEAT · 2026
          </p>
        </div>
        <div className="f-mono hidden gap-7 text-[11px] md:flex">
          {["PIPELINE", "CAPTURES", "SETUP", "SOURCE"].map((t) => (
            <a key={t} href="#tools" className="relative text-[var(--ink-dark)]">
              {t}
              <span className="absolute -bottom-1 left-0 h-[2px] w-full" style={{ background: "linear-gradient(90deg,#f2316b,#f28e35,#f2d535)" }} />
            </a>
          ))}
          <a href="#terminal" className="press-card -my-2 px-4 text-[var(--ink-dark)]">
            RUN IT
          </a>
        </div>
      </div>

      {/* giant thermal word behind the captures strip */}
      <motion.p
        style={{ y: yWord }}
        aria-hidden
        className="thermal-text f-hubot pointer-events-none absolute left-1/2 top-[64%] -translate-x-1/2 whitespace-nowrap text-[clamp(9rem,30vw,26rem)] font-bold leading-none tracking-tight"
      >
        REWEB
      </motion.p>

      {/* top row: intro card + status card */}
      <div className="relative z-10 mt-14 grid gap-8 px-8 md:grid-cols-[1fr_auto] md:px-14">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-fit border border-[rgba(17,13,25,0.5)] bg-[var(--paper)] p-6 md:p-7"
        >
          <p className="f-instrument max-w-sm text-2xl font-medium leading-snug text-[var(--ink-dark)]">
            Five phases of transmutation, executed in your terminal.
          </p>
          <div className="mt-7 flex items-center gap-6">
            <a href="#terminal" className="f-mono bg-[var(--ink-dark)] px-5 py-3 text-xs font-bold tracking-widest text-[var(--paper)] transition-transform hover:-translate-y-0.5">
              RUN IT
            </a>
            <a href="#tools" className="k-link f-instrument text-lg font-semibold text-[var(--ink-dark)]">
              See the lineup
            </a>
          </div>
        </motion.div>

        <motion.div
          style={{ y: yCard }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="f-mono hidden w-64 bg-[var(--ink-dark)] p-6 text-[var(--paper)] md:block"
        >
          <p className="text-[10px] tracking-[0.18em] opacity-70">EXTRACTED LIVE · v1.0</p>
          <p className="mt-3 text-5xl font-bold leading-none">
            4 <span className="opacity-40">SITES</span>
            <br />→ 1 DNA
          </p>
          <p className="mt-4 text-[10px] leading-relaxed opacity-60">
            1440×900 @2X DESKTOP · 390×844 @3X MOBILE
          </p>
        </motion.div>
      </div>

      {/* phase list */}
      <div className="relative z-10 mt-20 px-8 md:px-14">
        {PHASES.map((p, i) => (
          <motion.div
            key={p.n}
            initial={{ opacity: 0, y: 34 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 0.7, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-[auto_1fr] items-baseline gap-6 border-t border-[rgba(17,13,25,0.18)] py-5 md:grid-cols-[3.5rem_10rem_1fr]"
          >
            <span className="f-mono text-xs text-[var(--ink-dark)] opacity-50">{p.n}</span>
            <span className="f-display text-2xl font-bold tracking-tight text-[var(--ink-dark)] md:text-3xl">{p.label}</span>
            <span className="f-instrument col-span-2 text-lg leading-snug text-[var(--ink-dark)] opacity-75 md:col-span-1 md:text-xl">{p.desc}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
