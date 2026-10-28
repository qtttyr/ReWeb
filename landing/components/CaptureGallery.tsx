"use client";

// CaptureGallery — a dedicated section of real site captures. Each card is a
// live link to the source site; captions carry the extracted tokens. Shown
// as analysis specimens, credited and linked.

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

const CAPTURES = [
  { n: "01", src: "/refs/sebg-hero.jpg", site: "www.sebg.ch", href: "https://www.sebg.ch", font: "Funnel Display", tone: "rgb(34,97,233)", label: "COBALT KINETIC" },
  { n: "02", src: "/refs/relevo-hero.jpg", site: "relevovinco.com", href: "https://relevovinco.com", font: "Instrument Sans", tone: "rgb(212,176,143)", label: "KRAFT LETTERPRESS" },
  { n: "03", src: "/refs/kelvin-hero.jpg", site: "kelvin.8b.com", href: "https://kelvin.8b.com", font: "Hubot Sans", tone: "rgb(241,237,228)", label: "THERMAL PAPER" },
  { n: "04", src: "/refs/stash-hero.jpg", site: "stash.cool", href: "https://stash.cool", font: "Space Mono", tone: "rgb(26,26,26)", label: "MONO DIRECTORY" },
];

export default function CaptureGallery() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const yHead = useTransform(scrollYProgress, [0, 1], [70, -70]);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden py-24 text-[var(--ink-dark)] md:py-32"
      style={{ background: "var(--paper)" }}
    >
      {/* head */}
      <motion.div style={{ y: yHead }} className="flex items-end justify-between px-8 md:px-14">
        <div>
          <p className="f-mono text-[11px] tracking-[0.22em] opacity-55">
            CAPTURED LIVE · 1440 @2X
          </p>
          <h2 className="f-display mt-4 text-[clamp(2.4rem,6vw,5rem)] font-bold leading-none tracking-tight">
            Four sites,
            <span className="f-instrument font-light"> four DNAs.</span>
          </h2>
        </div>
        <p className="f-mono hidden text-[11px] opacity-55 md:block">
          01 — 04
        </p>
      </motion.div>

      {/* clickable specimen cards */}
      <div className="mt-14 grid gap-6 px-8 md:grid-cols-2 md:px-14">
        {CAPTURES.map((c, i) => (
          <motion.a
            key={c.n}
            href={c.href}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 0.75, delay: (i % 2) * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="group relative block border border-[rgba(17,13,25,0.45)] bg-[var(--paper)] p-2 transition-transform duration-300 hover:-translate-y-1.5"
          >
            {/* corner index */}
            <span className="f-mono absolute -top-px -left-px z-10 bg-[var(--ink-dark)] px-2.5 py-1 text-[10px] tracking-[0.2em] text-[var(--paper)]">
              {c.n}
            </span>

            <div className="relative aspect-[16/10] overflow-hidden">
              <img
                src={c.src}
                alt={`Capture of ${c.site}`}
                width={1600}
                height={1000}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
              />
            </div>

            <figcaption className="flex items-baseline justify-between px-1.5 py-3">
              <span className="f-mono text-sm font-bold">{c.site}</span>
              <span className="f-mono text-[10px] opacity-60">
                {c.font} · {c.tone}
              </span>
            </figcaption>

            {/* open link */}
            <span className="f-mono absolute right-3 top-3 z-10 border border-[rgba(17,13,25,0.35)] bg-[var(--paper)] px-3 py-1.5 text-[10px] tracking-[0.2em] opacity-0 transition-all duration-300 group-hover:opacity-100">
              OPEN
            </span>
          </motion.a>
        ))}
      </div>

      {/* credit line */}
      <p className="f-mono mt-10 px-8 text-[10px] leading-relaxed tracking-[0.16em] opacity-45 md:px-14">
        CAPTURES BELONG TO THEIR RESPECTIVE OWNERS — SHOWN AS ANALYSIS SPECIMENS, LINKED TO SOURCE.
      </p>
    </section>
  );
}
