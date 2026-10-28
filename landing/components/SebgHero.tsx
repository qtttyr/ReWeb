"use client";

import { motion, useScroll, useTransform, useSpring, useVelocity } from "motion/react";
import { useEffect, useRef } from "react";
import HeroHelix from "./HeroHelix";
import Logo from "./Logo";

const HEADLINE = [
  [
    { text: "I clone ", weight: "font-bold" },
    { text: "websites", weight: "font-light" },
  ],
  [{ text: "that move.", weight: "font-bold" }],
];

function CharReveal({ text, delay }: { text: string; delay: number }) {
  return (
    <span className="inline-block whitespace-pre">
      {text.split("").map((ch, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ y: "110%", rotate: 6 }}
          animate={{ y: "0%", rotate: 0 }}
          transition={{
            delay: delay + i * 0.028,
            duration: 0.9,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  );
}

export default function SebgHero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  const yTitle = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const yDeck = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const { scrollY } = useScroll();
  const vel = useVelocity(scrollY);
  const smoothVel = useSpring(vel, { stiffness: 120, damping: 32 });
  const skew = useTransform(smoothVel, [-2200, 0, 2200], [-3.2, 0, 3.2], { clamp: true });

  return (
    <section
      ref={ref}
      className="relative flex min-h-screen flex-col overflow-hidden"
      style={{ background: "var(--seb-bg)" }}
    >
      {/* faint vertical grid */}
      <div className="pointer-events-none absolute inset-0 flex justify-between px-[8.33%]">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-full w-px bg-[rgba(17,13,25,0.07)]" />
        ))}
      </div>

      {/* top bar */}
      <div className="relative z-20 flex items-start justify-between px-8 pt-7 md:px-14">
        <div className="flex items-center gap-3.5">
          <Logo className="h-8 w-8 text-[var(--seb-cream)] md:h-9 md:w-9" />
          <div className="f-display leading-tight">
            <p className="text-xl font-bold text-[var(--seb-cream)] md:text-2xl">ReWeb</p>
            <p className="text-sm font-light text-[rgba(251,251,248,0.75)] md:text-base">
              design transmutation engine
            </p>
          </div>
        </div>
        <a
          href="#terminal"
          className="hero-pill f-instrument px-6 py-3.5 text-sm font-semibold md:text-base"
        >
          Get the engine
        </a>
      </div>

      {/* the spiral — three strands of halftone dots across the whole band */}
      <motion.div style={{ y: yDeck }} className="relative z-0 mt-6 px-8 md:mt-8 md:px-14">
        <div className="h-[30vh] md:h-[36vh]">
          <HeroHelix className="h-full" />
        </div>
      </motion.div>

      {/* text block — its own lane below the mark */}
      <motion.div style={{ y: yTitle, opacity: fade, skewX: skew }} className="relative z-10 mt-auto px-8 pb-10 pt-10 md:px-14 md:pb-12">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.7 }}
          className="f-mono mb-5 text-[11px] tracking-[0.24em] text-[rgba(251,251,248,0.66)]"
        >
          COMPUTED STYLES, NOT VIBES
        </motion.p>

        <h1 className="f-display text-[clamp(2.8rem,8vw,7.6rem)] leading-[0.97] tracking-[-0.035em] text-[var(--seb-cream)]">
          {HEADLINE.map((line, li) => (
            <span key={li} className="block overflow-hidden pb-[0.08em]">
              {line.map((seg, si) => (
                <span key={si} className={seg.weight}>
                  <CharReveal text={seg.text} delay={0.25 + li * 0.18 + si * 0.06} />
                </span>
              ))}
            </span>
          ))}
        </h1>

        <div className="mt-7 flex flex-col gap-7 md:flex-row md:items-center md:gap-12">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.35, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="f-instrument max-w-sm text-lg leading-snug text-[rgba(251,251,248,0.82)] md:text-xl"
          >
            Any live site becomes a design system in your stack. In seconds.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-7"
          >
            <a href="#terminal" className="hero-pill f-instrument px-6 py-3.5 text-sm font-semibold md:text-base">
              Extract a site
            </a>
            <a href="#tools" className="k-link f-instrument text-base font-semibold text-[var(--seb-cream)]">
              See the engine
            </a>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
