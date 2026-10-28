"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";

function useClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export default function Statement() {
  const ref = useRef<HTMLElement>(null);
  const clock = useClock();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const yFaint = useTransform(scrollYProgress, [0, 1], [40, -40]);

  const LINES = [
    [
      { t: "ReWeb reads the", style: "serif" },
      { t: "computed truth", style: "bold" },
    ],
    [
      { t: "of any live site —", style: "serif" },
      { t: "every alpha,", style: "serif" },
    ],
    [
      { t: "every bevel,", style: "bold" },
      { t: "every tracking curve.", style: "serif" },
    ],
    [
      { t: "No vibes.", style: "serif" },
      { t: "No slop.", style: "bold" },
    ],
  ];

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-white py-24 text-black md:py-36"
    >
      {/* micro header with live clock, Signal-A style */}
      <div className="flex items-center justify-between px-8 text-[10px] tracking-[0.14em] md:px-14 md:text-[11px]">
        <span className="inline-flex items-center gap-2">
          <span className="h-[7px] w-[7px] rounded-full bg-black" />
          LIVE
        </span>
        <span className="opacity-45">EXTRACTION LOG</span>
        <span className="f-mono">{clock} UTC</span>
      </div>
      <div className="mx-8 mt-3 border-t border-black md:mx-14" />

      {/* big mixed statement */}
      <motion.div style={{ y: yFaint }} className="relative z-10 mt-14 px-8 md:mt-20 md:px-14">
        <h2 className="max-w-[62rem] text-[clamp(2.5rem,6.6vw,5.6rem)] leading-[1.02] tracking-[-0.015em]">
          {LINES.map((line, li) => (
            <motion.span
              key={li}
              className="block"
              initial={{ opacity: 0, y: 42 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8%" }}
              transition={{ duration: 0.85, delay: li * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              {line.map((seg, si) => (
                <span
                  key={si}
                  className={
                    seg.style === "bold"
                      ? "f-instrument font-extrabold tracking-[-0.03em]"
                      : "f-serif font-normal"
                  }
                >
                  {seg.t}{" "}
                </span>
              ))}
            </motion.span>
          ))}
        </h2>

        {/* mono caption row */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="f-mono mt-16 flex max-w-xl flex-wrap gap-x-10 gap-y-3 text-[11px] leading-relaxed opacity-60"
        >
          <span>DIGITAL</span>
          <span>CRAFT</span>
          <span>RESPECT</span>
          <span>NO</span>
          <span>GUESSING</span>
          <span>DOM → DNA</span>
        </motion.div>
      </motion.div>
    </section>
  );
}
