---
name: reweb-transmuter
description: Reverse-engineers any reference or Awwwards website, extracts its computed Design DNA and screenshots, and transfigures the exact design system 1-to-1 onto your target project without AI slop.
---

# ReWeb Transmuter: 1-to-1 Design Transfiguration System

This skill gives you the capability to take any website URL (Awwwards winners, Linear, Stripe, Apple, Framer) and transmute its visual design, typography, spacing, atmosphere, and micro-interactions 1-to-1 into a new project.

## Core Philosophy: Anti-Slop 1-to-1 Fidelity
- **Never guess colors or fonts from memory**: Always extract computed styles via ReWeb.
- **Dual Perception**: Inspect BOTH the quantitative metrics (`dna.json`) and the qualitative cropped screenshots of each section (`hero.png`, `bento-grid.png`).
- **Semantic Re-mapping**: Keep the visual rhythm, exact border alphas (`border-white/10`), inner bevel shadows (`inset 0 1px 0 rgba(...)`), and typography tracking, but adapt all copy, labels, and iconography to the user's domain.

---

## The 5-Phase Transmutation Workflow

### Phase 1: Deep Extraction
Run ReWeb analysis on the target reference URL:
```bash
npx tsx bin/reweb.ts analyze <TARGET_URL> -o .reweb/captures/reference
```
Or call the MCP tool `reweb_extract_dna` with `{ "url": "<TARGET_URL>" }`.

This produces:
- `dna.json`: Full computed Design DNA.
- `full-desktop.png` & `full-mobile.png`: High-resolution visual captures.
- Individual section screenshots: `section-0-navbar.png`, `section-1-hero.png`, `section-2-bento-grid.png`, etc.
- `globals.css` & `tailwind.config.ts`: Ready-to-use tokens.

### Phase 2: Visual Inspection & Verification
1. Inspect the extracted `section-1-hero.png` and `dna.json`.
2. Check the detected `primaryFont` and `editorialFont`.
3. Check the base background (e.g. `rgb(9, 9, 11)`), border contrast, and whether noise overlays or backdrop-blurs are present.

### Phase 3: Token Integration
Apply the extracted tokens into the project:
- Copy the CSS variables and utility classes into `globals.css`.
- Configure `tailwind.config.ts` with exact font family stacks, border radiuses, and container max-widths.

### Phase 4: Component Synthesis (1-to-1 Section Cloning)
For each section (Navbar, Hero, Bento Grid, Showcase, CTA, Footer):
1. Read the section blueprint and inspect its isolated screenshot.
2. Maintain identical visual hierarchy:
   - Eyebrow badge: exact tracking, font-mono or uppercase pill.
   - Headline: exact font size scale, negative tracking (`tracking-tight` or `-0.03em`), optical line height.
   - CTA buttons: exact padding, border, glow shadow, and hover spring.
   - Bento Grid: exact column ratios, card border alphas, and inner bevel shadows.
3. Replace the reference company's copy with the user's project context.

### Phase 5: Visual Diff & Verification Loop
1. Take a screenshot of the local running build at port 3000:
2. Run visual diff:
```bash
npx tsx bin/reweb.ts diff .reweb/captures/reference/full-desktop.png .reweb/captures/candidate.png -o .reweb/captures/diff.png
```
3. Inspect the diff: if layout padding, font weights, or contrast drift, tweak the code until variance is minimized.
