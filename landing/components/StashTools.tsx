"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

const TOOLS = [
  {
    n: "01",
    name: "reweb_extract_dna",
    kind: "MCP TOOL",
    desc: "Full computed DNA + retina screenshots of every section, from any live URL.",
    meta: "~20s",
  },
  {
    n: "02",
    name: "reweb_compile_tokens",
    kind: "MCP TOOL",
    desc: "DesignDNA JSON pressed into globals.css, tailwind.config.ts and font links.",
    meta: "<1s",
  },
  {
    n: "03",
    name: "reweb_visual_diff",
    kind: "MCP TOOL",
    desc: "Pixel-level match between reference and your build. Hot-magenta drift report.",
    meta: "3% gate",
  },
  {
    n: "04",
    name: "reweb setup all",
    kind: "CLI",
    desc: "Registers the engine into OpenCode, Claude Code, Cursor, Windsurf and Cline.",
    meta: "1-click",
  },
];

export default function StashTools() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const yHead = useTransform(scrollYProgress, [0, 1], [70, -70]);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden pb-24 pt-20 text-[var(--bone)] md:pb-32 md:pt-28"
      style={{ background: "var(--coal)" }}
    >
      {/* section head, stash editorial style */}
      <motion.div style={{ y: yHead }} className="flex items-end justify-between px-8 md:px-14">
        <h2 className="f-display text-[clamp(2.4rem,6vw,5rem)] font-light leading-none tracking-tight text-[var(--bone)]">
          The engine
          <span className="f-mono ml-3 align-super text-sm text-[var(--live-yellow)]">4</span>
        </h2>
        <div className="f-mono flex items-center gap-4 text-[11px] text-[var(--bone)] opacity-70">
          <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-[var(--live-yellow)]" />
          <span>01 / 04</span>
        </div>
      </motion.div>

      {/* directory rows */}
      <div className="mt-14">
        {TOOLS.map((t, i) => (
          <motion.a
            key={t.n}
            href="#terminal"
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-6%" }}
            transition={{ duration: 0.65, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="dir-row hairline group block px-8 py-7 md:px-14"
          >
            <div className="grid grid-cols-[auto_1fr_auto] items-baseline gap-5 md:gap-8">
              <span className="f-mono text-[11px] opacity-50">{t.n}</span>
              <div>
                <p className="f-mono text-lg font-bold tracking-tight md:text-xl">
                  {t.name}
                  <span className="dir-copy f-mono ml-4 text-[10px] font-normal opacity-70">{t.kind}</span>
                </p>
                <p className="dir-copy f-instrument mt-1.5 max-w-xl text-sm leading-snug opacity-80 md:text-base">
                  {t.desc}
                </p>
              </div>
              <span className="f-mono text-[11px] opacity-50">{t.meta}</span>
            </div>
          </motion.a>
        ))}
      </div>
    </section>
  );
}
